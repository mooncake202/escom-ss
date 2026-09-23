const caracteristicasService = require('./caracteristicas.service');

// Mismo patrón que calendario.controller.js; además reenvía `datos` (capacidad/ocupados/cupos a
// liberar) para que el front pueda explicar exactamente por qué no se pudo.
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  if (err.datos) body.datos = err.datos;
  return res.status(status).json(body);
}

// El id siempre se toma de la ruta y se valida aquí: nunca se confía en lo que mande el cliente.
function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('Identificador de solicitud inválido.');
    err.status = 400;
    throw err;
  }
  return id;
}

// ── CU-ADM-15 · Profesor ────────────────────────────────────────────────────
// El profesor sale del token (req.usuario.sub): el cuerpo nunca trae un profesor_id.

async function getContexto(req, res) {
  try {
    const resultado = await caracteristicasService.obtenerContexto({ usuarioId: req.usuario.sub });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener el contexto de características:');
  }
}

async function getMisSolicitudes(req, res) {
  try {
    const resultado = await caracteristicasService.listarMisSolicitudes({ usuarioId: req.usuario.sub });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar las solicitudes del profesor:');
  }
}

async function postSolicitud(req, res) {
  try {
    // caracteristicaId puede ser null a propósito (volver a Profesor base), así que se pasa tal cual:
    // el servicio distingue null (válido) de undefined (no se eligió nada).
    const resultado = await caracteristicasService.crearSolicitud({
      usuarioId: req.usuario.sub,
      caracteristicaId: req.body.caracteristicaId,
      justificacion: req.body.justificacion,
    });
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al crear la solicitud de característica:');
  }
}

// ── CU-ADM-16 · Coordinación ────────────────────────────────────────────────

// Bandeja compartida: pendientes + historial de resueltas en una sola respuesta,
// igual que el listado de Coordinación en Reportes.
async function getSolicitudes(req, res) {
  try {
    const resultado = await caracteristicasService.listarSolicitudes();
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar las solicitudes de características:');
  }
}

async function getSolicitud(req, res) {
  try {
    const resultado = await caracteristicasService.obtenerSolicitud({ solicitudId: leerId(req) });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al consultar la solicitud:');
  }
}

async function postAprobar(req, res) {
  try {
    const resultado = await caracteristicasService.aprobarSolicitud({
      solicitudId: leerId(req),
      comentario: req.body?.comentario,
    });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al aprobar la solicitud de característica:');
  }
}

async function postRechazar(req, res) {
  try {
    const resultado = await caracteristicasService.rechazarSolicitud({
      solicitudId: leerId(req),
      comentario: req.body?.comentario,
    });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al rechazar la solicitud de característica:');
  }
}

module.exports = {
  getContexto, getMisSolicitudes, postSolicitud,
  getSolicitudes, getSolicitud, postAprobar, postRechazar,
};
