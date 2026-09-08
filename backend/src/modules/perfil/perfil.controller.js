const perfilService = require('./perfil.service');

async function putPerfilProfesor(req, res) {
  try {
    const usuarioId = req.usuario.sub; // del token, no del body
    const actualizado = await perfilService.actualizarPerfilProfesor(usuarioId, req.body);
    return res.status(200).json({
      message: 'Tus datos fueron actualizados correctamente.',
      profesor: actualizado,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;

    if (status === 500) console.error('Error al actualizar perfil de profesor:', err);

    return res.status(status).json({ message });
  }
}

module.exports = { putPerfilProfesor };
