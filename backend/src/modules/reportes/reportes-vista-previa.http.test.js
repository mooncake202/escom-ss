// POST /reportes/mensual/vista-previa de punta a punta (Express + auth reales); BD falsa, carpeta temporal, sin Redis real.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const { PDFDocument } = require('pdf-lib');

const rutaRedis = require.resolve('../../lib/redis');
require.cache[rutaRedis] = { id: rutaRedis, filename: rutaRedis, loaded: true, exports: { get: async () => null } };

const { generarToken } = require('../../lib/jwt');
const { requireAuth } = require('../../middleware/auth.middleware');
const vistaPrevia = require('./reportes-vista-previa.service');
const { guardarRubrica } = require('./reportes.rubricas');
const router = require('./reportes-alumno.routes');
const { crearBdReporte } = require('./reportes.vista-previa.fixtures');
const { crearPng, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');

const generarReal = vistaPrevia.generarVistaPreviaReporteMensual;
const SIN_CUERPO = Symbol('sin cuerpo');

async function levantar(t, opciones = {}, { conRubrica = true } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'vista-previa-http-'));
  const bd = crearBdReporte(opciones);
  if (conRubrica) await guardarRubrica(7, { buffer: crearPng(500, 180) }, { prisma: bd.prisma, rutaBase: base });
  bd.operaciones.length = 0;
  const servicio = t.mock.method(vistaPrevia, 'generarVistaPreviaReporteMensual', (id, actividades) => generarReal(id, actividades, { prisma: bd.prisma, ahora: bd.ahora, rutaBase: base }));

  const app = express();
  app.use(express.json());
  app.use('/reportes', router);
  const servidor = await new Promise((resolver) => { const s = app.listen(0, '127.0.0.1', () => resolver(s)); });
  t.after(() => new Promise((resolver) => servidor.close(resolver)));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));

  const url = `http://127.0.0.1:${servidor.address().port}/reportes/mensual/vista-previa`;
  async function pedir({ cuerpo = { actividades: ACTIVIDADES_EJEMPLO }, rol = 'alumno_asignado', sub = 7, sinToken = false } = {}) {
    const cabeceras = { 'Content-Type': 'application/json' };
    if (!sinToken) cabeceras.Authorization = `Bearer ${generarToken({ sub, rol })}`;
    return fetch(url, { method: 'POST', headers: cabeceras, body: cuerpo === SIN_CUERPO ? undefined : JSON.stringify(cuerpo) });
  }
  const json = async (respuesta) => ({ status: respuesta.status, cuerpo: await respuesta.json() });
  return { pedir, json, servicio, ...bd };
}

test('la ruta exige sesión y rol alumno_asignado', () => {
  const capa = router.stack.find((c) => c.route?.path === '/mensual/vista-previa' && c.route.methods.post);
  assert.ok(capa, 'POST /mensual/vista-previa existe');
  const [autenticar, autorizar] = capa.route.stack.map((c) => c.handle);
  assert.equal(autenticar, requireAuth);
  const res = { codigo: null, status(c) { res.codigo = c; return res; }, json() { return res; } };
  autorizar({ usuario: { rol: 'profesor' } }, res, () => assert.fail('no debe continuar'));
  assert.equal(res.codigo, 403);
});

test('sin token → 401; con otro rol → 403; no se llama al servicio', async (t) => {
  const { pedir, servicio } = await levantar(t);
  assert.equal((await pedir({ sinToken: true })).status, 401);
  for (const rol of ['coordinador', 'profesor', 'alumno']) assert.equal((await pedir({ rol })).status, 403, rol);
  assert.equal(servicio.mock.callCount(), 0);
});

test('200: entrega el PDF (una página Carta) con cabeceras que evitan guardarlo o interpretarlo distinto', async (t) => {
  const { pedir, servicio, escrituras } = await levantar(t);
  const respuesta = await pedir();

  assert.equal(respuesta.status, 200);
  assert.equal(respuesta.headers.get('content-type'), 'application/pdf');
  assert.equal(respuesta.headers.get('cache-control'), 'no-store');
  assert.equal(respuesta.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(respuesta.headers.get('content-disposition'), 'inline; filename="vista-previa-reporte-mensual-1.pdf"');

  const bytes = Buffer.from(await respuesta.arrayBuffer());
  assert.equal(Number(respuesta.headers.get('content-length')), bytes.length);
  assert.equal(bytes.subarray(0, 5).toString('latin1'), '%PDF-');
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 1);

  assert.deepEqual(escrituras(), [], 'no se escribió nada en la BD');
  const [id, actividades] = servicio.mock.calls[0].arguments;
  assert.equal(id, 7, 'el alumno sale del token');
  assert.equal(actividades, ACTIVIDADES_EJEMPLO, 'solo se usa el texto de actividades del cuerpo');
});

test('el alumno sale siempre del token: campos extra del cuerpo (usuario_id, rúbrica, número) se ignoran', async (t) => {
  const { pedir, servicio } = await levantar(t);
  const respuesta = await pedir({ cuerpo: { actividades: ACTIVIDADES_EJEMPLO, usuario_id: 999, numero: 50, rubrica: 'otra' } });
  assert.equal(respuesta.status, 200);
  assert.equal(servicio.mock.calls[0].arguments[0], 7);
  assert.equal(servicio.mock.calls[0].arguments[1], ACTIVIDADES_EJEMPLO);
  assert.equal(servicio.mock.calls[0].arguments.length, 2, 'el servicio solo recibe el usuario y las actividades');
});

test('sin actividades (cuerpo vacío, sin cuerpo o vacías) → 400 ACTIVIDADES_VACIAS', async (t) => {
  const { pedir, json } = await levantar(t);
  for (const cuerpo of [{}, { actividades: '' }, { actividades: '  \n ' }, { actividades: null }]) {
    const r = await json(await pedir({ cuerpo }));
    assert.equal(r.status, 400, JSON.stringify(cuerpo));
    assert.equal(r.cuerpo.code, 'ACTIVIDADES_VACIAS');
  }
  const sinCuerpo = await json(await pedir({ cuerpo: SIN_CUERPO }));
  assert.equal(sinCuerpo.status, 400);
  assert.equal(sinCuerpo.cuerpo.code, 'ACTIVIDADES_VACIAS');
});

test('actividades que no son texto → 400 TEXTO_INVALIDO', async (t) => {
  const { pedir, json } = await levantar(t);
  for (const actividades of [42, ['a', 'b'], { texto: 'x' }, true]) {
    const r = await json(await pedir({ cuerpo: { actividades } }));
    assert.equal(r.status, 400);
    assert.equal(r.cuerpo.code, 'TEXTO_INVALIDO');
  }
});

test('caracteres no soportados → 400 con la lista de caracteres para que el alumno los corrija', async (t) => {
  const { pedir, json } = await levantar(t);
  const r = await json(await pedir({ cuerpo: { actividades: 'Terminé la tarea 😀' } }));
  assert.equal(r.status, 400);
  assert.equal(r.cuerpo.code, 'CARACTERES_NO_SOPORTADOS');
  assert.deepEqual(r.cuerpo.caracteres, [{ caracter: '😀', codigo: 'U+1F600' }]);
});

test('actividades que no caben → 422 con las líneas (para pedir que se resuma)', async (t) => {
  const { pedir, json } = await levantar(t);
  const demasiado = Array.from({ length: 40 }, (_, i) => `Actividad ${i + 1}: revisé y documenté los requerimientos del módulo asignado.`).join('\n');
  const r = await json(await pedir({ cuerpo: { actividades: demasiado } }));
  assert.equal(r.status, 422);
  assert.equal(r.cuerpo.code, 'ACTIVIDADES_EXCEDEN_ESPACIO');
  assert.ok(r.cuerpo.lineasMaximas > 0 && r.cuerpo.lineasRenderizadas > r.cuerpo.lineasMaximas);
  assert.match(r.cuerpo.message, /Resume/);
});

test('palabra demasiado larga → 422 ACTIVIDADES_PALABRA_DEMASIADO_LARGA', async (t) => {
  const { pedir, json } = await levantar(t);
  const r = await json(await pedir({ cuerpo: { actividades: `Consulté ${'documentos-del-proyecto/'.repeat(30)}` } }));
  assert.equal(r.status, 422);
  assert.equal(r.cuerpo.code, 'ACTIVIDADES_PALABRA_DEMASIADO_LARGA');
});

test('reporte no generable → 409 REPORTE_NO_GENERABLE con los motivos', async (t) => {
  const { pedir, json } = await levantar(t, { bitacoras: [] });
  const r = await json(await pedir());
  assert.equal(r.status, 409);
  assert.equal(r.cuerpo.code, 'REPORTE_NO_GENERABLE');
  assert.deepEqual(r.cuerpo.motivosBloqueo.map((m) => m.codigo), ['SIN_BITACORAS_APROBADAS']);
  assert.ok(r.cuerpo.motivosBloqueo[0].mensaje);
});

test('sin rúbrica registrada → 409 RUBRICA_NO_REGISTRADA', async (t) => {
  const { pedir, json } = await levantar(t, {}, { conRubrica: false });
  const r = await json(await pedir());
  assert.equal(r.status, 409);
  assert.equal(r.cuerpo.code, 'RUBRICA_NO_REGISTRADA');
});

test('datos del alumno no imprimibles → 422 DATOS_NO_IMPRIMIBLES con el campo', async (t) => {
  const { pedir, json } = await levantar(t, { nombre: 'ANA 😀' });
  const r = await json(await pedir());
  assert.equal(r.status, 422);
  assert.equal(r.cuerpo.code, 'DATOS_NO_IMPRIMIBLES');
  assert.equal(r.cuerpo.campo, 'alumno.nombreCompleto');
});

test('un error interno responde 500 genérico, sin filtrar detalles ni datos de apoyo', async (t) => {
  const { pedir, json, servicio } = await levantar(t);
  const silencio = t.mock.method(console, 'error', () => {});
  servicio.mock.mockImplementation(async () => {
    throw Object.assign(new Error('EACCES /srv/uploads/rubricas/7/secreto.enc'), { code: 'PDF_PAGINAS_INVALIDAS', campo: 'ruta-interna' });
  });
  const r = await json(await pedir());
  assert.equal(r.status, 500);
  assert.equal(JSON.stringify(r.cuerpo).includes('secreto'), false);
  assert.equal(JSON.stringify(r.cuerpo).includes('/srv'), false);
  assert.equal(r.cuerpo.campo, undefined);
  assert.ok(silencio.mock.callCount() >= 1);
});

test('una respuesta de error nunca es un PDF ni lleva la cabecera de PDF', async (t) => {
  const { pedir } = await levantar(t, { bitacoras: [] });
  const respuesta = await pedir();
  assert.equal(respuesta.status, 409);
  assert.match(respuesta.headers.get('content-type'), /application\/json/);
});
