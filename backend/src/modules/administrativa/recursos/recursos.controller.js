// CU-ADM-05. El coordinador sale SIEMPRE de req.usuario: el cuerpo nunca decide la autoría.

const servicio = require('./recursos.service');

function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getRecursos(_req, res) {
  try {
    return res.status(200).json(await servicio.listar());
  } catch (err) {
    return manejarError(err, res, 'Error al listar los recursos:');
  }
}

// CU-GR-01: público a propósito — el alumno_sin_asignar todavía no tiene cuenta cuando llena este
// formulario. Expone SOLO la URL de este recurso puntual, nunca el catálogo completo.
async function getRecursoConstanciaCreditos(_req, res) {
  try {
    return res.status(200).json(await servicio.obtenerUrlConstanciaCreditos());
  } catch (err) {
    return manejarError(err, res, 'Error al obtener el recurso de constancia de créditos:');
  }
}

async function postRecurso(req, res) {
  try {
    const { nombre, url, tipo } = req.body ?? {};
    return res.status(201).json(await servicio.crear({ usuarioId: req.usuario.sub, nombre, url, tipo }));
  } catch (err) {
    return manejarError(err, res, 'Error al crear un recurso:');
  }
}

async function putRecurso(req, res) {
  try {
    const { nombre, url, tipo } = req.body ?? {};
    return res.status(200).json(await servicio.actualizar({
      usuarioId: req.usuario.sub, id: req.params.id, nombre, url, tipo,
    }));
  } catch (err) {
    return manejarError(err, res, 'Error al actualizar un recurso:');
  }
}

async function deleteRecurso(req, res) {
  try {
    return res.status(200).json(await servicio.eliminar({ usuarioId: req.usuario.sub, id: req.params.id }));
  } catch (err) {
    return manejarError(err, res, 'Error al eliminar un recurso:');
  }
}

module.exports = { getRecursos, postRecurso, putRecurso, deleteRecurso, getRecursoConstanciaCreditos };
