const ahProfesorService = require('./ah-profesor.service');

// Mismo patrón de manejo de errores que gr-profesor.controller.js
// (err.status || 500, mensaje genérico en 500, err.code reenviado si existe).
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getAlumnos(req, res) {
  try {
    const alumnos = await ahProfesorService.listarAlumnosDeProfesor(req.usuario.sub);
    return res.status(200).json(alumnos);
  } catch (err) {
    return manejarError(err, res, 'Error al listar alumnos de AH:');
  }
}

async function getDetalleAlumno(req, res) {
  try {
    const detalle = await ahProfesorService.obtenerDetalleAlumno(req.usuario.sub, req.params.solicitudId);
    return res.status(200).json(detalle);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener detalle de alumno (AH):');
  }
}

async function postCrearActividad(req, res) {
  try {
    const actividad = await ahProfesorService.crearActividad(req.usuario.sub, req.params.solicitudId, req.body);
    return res.status(201).json({ message: 'Actividad asignada correctamente.', actividad });
  } catch (err) {
    return manejarError(err, res, 'Error al crear actividad:');
  }
}

async function putEditarActividad(req, res) {
  try {
    const actividad = await ahProfesorService.editarActividad(req.usuario.sub, req.params.id, req.body);
    return res.status(200).json({ message: 'Actividad actualizada correctamente.', actividad });
  } catch (err) {
    return manejarError(err, res, 'Error al editar actividad:');
  }
}

async function deleteActividad(req, res) {
  try {
    await ahProfesorService.eliminarActividad(req.usuario.sub, req.params.id);
    return res.status(200).json({ message: 'Actividad eliminada correctamente.' });
  } catch (err) {
    return manejarError(err, res, 'Error al eliminar actividad:');
  }
}

async function getBitacorasPendientes(req, res) {
  try {
    const filtroNombre = req.query.nombre || null;
    const bitacoras = await ahProfesorService.listarBitacorasPendientes(req.usuario.sub, filtroNombre);
    return res.status(200).json(bitacoras);
  } catch (err) {
    return manejarError(err, res, 'Error al listar bitácoras pendientes:');
  }
}

async function postAprobarBitacora(req, res) {
  try {
    const resultado = await ahProfesorService.aprobarBitacora(req.usuario.sub, req.params.id, req.body.actividadAdicional || null);
    return res.status(200).json({ message: 'Bitácora aprobada correctamente.', ...resultado });
  } catch (err) {
    return manejarError(err, res, 'Error al aprobar bitácora:');
  }
}

async function postRechazarBitacora(req, res) {
  try {
    const resultado = await ahProfesorService.rechazarBitacora(req.usuario.sub, req.params.id, req.body.motivoRechazo);
    return res.status(200).json({ message: 'Bitácora rechazada correctamente.', ...resultado });
  } catch (err) {
    return manejarError(err, res, 'Error al rechazar bitácora:');
  }
}

async function getAcumuladoAlumnos(req, res) {
  try {
    const alumnos = await ahProfesorService.listarAcumuladoAlumnosDeProfesor(req.usuario.sub);
    return res.status(200).json(alumnos);
  } catch (err) {
    return manejarError(err, res, 'Error al listar acumulado de horas (profesor):');
  }
}

async function getHistorialAlumno(req, res) {
  try {
    const { alumnoId, tipo, estado, fechaDesde, fechaHasta } = req.query;
    const historial = await ahProfesorService.obtenerHistorialAlumnoDeProfesor(req.usuario.sub, alumnoId, { tipo, estado, fechaDesde, fechaHasta });
    return res.status(200).json(historial);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener historial de alumno (profesor):');
  }
}

async function postAprobarBitacoraDesdeHistorial(req, res) {
  try {
    const resultado = await ahProfesorService.aprobarBitacoraRechazadaDesdeHistorial(req.usuario.sub, req.params.id, !!req.body.confirmarSobrepasoHoras);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al aprobar bitácora desde historial:');
  }
}

async function putExtenderFechaLimiteActividad(req, res) {
  try {
    const actividad = await ahProfesorService.extenderFechaLimiteActividad(req.usuario.sub, req.params.id, req.body.fecha_limite);
    return res.status(200).json({ message: 'Fecha límite extendida correctamente.', actividad });
  } catch (err) {
    return manejarError(err, res, 'Error al extender fecha límite (historial):');
  }
}

module.exports = {
  getAlumnos, getDetalleAlumno, postCrearActividad, putEditarActividad, deleteActividad,
  getBitacorasPendientes, postAprobarBitacora, postRechazarBitacora,
  getAcumuladoAlumnos,
  getHistorialAlumno, postAprobarBitacoraDesdeHistorial, putExtenderFechaLimiteActividad,
};
