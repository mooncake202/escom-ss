const notificacionesService = require('./notificaciones.service');

async function getPendientes(req, res) {
  try {
    const notificaciones = await notificacionesService.listarPendientes(req.usuario.sub);
    return res.status(200).json(notificaciones);
  } catch (err) {
    console.error('Error al listar notificaciones:', err);
    return res.status(500).json({ message: 'No se pudieron cargar las notificaciones.' });
  }
}

async function putMarcarLeida(req, res) {
  try {
    const id = Number(req.params.id);
    await notificacionesService.marcarLeida(id, req.usuario.sub);
    return res.status(200).json({ message: 'Notificación marcada como leída.' });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al marcar notificación como leída:', err);
    return res.status(status).json({ message });
  }
}

module.exports = { getPendientes, putMarcarLeida };
