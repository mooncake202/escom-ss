const grProfesorService = require('./gr-profesor.service');

async function getSolicitudesPendientes(req, res) {
  try {
    const solicitudes = await grProfesorService.listarSolicitudesPendientes(req.usuario.sub);
    return res.status(200).json(solicitudes);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al listar solicitudes pendientes:', err);
    return res.status(status).json({ message });
  }
}

async function postDecidirSolicitud(req, res) {
  try {
    const { decision } = req.body;
    const resultado = await grProfesorService.decidirSolicitud(req.params.id, decision, req.usuario.sub);

    const message = resultado.estado_solicitud === 'aceptada_por_profesor'
      ? 'Solicitud aceptada correctamente.'
      : 'Solicitud rechazada correctamente.';

    return res.status(200).json({ message });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al decidir solicitud:', err);

    const body = { message };
    if (err.code) body.code = err.code;
    return res.status(status).json(body);
  }
}

module.exports = { getSolicitudesPendientes, postDecidirSolicitud };
