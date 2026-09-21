const calendarioService = require('./calendario.service');

// Mismo patrón que ah-alumno.controller.js; además reenvía `errores` (campos inválidos) para el formulario.
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  if (err.errores) body.errores = err.errores;
  return res.status(status).json(body);
}

async function getEventos(req, res) {
  try {
    const { tipo, desde, hasta } = req.query;
    const resultado = await calendarioService.listarEventos({ rol: req.usuario.rol, filtros: { tipo, desde, hasta } });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar el calendario:');
  }
}

async function postEvento(req, res) {
  try {
    const resultado = await calendarioService.crearEvento({ usuarioId: req.usuario.sub, entrada: req.body });
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al crear el evento del calendario:');
  }
}

async function putEvento(req, res) {
  try {
    const resultado = await calendarioService.actualizarInhabil({ id: req.params.id, entrada: req.body });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al actualizar el evento del calendario:');
  }
}

async function deleteEvento(req, res) {
  try {
    const resultado = await calendarioService.eliminarInhabil({ id: req.params.id });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al eliminar el evento del calendario:');
  }
}

module.exports = { getEventos, postEvento, putEvento, deleteEvento };
