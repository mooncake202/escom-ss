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

module.exports = { getAlumnos, getDetalleAlumno, postCrearActividad, putEditarActividad, deleteActividad };
