const grService = require('./gr.service');

async function postEnviarSolicitud(req, res) {
  try {
    const resultado = await grService.enviarSolicitudRegistro(req.body);
    return res.status(201).json({ message: resultado.mensaje });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;

    if (status === 500) console.error('Error inesperado al enviar solicitud de registro:', err);

    const body = { message };
    if (err.code) body.code = err.code; // ej. OFERTA_SIN_CUPOS

    return res.status(status).json(body);
  }
}

async function getVerificarCorreo(req, res) {
  try {
    const { correo } = req.query;
    const resultado = await grService.verificarCorreoDisponible(correo);
    return res.status(200).json(resultado);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error inesperado al verificar correo:', err);
    return res.status(status).json({ message });
  }
}


async function getEstadoSolicitud(req, res) {
  try {
    const resultado = await grService.obtenerEstadoActualPorUsuarioId(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error inesperado al obtener estado de solicitud:', err);
    return res.status(status).json({ message });
  }
}

module.exports = { postEnviarSolicitud, getVerificarCorreo, getEstadoSolicitud };


