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

    const MENSAJES = {
      aceptada_por_profesor: 'Solicitud aceptada correctamente.',
      rechazada_por_profesor: 'Solicitud rechazada correctamente.',
      rechazada_por_cupos: 'La solicitud no pudo aceptarse: alcanzaste tu límite de cupos disponibles. La solicitud fue rechazada automáticamente.',
    };
    const message = MENSAJES[resultado.estado_solicitud] ?? 'Solicitud procesada.';

    return res.status(200).json({ message, estado_solicitud: resultado.estado_solicitud });
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
