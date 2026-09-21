const coordinacionService = require('./reportes-coordinacion.service');
const validacionService = require('./reportes-validacion.service');
const { manejarError, responderPdf } = require('./reportes-profesor.controller');

// El coordinador sale siempre del token (req.usuario.sub); nada del cliente decide qué revisa ni cómo.
async function getReportes(req, res) {
  try {
    return res.status(200).json(await coordinacionService.listarReportes(req.usuario.sub));
  } catch (err) {
    return manejarError(err, res, 'Error al listar los reportes de coordinación:');
  }
}

async function getDetalleReporte(req, res) {
  try {
    return res.status(200).json(await coordinacionService.obtenerDetalleReporte(req.usuario.sub, req.params.tipoReporte, req.params.id));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el reporte de coordinación:');
  }
}

async function getPdfReporte(req, res) {
  try {
    const { pdf, nombreArchivo } = await coordinacionService.obtenerPdfReporte(req.usuario.sub, req.params.tipoReporte, req.params.id);
    return responderPdf(res, pdf, nombreArchivo);
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el PDF del reporte de coordinación:');
  }
}

async function postRechazar(req, res) {
  try {
    return res.status(200).json(await validacionService.rechazarReporte(req.usuario.sub, req.params.tipoReporte, req.params.id, req.body?.comentario));
  } catch (err) {
    return manejarError(err, res, 'Error al rechazar el reporte (coordinación):');
  }
}

// Valida con el sello fijo del prototipo; el cuerpo no decide nada (la IP sale de la conexión).
async function postAprobar(req, res) {
  try {
    return res.status(200).json(await validacionService.aprobarReporte(req.usuario.sub, req.params.tipoReporte, req.params.id, { ip: req.ip }));
  } catch (err) {
    return manejarError(err, res, 'Error al aprobar el reporte (coordinación):');
  }
}

module.exports = { getReportes, getDetalleReporte, getPdfReporte, postRechazar, postAprobar };
