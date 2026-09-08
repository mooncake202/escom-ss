const redis = require('../lib/redis');

/**
 * Limita cuántas veces una misma IP puede pegarle a un endpoint dentro de
 * una ventana de tiempo. Usa el mismo cliente de Redis que ya existe para
 * expiración de tokens (CRED-01/02) — no abre una conexión nueva.
 *
 * @param {object} opciones
 * @param {string} opciones.prefijo   - namespace de la key en Redis (ej. "rl:registro")
 * @param {number} opciones.maximo    - peticiones permitidas por ventana
 * @param {number} opciones.ventanaSegundos - duración de la ventana
 */
function crearRateLimiter({ prefijo, maximo, ventanaSegundos }) {
  return async function rateLimiter(req, res, next) {
    // req.ip respeta X-Forwarded-For si el 'trust proxy' de Express está
    // configurado — importante porque estás detrás de nginx/Cloudflare.
    const key = `${prefijo}:${req.ip}`;

    let intentos;
    try {
      intentos = await redis.incr(key);
      if (intentos === 1) {
        // Solo se pone expiración la PRIMERA vez que se crea la key —
        // así la ventana es fija desde el primer intento, no se reinicia
        // con cada petición nueva.
        await redis.expire(key, ventanaSegundos);
      }
    } catch (err) {
      // Si Redis llegara a fallar, no queremos tumbar el endpoint real por
      // eso — se deja pasar la petición (fail-open) y se loguea el problema.
      console.error('Error en rate limiter (Redis no disponible):', err.message);
      return next();
    }

    if (intentos > maximo) {
      return res.status(429).json({
        message: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
      });
    }

    next();
  };
}

module.exports = { crearRateLimiter };
