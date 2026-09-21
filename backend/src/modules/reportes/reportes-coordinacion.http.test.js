// Rutas de /coordinador/reportes (listado, detalle, PDF, rechazar y aprobar) de punta a punta: Express + auth reales,
// servicios reales con Prisma falso, carpeta temporal, TSA, sello y notificaciones falsos. Sin BD, Redis, red ni FreeTSA.

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
const coordinacion = require('./reportes-coordinacion.service');
const validacion = require('./reportes-validacion.service');
const router = require('./reportes-coordinacion.routes');
const { reporteMensual, crearBdProfesor } = require('./reportes.profesor.fixtures');

const listarReal = coordinacion.listarReportes;
const detalleReal = coordinacion.obtenerDetalleReporte;
const pdfReal = coordinacion.obtenerPdfReporte;
const rechazarReal = validacion.rechazarReporte;
const aprobarReal = validacion.aprobarReporte;

const PDF_VIGENTE = Buffer.from('%PDF-1.7\n% PDF vigente: alumno + profesor (bytes exactos)\n%%EOF\n');
const MARCA_SELLO = Buffer.from('\n%%SELLO-DE-VALIDACION-DEL-PROTOTIPO');
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA').toString('base64');
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rev = (id, tipo, estado, fecha, extra = {}) => ({ id, tipo_revisor: tipo, estado, fecha: new Date(fecha), hash_documento: null, comentario: null, ...extra });

async function levantar(t) {
  const rutaBaseDocumentos = fs.mkdtempSync(path.join(os.tmpdir(), 'http-coordinacion-'));
  t.after(() => fs.rmSync(rutaBaseDocumentos, { recursive: true, force: true }));
  for (const ruta of ['1/vigente.pdf', '3/final.pdf']) {
    fs.mkdirSync(path.dirname(path.join(rutaBaseDocumentos, ruta)), { recursive: true });
    fs.writeFileSync(path.join(rutaBaseDocumentos, ruta), cifrarBuffer(ruta === '1/vigente.pdf' ? PDF_VIGENTE : Buffer.from('%PDF-final-con-sello')));
  }

  const bd = crearBdProfesor({
    profesores: { 50: 1 },
    escritura: true,
    coordinadores: [70, 71],
    reportes: [
      reporteMensual({ id: 1, profesorId: 1, estado: 'pendiente_revision_coordinador', numero: 2, rutaArchivo: '1/vigente.pdf',
        revisiones: [rev(9001, 'alumno', 'aprobado', '2026-08-16T15:00:00.000Z', { hash_documento: sha256('solo alumno') }),
          rev(9101, 'profesor', 'aprobado', '2026-08-20T15:00:00.000Z', { hash_documento: sha256(PDF_VIGENTE) })] }),
      reporteMensual({ id: 2, profesorId: 1, estado: 'pendiente_revision_profesor', rutaArchivo: '2/x.pdf' }),
      reporteMensual({ id: 3, profesorId: 1, estado: 'aprobado_coordinador', rutaArchivo: '3/final.pdf',
        revisiones: [rev(9003, 'alumno', 'aprobado', '2026-08-01T15:00:00.000Z'), rev(9103, 'profesor', 'aprobado', '2026-08-05T15:00:00.000Z'),
          rev(9203, 'coordinador', 'aprobado', '2026-08-10T15:00:00.000Z', { hash_documento: 'c'.repeat(64) })] }),
      reporteMensual({ id: 4, profesorId: 1, estado: 'rechazado_coordinador', rutaArchivo: '4/x.pdf',
        revisiones: [rev(9004, 'alumno', 'aprobado', '2026-08-01T15:00:00.000Z'), rev(9104, 'profesor', 'aprobado', '2026-08-05T15:00:00.000Z'),
          rev(9204, 'coordinador', 'rechazado', '2026-08-11T15:00:00.000Z', { comentario: 'Falta el detalle de las horas.' })] }),
    ],
  });
  const avisos = { notificaciones: [], emisiones: [] };
  const sellosDeTiempo = [];
  let tsa = async (hash) => { sellosDeTiempo.push(hash); return { token: TOKEN }; };

  const depsValidacion = () => ({
    prisma: bd.prisma,
    rutaBaseDocumentos,
    leerSello: () => ({ data: Buffer.from('sello-de-prueba') }),
    agregarSello: async (pdf) => Buffer.concat([pdf, MARCA_SELLO]),
    solicitarSelloTiempo: (hash) => tsa(hash),
    crearNotificacion: async (datos) => { avisos.notificaciones.push(datos); },
    emitirAUsuario: (usuarioId, evento, datos) => { avisos.emisiones.push({ usuarioId, evento, datos }); },
  });
  const listar = t.mock.method(coordinacion, 'listarReportes', (id) => listarReal(id, { prisma: bd.prisma }));
  const detalle = t.mock.method(coordinacion, 'obtenerDetalleReporte', (id, tipo, reporteId) => detalleReal(id, tipo, reporteId, { prisma: bd.prisma }));
  const pdf = t.mock.method(coordinacion, 'obtenerPdfReporte', (id, tipo, reporteId) => pdfReal(id, tipo, reporteId, { prisma: bd.prisma, rutaBaseDocumentos }));
  const rechazar = t.mock.method(validacion, 'rechazarReporte', (id, tipo, reporteId, comentario, deps) => rechazarReal(id, tipo, reporteId, comentario, { ...depsValidacion(), ...deps }));
  const aprobar = t.mock.method(validacion, 'aprobarReporte', (id, tipo, reporteId, deps) => aprobarReal(id, tipo, reporteId, { ...depsValidacion(), ...deps }));

  const app = express();
  app.use(express.json());
  app.use('/coordinador', router);
  const servidor = await new Promise((resolver) => { const s = app.listen(0, '127.0.0.1', () => resolver(s)); });
  t.after(() => new Promise((resolver) => servidor.close(resolver)));

  const base = `http://127.0.0.1:${servidor.address().port}/coordinador/reportes`;
  const cabeceras = (rol, sub, sinToken) => ({ 'Content-Type': 'application/json', ...(sinToken ? {} : { Authorization: `Bearer ${generarToken({ sub, rol })}` }) });
  async function pedir(ruta = '', { metodo = 'GET', cuerpo, rol = 'coordinador', sub = 70, sinToken = false } = {}) {
    const respuesta = await fetch(`${base}${ruta}`, { method: metodo, headers: cabeceras(rol, sub, sinToken), body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  }
  async function pedirPdf(ruta, { rol = 'coordinador', sub = 70 } = {}) {
    const respuesta = await fetch(`${base}${ruta}`, { headers: cabeceras(rol, sub) });
    return { status: respuesta.status, cabeceras: respuesta.headers, cuerpo: Buffer.from(await respuesta.arrayBuffer()) };
  }
  return {
    pedir, pedirPdf, listar, detalle, pdf, rechazar, aprobar, avisos, sellosDeTiempo, rutaBaseDocumentos,
    fallarTsa: (fn) => { tsa = fn; },
    reporte: (id) => bd.reportes.find((r) => r.id === id),
    ...bd,
  };
}

test('todas las rutas exigen sesión y rol coordinador', () => {
  const rutas = [
    ['get', '/reportes'], ['get', '/reportes/:tipoReporte/:id'], ['get', '/reportes/:tipoReporte/:id/pdf'],
    ['post', '/reportes/:tipoReporte/:id/rechazar'], ['post', '/reportes/:tipoReporte/:id/aprobar'],
  ];
  assert.equal(router.stack.filter((c) => c.route).length, rutas.length, 'no hay rutas sin revisar');
  for (const [metodo, ruta] of rutas) {
    const capa = router.stack.find((c) => c.route?.path === ruta && c.route.methods[metodo]);
    assert.ok(capa, `${metodo.toUpperCase()} ${ruta} existe`);
    const [autenticar, autorizar] = capa.route.stack.map((c) => c.handle);
    assert.equal(autenticar, requireAuth);
    const res = { codigo: null, status(c) { res.codigo = c; return res; }, json() { return res; } };
    for (const rol of ['alumno_asignado', 'alumno_sin_asignar', 'profesor']) {
      autorizar({ usuario: { rol } }, res, () => assert.fail(`${rol} no debe pasar`));
      assert.equal(res.codigo, 403);
    }
    let paso = false;
    autorizar({ usuario: { rol: 'coordinador' } }, res, () => { paso = true; });
    assert.equal(paso, true);
  }
});

test('sin token → 401; profesor, alumno → 403; ningún servicio se llama', async (t) => {
  const e = await levantar(t);
  const rutas = [['GET', ''], ['GET', '/mensual/1'], ['GET', '/mensual/1/pdf'], ['POST', '/mensual/1/rechazar'], ['POST', '/mensual/1/aprobar']];
  for (const [metodo, ruta] of rutas) {
    const cuerpo = metodo === 'POST' ? { comentario: 'x' } : undefined;
    assert.equal((await e.pedir(ruta, { metodo, cuerpo, sinToken: true })).status, 401, `${metodo} ${ruta}`);
    for (const rol of ['profesor', 'alumno_asignado', 'alumno_sin_asignar']) assert.equal((await e.pedir(ruta, { metodo, cuerpo, rol })).status, 403, `${rol} ${metodo} ${ruta}`);
  }
  assert.equal([e.listar, e.detalle, e.pdf, e.rechazar, e.aprobar].reduce((n, m) => n + m.mock.callCount(), 0), 0);
});

test('200 listado: pendientes y procesados con la forma acordada; el coordinador sale del token; lo del profesor no aparece', async (t) => {
  const e = await levantar(t);
  const { status, cuerpo } = await e.pedir('', { sub: 71, });
  assert.equal(status, 200);
  assert.deepEqual(Object.keys(cuerpo).sort(), ['pendientes', 'procesados', 'totales']);
  assert.deepEqual(cuerpo.pendientes.map((r) => r.id), [1]);
  assert.deepEqual(cuerpo.procesados.map((r) => r.id), [4, 3]);
  assert.deepEqual(cuerpo.totales, { pendientes: 1, procesados: 2 });
  assert.deepEqual(cuerpo.pendientes[0].alumno, { nombreCompleto: 'ANA GARCIA LOPEZ', boleta: '2022630001', carrera: 'Ingeniería en Inteligencia Artificial' });
  assert.deepEqual(cuerpo.pendientes[0].profesor, { nombreCompleto: 'LUIS TORRES VEGA' });
  assert.equal(/solicitud_registro|ruta_archivo|hash|token|usuario_id/i.test(JSON.stringify(cuerpo)), false);
  assert.equal(e.listar.mock.calls[0].arguments[0], 71, 'el coordinador sale del token (sub)');
});

test('un usuario coordinador sin perfil → 404 de perfil; coordinador_id / usuario_id por query no cambian nada', async (t) => {
  const e = await levantar(t);
  const r = await e.pedir('', { sub: 999 });
  assert.equal(r.status, 404);
  assert.match(r.cuerpo.message, /perfil de coordinador/);
  const conQuery = await e.pedir('?coordinador_id=71&usuario_id=71', { sub: 70 });
  assert.equal(conQuery.status, 200);
  assert.deepEqual(e.listar.mock.calls.at(-1).arguments, [70]);
});

test('200 detalle: título, alumno, carrera, profesor, días, horas, fechas y estado; el rechazo trae su motivo', async (t) => {
  const e = await levantar(t);
  const { status, cuerpo } = await e.pedir('/mensual/1');
  assert.equal(status, 200);
  assert.equal(cuerpo.titulo, 'Reporte mensual de actividades No. 2');
  assert.deepEqual([cuerpo.diasLaborados, cuerpo.horasReportadas, cuerpo.estadoReporte, cuerpo.puedeRevisar], [4, 13, 'pendiente_revision_coordinador', true]);
  assert.equal(cuerpo.fechaAprobacionProfesor, '2026-08-20T15:00:00.000Z');
  assert.deepEqual(e.detalle.mock.calls[0].arguments, [70, 'mensual', '1']);
  const rechazado = await e.pedir('/mensual/4');
  assert.deepEqual(rechazado.cuerpo.revisionCoordinacion, { estado: 'rechazado', comentario: 'Falta el detalle de las horas.', fecha: '2026-08-11T15:00:00.000Z' });
});

test('reporte que sigue con el profesor, inexistente, global o id inválido: el mismo 404 en detalle, PDF, aprobar y rechazar', async (t) => {
  const e = await levantar(t);
  const esperado = { message: 'Reporte no encontrado.' };
  for (const ruta of ['/mensual/2', '/mensual/999', '/global/1', '/semanal/1', '/mensual/abc', '/mensual/0', '/mensual/-1', '/__proto__/1']) {
    assert.deepEqual((await e.pedir(ruta)).cuerpo, esperado, `detalle ${ruta}`);
    assert.equal((await e.pedirPdf(`${ruta}/pdf`)).status, 404, `pdf ${ruta}`);
    assert.equal((await e.pedir(`${ruta}/aprobar`, { metodo: 'POST' })).status, 404, `aprobar ${ruta}`);
    assert.equal((await e.pedir(`${ruta}/rechazar`, { metodo: 'POST', cuerpo: { comentario: 'x' } })).status, 404, `rechazar ${ruta}`);
  }
  assert.equal(e.reporte(2).estado_reporte, 'pendiente_revision_profesor');
  assert.deepEqual(e.sellosDeTiempo, []);
});

test('200 pdf: application/pdf con los bytes exactos almacenados; nunca se regenera', async (t) => {
  const e = await levantar(t);
  const r = await e.pedirPdf('/mensual/1/pdf');
  assert.equal(r.status, 200);
  assert.equal(r.cabeceras.get('content-type'), 'application/pdf');
  assert.equal(r.cabeceras.get('content-length'), String(PDF_VIGENTE.length));
  assert.equal(r.cabeceras.get('content-disposition'), 'inline; filename="reporte-mensual-2-2022630001.pdf"');
  assert.match(r.cabeceras.get('cache-control'), /no-store/);
  assert.equal(r.cabeceras.get('x-content-type-options'), 'nosniff');
  assert.equal(Buffer.compare(r.cuerpo, PDF_VIGENTE), 0);
  assert.equal((await e.pedirPdf('/mensual/3/pdf')).cuerpo.toString(), '%PDF-final-con-sello', 'también el ya validado');
  assert.ok(e.operaciones.every((o) => /\.(findUnique|findFirst|findMany)$/.test(o)), 'solo lecturas');
});

test('200 aprobar: PDF final = PDF vigente + sello, con hash, IP y sello de tiempo; pasa a aprobado_coordinador y se avisa a alumno y profesor', async (t) => {
  const e = await levantar(t);
  const r = await e.pedir('/mensual/1/aprobar', { metodo: 'POST', cuerpo: { estado: 'aprobado', hash: 'x', sello: 'y', coordinador_id: 71 } });

  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo.reporte, { id: 1, numero: 2, estadoReporte: 'aprobado_coordinador' });
  assert.deepEqual(Object.keys(r.cuerpo).sort(), ['fechaRevision', 'reporte'], 'sin hash, ruta ni token en la respuesta');
  assert.deepEqual(e.aprobar.mock.calls[0].arguments.slice(0, 3), [70, 'mensual', '1']);

  const final = Buffer.concat([PDF_VIGENTE, MARCA_SELLO]);
  const revisiones = e.reporte(1).revision_reporte_mensual;
  assert.equal(revisiones.length, 3, 'alumno y profesor se conservan; se agrega Coordinación');
  assert.deepEqual([revisiones[2].tipo_revisor, revisiones[2].estado, revisiones[2].hash_documento, revisiones[2].token_tsa, revisiones[2].usuario_id], ['coordinador', 'aprobado', sha256(final), TOKEN, 70]);
  assert.ok(revisiones[2].ip_firma);
  assert.deepEqual(e.sellosDeTiempo, [sha256(final)]);
  const ruta = e.reporte(1).documento.ruta_archivo;
  assert.notEqual(ruta, '1/vigente.pdf');
  assert.equal(Buffer.compare(descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, ruta))), final), 0);
  assert.equal(fs.existsSync(path.join(e.rutaBaseDocumentos, '1/vigente.pdf')), true, 'el PDF anterior se conserva');
  assert.deepEqual(e.avisos.notificaciones.map((n) => n.rutaRelacionada), ['/alumno/reportes?destacar=1', '/profesor/reportes?destacar=1']);

  // Y ahora el PDF que se ve es el final.
  assert.equal(Buffer.compare((await e.pedirPdf('/mensual/1/pdf')).cuerpo, final), 0);
});

test('aprobar: TSA caída → 503 reintentable sin avanzar nada; ya validado → 409; el hash alterado → 500 genérico', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  e.fallarTsa(async () => { throw new ErrorTsa('sin conexión', 'TSA_SIN_CONEXION'); });
  const caida = await e.pedir('/mensual/1/aprobar', { metodo: 'POST' });
  assert.equal(caida.status, 503);
  assert.deepEqual([caida.cuerpo.code, caida.cuerpo.reintentable], ['SELLO_TIEMPO_NO_DISPONIBLE', true]);
  assert.equal(e.reporte(1).estado_reporte, 'pendiente_revision_coordinador');
  assert.equal(e.reporte(1).revision_reporte_mensual.length, 2);
  assert.equal(e.reporte(1).documento.ruta_archivo, '1/vigente.pdf');
  assert.deepEqual(e.avisos.notificaciones, []);

  e.fallarTsa(async () => ({ token: TOKEN }));
  assert.equal((await e.pedir('/mensual/1/aprobar', { metodo: 'POST' })).status, 200);
  const repetido = await e.pedir('/mensual/1/aprobar', { metodo: 'POST' });
  assert.equal(repetido.status, 409);
  assert.deepEqual(repetido.cuerpo, { message: 'Este reporte ya no está pendiente de tu revisión.', code: 'REPORTE_NO_PENDIENTE', estadoReporte: 'aprobado_coordinador' });

  const alterado = await levantar(t);
  alterado.reporte(1).revision_reporte_mensual.find((r) => r.tipo_revisor === 'profesor').hash_documento = sha256('otro');
  const r = await alterado.pedir('/mensual/1/aprobar', { metodo: 'POST' });
  assert.equal(r.status, 500);
  assert.deepEqual(Object.keys(r.cuerpo).sort(), ['code', 'message']);
  assert.equal(r.cuerpo.message, 'Ocurrió un error. Intenta de nuevo más tarde.');
});

test('200 rechazar: cambia el estado, guarda el motivo y avisa; sin PDF, sello, hash ni TSA', async (t) => {
  const e = await levantar(t);
  const r = await e.pedir('/mensual/1/rechazar', { metodo: 'POST', cuerpo: { comentario: 'Falta el detalle.', coordinador_id: 71, estado: 'aprobado' } });

  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo.reporte, { id: 1, numero: 2, estadoReporte: 'rechazado_coordinador' });
  assert.deepEqual(e.rechazar.mock.calls[0].arguments.slice(0, 4), [70, 'mensual', '1', 'Falta el detalle.']);
  const ultima = e.reporte(1).revision_reporte_mensual.at(-1);
  assert.deepEqual([ultima.tipo_revisor, ultima.estado, ultima.comentario, ultima.usuario_id, ultima.hash_documento, ultima.token_tsa, ultima.ip_firma], ['coordinador', 'rechazado', 'Falta el detalle.', 70, null, null, null]);
  assert.equal(e.reporte(1).documento.ruta_archivo, '1/vigente.pdf');
  assert.deepEqual(e.sellosDeTiempo, []);
  assert.equal(e.avisos.notificaciones.length, 2);
});

test('rechazar: sin motivo → 400 con código; ya resuelto → 409 con el estado; nadie más cambia', async (t) => {
  const e = await levantar(t);
  for (const cuerpo of [undefined, {}, { comentario: '' }, { comentario: '   ' }, { comentario: 7 }]) {
    const r = await e.pedir('/mensual/1/rechazar', { metodo: 'POST', cuerpo });
    assert.equal(r.status, 400, JSON.stringify(cuerpo));
    assert.equal(r.cuerpo.code, 'COMENTARIO_REQUERIDO');
  }
  assert.equal(e.reporte(1).estado_reporte, 'pendiente_revision_coordinador');
  for (const id of [3, 4]) {
    const r = await e.pedir(`/mensual/${id}/rechazar`, { metodo: 'POST', cuerpo: { comentario: 'x' } });
    assert.equal(r.status, 409);
    assert.equal(r.cuerpo.code, 'REPORTE_NO_PENDIENTE');
  }
});

test('un error interno responde 500 genérico, sin filtrar detalles', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  e.listar.mock.mockImplementation(async () => { throw new Error('ECONNREFUSED mariadb:3306 secreto'); });
  const r = await e.pedir('');
  assert.equal(r.status, 500);
  assert.equal(JSON.stringify(r.cuerpo).includes('secreto'), false);
});
