// Redis del calendario: metadata informativa. Ninguna función lanza: si Redis falla o no responde,
// la operación principal (BD) sigue y solo se registra el error.

const CLAVE_ULTIMA_MODIFICACION = 'calendario:ultima_modificacion';
// Misma clave que modules/periodos/periodos.service.js (allá no se exporta).
const CLAVE_CACHE_PERIODOS = 'cache:periodos';
// Con lazyConnect, ioredis encola los comandos si Redis está caído: sin tope, la petición se colgaría.
const TIMEOUT_REDIS_MS = 1500;

function conTimeout(operacion, ms) {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error(`Redis no respondió en ${ms} ms`)), ms);
  });
  return Promise.race([Promise.resolve().then(operacion), limite]).finally(() => clearTimeout(temporizador));
}

/** ISO de la última modificación, o null si no existe, es inválida o Redis falla. */
async function leerUltimaModificacion(redis, { timeoutMs = TIMEOUT_REDIS_MS } = {}) {
  try {
    const valor = await conTimeout(() => redis.get(CLAVE_ULTIMA_MODIFICACION), timeoutMs);
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
  } catch (err) {
    console.error('Error al leer la última modificación del calendario (se continúa sin ella):', err.message);
    return null;
  }
}

/** Guarda la marca sin TTL. Devuelve el ISO guardado, o null si Redis falló. */
async function registrarUltimaModificacion(redis, fecha, { timeoutMs = TIMEOUT_REDIS_MS } = {}) {
  const iso = fecha.toISOString();
  try {
    await conTimeout(() => redis.set(CLAVE_ULTIMA_MODIFICACION, iso), timeoutMs);
    return iso;
  } catch (err) {
    console.error('Error al guardar la última modificación del calendario (no crítico):', err.message);
    return null;
  }
}

/** Borra el caché de GET /periodos. Devuelve true si se pudo. */
async function invalidarCachePeriodos(redis, { timeoutMs = TIMEOUT_REDIS_MS } = {}) {
  try {
    await conTimeout(() => redis.del(CLAVE_CACHE_PERIODOS), timeoutMs);
    return true;
  } catch (err) {
    console.error('Error al invalidar cache:periodos (no crítico; expirará solo):', err.message);
    return false;
  }
}

module.exports = {
  CLAVE_ULTIMA_MODIFICACION,
  CLAVE_CACHE_PERIODOS,
  TIMEOUT_REDIS_MS,
  leerUltimaModificacion,
  registrarUltimaModificacion,
  invalidarCachePeriodos,
};
