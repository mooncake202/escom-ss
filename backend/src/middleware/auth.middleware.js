const { verificarToken } = require('../lib/jwt');

/**
 * Verifica que la petición traiga un JWT válido en el header Authorization.
 * Si es válido, adjunta { sub, rol } a req.usuario.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No se proporcionó un token de autenticación.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.usuario = verificarToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
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
