const directorioService = require('./directorio.service');

// El alumno sale SIEMPRE de req.usuario.sub. Ningún endpoint de este módulo recibe un id por
// parámetro ni por cuerpo: no hay forma de consultar el profesor o el equipo de otra persona.
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getMiProfesor(req, res) {
  try {
    return res.status(200).json(await directorioService.obtenerMiProfesor({ usuarioId: req.usuario.sub }));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el profesor asignado:');
  }
}

async function getMiEquipo(req, res) {
  try {
    return res.status(200).json(await directorioService.obtenerMiEquipo({ usuarioId: req.usuario.sub }));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el equipo de proyecto:');
  }
}

module.exports = { getMiProfesor, getMiEquipo };
