// POST /reportes/mensual (envío definitivo) de punta a punta: Express + auth reales, servicio real con BD falsa,
// carpetas temporales y TSA falsa. Sin Redis real ni red.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');

const rutaRedis = require.resolve('../../lib/redis');
require.cache[rutaRedis] = { id: rutaRedis, filename: rutaRedis, loaded: true, exports: { get: async () => null } };

const { generarToken } = require('../../lib/jwt');
const { requireAuth } = require('../../middleware/auth.middleware');
const envio = require('./reportes-envio.service');
const { guardarRubrica } = require('./reportes.rubricas');
const { ErrorTsa } = require('../../lib/timestampTsa');
const router = require('./reportes-alumno.routes');
const { crearBdEnvio } = require('./reportes.envio.fixtures');
const { crearPng, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');

const enviarReal = envio.enviarReporteMensual;
const TOKEN = Buffer.from('TOKEN-TSA-DE-PRUEBA').toString('base64');

async function levantar(t, opciones = {}, { tsa } = {}) {
  const tmp = (prefijo) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefijo));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    return dir;
  };
  const rutaBaseRubricas = tmp('envio-http-rubricas-');
  const rutaBaseDocumentos = tmp('envio-http-docs-');
  const bd = crearBdEnvio(opciones);
  await guardarRubrica(7, { buffer: crearPng(500, 180) }, { prisma: bd.prisma, rutaBase: rutaBaseRubricas });
  bd.operaciones.length = 0;

  const servicio = t.mock.method(envio, 'enviarReporteMensual', (id, actividades, deps) => enviarReal(id, actividades, {
    ...deps,
    prisma: bd.prisma,
    ahora: bd.ahora,
    rutaBaseRubricas,
    rutaBaseDocumentos,
    solicitarSelloTiempo: tsa ?? (async () => ({ token: TOKEN, fecha: new Date() })),
    crearNotificacion: async () => {},
    emitirAUsuario: () => {},
  }));

  const app = express();
  app.use(express.json());
  app.use('/reportes', router);
  const servidor = await new Promise((resolver) => { const s = app.listen(0, '127.0.0.1', () => resolver(s)); });
  t.after(() => new Promise((resolver) => servidor.close(resolver)));

  const url = `http://127.0.0.1:${servidor.address().port}/reportes/mensual`;
  async function pedir({ cuerpo = { actividades: ACTIVIDADES_EJEMPLO }, rol = 'alumno_asignado', sub = 7, sinToken = false } = {}) {
    const cabeceras = { 'Content-Type': 'application/json' };
    if (!sinToken) cabeceras.Authorization = `Bearer ${generarToken({ sub, rol })}`;
    const respuesta = await fetch(url, { method: 'POST', headers: cabeceras, body: JSON.stringify(cuerpo) });
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  }
  const archivos = () => fs.readdirSync(rutaBaseDocumentos, { recursive: true, withFileTypes: true }).filter((e) => e.isFile());
  return { pedir, servicio, archivos, ...bd };
}

test('la ruta exige sesión y rol alumno_asignado', () => {
  const capa = router.stack.find((c) => c.route?.path === '/mensual' && c.route.methods.post);
  assert.ok(capa, 'POST /mensual existe');
  const [autenticar, autorizar] = capa.route.stack.map((c) => c.handle);
  assert.equal(autenticar, requireAuth);
  const res = { codigo: null, status(c) { res.codigo = c; return res; }, json() { return res; } };
  autorizar({ usuario: { rol: 'profesor' } }, res, () => assert.fail('no debe continuar'));
  assert.equal(res.codigo, 403);
});

test('sin token → 401; con otro rol → 403; no se llama al servicio', async (t) => {
  const e = await levantar(t);
  assert.equal((await e.pedir({ sinToken: true })).status, 401);
  for (const rol of ['coordinador', 'profesor', 'alumno']) assert.equal((await e.pedir({ rol })).status, 403, rol);
  assert.equal(e.servicio.mock.callCount(), 0);
});

test('201: reporte enviado a revisión, sin decir "aprobado" y sin exponer ruta, hash ni token', async (t) => {
  const e = await levantar(t);
  const { status, cuerpo } = await e.pedir();

  assert.equal(status, 201);
  assert.deepEqual(Object.keys(cuerpo).sort(), ['fechaEnvio', 'message', 'reporte']);
  assert.deepEqual(cuerpo.reporte, { id: e.db.reportes[0].id, numero: 1, estadoReporte: 'pendiente_revision_profesor' });
  assert.match(cuerpo.message, /firmado y enviado a tu profesor responsable/);
  const texto = JSON.stringify(cuerpo);
  assert.equal(/aprobad/i.test(texto), false);
  assert.equal(texto.includes(e.db.documentos[0].ruta_archivo), false);
  assert.equal(texto.includes(e.db.revisiones[0].hash_documento), false);
  assert.equal(texto.includes(TOKEN), false);

  assert.equal(e.db.documentos.length, 1);
  assert.equal(e.db.reportes.length, 1);
  assert.equal(e.db.revisiones.length, 1);
  assert.equal(e.archivos().length, 1);
  assert.ok(e.db.revisiones[0].ip_firma, 'IP de la firma registrada');
});

test('el alumno sale del token y solo se usan las actividades del cuerpo (campos extra ignorados)', async (t) => {
  const e = await levantar(t);
  const { status } = await e.pedir({ cuerpo: { actividades: ACTIVIDADES_EJEMPLO, usuario_id: 999, numero: 50, estado: 'aprobado_coordinador', hash: 'x', token_tsa: 'y' } });
  assert.equal(status, 201);
  const [id, actividades] = e.servicio.mock.calls[0].arguments;
  assert.equal(id, 7);
  assert.equal(actividades, ACTIVIDADES_EJEMPLO);
  assert.equal(e.db.reportes[0].estado_reporte, 'pendiente_revision_profesor');
  assert.equal(e.db.reportes[0].num_reporte, 1);
});

test('TSA caída → 503 reintentable con mensaje claro, y no queda nada guardado', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t, {}, { tsa: async () => { throw new ErrorTsa('sin conexión con freetsa.org', 'TSA_SIN_CONEXION'); } });
  const { status, cuerpo } = await e.pedir();
  assert.equal(status, 503);
  assert.equal(cuerpo.code, 'SELLO_TIEMPO_NO_DISPONIBLE');
  assert.equal(cuerpo.reintentable, true);
  assert.match(cuerpo.message, /Tu reporte no fue enviado/);
  assert.equal(JSON.stringify(cuerpo).includes('freetsa'), false);
  assert.deepEqual(e.db.documentos, []);
  assert.deepEqual(e.db.reportes, []);
  assert.deepEqual(e.db.revisiones, []);
  assert.equal(e.archivos().length, 0);
});

test('envíos simultáneos por HTTP: un 201 y los demás 409 REPORTE_YA_EXISTE con el reporte existente', async (t) => {
  const e = await levantar(t, {}, { tsa: async () => { await new Promise((r) => setTimeout(r, 20)); return { token: TOKEN, fecha: new Date() }; } });
  const respuestas = await Promise.all([e.pedir(), e.pedir(), e.pedir()]);
  assert.deepEqual(respuestas.map((r) => r.status).sort(), [201, 409, 409]);
  for (const r of respuestas.filter((x) => x.status === 409)) {
    assert.equal(r.cuerpo.code, 'REPORTE_YA_EXISTE');
    assert.deepEqual(r.cuerpo.reporteExistente, { numero: 1, estadoReporte: 'pendiente_revision_profesor' });
  }
  assert.equal(e.db.reportes.length, 1);
  assert.equal(e.archivos().length, 1);
});

test('validaciones: sin actividades 400; no generable 409 con motivos; sin rúbrica 409; datos que cambian 409', async (t) => {
  const vacio = await levantar(t);
  const r1 = await vacio.pedir({ cuerpo: {} });
  assert.equal(r1.status, 400);
  assert.equal(r1.cuerpo.code, 'ACTIVIDADES_VACIAS');

  const bloqueado = await levantar(t, { bitacoras: [] });
  const r2 = await bloqueado.pedir();
  assert.equal(r2.status, 409);
  assert.equal(r2.cuerpo.code, 'REPORTE_NO_GENERABLE');
  assert.deepEqual(r2.cuerpo.motivosBloqueo.map((m) => m.codigo), ['SIN_BITACORAS_APROBADAS']);

  const cambio = await levantar(t, {}, {
    tsa: async () => { cambio.perfil.profesorUsuario = { nombre: 'OTRO', apellidos: 'PROFESOR' }; return { token: TOKEN, fecha: new Date() }; },
  });
  const r3 = await cambio.pedir();
  assert.equal(r3.status, 409);
  assert.equal(r3.cuerpo.code, 'DATOS_DEL_REPORTE_CAMBIARON');
  assert.equal(cambio.db.reportes.length, 0);
});

test('un error interno responde 500 genérico, sin filtrar detalles', async (t) => {
  t.mock.method(console, 'error', () => {});
  const e = await levantar(t);
  e.servicio.mock.mockImplementation(async () => { throw Object.assign(new Error('EACCES /srv/uploads/documentos/2022630001/secreto.pdf'), { campo: 'ruta' }); });
  const { status, cuerpo } = await e.pedir();
  assert.equal(status, 500);
  assert.equal(JSON.stringify(cuerpo).includes('secreto'), false);
  assert.equal(cuerpo.campo, undefined);
});
