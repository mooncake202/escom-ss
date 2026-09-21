const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CLAVE_ULTIMA_MODIFICACION,
  CLAVE_CACHE_PERIODOS,
  leerUltimaModificacion,
  registrarUltimaModificacion,
  invalidarCachePeriodos,
} = require('./calendario.redis');
const { crearRedisFalso } = require('./calendario.fakes');

const FECHA = new Date('2026-09-18T20:37:00.000Z');
const OPCIONES = { timeoutMs: 20 };

test('claves: la del calendario y la misma del caché de periodos', () => {
  assert.equal(CLAVE_ULTIMA_MODIFICACION, 'calendario:ultima_modificacion');
  assert.equal(CLAVE_CACHE_PERIODOS, 'cache:periodos');
});

test('registrar y leer la última modificación (SET sin TTL)', async () => {
  const redis = crearRedisFalso();
  assert.equal(await registrarUltimaModificacion(redis, FECHA, OPCIONES), '2026-09-18T20:37:00.000Z');
  assert.deepEqual(redis.llamadas, [['set', CLAVE_ULTIMA_MODIFICACION, '2026-09-18T20:37:00.000Z']]);
  assert.equal(await leerUltimaModificacion(redis, OPCIONES), '2026-09-18T20:37:00.000Z');
});

test('leer: sin clave o con valor inválido devuelve null', async () => {
  const redis = crearRedisFalso();
  assert.equal(await leerUltimaModificacion(redis, OPCIONES), null);
  redis.datos.set(CLAVE_ULTIMA_MODIFICACION, 'no-es-fecha');
  assert.equal(await leerUltimaModificacion(redis, OPCIONES), null);
});

test('Redis caído: ninguna función lanza; devuelven null / false', async (t) => {
  t.mock.method(console, 'error', () => {});
  const redis = crearRedisFalso({ modo: 'error' });
  assert.equal(await leerUltimaModificacion(redis, OPCIONES), null);
  assert.equal(await registrarUltimaModificacion(redis, FECHA, OPCIONES), null);
  assert.equal(await invalidarCachePeriodos(redis, OPCIONES), false);
});

test('Redis colgado: se abandona tras el timeout en lugar de esperar indefinidamente', async (t) => {
  t.mock.method(console, 'error', () => {});
  const redis = crearRedisFalso({ modo: 'colgado' });
  const inicio = Date.now();
  assert.equal(await leerUltimaModificacion(redis, OPCIONES), null);
  assert.equal(await registrarUltimaModificacion(redis, FECHA, OPCIONES), null);
  assert.equal(await invalidarCachePeriodos(redis, OPCIONES), false);
  assert.ok(Date.now() - inicio < 1000);
});

test('un cliente que lanza de forma síncrona también se tolera', async (t) => {
  t.mock.method(console, 'error', () => {});
  const redis = { get() { throw new Error('boom'); }, set() { throw new Error('boom'); }, del() { throw new Error('boom'); } };
  assert.equal(await leerUltimaModificacion(redis, OPCIONES), null);
  assert.equal(await registrarUltimaModificacion(redis, FECHA, OPCIONES), null);
  assert.equal(await invalidarCachePeriodos(redis, OPCIONES), false);
});

test('invalidar cache:periodos borra exactamente esa clave', async () => {
  const redis = crearRedisFalso();
  redis.datos.set(CLAVE_CACHE_PERIODOS, '[]');
  redis.datos.set('cache:ofertas', '[]');
  assert.equal(await invalidarCachePeriodos(redis, OPCIONES), true);
  assert.deepEqual([...redis.datos.keys()], ['cache:ofertas']);
});
