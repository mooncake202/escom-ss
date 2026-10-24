const test = require('node:test');
const assert = require('node:assert/strict');

const { solicitarSelloTiempo, configuracionTsa, ErrorTsa, URL_FREETSA, TIMEOUT_MS } = require('./timestampTsa');

// TSA principal y de respaldo (variables de entorno). Sin red: `fetch` se sustituye por respuestas simuladas y se
// registran las URL a las que se llamó. El camino exitoso con un token real se prueba contra las TSA reales, fuera de
// esta suite (necesita internet).

const HASH = 'a'.repeat(64);
const VARIABLES = ['TSA_URL', 'TSA_URL_RESPALDO', 'TSA_TIMEOUT_MS'];

function escenario(t, entorno, respuestas) {
  const antes = Object.fromEntries(VARIABLES.map((v) => [v, process.env[v]]));
  for (const v of VARIABLES) delete process.env[v];
  Object.assign(process.env, entorno);
  t.after(() => { for (const v of VARIABLES) { if (antes[v] === undefined) delete process.env[v]; else process.env[v] = antes[v]; } });

  const llamadas = [];
  t.mock.method(global, 'fetch', async (url) => {
    llamadas.push(url);
    const r = respuestas[url];
    if (r instanceof Error) throw r;
    return r;
  });
  for (const nivel of ['info', 'warn', 'error']) t.mock.method(console, nivel, () => {});
  return llamadas;
}

const caida = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
const http500 = () => ({ ok: false, status: 500, text: async () => 'Internal Server Error' });
const basura = () => ({ ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });

test('configuracionTsa: sin variables es FreeTSA, sin respaldo y 15000 ms (comportamiento anterior)', () => {
  assert.deepEqual(configuracionTsa({}), { principal: URL_FREETSA, respaldo: null, timeoutMs: TIMEOUT_MS });
  assert.equal(URL_FREETSA, 'https://freetsa.org/tsr');
  assert.equal(TIMEOUT_MS, 15000);
});

test('configuracionTsa: variables vacías cuentan como ausentes (docker-compose las declara vacías); un timeout inválido usa el de siempre', () => {
  assert.deepEqual(configuracionTsa({ TSA_URL: '  ', TSA_URL_RESPALDO: '', TSA_TIMEOUT_MS: 'abc' }), { principal: URL_FREETSA, respaldo: null, timeoutMs: TIMEOUT_MS });
  assert.equal(configuracionTsa({ TSA_TIMEOUT_MS: '-5' }).timeoutMs, TIMEOUT_MS);
  assert.deepEqual(
    configuracionTsa({ TSA_URL: 'https://tsa.uno/tsr', TSA_URL_RESPALDO: 'http://tsa.dos', TSA_TIMEOUT_MS: '8000' }),
    { principal: 'https://tsa.uno/tsr', respaldo: 'http://tsa.dos', timeoutMs: 8000 },
  );
});

test('sin respaldo: si la principal falla, el error es el de siempre y no se intenta otra TSA', async (t) => {
  const llamadas = escenario(t, {}, { [URL_FREETSA]: caida() });
  await assert.rejects(solicitarSelloTiempo(HASH), (e) => e instanceof ErrorTsa && e.codigo === 'TSA_SIN_CONEXION');
  assert.deepEqual(llamadas, [URL_FREETSA]);
});

test('con respaldo: principal caída → se intenta el respaldo; si también falla, se lanza el error de la PRINCIPAL', async (t) => {
  const llamadas = escenario(t, { TSA_URL: 'https://principal/tsr', TSA_URL_RESPALDO: 'http://respaldo/tsr' }, {
    'https://principal/tsr': caida(),
    'http://respaldo/tsr': http500(),
  });
  await assert.rejects(solicitarSelloTiempo(HASH), (e) => {
    assert.equal(e.codigo, 'TSA_SIN_CONEXION', 'mismo error que sin respaldo');
    assert.equal(e.errorRespaldo.codigo, 'TSA_HTTP', 'el del respaldo viaja adjunto');
    return true;
  });
  assert.deepEqual(llamadas, ['https://principal/tsr', 'http://respaldo/tsr']);
});

test('con respaldo: una respuesta inválida o un HTTP de error en la principal también pasan al respaldo', async (t) => {
  const llamadas = escenario(t, { TSA_URL: 'https://principal/tsr', TSA_URL_RESPALDO: 'http://respaldo/tsr' }, {
    'https://principal/tsr': basura(),
    'http://respaldo/tsr': http500(),
  });
  await assert.rejects(solicitarSelloTiempo(HASH), (e) => e.codigo === 'TSA_RESPUESTA_INVALIDA');
  assert.deepEqual(llamadas, ['https://principal/tsr', 'http://respaldo/tsr']);
});

test('hash mal formado: error de quien llama, no de la TSA → no se llama a ninguna TSA', async (t) => {
  const llamadas = escenario(t, { TSA_URL_RESPALDO: 'http://respaldo/tsr' }, {});
  await assert.rejects(solicitarSelloTiempo('no-es-hash'), (e) => e.codigo === 'HASH_INVALIDO');
  assert.deepEqual(llamadas, []);
});

test('con `url` explícito se usa SOLO esa TSA, sin respaldo (scripts que fijan FreeTSA)', async (t) => {
  const llamadas = escenario(t, { TSA_URL_RESPALDO: 'http://respaldo/tsr' }, { 'https://fija/tsr': caida() });
  await assert.rejects(solicitarSelloTiempo(HASH, { url: 'https://fija/tsr' }), (e) => e.codigo === 'TSA_SIN_CONEXION');
  assert.deepEqual(llamadas, ['https://fija/tsr']);
});
