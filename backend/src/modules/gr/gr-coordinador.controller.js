const grCoordinadorService = require('./gr-coordinador.service');

async function getSolicitudesDocumentacion(req, res) {
  try {
    const solicitudes = await grCoordinadorService.listarSolicitudesDocumentacionPendiente();
    return res.status(200).json(solicitudes);
  } catch (err) {
    console.error('Error al listar solicitudes de documentación:', err);
    return res.status(500).json({ message: 'Ocurrió un error. Intenta de nuevo más tarde.' });
  }
}

async function postDecidirDocumentacion(req, res) {
  try {
    const { decision, motivoRechazo } = req.body;
    const resultado = await grCoordinadorService.decidirDocumentacion(req.params.id, decision, motivoRechazo, req.usuario.sub);
    return res.status(200).json({ message: 'Decisión registrada correctamente.', estado_solicitud: resultado.estado_solicitud });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al decidir documentación:', err);
    const body = { message };
    if (err.code) body.code = err.code;
    return res.status(status).json(body);
  }
}

async function getDescargarDocumento(req, res) {
  try {
    const buffer = await grCoordinadorService.descargarDocumento(req.params.id, req.usuario);
    res.setHeader('Content-Type', 'application/pdf');
    return res.status(200).send(buffer);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al descargar documento:', err);
    return res.status(status).json({ message });
  }
}

async function getSolicitudesCartaCompromiso(req, res) {
  try {
    const solicitudes = await grCoordinadorService.listarSolicitudesEsperandoCarta();
    return res.status(200).json(solicitudes);
  } catch (err) {
    console.error('Error al listar solicitudes de carta compromiso:', err);
    return res.status(500).json({ message: 'Ocurrió un error. Intenta de nuevo más tarde.' });
  }
}

async function postRegistrarRecepcionCarta(req, res) {
  try {
    const resultado = await grCoordinadorService.registrarRecepcionCarta(req.params.id, req.usuario.sub);
    return res.status(200).json({ message: resultado.mensaje });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al registrar recepción de carta:', err);
    return res.status(status).json({ message });
  }
}



module.exports = { getSolicitudesDocumentacion, 
  postDecidirDocumentacion, getDescargarDocumento,
  getSolicitudesCartaCompromiso, postRegistrarRecepcionCarta,
};
