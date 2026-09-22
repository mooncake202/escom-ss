const lssAlumnoService = require('./lss-alumno.service');

// Mismo patrón de manejo de errores que ah-alumno.controller.js
// (err.status || 500, mensaje genérico en 500, err.code reenviado si existe).
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getEstadoRequisitos(req, res) {
  try {
    const resultado = await lssAlumnoService.obtenerEstadoRequisitos(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener estado de requisitos LSS:');
  }
}

async function postIniciarEvaluacion(req, res) {
  try {
    const resultado = await lssAlumnoService.iniciarEvaluacion(req.usuario.sub, req.body.reportesValidadosSiss);
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al iniciar evaluación de desempeño:');
  }
}

// ── CU-LSS-02 ─────────────────────────────────────────────────

async function getEstadoEvaluacion(req, res) {
  try {
    const resultado = await lssAlumnoService.obtenerEstadoEvaluacion(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener estado de evaluación:');
  }
}

async function postReenviarEvaluacion(req, res) {
  try {
    const resultado = await lssAlumnoService.reenviarSolicitudEvaluacion(req.usuario.sub, req.body.reportesValidadosSiss);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al reenviar solicitud de evaluación:');
  }
}

// No usa manejarError: la respuesta exitosa es binaria (el PDF), no JSON —
// mismo patrón que gr-coordinador.controller.js:getDescargarDocumento.
async function getDescargarEvaluacion(req, res) {
  try {
    const buffer = await lssAlumnoService.marcarEvaluacionDescargada(req.usuario.sub);
    res.setHeader('Content-Type', 'application/pdf');
    return res.status(200).send(buffer);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al descargar evaluación:', err);
    return res.status(status).json({ message });
  }
}

async function postConfirmarSiss(req, res) {
  try {
    const resultado = await lssAlumnoService.confirmarSubidaSiss(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al confirmar subida a SISS:');
  }
}

async function postCartaTermino(req, res) {
  try {
    const resultado = await lssAlumnoService.solicitarCartaTermino(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al solicitar carta de término:');
  }
}

module.exports = {
  getEstadoRequisitos,
  postIniciarEvaluacion,
  getEstadoEvaluacion,
  postReenviarEvaluacion,
  getDescargarEvaluacion,
  postConfirmarSiss,
  postCartaTermino,
};
