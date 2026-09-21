const reportesProfesorService = require('./reportes-profesor.service');
const revisionService = require('./reportes-revision.service');
const rubricasService = require('./reportes.rubricas');

// Datos de apoyo que el cliente puede recibir en errores esperados (nunca en 500).
const DETALLES_DE_ERROR = ['estadoReporte', 'reintentable'];

function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  if (status !== 500) {
    for (const campo of DETALLES_DE_ERROR) if (err[campo] !== undefined) body[campo] = err[campo];
  }
  return res.status(status).json(body);
}

// El profesor sale siempre del token (req.usuario.sub); nada del cliente decide de quién son los reportes.
async function getReportes(req, res) {
  try {
    const resultado = await reportesProfesorService.listarReportes(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar los reportes del profesor:');
  }
}

async function getDetalleReporte(req, res) {
  try {
    const detalle = await reportesProfesorService.obtenerDetalleReporte(req.usuario.sub, req.params.tipoReporte, req.params.id);
    return res.status(200).json(detalle);
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el reporte del profesor:');
  }
}

// Se entrega tal cual el PDF almacenado; no se genera ni se guarda nada. También lo usa Coordinación (CU-REP-06).
function responderPdf(res, pdf, nombreArchivo) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Length': String(pdf.length),
    'Content-Disposition': `inline; filename="${nombreArchivo}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  return res.status(200).end(pdf);
}

async function getPdfReporte(req, res) {
  try {
    const { pdf, nombreArchivo } = await reportesProfesorService.obtenerPdfReporte(req.usuario.sub, req.params.tipoReporte, req.params.id);
    return responderPdf(res, pdf, nombreArchivo);
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el PDF del reporte:');
  }
}

// La rúbrica del profesor se sube con el mismo controlador seguro del alumno (postRubrica, en reportes-alumno.controller.js).
async function getEstadoRubrica(req, res) {
  try {
    return res.status(200).json(await rubricasService.consultarEstadoRubrica(req.usuario.sub));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar la rúbrica del profesor:');
  }
}

async function postRechazar(req, res) {
  try {
    const resultado = await revisionService.rechazarReporte(req.usuario.sub, req.params.tipoReporte, req.params.id, req.body?.comentario);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al rechazar el reporte:');
  }
}

// Aprueba y firma con la rúbrica ya guardada del profesor; el cuerpo no decide nada (la IP sale de la conexión).
async function postAprobar(req, res) {
  try {
    const resultado = await revisionService.aprobarReporte(req.usuario.sub, req.params.tipoReporte, req.params.id, { ip: req.ip });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al aprobar el reporte:');
  }
}

module.exports = { getReportes, getDetalleReporte, getPdfReporte, getEstadoRubrica, postRechazar, postAprobar, manejarError, responderPdf };
