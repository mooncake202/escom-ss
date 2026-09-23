// POST /reportes/rubrica de punta a punta (Express + multer + auth reales); BD falsa, carpeta temporal, sin Redis real.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');

// La blacklist de tokens consulta Redis: se sustituye por un doble para no abrir conexiones.
const rutaRedis = require.resolve('../../lib/redis');
require.cache[rutaRedis] = { id: rutaRedis, filename: rutaRedis, loaded: true, exports: { get: async () => null } };

const { generarToken } = require('../../lib/jwt');
const { requireAuth } = require('../../middleware/auth.middleware');
const rubricas = require('./reportes.rubricas');
const router = require('./reportes-alumno.routes');
const { crearPng, crearPngRuido, JPEG_PEQUENO } = require('./reportes.pdf.fixtures');

const PNG = crearPng(400, 140);
const guardarReal = rubricas.guardarRubrica;

async function levantar(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'rubricas-http-'));
  const usuario = { id: 7, rubrica_imagen: null };
  const BOLETA = '2022630001';
  const bd = {
    usuario: {
      findUnique: async () => ({
        id: usuario.id, rol: 'alumno_asignado', rubrica_imagen: usuario.rubrica_imagen,
        correo_institucional: null, alumno: { boleta: BOLETA },
      }),
      updateMany: async ({ where, data }) => {
        if (where.rubrica_imagen === null && usuario.rubrica_imagen !== null) return { count: 0 };
        Object.assign(usuario, data);
        return { count: 1 };
      },
    },
  };
  const servicio = t.mock.method(rubricas, 'guardarRubrica', (id, archivo, opciones) => guardarReal(id, archivo, { ...opciones, prisma: bd, rutaBase: base }));

  const app = express();
  app.use('/reportes', router);
  const servidor = await new Promise((resolver) => { const s = app.listen(0, '127.0.0.1', () => resolver(s)); });
  t.after(() => new Promise((resolver) => servidor.close(resolver)));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));

  const url = `http://127.0.0.1:${servidor.address().port}/reportes/rubrica`;
  const token = (rol = 'alumno_asignado', sub = 7) => generarToken({ sub, rol });

  async function subir({ archivo = PNG, campo = 'rubrica', nombre = 'firma.png', tipo = 'image/png', rol, extras = {}, sinToken = false, sinMultipart = false } = {}) {
    const cabeceras = sinToken ? {} : { Authorization: `Bearer ${token(rol)}` };
    let body;
    if (sinMultipart) {
      body = JSON.stringify({ rubrica: 'x' });
      cabeceras['Content-Type'] = 'application/json';
    } else {
      body = new FormData();
      for (const [k, v] of Object.entries(extras)) body.append(k, v);
      if (archivo) body.append(campo, new Blob([archivo], { type: tipo }), nombre);
    }
    const respuesta = await fetch(url, { method: 'POST', headers: cabeceras, body });
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  }
  const archivosGuardados = () => fs.readdirSync(base, { recursive: true, withFileTypes: true }).filter((e) => e.isFile());
  return { subir, usuario, servicio, base, archivosGuardados };
}

test('la ruta exige sesión y rol alumno_asignado, en ese orden', () => {
  const capa = router.stack.find((c) => c.route?.path === '/rubrica' && c.route.methods.post);
  assert.ok(capa, 'POST /rubrica existe');
  const [autenticar, autorizar] = capa.route.stack.map((c) => c.handle);
  assert.equal(autenticar, requireAuth);
  const respuesta = () => { const r = { codigo: null, status(c) { r.codigo = c; return r; }, json() { return r; } }; return r; };
  let res = respuesta();
  autorizar({ usuario: { rol: 'coordinador' } }, res, () => assert.fail('no debe continuar'));
  assert.equal(res.codigo, 403);
  res = respuesta();
  let continuo = false;
  autorizar({ usuario: { rol: 'alumno_asignado' } }, res, () => { continuo = true; });
  assert.equal(continuo, true);
});

test('sin token → 401; con otro rol → 403; en ambos casos no se llama al servicio', async (t) => {
  const { subir, servicio } = await levantar(t);
  assert.equal((await subir({ sinToken: true })).status, 401);
  for (const rol of ['coordinador', 'profesor', 'alumno']) assert.equal((await subir({ rol })).status, 403, rol);
  assert.equal(servicio.mock.callCount(), 0);
});

test('201: guarda la rúbrica y responde solo el estado, aclarando que no se firmó ni envió nada', async (t) => {
  const { subir, usuario, servicio, archivosGuardados } = await levantar(t);
  const { status, cuerpo } = await subir();

  assert.equal(status, 201);
  assert.deepEqual(Object.keys(cuerpo).sort(), ['message', 'requiereSubirRubrica', 'tieneRubrica']);
  assert.equal(cuerpo.tieneRubrica, true);
  assert.equal(cuerpo.requiereSubirRubrica, false);
  assert.match(cuerpo.message, /Aún no se ha firmado ni enviado ningún reporte/);
  assert.equal(JSON.stringify(cuerpo).includes(usuario.rubrica_imagen), false, 'la ruta no se expone');

  assert.equal(archivosGuardados().length, 1);
  assert.equal(usuario.rubrica_imagen, '2022630001/Rubrica/rubrica.enc');
  assert.ok(typeof usuario.rubrica_ip === 'string' && usuario.rubrica_ip.length > 0, 'IP registrada');
  const [id, archivo, opciones] = servicio.mock.calls[0].arguments;
  assert.equal(id, 7, 'el usuario sale del token, no del cuerpo');
  assert.ok(Buffer.isBuffer(archivo.buffer) && archivo.buffer.equals(PNG));
  assert.equal(opciones.ip, usuario.rubrica_ip);
});

test('el usuario siempre sale del token: un campo "usuario_id" en el formulario se rechaza', async (t) => {
  const { subir, usuario, servicio } = await levantar(t);
  const { status, cuerpo } = await subir({ extras: { usuario_id: '999' } });
  assert.equal(status, 400);
  assert.equal(cuerpo.code, 'RUBRICA_REQUERIDA');
  assert.equal(servicio.mock.callCount(), 0);
  assert.equal(usuario.rubrica_imagen, null);
});

test('acepta JPEG aunque el cliente declare cualquier tipo o nombre', async (t) => {
  const { subir, usuario } = await levantar(t);
  const { status } = await subir({ archivo: JPEG_PEQUENO, nombre: '../../x.exe', tipo: 'application/octet-stream' });
  assert.equal(status, 201);
  assert.ok(usuario.rubrica_imagen);
});

test('sin archivo, JSON en lugar de multipart o campo con otro nombre → 400 RUBRICA_REQUERIDA', async (t) => {
  const { subir, usuario } = await levantar(t);
  for (const opciones of [{ archivo: null }, { sinMultipart: true }, { campo: 'archivo' }]) {
    const { status, cuerpo } = await subir(opciones);
    assert.equal(status, 400, JSON.stringify(opciones));
    assert.equal(cuerpo.code, 'RUBRICA_REQUERIDA');
  }
  assert.equal(usuario.rubrica_imagen, null);
});

test('más de 3 MB → 413 RUBRICA_MUY_GRANDE (multer corta la lectura, el servicio no se llama)', async (t) => {
  const { subir, servicio, archivosGuardados } = await levantar(t);
  const { status, cuerpo } = await subir({ archivo: Buffer.concat([PNG, Buffer.alloc(rubricas.LIMITE_BYTES)]) });
  assert.equal(status, 413);
  assert.equal(cuerpo.code, 'RUBRICA_MUY_GRANDE');
  assert.equal(servicio.mock.callCount(), 0);
  assert.equal(archivosGuardados().length, 0);
});

test('una imagen válida de entre 1 y 3 MB se acepta (201)', async (t) => {
  const { subir, usuario } = await levantar(t);
  const grande = crearPngRuido(700, 700);
  assert.ok(grande.length > 1024 * 1024 && grande.length < rubricas.LIMITE_BYTES);
  const { status } = await subir({ archivo: grande });
  assert.equal(status, 201);
  assert.ok(usuario.rubrica_imagen);
});

test('archivo que no es imagen o está dañado → 422 IMAGEN_INVALIDA y nada se guarda', async (t) => {
  const { subir, usuario, archivosGuardados } = await levantar(t);
  for (const archivo of [Buffer.from('%PDF-1.7 no soy imagen'), PNG.subarray(0, 60), crearPng(4100, 2)]) {
    const { status, cuerpo } = await subir({ archivo: Buffer.from(archivo) });
    assert.equal(status, 422);
    assert.equal(cuerpo.code, 'IMAGEN_INVALIDA');
  }
  assert.equal(usuario.rubrica_imagen, null);
  assert.equal(archivosGuardados().length, 0);
});

test('segunda subida → 409 RUBRICA_YA_REGISTRADA y la primera rúbrica no cambia', async (t) => {
  const { subir, usuario, archivosGuardados } = await levantar(t);
  assert.equal((await subir()).status, 201);
  const ruta = usuario.rubrica_imagen;

  const { status, cuerpo } = await subir({ archivo: crearPng(300, 100, [200, 30, 30]) });
  assert.equal(status, 409);
  assert.equal(cuerpo.code, 'RUBRICA_YA_REGISTRADA');
  assert.equal(usuario.rubrica_imagen, ruta);
  assert.equal(archivosGuardados().length, 1);
});

test('un error interno responde 500 genérico, sin filtrar detalles', async (t) => {
  const { subir, servicio } = await levantar(t);
  const silencio = t.mock.method(console, 'error', () => {});
  servicio.mock.mockImplementation(async () => { throw new Error('EACCES: /srv/uploads/rubricas/7 secreto'); });
  const { status, cuerpo } = await subir();
  assert.equal(status, 500);
  assert.equal(JSON.stringify(cuerpo).includes('secreto'), false);
  assert.equal(JSON.stringify(cuerpo).includes('/srv'), false);
  assert.ok(silencio.mock.callCount() >= 1);
});
