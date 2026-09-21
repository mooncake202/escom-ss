const multer = require('multer');
const reportesAlumnoService = require('./reportes-alumno.service');
const rubricasService = require('./reportes.rubricas');
const vistaPreviaService = require('./reportes-vista-previa.service');
const envioService = require('./reportes-envio.service');
const seguimientoService = require('./reportes-seguimiento.service');
const correccionService = require('./reportes-correccion.service');
const globalService = require('./reportes-global.service');
const { responderPdf } = require('./reportes-profesor.controller');

const DETALLES_DE_ERROR = ['motivosBloqueo', 'campo', 'caracteres', 'lineasRenderizadas', 'lineasMaximas', 'parrafos', 'palabra', 'reporteExistente', 'reintentable', 'estadoReporte'];

function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  // Datos de apoyo para que el cliente muestre qué corregir (solo en errores esperados, nunca en 500).
  if (status !== 500) {
    for (const campo of DETALLES_DE_ERROR) if (err[campo] !== undefined) body[campo] = err[campo];
  }
  return res.status(status).json(body);
}

async function getSiguienteReporteMensual(req, res) {
  try {
    const resultado = await reportesAlumnoService.prepararReporteMensual(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al preparar el reporte mensual:');
  }
}

// Multipart en memoria (campo "rubrica"): el límite corta la lectura; el tipo real se valida por bytes en el servicio.
const subirArchivoRubrica = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: rubricasService.LIMITE_BYTES, files: 1, fields: 0 },
}).single('rubrica');

function erroresDeSubida(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return Object.assign(new Error('La imagen de la rúbrica excede el tamaño máximo permitido (3 MB).'), { status: 413, code: rubricasService.CODIGOS_ERROR.RUBRICA_MUY_GRANDE });
  }
  if (err instanceof multer.MulterError) {
    return Object.assign(new Error('Envía únicamente la imagen de tu rúbrica en el campo "rubrica".'), { status: 400, code: rubricasService.CODIGOS_ERROR.RUBRICA_REQUERIDA });
  }
  return err;
}

// Guardar la rúbrica no firma ni envía ningún reporte.
function postRubrica(req, res) {
  subirArchivoRubrica(req, res, async (errSubida) => {
    if (errSubida) return manejarError(erroresDeSubida(errSubida), res, 'Error al recibir la rúbrica:');
    try {
      const estado = await rubricasService.guardarRubrica(req.usuario.sub, req.file, { ip: req.ip });
      return res.status(201).json({
        message: 'Tu rúbrica se guardó y se reutilizará en tus reportes. Aún no se ha firmado ni enviado ningún reporte.',
        tieneRubrica: estado.tieneRubrica,
        requiereSubirRubrica: estado.requiereSubirRubrica,
      });
    } catch (err) {
      return manejarError(err, res, 'Error al guardar la rúbrica:');
    }
  });
}

// Vista previa: el PDF se genera en memoria y se entrega tal cual; no se guarda ni se firma nada.
async function postVistaPreviaReporteMensual(req, res) {
  try {
    const { pdf, numeroReporte } = await vistaPreviaService.generarVistaPreviaReporteMensual(req.usuario.sub, req.body?.actividades);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.length),
      'Content-Disposition': `inline; filename="vista-previa-reporte-mensual-${numeroReporte}.pdf"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.status(200).end(pdf);
  } catch (err) {
    return manejarError(err, res, 'Error al generar la vista previa del reporte:');
  }
}

// Envío definitivo: genera el PDF, lo sella (TSA), lo guarda cifrado y registra documento, reporte y firma del alumno.
async function postEnviarReporteMensual(req, res) {
  try {
    const { reporte, fechaEnvio } = await envioService.enviarReporteMensual(req.usuario.sub, req.body?.actividades, { ip: req.ip });
    return res.status(201).json({
      message: 'Tu reporte mensual fue firmado y enviado a tu profesor responsable para su revisión.',
      reporte,
      fechaEnvio,
    });
  } catch (err) {
    return manejarError(err, res, 'Error al enviar el reporte mensual:');
  }
}

// ── CU-REP-07: reporte global (mismo flujo que el mensual) ─────────
async function getSiguienteReporteGlobal(req, res) {
  try {
    return res.status(200).json(await globalService.prepararReporteGlobal(req.usuario.sub));
  } catch (err) {
    return manejarError(err, res, 'Error al preparar el reporte global:');
  }
}

// Vista previa del global: el PDF se genera en memoria y se entrega tal cual; no se guarda ni se firma nada.
async function postVistaPreviaReporteGlobal(req, res) {
  try {
    const { pdf } = await globalService.generarVistaPreviaReporteGlobal(req.usuario.sub, req.body?.actividades);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.length),
      'Content-Disposition': 'inline; filename="vista-previa-reporte-global.pdf"',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.status(200).end(pdf);
  } catch (err) {
    return manejarError(err, res, 'Error al generar la vista previa del reporte global:');
  }
}

async function postEnviarReporteGlobal(req, res) {
  try {
    const { reporte, fechaEnvio } = await globalService.enviarReporteGlobal(req.usuario.sub, req.body?.actividades, { ip: req.ip });
    return res.status(201).json({
      message: 'Tu reporte global fue firmado y enviado a tu profesor responsable para su revisión.',
      reporte,
      fechaEnvio,
    });
  } catch (err) {
    return manejarError(err, res, 'Error al enviar el reporte global:');
  }
}

// ── CU-REP-02 / 03 / 04: seguimiento, historial, PDF almacenado y corrección de un reporte propio ─────────
// El alumno sale siempre del token (req.usuario.sub); nada del cliente decide de quién son los reportes.
async function getReportes(req, res) {
  try {
    return res.status(200).json(await seguimientoService.listarReportes(req.usuario.sub));
  } catch (err) {
    return manejarError(err, res, 'Error al listar los reportes del alumno:');
  }
}

async function getSeguimientoReporte(req, res) {
  try {
    return res.status(200).json(await seguimientoService.obtenerSeguimiento(req.usuario.sub, req.params.tipoReporte, req.params.id));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el seguimiento del reporte:');
  }
}

async function getPdfReporte(req, res) {
  try {
    const { pdf, nombreArchivo } = await seguimientoService.obtenerPdfReporte(req.usuario.sub, req.params.tipoReporte, req.params.id);
    return responderPdf(res, pdf, nombreArchivo);
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el PDF del reporte del alumno:');
  }
}

// Vista previa del reporte corregido: en memoria, sin firmar ni guardar nada.
async function postVistaPreviaCorreccion(req, res) {
  try {
    const { pdf, numeroReporte } = await correccionService.generarVistaPreviaCorreccion(req.usuario.sub, req.params.tipoReporte, req.params.id, req.body?.actividades);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.length),
      'Content-Disposition': `inline; filename="vista-previa-reporte-mensual-${numeroReporte}.pdf"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.status(200).end(pdf);
  } catch (err) {
    return manejarError(err, res, 'Error al generar la vista previa del reporte corregido:');
  }
}

// Reenvío definitivo: genera el PDF, lo sella (TSA), lo guarda cifrado y registra una revisión nueva del alumno.
async function postReenviarReporteCorregido(req, res) {
  try {
    const resultado = await correccionService.reenviarReporteCorregido(req.usuario.sub, req.params.tipoReporte, req.params.id, req.body?.actividades, { ip: req.ip });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al reenviar el reporte corregido:');
  }
}

module.exports = {
  getSiguienteReporteMensual, postRubrica, postVistaPreviaReporteMensual, postEnviarReporteMensual,
  getReportes, getSeguimientoReporte, getPdfReporte, postVistaPreviaCorreccion, postReenviarReporteCorregido,
  getSiguienteReporteGlobal, postVistaPreviaReporteGlobal, postEnviarReporteGlobal,
};
