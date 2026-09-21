// Rutas de /profesor/reportes (listado, detalle, PDF, rechazar, aprobar y rúbrica) de punta a punta: Express + auth reales,
// servicios reales con Prisma falso, carpetas temporales, TSA y notificaciones falsas. Sin BD, Redis, red ni FreeTSA.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { cifrarBuffer } = require('../../lib/fileEncryption');
const { ErrorTsa } = require('../../lib/timestampTsa');

const rutaRedis = require.resolve('../../lib/redis');
require.cache[rutaRedis] = { id: rutaRedis, filename: rutaRedis, loaded: true, exports: { get: async () => null } };

const { generarToken } = require('../../lib/jwt');
const { requireAuth } = require('../../middleware/auth.middleware');
const servicio = require('./reportes-profesor.service');
const revision = require('./reportes-revision.service');
const rubricas = require('./reportes.rubricas');
const router = require('./reportes-profesor.routes');
const { reporteMensual, crearBdProfesor } = require('./reportes.profesor.fixtures');

const listarReal = servicio.listarReportes;
const detalleReal = servicio.obtenerDetalleReporte;
const pdfReal = servicio.obtenerPdfReporte;
const rechazarReal = revision.rechazarReporte;
const aprobarReal = revision.aprobarReporte;
const estadoRubricaReal = rubricas.consultarEstadoRubrica;

const PDF_ALUMNO = Buffer.from('%PDF-1.7\n% PDF firmado por el alumno (bytes exactos)\n%%EOF\n');
const FIRMA_PROFESOR = Buffer.from('\n%%FIRMA-DEL-PROFESOR');
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA').toString('base64');
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

const RUBRICA_FALSA = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);

async function levantar(t, opciones) {
  // Carpeta de documentos temporal: los reportes 1 y 2 tienen su PDF cifrado; el 3 apunta a un archivo inexistente.
  const rutaBaseDocumentos = fs.mkdtempSync(path.join(os.tmpdir(), 'http-pdf-profesor-'));
  t.after(() => fs.rmSync(rutaBaseDocumentos, { recursive: true, force: true }));
  for (const ruta of ['1/a.pdf', '2/b.pdf']) {
    fs.mkdirSync(path.dirname(path.join(rutaBaseDocumentos, ruta)), { recursive: true });
    fs.writeFileSync(path.join(rutaBaseDocumentos, ruta), cifrarBuffer(ruta === '1/a.pdf' ? PDF_ALUMNO : Buffer.from('%PDF-del-otro-profesor')));
  }
  const rutaBaseRubricas = fs.mkdtempSync(path.join(os.tmpdir(), 'http-rubricas-profesor-'));
  t.after(() => fs.rmSync(rutaBaseRubricas, { recursive: true, force: true }));
  fs.mkdirSync(path.join(rutaBaseRubricas, '50'));
  fs.writeFileSync(path.join(rutaBaseRubricas, '50/firma.enc'), cifrarBuffer(Buffer.from('rúbrica de prueba')));
  const avisos = { notificaciones: [], emisiones: [] };
  const sellos = [];
  let tsa = async (hash) => { sellos.push(hash); return { token: TOKEN }; };

  const bd = crearBdProfesor({
    profesores: { 50: 1, 51: 2 },
    escritura: true,
    usuarios: { 50: { rubrica_imagen: '50/firma.enc' }, 51: { rubrica_imagen: null } },
    coordinadores: [70],
    reportes: [
      reporteMensual({ id: 1, profesorId: 1, solicitudId: 1001, envio: '2026-08-16T15:00:00.000Z', diasLaborados: 2, horasReportadas: 7, rutaArchivo: '1/a.pdf', hashAlumno: sha256(PDF_ALUMNO) }),
      reporteMensual({ id: 2, profesorId: 2, solicitudId: 1002, nombre: 'LUIS', apellidos: 'RUIZ MARTINEZ', boleta: '2022630002', rutaArchivo: '2/b.pdf' }),
      reporteMensual({ id: 3, profesorId: 1, solicitudId: 1003, estado: 'aprobado_coordinador', numero: 2, rutaArchivo: '3/no-existe.pdf' }),
    ],
    ...opciones,
  });
  const listar = t.mock.method(servicio, 'listarReportes', (id) => listarReal(id, { prisma: bd.prisma }));
  const detalle = t.mock.method(servicio, 'obtenerDetalleReporte', (id, tipo, reporteId) => detalleReal(id, tipo, reporteId, { prisma: bd.prisma }));

  const pdf = t.mock.method(servicio, 'obtenerPdfReporte', (id, tipo, reporteId) => pdfReal(id, tipo, reporteId, { prisma: bd.prisma, rutaBaseDocumentos }));

  const depsRevision = () => ({
    prisma: bd.prisma,
    rutaBaseDocumentos,
    rutaBaseRubricas,
    agregarRubrica: async (pdf) => Buffer.concat([pdf, FIRMA_PROFESOR]),
    solicitarSelloTiempo: (hash) => tsa(hash),
    crearNotificacion: async (datos) => { avisos.notificaciones.push(datos); },
    emitirAUsuario: (usuarioId, evento, datos) => { avisos.emisiones.push({ usuarioId, evento, datos }); },
  });
  const rechazar = t.mock.method(revision, 'rechazarReporte', (id, tipo, reporteId, comentario, deps) => rechazarReal(id, tipo, reporteId, comentario, { ...depsRevision(), ...deps }));
  const aprobar = t.mock.method(revision, 'aprobarReporte', (id, tipo, reporteId, deps) => aprobarReal(id, tipo, reporteId, { ...depsRevision(), ...deps }));
  const estadoRubrica = t.mock.method(rubricas, 'consultarEstadoRubrica', (id) => estadoRubricaReal(id, { prisma: bd.prisma }));
  const guardarRubrica = t.mock.method(rubricas, 'guardarRubrica', async () => ({ tieneRubrica: true, requiereSubirRubrica: false, fechaRegistro: '2026-09-21T15:00:00.000Z' }));

  const app = express();
  app.use(express.json());
  app.use('/profesor', router);
  const servidor = await new Promise((resolver) => { const s = app.listen(0, '127.0.0.1', () => resolver(s)); });
  t.after(() => new Promise((resolver) => servidor.close(resolver)));

  const base = `http://127.0.0.1:${servidor.address().port}/profesor/reportes`;
  async function pedir(ruta = '', { rol = 'profesor', sub = 50, sinToken = false } = {}) {
    const cabeceras = sinToken ? {} : { Authorization: `Bearer ${generarToken({ sub, rol })}` };
    const respuesta = await fetch(`${base}${ruta}`, { headers: cabeceras });
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  }
  async function pedirPdf(ruta, { rol = 'profesor', sub = 50 } = {}) {
    const respuesta = await fetch(`${base}${ruta}`, { headers: { Authorization: `Bearer ${generarToken({ sub, rol })}` } });
    return { status: respuesta.status, cabeceras: respuesta.headers, cuerpo: Buffer.from(await respuesta.arrayBuffer()) };
  }
  async function enviar(ruta, { metodo = 'POST', cuerpo, rol = 'profesor', sub = 50, sinToken = false } = {}) {
    const cabeceras = { 'Content-Type': 'application/json', ...(sinToken ? {} : { Authorization: `Bearer ${generarToken({ sub, rol })}` }) };
    const respuesta = await fetch(`${base}${ruta}`, { method: metodo, headers: cabeceras, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  }
  return {
    base, pedir, pedirPdf, enviar, listar, detalle, pdf, rechazar, aprobar, estadoRubrica, guardarRubrica, avisos, sellos,
    reporte: (id) => bd.reportes.find((r) => r.id === id),
    fallarTsa: (fn) => { tsa = fn; },
    rutaBaseDocumentos,
    ...bd,
  };
}

test('todas las rutas exigen sesión y rol profesor', () => {
  const rutas = [
    ['get', '/reportes'], ['get', '/reportes/:tipoReporte/:id'], ['get', '/reportes/:tipoReporte/:id/pdf'],
    ['post', '/reportes/:tipoReporte/:id/rechazar'], ['post', '/reportes/:tipoReporte/:id/aprobar'],
    ['get', '/reportes/rubrica'], ['post', '/reportes/rubrica'],
  ];
  assert.equal(router.stack.filter((c) => c.route).length, rutas.length, 'no hay rutas sin revisar');
  for (const [metodo, ruta] of rutas) {
    const capa = router.stack.find((c) => c.route?.path === ruta && c.route.methods[metodo]);
    assert.ok(capa, `${metodo.toUpperCase()} ${ruta} existe`);
    const [autenticar, autorizar] = capa.route.stack.map((c) => c.handle);
    assert.equal(autenticar, requireAuth);
    const res = { codigo: null, status(c) { res.codigo = c; return res; }, json() { return res; } };
    for (const rol of ['alumno_asignado', 'coordinador', 'alumno_sin_asignar']) {
      autorizar({ usuario: { rol } }, res, () => assert.fail(`${rol} no debe pasar`));
      assert.equal(res.codigo, 403);
    }
    let paso = false;
    autorizar({ usuario: { rol: 'profesor' } }, res, () => { paso = true; });
    assert.equal(paso, true);
  }
});

test('sin token → 401; otros roles → 403; el servicio no se llama', async (t) => {
  const e = await levantar(t);
  for (const ruta of ['', '/mensual/1', '/mensual/1/pdf']) {
    assert.equal((await e.pedir(ruta, { sinToken: true })).status, 401);
    for (const rol of ['alumno_asignado', 'alumno_sin_asignar', 'coordinador']) assert.equal((await e.pedir(ruta, { rol })).status, 403, `${rol} ${ruta}`);
  }
  for (const [metodo, ruta] of [['POST', '/mensual/1/rechazar'], ['POST', '/mensual/1/aprobar'], ['GET', '/rubrica'], ['POST', '/rubrica']]) {
    assert.equal((await e.enviar(ruta, { metodo, sinToken: true })).status, 401, `${metodo} ${ruta}`);
    for (const rol of ['alumno_asignado', 'alumno_sin_asignar', 'coordinador']) {
      assert.equal((await e.enviar(ruta, { metodo, rol, cuerpo: metodo === 'POST' ? { comentario: 'x' } : undefined })).status, 403, `${rol} ${metodo} ${ruta}`);
    }
  }
  assert.equal(e.rechazar.mock.callCount() + e.aprobar.mock.callCount() + e.estadoRubrica.mock.callCount() + e.guardarRubrica.mock.callCount(), 0);
  assert.equal(e.listar.mock.callCount(), 0);
  assert.equal(e.detalle.mock.callCount(), 0);
  assert.equal(e.pdf.mock.callCount(), 0);
});

test('200 listado: pendientes y procesados solo del profesor del token, con la forma acordada', async (t) => {
  const e = await levantar(t);
  const { status, cuerpo } = await e.pedir();

  assert.equal(status, 200);
  assert.deepEqual(Object.keys(cuerpo).sort(), ['pendientes', 'procesados', 'totales']);
  assert.deepEqual(cuerpo.pendientes.map((r) => r.id), [1]);
  assert.deepEqual(cuerpo.procesados.map((r) => r.id), [3]);
  assert.deepEqual(cuerpo.totales, { pendientes: 1, procesados: 1 });
  assert.deepEqual(Object.keys(cuerpo.pendientes[0]).sort(), [
    'alumno', 'estadoReporte', 'fechaEnvio', 'id', 'mesMostrado', 'numeroReporte', 'periodo', 'puedeRevisar', 'tipoReporte',
  ]);
  assert.deepEqual(cuerpo.pendientes[0].alumno, { nombreCompleto: 'ANA GARCIA LOPEZ', boleta: '2022630001' });
  assert.equal(cuerpo.pendientes[0].tipoReporte, 'mensual');
  assert.equal(cuerpo.pendientes[0].numeroReporte, 1);
  assert.equal(cuerpo.pendientes[0].mesMostrado.texto, 'Agosto 2026');
  // Nada de otros alumnos ni datos internos.
  const texto = JSON.stringify(cuerpo);
  assert.equal(/2022630002|RUIZ MARTINEZ/.test(texto), false);
  assert.equal(/solicitud_registro|documento_id|ruta_archivo|hash|token/i.test(texto), false);
  assert.equal(e.listar.mock.calls[0].arguments[0], 50, 'el profesor sale del token (sub)');
});

test('el otro profesor ve únicamente lo suyo', async (t) => {
  const e = await levantar(t);
  const { cuerpo } = await e.pedir('', { sub: 51 });
  assert.deepEqual(cuerpo.pendientes.map((r) => r.id), [2]);
  assert.deepEqual(cuerpo.procesados, []);
});

test('profesor_id / profesorId por query o cabecera NO cambian de quién son los reportes', async (t) => {
  const e = await levantar(t);
  const conQuery = await e.pedir('?profesor_id=2&profesorId=2&usuario_id=51');
  assert.deepEqual(conQuery.cuerpo.pendientes.map((r) => r.id), [1]);
  const detalle = await e.pedir('/mensual/2?profesor_id=2&profesorId=2');
  assert.equal(detalle.status, 404, 'el reporte del otro profesor sigue siendo ajeno');
  assert.deepEqual(e.listar.mock.calls[0].arguments, [50]);
});

test('200 detalle: título, tipo, número, alumno, boleta, días, horas, fecha de envío, actividades y estado', async (t) => {
  const e = await levantar(t);
  const { status, cuerpo } = await e.pedir('/mensual/1');

  assert.equal(status, 200);
  assert.equal(cuerpo.id, 1);
  assert.equal(cuerpo.tipoReporte, 'mensual');
  assert.equal(cuerpo.numeroReporte, 1);
  assert.equal(cuerpo.titulo, 'Reporte mensual de actividades No. 1');
  assert.deepEqual(cuerpo.alumno, { nombreCompleto: 'ANA GARCIA LOPEZ', boleta: '2022630001' });
  assert.equal(cuerpo.diasLaborados, 2);
  assert.equal(cuerpo.horasReportadas, 7);
  assert.equal(cuerpo.fechaEnvio, '2026-08-16T15:00:00.000Z');
  assert.equal(cuerpo.actividades, 'Actividades del reporte 1.');
  assert.equal(cuerpo.estadoReporte, 'pendiente_revision_profesor');
  assert.equal(cuerpo.puedeRevisar, true);
  assert.deepEqual(e.detalle.mock.calls[0].arguments, [50, 'mensual', '1']);

  const procesado = await e.pedir('/mensual/3');
  assert.equal(procesado.status, 200);
  assert.equal(procesado.cuerpo.puedeRevisar, false);
});

test('reporte ajeno, inexistente, tipo global o sin soporte, e id inválido: 404 idénticos', async (t) => {
  const e = await levantar(t);
  const ajeno = await e.pedir('/mensual/2');
  const inexistente = await e.pedir('/mensual/999');
  assert.equal(ajeno.status, 404);
  assert.deepEqual(ajeno.cuerpo, inexistente.cuerpo, 'no se distingue ajeno de inexistente');
  assert.deepEqual(ajeno.cuerpo, { message: 'Reporte no encontrado.' });

  for (const ruta of ['/global/1', '/semanal/1', '/mensual/abc', '/mensual/0', '/mensual/-1', '/mensual/1.5', '/mensual/99999999999999', '/__proto__/1']) {
    const r = await e.pedir(ruta);
    assert.equal(r.status, 404, ruta);
    assert.deepEqual(r.cuerpo, ajeno.cuerpo, ruta);
  }
});

test('un error interno responde 500 genérico, sin filtrar detalles', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  e.listar.mock.mockImplementation(async () => { throw new Error('ECONNREFUSED mariadb:3306 secreto'); });
  const r = await e.pedir();
  assert.equal(r.status, 500);
  assert.equal(JSON.stringify(r.cuerpo).includes('secreto'), false);
  assert.equal(JSON.stringify(r.cuerpo).includes('mariadb'), false);
});

test('profesor sin perfil → 404 con mensaje de perfil (no de reporte)', async (t) => {
  const e = await levantar(t);
  const r = await e.pedir('', { sub: 999 });
  assert.equal(r.status, 404);
  assert.match(r.cuerpo.message, /perfil de profesor/);
});

test('200 pdf: application/pdf con los bytes exactos que firmó el alumno, para el profesor dueño', async (t) => {
  const e = await levantar(t);
  const r = await e.pedirPdf('/mensual/1/pdf');

  assert.equal(r.status, 200);
  assert.equal(r.cabeceras.get('content-type'), 'application/pdf');
  assert.equal(r.cabeceras.get('content-length'), String(PDF_ALUMNO.length));
  assert.equal(r.cabeceras.get('content-disposition'), 'inline; filename="reporte-mensual-1-2022630001.pdf"');
  assert.match(r.cabeceras.get('cache-control'), /no-store/);
  assert.equal(r.cabeceras.get('x-content-type-options'), 'nosniff');
  assert.equal(Buffer.compare(r.cuerpo, PDF_ALUMNO), 0);
  assert.deepEqual(e.pdf.mock.calls[0].arguments, [50, 'mensual', '1'], 'el profesor sale del token');
  // Solo lecturas: nada de create/update/delete en la BD.
  assert.ok(e.operaciones.every((o) => /\.(findUnique|findFirst|findMany)$/.test(o)), e.operaciones.join(', '));
});

test('pdf de un reporte ajeno o inexistente: 404 JSON idéntico, sin bytes del otro profesor; profesor_id por query no cambia nada', async (t) => {
  const e = await levantar(t);
  const ajeno = await e.pedirPdf('/mensual/2/pdf?profesor_id=2&profesorId=2');
  const inexistente = await e.pedirPdf('/mensual/999/pdf');

  assert.equal(ajeno.status, 404);
  assert.deepEqual(JSON.parse(ajeno.cuerpo.toString()), { message: 'Reporte no encontrado.' });
  assert.deepEqual(ajeno.cuerpo, inexistente.cuerpo);
  assert.equal(ajeno.cuerpo.includes('del-otro-profesor'), false);
  assert.match(ajeno.cabeceras.get('content-type'), /application\/json/);

  // Y el otro profesor sí ve el suyo.
  const propio = await e.pedirPdf('/mensual/2/pdf', { sub: 51 });
  assert.equal(propio.status, 200);
  assert.equal(propio.cuerpo.toString(), '%PDF-del-otro-profesor');
});

test('pdf: tipo global o desconocido e id inválido → 404', async (t) => {
  const e = await levantar(t);
  for (const ruta of ['/global/1/pdf', '/semanal/1/pdf', '/mensual/abc/pdf', '/mensual/0/pdf', '/mensual/-1/pdf', '/__proto__/1/pdf']) {
    assert.equal((await e.pedirPdf(ruta)).status, 404, ruta);
  }
});

test('pdf: archivo faltante → 404 con código; archivo ilegible → 500 genérico sin detalles', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  const faltante = await e.pedirPdf('/mensual/3/pdf');
  assert.equal(faltante.status, 404);
  assert.deepEqual(JSON.parse(faltante.cuerpo.toString()), { message: 'El archivo del reporte no está disponible.', code: 'ARCHIVO_NO_DISPONIBLE' });

  e.pdf.mock.mockImplementation(async () => { throw new Error('EACCES /var/secreto/uploads'); });
  const roto = await e.pedirPdf('/mensual/1/pdf');
  assert.equal(roto.status, 500);
  assert.equal(roto.cuerpo.toString().includes('secreto'), false);
});

// ── Rechazar ─────────────────────────────────────────────────

test('200 rechazar: cambia el estado, guarda el motivo y avisa al alumno; el profesor sale del token', async (t) => {
  const e = await levantar(t);
  const r = await e.enviar('/mensual/1/rechazar', { cuerpo: { comentario: 'Faltan actividades.', profesor_id: 2, usuario_id: 51, estado: 'aprobado' } });

  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo, { reporte: { id: 1, numero: 1, estadoReporte: 'rechazado_profesor' }, fechaRevision: r.cuerpo.fechaRevision });
  assert.match(r.cuerpo.fechaRevision, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(e.rechazar.mock.calls[0].arguments.slice(0, 4), [50, 'mensual', '1', 'Faltan actividades.']);
  assert.equal(e.reporte(1).estado_reporte, 'rechazado_profesor');
  const ultima = e.reporte(1).revision_reporte_mensual.at(-1);
  assert.deepEqual([ultima.tipo_revisor, ultima.estado, ultima.comentario, ultima.usuario_id, ultima.hash_documento, ultima.token_tsa], ['profesor', 'rechazado', 'Faltan actividades.', 50, null, null]);
  assert.equal(e.avisos.notificaciones.length, 1);
  assert.equal(e.avisos.notificaciones[0].usuarioId, 201);
  assert.deepEqual(e.sellos, []);
});

test('rechazar sin motivo → 400 con código; ajeno/inexistente → 404 idéntico; ya revisado → 409 con el estado actual', async (t) => {
  const e = await levantar(t);
  for (const cuerpo of [undefined, {}, { comentario: '' }, { comentario: '   ' }, { comentario: 7 }]) {
    const r = await e.enviar('/mensual/1/rechazar', { cuerpo });
    assert.equal(r.status, 400, JSON.stringify(cuerpo));
    assert.equal(r.cuerpo.code, 'COMENTARIO_REQUERIDO');
  }
  assert.equal(e.reporte(1).estado_reporte, 'pendiente_revision_profesor');

  const ajeno = await e.enviar('/mensual/2/rechazar', { cuerpo: { comentario: 'x' } });
  const inexistente = await e.enviar('/mensual/999/rechazar', { cuerpo: { comentario: 'x' } });
  assert.equal(ajeno.status, 404);
  assert.deepEqual(ajeno.cuerpo, { message: 'Reporte no encontrado.' });
  assert.deepEqual(ajeno.cuerpo, inexistente.cuerpo);
  assert.equal((await e.enviar('/global/1/rechazar', { cuerpo: { comentario: 'x' } })).status, 404);
  assert.equal(e.reporte(2).estado_reporte, 'pendiente_revision_profesor');

  assert.equal((await e.enviar('/mensual/1/rechazar', { cuerpo: { comentario: 'Motivo' } })).status, 200);
  const repetido = await e.enviar('/mensual/1/rechazar', { cuerpo: { comentario: 'Otra vez' } });
  assert.equal(repetido.status, 409);
  assert.deepEqual(repetido.cuerpo, { message: 'Este reporte ya no está pendiente de tu revisión.', code: 'REPORTE_NO_PENDIENTE', estadoReporte: 'rechazado_profesor' });
  const procesado = await e.enviar('/mensual/3/rechazar', { cuerpo: { comentario: 'x' } });
  assert.equal(procesado.status, 409);
});

// ── Aprobar y firmar ─────────────────────────────────────────

test('200 aprobar: PDF final = PDF del alumno + firma del profesor, con hash, IP y sello; pasa a Coordinación y se avisa', async (t) => {
  const e = await levantar(t);
  const r = await e.enviar('/mensual/1/aprobar', { cuerpo: { estado: 'aprobado', hash: 'x', rubrica: 'y', profesor_id: 2 } });

  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo.reporte, { id: 1, numero: 1, estadoReporte: 'pendiente_revision_coordinador' });
  assert.deepEqual(Object.keys(r.cuerpo).sort(), ['fechaRevision', 'reporte'], 'sin hash, ruta ni token en la respuesta');
  assert.deepEqual(e.aprobar.mock.calls[0].arguments.slice(0, 3), [50, 'mensual', '1']);

  const final = Buffer.concat([PDF_ALUMNO, FIRMA_PROFESOR]);
  const revisiones = e.reporte(1).revision_reporte_mensual;
  assert.equal(revisiones.length, 2, 'la firma del alumno se conserva y se agrega la del profesor');
  assert.deepEqual([revisiones[1].tipo_revisor, revisiones[1].estado, revisiones[1].hash_documento, revisiones[1].token_tsa], ['profesor', 'aprobado', sha256(final), TOKEN]);
  assert.ok(revisiones[1].ip_firma, 'la IP sale de la conexión');
  assert.deepEqual(e.sellos, [sha256(final)]);
  // El documento ahora es el PDF final, cifrado.
  const ruta = e.reporte(1).documento.ruta_archivo;
  assert.notEqual(ruta, '1/a.pdf');
  const { descifrarBuffer } = require('../../lib/fileEncryption');
  assert.equal(Buffer.compare(descifrarBuffer(fs.readFileSync(path.join(e.rutaBaseDocumentos, ruta))), final), 0);
  assert.deepEqual(e.avisos.notificaciones.map((n) => n.usuarioId), [70]);
  assert.equal(e.avisos.notificaciones[0].rutaRelacionada, '/coordinacion/reportes?destacar=1');
});

test('aprobar: sin rúbrica 409; TSA caída 503 reintentable sin avanzar nada; ajeno 404; repetido 409', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);

  const sinRubrica = await e.enviar('/mensual/2/aprobar', { sub: 51 });
  assert.equal(sinRubrica.status, 409);
  assert.equal(sinRubrica.cuerpo.code, 'RUBRICA_NO_REGISTRADA');

  e.fallarTsa(async () => { throw new ErrorTsa('sin conexión', 'TSA_SIN_CONEXION'); });
  const caida = await e.enviar('/mensual/1/aprobar');
  assert.equal(caida.status, 503);
  assert.deepEqual([caida.cuerpo.code, caida.cuerpo.reintentable], ['SELLO_TIEMPO_NO_DISPONIBLE', true]);
  assert.equal(e.reporte(1).estado_reporte, 'pendiente_revision_profesor');
  assert.equal(e.reporte(1).revision_reporte_mensual.length, 1);
  assert.equal(e.reporte(1).documento.ruta_archivo, '1/a.pdf');
  assert.deepEqual(e.avisos.notificaciones, []);

  const ajeno = await e.enviar('/mensual/2/aprobar');
  assert.deepEqual(ajeno, { status: 404, cuerpo: { message: 'Reporte no encontrado.' } });

  e.fallarTsa(async () => ({ token: TOKEN }));
  assert.equal((await e.enviar('/mensual/1/aprobar')).status, 200);
  assert.equal((await e.enviar('/mensual/1/aprobar')).status, 409);
});

test('500 al aprobar: mensaje genérico, sin rutas ni detalles internos', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  e.aprobar.mock.mockImplementation(async () => { throw new Error('ENOENT /var/uploads/secreto/1/a.pdf'); });
  const r = await e.enviar('/mensual/1/aprobar');
  assert.equal(r.status, 500);
  assert.equal(JSON.stringify(r.cuerpo).includes('secreto'), false);
});

// ── Rúbrica del profesor ─────────────────────────────────────

test('GET rúbrica: solo si existe (nunca la ruta ni los bytes) — con firma y sin ella', async (t) => {
  const e = await levantar(t);
  assert.deepEqual(await e.enviar('/rubrica', { metodo: 'GET' }), { status: 200, cuerpo: { tieneRubrica: true, requiereSubirRubrica: false } });
  assert.deepEqual(await e.enviar('/rubrica', { metodo: 'GET', sub: 51 }), { status: 200, cuerpo: { tieneRubrica: false, requiereSubirRubrica: true } });
});

test('POST rúbrica: el profesor la sube con el mismo mecanismo seguro del alumno (multipart, campo "rubrica", el usuario sale del token)', async (t) => {
  const e = await levantar(t);
  const url = `${e.base}/rubrica`;
  const formulario = new FormData();
  formulario.append('rubrica', new Blob([RUBRICA_FALSA], { type: 'image/png' }), 'firma.png');
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${generarToken({ sub: 51, rol: 'profesor' })}` }, body: formulario });

  assert.equal(r.status, 201);
  assert.deepEqual([e.guardarRubrica.mock.calls[0].arguments[0], Buffer.compare(e.guardarRubrica.mock.calls[0].arguments[1].buffer, RUBRICA_FALSA)], [51, 0]);
  const cuerpo = await r.json();
  assert.deepEqual([cuerpo.tieneRubrica, cuerpo.requiereSubirRubrica], [true, false]);

  const sinArchivo = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${generarToken({ sub: 51, rol: 'alumno_asignado' })}` }, body: formulario });
  assert.equal(sinArchivo.status, 403);
});
