const ahAlumnoService = require('./ah-alumno.service');

// Mismo patrón de manejo de errores que ah.controller.js
// (err.status || 500, mensaje genérico en 500, err.code reenviado si existe).
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getMisActividades(req, res) {
  try {
    const resultado = await ahAlumnoService.listarActividadesAlumno(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar actividades del alumno:');
  }
}

async function getDetalleActividad(req, res) {
  try {
    const actividad = await ahAlumnoService.obtenerDetalleActividad(req.usuario.sub, req.params.id);
    return res.status(200).json(actividad);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener detalle de actividad (alumno):');
  }
}

async function getEstadoJornada(req, res) {
  try {
    const estado = await ahAlumnoService.obtenerEstadoJornadaActual(req.usuario.sub);
    return res.status(200).json(estado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener estado de jornada:');
  }
}

async function postIniciarJornada(req, res) {
  try {
    const resultado = await ahAlumnoService.iniciarJornada(req.usuario.sub);
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al iniciar jornada:');
  }
}

async function postFinalizarJornada(req, res) {
  try {
    const resultado = await ahAlumnoService.finalizarJornada(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al finalizar jornada:');
  }
}

async function postCancelarJornada(req, res) {
  try {
    const resultado = await ahAlumnoService.cancelarJornada(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al cancelar jornada:');
  }
}

async function postConfirmarBitacora(req, res) {
  try {
    const resultado = await ahAlumnoService.confirmarBitacora(req.usuario.sub, req.body);
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al confirmar bitácora:');
  }
}

async function getAcumuladoPropio(req, res) {
  try {
    const acumulado = await ahAlumnoService.obtenerAcumuladoPropio(req.usuario.sub);
    return res.status(200).json(acumulado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener acumulado de horas (alumno):');
  }
}

async function getHistorialPropio(req, res) {
  try {
    const { tipo, estado, fechaDesde, fechaHasta } = req.query;
    const historial = await ahAlumnoService.obtenerHistorialPropio(req.usuario.sub, { tipo, estado, fechaDesde, fechaHasta });
    return res.status(200).json(historial);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener historial (alumno):');
  }
}

module.exports = {
  getMisActividades,
  getDetalleActividad,
  getEstadoJornada,
  postIniciarJornada,
  postFinalizarJornada,
  postCancelarJornada,
  postConfirmarBitacora,
  getAcumuladoPropio,
  getHistorialPropio,
};
