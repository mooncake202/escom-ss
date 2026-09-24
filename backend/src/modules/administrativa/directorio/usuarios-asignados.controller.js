// CU-ADM-17. Todo es GET: este controlador no expone ninguna escritura.
//
// El profesor sale de req.usuario.sub y el rol de req.usuario.rol, nunca del cuerpo ni de la query:
// un profesor no puede pedir los alumnos de otro aunque mande su id.

const servicio = require('./usuarios-asignados.service');

function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getMisAlumnos(req, res) {
  try {
    return res.status(200).json(await servicio.listarMisAlumnos({ usuarioId: req.usuario.sub }));
  } catch (err) {
    return manejarError(err, res, 'Error al listar los alumnos del profesor:');
  }
}

async function getProfesores(_req, res) {
  try {
    return res.status(200).json(await servicio.listarProfesores());
  } catch (err) {
    return manejarError(err, res, 'Error al listar los profesores:');
  }
}

async function getAlumnosDeProfesor(req, res) {
  try {
    return res.status(200).json(await servicio.listarAlumnosDeProfesor({ profesorId: req.params.profesorId }));
  } catch (err) {
    return manejarError(err, res, 'Error al listar los alumnos de un profesor:');
  }
}

async function getAlumnoAsignado(req, res) {
  try {
    return res.status(200).json(await servicio.obtenerAlumnoAsignado({
      usuarioId: req.usuario.sub,
      rol: req.usuario.rol,
      boleta: req.params.boleta,
    }));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el detalle de un alumno asignado:');
  }
}

module.exports = { getMisAlumnos, getProfesores, getAlumnosDeProfesor, getAlumnoAsignado };
