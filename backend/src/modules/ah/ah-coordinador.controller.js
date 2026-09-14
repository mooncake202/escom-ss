const ahCoordinadorService = require('./ah-coordinador.service');

// Mismo patrón de manejo de errores que ah.controller.js/ah-alumno.controller.js
// (err.status || 500, mensaje genérico en 500, err.code reenviado si existe).
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getAcumuladoProfesores(req, res) {
  try {
    const profesores = await ahCoordinadorService.listarProfesoresConAcumulado();
    return res.status(200).json(profesores);
  } catch (err) {
    return manejarError(err, res, 'Error al listar acumulado de horas (coordinador):');
  }
}

async function getHistorialAlumno(req, res) {
  try {
    const { alumnoId, tipo, estado, fechaDesde, fechaHasta } = req.query;
    const historial = await ahCoordinadorService.obtenerHistorialAlumnoParaCoordinador(alumnoId, { tipo, estado, fechaDesde, fechaHasta });
    return res.status(200).json(historial);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener historial de alumno (coordinador):');
  }
}

module.exports = { getAcumuladoProfesores, getHistorialAlumno };
