const perfilService = require('./perfil.service');

// El id del usuario sale SIEMPRE de req.usuario.sub (el token). Ningún endpoint de este módulo
// acepta un id por parámetro o por cuerpo: no existe forma de pedir o editar el perfil de otro.
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  return res.status(status).json({ message });
}

// ── CU-ADM-10 · Profesor ──

async function getPerfilProfesor(req, res) {
  try {
    return res.status(200).json(await perfilService.obtenerPerfilProfesor(req.usuario.sub));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el perfil del profesor:');
  }
}

async function putPerfilProfesor(req, res) {
  try {
    const perfil = await perfilService.actualizarPerfilProfesor(req.usuario.sub, req.body);
    return res.status(200).json({ message: 'Tus datos fueron actualizados correctamente.', perfil });
  } catch (err) {
    return manejarError(err, res, 'Error al actualizar perfil de profesor:');
  }
}

// ── CU-ADM-04 · Alumno ──

async function getPerfilAlumno(req, res) {
  try {
    return res.status(200).json(await perfilService.obtenerPerfilAlumno(req.usuario.sub));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el perfil del alumno:');
  }
}

async function putPerfilAlumno(req, res) {
  try {
    const perfil = await perfilService.actualizarPerfilAlumno(req.usuario.sub, req.body);
    return res.status(200).json({ message: 'Tus datos fueron actualizados correctamente.', perfil });
  } catch (err) {
    return manejarError(err, res, 'Error al actualizar perfil de alumno:');
  }
}

module.exports = { getPerfilProfesor, putPerfilProfesor, getPerfilAlumno, putPerfilAlumno };
