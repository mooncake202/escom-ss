const lssProfesorService = require('./lss-profesor.service');

// Mismo patrón de manejo de errores que lss-alumno.controller.js
// (err.status || 500, mensaje genérico en 500, err.code reenviado si existe).
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

// ── CU-LSS-03 ─────────────────────────────────────────────────

async function getAlumnosConEvaluacionPendiente(req, res) {
  try {
    const resultado = await lssProfesorService.listarAlumnosConEvaluacionPendiente(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar alumnos con evaluación pendiente:');
  }
}

async function postRegistrarEvaluacion(req, res) {
  try {
    const { observacionesProfesor, reportesSissConfirmados, valores } = req.body;
    const resultado = await lssProfesorService.registrarEvaluacion(
      req.usuario.sub,
      req.params.boleta,
      { observacionesProfesor, reportesSissConfirmados, valores },
      req.ip,
    );
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al registrar evaluación de desempeño:');
  }
}

async function postRechazarPorSiss(req, res) {
  try {
    const resultado = await lssProfesorService.rechazarPorSiss(req.usuario.sub, req.params.boleta, req.body.observacionesProfesor);
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al rechazar evaluación por SISS:');
  }
}

async function postCorregirYReenviar(req, res) {
  try {
    const { observacionesProfesor, valores } = req.body;
    const resultado = await lssProfesorService.corregirYReenviar(req.usuario.sub, req.params.boleta, { observacionesProfesor, valores });
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al corregir y reenviar evaluación:');
  }
}

module.exports = {
  getAlumnosConEvaluacionPendiente,
  postRegistrarEvaluacion,
  postRechazarPorSiss,
  postCorregirYReenviar,
};
