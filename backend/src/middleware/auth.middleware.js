const { verificarToken } = require('../lib/jwt');
const redis = require('../lib/redis');

/**
 * Verifica que la petición traiga un JWT válido en el header Authorization.
 * Y que no haya sido revocado por un logout anterior (blacklist en Redis).
 * Si es válido, adjunta { sub, rol } a req.usuario.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No se proporcionó un token de autenticación.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verificarToken(token);
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }

  try {
    const revocado = await redis.get(`blacklist:${decoded.jti}`);
    if (revocado) {
      return res.status(401).json({ message: 'Tu sesión fue cerrada. Vuelve a iniciar sesión.' });
    }
  } catch (err) {
    // Si Redis falla, no bloqueamos el acceso por eso (fail-open) — solo se
    // pierde la protección de blacklist momentáneamente, no todo el login.
    console.error('Error al consultar blacklist en Redis:', err.message);
  }

  req.usuario = decoded;
  next();
}







/**
 * Debe usarse DESPUÉS de requireAuth.
 * Ejemplo: router.post('/usuarios', requireAuth, requireRole('coordinador'), crearUsuario)
 */
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
