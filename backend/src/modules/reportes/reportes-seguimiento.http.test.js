// Rutas del alumno para CU-REP-02/03/04 (listado, seguimiento, PDF, vista previa de la corrección y reenvío) de punta a punta:
// Express + auth reales, servicios reales con Prisma falso, carpetas temporales, TSA, PDF y notificaciones falsos. Sin BD,
// Redis, red ni FreeTSA.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rutaRedis = require.resolve('../../lib/redis');
require.cache[rutaRedis] = { id: rutaRedis, filename: rutaRedis, loaded: true, exports: { get: async () => null } };

const { generarToken } = require('../../lib/jwt');
const { cifrarBuffer, descifrarBuffer } = require('../../lib/fileEncryption');
const { ErrorTsa } = require('../../lib/timestampTsa');
const { requireAuth } = require('../../middleware/auth.middleware');
const seguimiento = require('./reportes-seguimiento.service');
const correccion = require('./reportes-correccion.service');
const globalSvc = require('./reportes-global.service');
const router = require('./reportes-alumno.routes');
const { reporteMensual, crearBdProfesor, alumnoGrafo } = require('./reportes.profesor.fixtures');

const listarReal = seguimiento.listarReportes;
const detalleReal = seguimiento.obtenerSeguimiento;
const pdfReal = seguimiento.obtenerPdfReporte;
const vistaPreviaReal = correccion.generarVistaPreviaCorreccion;
const reenviarReal = correccion.reenviarReporteCorregido;

const PDF_ALUMNO = Buffer.from('%PDF-1.7\n% PDF almacenado del alumno (bytes exactos)\n%%EOF\n');
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA').toString('base64');
const ORIGINAL = 'Actividad original.';
const NUEVAS = 'Actividad corregida con más detalle.';
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rev = (id, tipo, estado, fecha, extra = {}) => ({
  id, tipo_revisor: tipo, estado, fecha: new Date(fecha), hash_documento: 'h'.repeat(64), ip_firma: '10.0.0.1', token_tsa: 'tok', comentario: null,
  usuario: { nombre: tipo === 'alumno' ? 'ANA' : 'LUIS', apellidos: tipo === 'alumno' ? 'GARCIA LOPEZ' : 'TORRES VEGA' }, ...extra,
});

async function levantar(t) {
  const rutaBaseDocumentos = fs.mkdtempSync(path.join(os.tmpdir(), 'http-alumno-'));
  const rutaBaseRubricas = fs.mkdtempSync(path.join(os.tmpdir(), 'http-alumno-rubricas-'));
  t.after(() => { fs.rmSync(rutaBaseDocumentos, { recursive: true, force: true }); fs.rmSync(rutaBaseRubricas, { recursive: true, force: true }); });
  for (const ruta of ['1/a.pdf', '2/b.pdf']) {
    fs.mkdirSync(path.dirname(path.join(rutaBaseDocumentos, ruta)), { recursive: true });
    fs.writeFileSync(path.join(rutaBaseDocumentos, ruta), cifrarBuffer(ruta === '1/a.pdf' ? PDF_ALUMNO : Buffer.from('%PDF-del-otro-alumno')));
  }
  fs.mkdirSync(path.join(rutaBaseRubricas, '201'), { recursive: true });
  fs.writeFileSync(path.join(rutaBaseRubricas, '201/firma.enc'), cifrarBuffer(Buffer.from('rúbrica de prueba')));

  const bd = crearBdProfesor({
    profesores: {},
    escritura: true,
    usuarios: { 201: { rubrica_imagen: '201/firma.enc' } },
    alumnos: { 201: alumnoGrafo({ usuarioId: 201 }) },
    reportes: [
      reporteMensual({ id: 1, numero: 1, estado: 'rechazado_profesor', actividades: ORIGINAL, rutaArchivo: '1/a.pdf', diasLaborados: 4, horasReportadas: 13,
        revisiones: [rev(1, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z'), rev(2, 'profesor', 'rechazado', '2026-08-18T15:00:00.000Z', { comentario: 'Detalla las pruebas.' })] }),
      reporteMensual({ id: 2, alumnoUsuarioId: 202, boleta: '2022630002', estado: 'rechazado_coordinador', rutaArchivo: '2/b.pdf' }),
      reporteMensual({ id: 3, alumnoUsuarioId: 201, boleta: '2022630001', numero: 2, estado: 'aprobado_coordinador', rutaArchivo: '3/c.pdf' }),
    ],
  });
  const avisos = { notificaciones: [], emisiones: [] };
  const sellos = [];
  let tsa = async (hash) => { sellos.push(hash); return { token: TOKEN }; };

  const depsCorreccion = () => ({
    prisma: bd.prisma,
    rutaBaseDocumentos,
    rutaBaseRubricas,
    generarPdf: async (datos) => Buffer.from(`%PDF-corregido\n${datos.actividades.texto}`),
    solicitarSelloTiempo: (hash) => tsa(hash),
    crearNotificacion: async (datos) => { avisos.notificaciones.push(datos); },
    emitirAUsuario: (usuarioId, evento, datos) => { avisos.emisiones.push({ usuarioId, evento, datos }); },
  });
  const listar = t.mock.method(seguimiento, 'listarReportes', (id) => listarReal(id, { prisma: bd.prisma }));
  const detalle = t.mock.method(seguimiento, 'obtenerSeguimiento', (id, tipo, reporteId) => detalleReal(id, tipo, reporteId, { prisma: bd.prisma }));
  const pdf = t.mock.method(seguimiento, 'obtenerPdfReporte', (id, tipo, reporteId) => pdfReal(id, tipo, reporteId, { prisma: bd.prisma, rutaBaseDocumentos }));
  const vistaPrevia = t.mock.method(correccion, 'generarVistaPreviaCorreccion', (id, tipo, reporteId, act, deps) => vistaPreviaReal(id, tipo, reporteId, act, { ...depsCorreccion(), ...deps }));
  const reenviar = t.mock.method(correccion, 'reenviarReporteCorregido', (id, tipo, reporteId, act, deps) => reenviarReal(id, tipo, reporteId, act, { ...depsCorreccion(), ...deps }));

  const app = express();
  app.use(express.json());
  app.use('/reportes', router);
  const servidor = await new Promise((resolver) => { const s = app.listen(0, '127.0.0.1', () => resolver(s)); });
  t.after(() => new Promise((resolver) => servidor.close(resolver)));

  const base = `http://127.0.0.1:${servidor.address().port}/reportes`;
  const cabeceras = (rol, sub, sinToken) => ({ 'Content-Type': 'application/json', ...(sinToken ? {} : { Authorization: `Bearer ${generarToken({ sub, rol })}` }) });
  async function pedir(ruta = '', { metodo = 'GET', cuerpo, rol = 'alumno_asignado', sub = 201, sinToken = false } = {}) {
    const respuesta = await fetch(`${base}${ruta}`, { method: metodo, headers: cabeceras(rol, sub, sinToken), body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  }
  async function pedirArchivo(ruta, { metodo = 'GET', cuerpo, rol = 'alumno_asignado', sub = 201 } = {}) {
    const respuesta = await fetch(`${base}${ruta}`, { method: metodo, headers: cabeceras(rol, sub), body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    return { status: respuesta.status, cabeceras: respuesta.headers, cuerpo: Buffer.from(await respuesta.arrayBuffer()) };
  }
  return {
    pedir, pedirArchivo, listar, detalle, pdf, vistaPrevia, reenviar, avisos, sellos, rutaBaseDocumentos,
    fallarTsa: (fn) => { tsa = fn; },
    reporte: (id) => bd.reportes.find((r) => r.id === id),
    ...bd,
  };
}

const RUTAS_NUEVAS = [
  ['get', '/'], ['get', '/:tipoReporte/:id'], ['get', '/:tipoReporte/:id/pdf'],
  ['post', '/:tipoReporte/:id/correccion/vista-previa'], ['post', '/:tipoReporte/:id/correccion'],
];

test('las rutas nuevas exigen sesión y rol alumno_asignado, y van después de /mensual/... para no taparlas', () => {
  const capas = router.stack.filter((c) => c.route);
  for (const [metodo, ruta] of RUTAS_NUEVAS) {
    const capa = capas.find((c) => c.route.path === ruta && c.route.methods[metodo]);
    assert.ok(capa, `${metodo.toUpperCase()} ${ruta} existe`);
    const [autenticar, autorizar] = capa.route.stack.map((c) => c.handle);
    assert.equal(autenticar, requireAuth);
    const res = { codigo: null, status(c) { res.codigo = c; return res; }, json() { return res; } };
    for (const rol of ['profesor', 'coordinador', 'alumno_sin_asignar']) {
      autorizar({ usuario: { rol } }, res, () => assert.fail(`${rol} no debe pasar`));
      assert.equal(res.codigo, 403);
    }
    let paso = false;
    autorizar({ usuario: { rol: 'alumno_asignado' } }, res, () => { paso = true; });
    assert.equal(paso, true);
  }
  const orden = capas.map((c) => `${Object.keys(c.route.methods)[0]} ${c.route.path}`);
  assert.ok(orden.indexOf('get /mensual/siguiente') < orden.indexOf('get /:tipoReporte/:id'), 'siguiente va antes del comodín');
  for (const previa of ['get /mensual/siguiente', 'post /mensual/vista-previa', 'post /mensual', 'post /rubrica']) assert.ok(orden.includes(previa), `${previa} se conserva`);
});

test('sin token → 401; profesor, coordinador → 403; ningún servicio se llama', async (t) => {
  const e = await levantar(t);
  const rutas = [['GET', ''], ['GET', '/mensual/1'], ['GET', '/mensual/1/pdf'], ['POST', '/mensual/1/correccion/vista-previa'], ['POST', '/mensual/1/correccion']];
  for (const [metodo, ruta] of rutas) {
    const cuerpo = metodo === 'POST' ? { actividades: NUEVAS } : undefined;
    assert.equal((await e.pedir(ruta, { metodo, cuerpo, sinToken: true })).status, 401, `${metodo} ${ruta}`);
    for (const rol of ['profesor', 'coordinador', 'alumno_sin_asignar']) assert.equal((await e.pedir(ruta, { metodo, cuerpo, rol })).status, 403, `${rol} ${metodo} ${ruta}`);
  }
  assert.equal([e.listar, e.detalle, e.pdf, e.vistaPrevia, e.reenviar].reduce((n, m) => n + m.mock.callCount(), 0), 0);
});

test('200 listado: solo los del alumno del token, con la forma acordada; usuario_id por query no cambia nada', async (t) => {
  const e = await levantar(t);
  const { status, cuerpo } = await e.pedir('?usuario_id=202&alumno_id=202');
  assert.equal(status, 200);
  assert.deepEqual(Object.keys(cuerpo).sort(), ['reportes', 'total']);
  assert.deepEqual(cuerpo.reportes.map((r) => r.id), [3, 1]);
  assert.equal(cuerpo.reportes.find((r) => r.id === 1).puedeCorregir, true);
  assert.equal(cuerpo.reportes.find((r) => r.id === 3).puedeCorregir, false);
  assert.equal(/2022630002|mesMostrado|hash|token|ruta_archivo/i.test(JSON.stringify(cuerpo)), false);
  assert.deepEqual(e.listar.mock.calls[0].arguments, [201]);
  assert.deepEqual((await e.pedir('', { sub: 202 })).cuerpo.reportes.map((r) => r.id), [2]);
});

test('200 seguimiento: historial real, último rechazo y actividades a precargar; ajeno/inexistente/global/id inválido → el mismo 404', async (t) => {
  const e = await levantar(t);
  const { status, cuerpo } = await e.pedir('/mensual/1');
  assert.equal(status, 200);
  assert.deepEqual(cuerpo.historial.map((h) => [h.etapa, h.resultado, h.motivo]), [['alumno', 'enviado', null], ['profesor', 'rechazado', 'Detalla las pruebas.']]);
  assert.equal(cuerpo.ultimoRechazo.motivo, 'Detalla las pruebas.');
  assert.equal(cuerpo.actividades, ORIGINAL);
  assert.deepEqual([cuerpo.diasLaborados, cuerpo.horasReportadas, cuerpo.numeroReporte], [4, 13, 1]);
  assert.deepEqual(e.detalle.mock.calls[0].arguments, [201, 'mensual', '1']);

  const esperado = { message: 'Reporte no encontrado.' };
  for (const ruta of ['/mensual/2', '/mensual/999', '/global/1', '/semanal/1', '/mensual/abc', '/mensual/0', '/mensual/-1', '/__proto__/1']) {
    assert.deepEqual((await e.pedir(ruta)).cuerpo, esperado, ruta);
  }
});

test('/mensual/siguiente sigue siendo la preparación del siguiente reporte y no un seguimiento con id "siguiente"', async (t) => {
  const e = await levantar(t);
  // Sin el servicio real, esta ruta llama a Prisma de verdad: basta ver que NO cae en el seguimiento (404 de reporte).
  t.mock.method(require('./reportes-alumno.service'), 'prepararReporteMensual', async () => ({ puedeGenerar: false, motivosBloqueo: [] }));
  const r = await e.pedir('/mensual/siguiente');
  assert.equal(r.status, 200);
  assert.equal(r.cuerpo.puedeGenerar, false);
  assert.equal(e.detalle.mock.callCount(), 0);
});

test('200 pdf: application/pdf con los bytes exactos almacenados del propio reporte; el de otro alumno → 404 sin sus bytes', async (t) => {
  const e = await levantar(t);
  const r = await e.pedirArchivo('/mensual/1/pdf');
  assert.equal(r.status, 200);
  assert.equal(r.cabeceras.get('content-type'), 'application/pdf');
  assert.equal(r.cabeceras.get('content-length'), String(PDF_ALUMNO.length));
  assert.equal(r.cabeceras.get('content-disposition'), 'inline; filename="reporte-mensual-1-2022630001.pdf"');
  assert.match(r.cabeceras.get('cache-control'), /no-store/);
  assert.equal(r.cabeceras.get('x-content-type-options'), 'nosniff');
  assert.equal(Buffer.compare(r.cuerpo, PDF_ALUMNO), 0);

  const ajeno = await e.pedirArchivo('/mensual/2/pdf');
  assert.equal(ajeno.status, 404);
  assert.equal(ajeno.cuerpo.includes('del-otro-alumno'), false);
  assert.deepEqual(JSON.parse(ajeno.cuerpo.toString()), { message: 'Reporte no encontrado.' });
});

test('200 vista previa de la corrección: PDF en memoria (no-store) sin cambiar nada; sin cambio en las actividades → 422', async (t) => {
  const e = await levantar(t);
  const antes = structuredClone(e.reportes);
  const r = await e.pedirArchivo('/mensual/1/correccion/vista-previa', { metodo: 'POST', cuerpo: { actividades: NUEVAS, id: 2, usuario_id: 202 } });
  assert.equal(r.status, 200);
  assert.equal(r.cabeceras.get('content-type'), 'application/pdf');
  assert.match(r.cabeceras.get('cache-control'), /no-store/);
  assert.equal(r.cabeceras.get('content-disposition'), 'inline; filename="vista-previa-reporte-mensual-1.pdf"');
  assert.equal(r.cuerpo.toString(), `%PDF-corregido\n${NUEVAS}`);
  assert.deepEqual(e.reportes, antes);
  assert.deepEqual(e.sellos, []);

  const igual = await e.pedir('/mensual/1/correccion/vista-previa', { metodo: 'POST', cuerpo: { actividades: ORIGINAL } });
  assert.equal(igual.status, 422);
  assert.equal(igual.cuerpo.code, 'SIN_CAMBIOS_EN_ACTIVIDADES');
});

test('200 reenviar: vuelve al profesor con el snapshot intacto, hash/IP/sello en la revisión nueva y aviso al profesor', async (t) => {
  const e = await levantar(t);
  const r = await e.pedir('/mensual/1/correccion', { metodo: 'POST', cuerpo: { actividades: NUEVAS, estado: 'aprobado_coordinador', dias_laborados: 99, horas_reportadas: 99, num_reporte: 7, hash: 'x' } });

  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo.reporte, { id: 1, numero: 1, estadoReporte: 'pendiente_revision_profesor' });
  assert.deepEqual(Object.keys(r.cuerpo).sort(), ['fechaEnvio', 'reporte'], 'sin hash, ruta ni token');
  assert.deepEqual(e.reenviar.mock.calls[0].arguments.slice(0, 4), [201, 'mensual', '1', NUEVAS]);

  const fila = e.reporte(1);
  assert.deepEqual([fila.estado_reporte, fila.actividades_mes, fila.num_reporte, fila.dias_laborados, fila.horas_reportadas], ['pendiente_revision_profesor', NUEVAS, 1, 4, 13]);
  const revisiones = fila.revision_reporte_mensual;
  assert.equal(revisiones.length, 3, 'el historial anterior se conserva y se agrega la revisión nueva');
  const guardado = descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, fila.documento.ruta_archivo)));
  assert.deepEqual([revisiones[2].tipo_revisor, revisiones[2].estado, revisiones[2].hash_documento, revisiones[2].token_tsa], ['alumno', 'aprobado', sha256(guardado), TOKEN]);
  assert.ok(revisiones[2].ip_firma);
  assert.deepEqual(e.sellos, [sha256(guardado)]);
  assert.deepEqual(e.avisos.notificaciones.map((n) => [n.usuarioId, n.rutaRelacionada]), [[301, '/profesor/reportes?destacar=1']]);
  assert.equal(fs.existsSync(path.join(e.rutaBaseDocumentos, '1/a.pdf')), true, 'el PDF anterior se conserva');

  // Y el PDF que ahora se ve es el corregido.
  assert.equal((await e.pedirArchivo('/mensual/1/pdf')).cuerpo.toString(), `%PDF-corregido\n${NUEVAS}`);
});

test('reenviar: TSA caída → 503 reintentable sin avanzar nada; ya reenviado → 409; ajeno → 404; aprobado → 409', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  e.fallarTsa(async () => { throw new ErrorTsa('sin conexión', 'TSA_SIN_CONEXION'); });
  const caida = await e.pedir('/mensual/1/correccion', { metodo: 'POST', cuerpo: { actividades: NUEVAS } });
  assert.equal(caida.status, 503);
  assert.deepEqual([caida.cuerpo.code, caida.cuerpo.reintentable], ['SELLO_TIEMPO_NO_DISPONIBLE', true]);
  assert.equal(e.reporte(1).estado_reporte, 'rechazado_profesor');
  assert.equal(e.reporte(1).revision_reporte_mensual.length, 2);
  assert.equal(e.reporte(1).actividades_mes, ORIGINAL);
  assert.deepEqual(e.avisos.notificaciones, []);

  e.fallarTsa(async () => ({ token: TOKEN }));
  assert.equal((await e.pedir('/mensual/1/correccion', { metodo: 'POST', cuerpo: { actividades: NUEVAS } })).status, 200);
  const repetido = await e.pedir('/mensual/1/correccion', { metodo: 'POST', cuerpo: { actividades: `${NUEVAS} Otra.` } });
  assert.equal(repetido.status, 409);
  assert.deepEqual(repetido.cuerpo, {
    message: 'Este reporte ya no se puede corregir: solo se corrigen los rechazados por tu profesor o por coordinación.',
    code: 'REPORTE_NO_CORREGIBLE',
    estadoReporte: 'pendiente_revision_profesor',
  });

  assert.deepEqual((await e.pedir('/mensual/2/correccion', { metodo: 'POST', cuerpo: { actividades: NUEVAS } })).cuerpo, { message: 'Reporte no encontrado.' });
  assert.equal((await e.pedir('/mensual/3/correccion', { metodo: 'POST', cuerpo: { actividades: NUEVAS } })).status, 409);
});

test('reenviar sin cambios, sin actividades o con un error interno: 422 / 400 con código; el 500 es genérico', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  const sin = await e.pedir('/mensual/1/correccion', { metodo: 'POST', cuerpo: { actividades: ORIGINAL } });
  assert.deepEqual([sin.status, sin.cuerpo.code], [422, 'SIN_CAMBIOS_EN_ACTIVIDADES']);
  const vacio = await e.pedir('/mensual/1/correccion', { metodo: 'POST', cuerpo: {} });
  assert.deepEqual([vacio.status, vacio.cuerpo.code], [400, 'ACTIVIDADES_VACIAS']);
  assert.equal(e.reporte(1).estado_reporte, 'rechazado_profesor');

  e.reenviar.mock.mockImplementation(async () => { throw new Error('ENOENT /var/uploads/secreto'); });
  const roto = await e.pedir('/mensual/1/correccion', { metodo: 'POST', cuerpo: { actividades: NUEVAS } });
  assert.equal(roto.status, 500);
  assert.equal(JSON.stringify(roto.cuerpo).includes('secreto'), false);
});

// ── CU-REP-07: reporte global (mismo flujo que el mensual) ────

test('las rutas del global exigen sesión y rol alumno_asignado, y están ANTES del comodín /:tipoReporte/:id', async (t) => {
  const e = await levantar(t);
  const capas = router.stack.filter((c) => c.route);
  const orden = capas.map((c) => `${Object.keys(c.route.methods)[0]} ${c.route.path}`);
  for (const ruta of ['get /global/siguiente', 'post /global/vista-previa', 'post /global']) {
    assert.ok(orden.includes(ruta), `${ruta} existe`);
    const capa = capas.find((c) => `${Object.keys(c.route.methods)[0]} ${c.route.path}` === ruta);
    assert.equal(capa.route.stack[0].handle, requireAuth);
  }
  assert.ok(orden.indexOf('get /global/siguiente') < orden.indexOf('get /:tipoReporte/:id'));

  const rutas = [['GET', '/global/siguiente'], ['POST', '/global/vista-previa'], ['POST', '/global']];
  for (const [metodo, ruta] of rutas) {
    const cuerpo = metodo === 'POST' ? { actividades: 'x' } : undefined;
    assert.equal((await e.pedir(ruta, { metodo, cuerpo, sinToken: true })).status, 401, `${metodo} ${ruta}`);
    for (const rol of ['profesor', 'coordinador', 'alumno_sin_asignar']) assert.equal((await e.pedir(ruta, { metodo, cuerpo, rol })).status, 403, `${rol} ${metodo} ${ruta}`);
  }
});

test('GET /global/siguiente: prepara el global del alumno del token (horas, periodo, bloqueos); no es un seguimiento con id "siguiente"', async (t) => {
  const e = await levantar(t);
  const respuesta = { horas: { acumuladas: 480, requeridas: 480, suficientes: true }, puedeGenerar: true, motivosBloqueo: [] };
  const preparar = t.mock.method(globalSvc, 'prepararReporteGlobal', async () => respuesta);
  const r = await e.pedir('/global/siguiente?usuario_id=202');
  assert.deepEqual([r.status, r.cuerpo], [200, respuesta]);
  assert.deepEqual(preparar.mock.calls[0].arguments, [201]);
  assert.equal(e.detalle.mock.callCount(), 0);
});

test('POST /global/vista-previa: PDF en memoria (no-store); las horas bajas llegan como 409 con sus motivos', async (t) => {
  const e = await levantar(t);
  const vista = t.mock.method(globalSvc, 'generarVistaPreviaReporteGlobal', async () => ({ pdf: Buffer.from('%PDF-global-previa') }));
  const r = await e.pedirArchivo('/global/vista-previa', { metodo: 'POST', cuerpo: { actividades: 'Resumen', horas: 999, tipo: 'mensual' } });
  assert.equal(r.status, 200);
  assert.equal(r.cabeceras.get('content-type'), 'application/pdf');
  assert.match(r.cabeceras.get('cache-control'), /no-store/);
  assert.equal(r.cabeceras.get('content-disposition'), 'inline; filename="vista-previa-reporte-global.pdf"');
  assert.deepEqual(vista.mock.calls[0].arguments.slice(0, 2), [201, 'Resumen']);

  vista.mock.mockImplementation(async () => { throw Object.assign(new Error('El reporte todavía no se puede generar.'), { status: 409, code: 'REPORTE_NO_GENERABLE', motivosBloqueo: [{ codigo: 'HORAS_INSUFICIENTES', mensaje: 'x' }] }); });
  const bajo = await e.pedir('/global/vista-previa', { metodo: 'POST', cuerpo: { actividades: 'Resumen' } });
  assert.equal(bajo.status, 409);
  assert.deepEqual([bajo.cuerpo.code, bajo.cuerpo.motivosBloqueo[0].codigo], ['REPORTE_NO_GENERABLE', 'HORAS_INSUFICIENTES']);
});

test('POST /global: 201 con el reporte enviado (sin hash, ruta ni token); la IP sale de la conexión; el 409 por duplicado y el 500 genérico', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  const enviar = t.mock.method(globalSvc, 'enviarReporteGlobal', async () => ({ reporte: { id: 5, numero: null, estadoReporte: 'pendiente_revision_profesor' }, fechaEnvio: '2027-03-01T15:00:00.000Z' }));
  const r = await e.pedir('/global', { metodo: 'POST', cuerpo: { actividades: NUEVAS, estado: 'aprobado_coordinador', horas: 1000, hash: 'x' } });
  assert.equal(r.status, 201);
  assert.deepEqual(Object.keys(r.cuerpo).sort(), ['fechaEnvio', 'message', 'reporte']);
  assert.deepEqual(r.cuerpo.reporte, { id: 5, numero: null, estadoReporte: 'pendiente_revision_profesor' });
  assert.deepEqual(enviar.mock.calls[0].arguments.slice(0, 2), [201, NUEVAS]);
  assert.ok(enviar.mock.calls[0].arguments[2].ip);

  enviar.mock.mockImplementation(async () => { throw Object.assign(new Error('Ya existe un reporte global para tu servicio social. Tu envío no se registró.'), { status: 409, code: 'REPORTE_YA_EXISTE', reporteExistente: { estadoReporte: 'pendiente_revision_profesor' } }); });
  const duplicado = await e.pedir('/global', { metodo: 'POST', cuerpo: { actividades: NUEVAS } });
  assert.deepEqual([duplicado.status, duplicado.cuerpo.code, duplicado.cuerpo.reporteExistente.estadoReporte], [409, 'REPORTE_YA_EXISTE', 'pendiente_revision_profesor']);

  enviar.mock.mockImplementation(async () => { throw new Error('ENOENT /var/uploads/secreto'); });
  const roto = await e.pedir('/global', { metodo: 'POST', cuerpo: { actividades: NUEVAS } });
  assert.equal(roto.status, 500);
  assert.equal(JSON.stringify(roto.cuerpo).includes('secreto'), false);
});

test('los endpoints genéricos (seguimiento, PDF, corrección) aceptan el tipo "global" y lo distinguen del mensual', async (t) => {
  const e = await levantar(t);
  assert.equal((await e.pedir('/global/999')).status, 404);
  assert.deepEqual(e.detalle.mock.calls.at(-1).arguments, [201, 'global', '999']);
  assert.equal((await e.pedirArchivo('/global/999/pdf')).status, 404);
  assert.equal((await e.pedir('/global/999/correccion', { metodo: 'POST', cuerpo: { actividades: NUEVAS } })).status, 404);
  assert.deepEqual(e.reenviar.mock.calls.at(-1).arguments.slice(0, 3), [201, 'global', '999']);
});
