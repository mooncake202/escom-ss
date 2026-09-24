// CU-ADM-06. El coordinador sale SIEMPRE de req.usuario.

const servicio = require('./contacto.service');

function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getContactos(_req, res) {
  try {
    return res.status(200).json(await servicio.listar());
  } catch (err) {
    return manejarError(err, res, 'Error al listar el contacto institucional:');
  }
}

async function postContacto(req, res) {
  try {
    const { tipo, valor } = req.body ?? {};
    return res.status(201).json(await servicio.crear({ usuarioId: req.usuario.sub, tipo, valor }));
  } catch (err) {
    return manejarError(err, res, 'Error al crear un contacto institucional:');
  }
}

async function putContacto(req, res) {
  try {
    const { tipo, valor } = req.body ?? {};
    return res.status(200).json(await servicio.actualizar({
      usuarioId: req.usuario.sub, id: req.params.id, tipo, valor,
    }));
  } catch (err) {
    return manejarError(err, res, 'Error al actualizar un contacto institucional:');
  }
}

async function deleteContacto(req, res) {
  try {
    return res.status(200).json(await servicio.eliminar({ usuarioId: req.usuario.sub, id: req.params.id }));
  } catch (err) {
    return manejarError(err, res, 'Error al eliminar un contacto institucional:');
  }
}

module.exports = { getContactos, postContacto, putContacto, deleteContacto };
