const lssCoordinadorService = require('./lss-coordinador.service');

// Mismo patrón de manejo de errores que lss-profesor.controller.js
// (err.status || 500, mensaje genérico en 500, err.code reenviado si existe).
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getEvaluacionesPendientesDictamen(req, res) {
  try {
    const resultado = await lssCoordinadorService.listarEvaluacionesPendientesDictamen();
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar evaluaciones pendientes de dictamen:');
  }
}

// No usa manejarError en el camino feliz: la respuesta exitosa es binaria
// (el PDF), no JSON — mismo patrón que getDescargarEvaluacion (LSS-02).
async function getDescargarParaRevision(req, res) {
  try {
    const buffer = await lssCoordinadorService.descargarParaRevision(req.usuario.sub, req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    return res.status(200).send(buffer);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al descargar evaluación para revisión:', err);
    return res.status(status).json({ message });
  }
}

async function postDictaminarAprobado(req, res) {
  try {
    const resultado = await lssCoordinadorService.dictaminarAprobado(req.usuario.sub, req.params.id, req.ip);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al aprobar dictamen de evaluación:');
  }
}

async function postDictaminarRechazado(req, res) {
  try {
    const resultado = await lssCoordinadorService.dictaminarRechazado(req.usuario.sub, req.params.id, req.body.motivoRechazoCoordinacion);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al rechazar dictamen de evaluación:');
  }
}

// ── CU-LSS-06 ─────────────────────────────────────────────────

async function getSolicitudesCartaTermino(req, res) {
  try {
    const resultado = await lssCoordinadorService.listarSolicitudesCartaTermino();
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar solicitudes de carta de término:');
  }
}

async function postMarcarCartaLista(req, res) {
  try {
    const resultado = await lssCoordinadorService.marcarCartaListaParaRecoger(req.usuario.sub, req.params.id);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al marcar carta de término como lista:');
  }
}

// ── CU-LSS-09 ─────────────────────────────────────────────────

async function getExpedientesPendientes(req, res) {
  try {
    const resultado = await lssCoordinadorService.listarExpedientesPendientes();
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al listar expedientes pendientes:');
  }
}

// No usa manejarError en el camino feliz: la respuesta exitosa es binaria
// (el PDF), no JSON — mismo patrón que getDescargarParaRevision.
async function getDescargarExpediente(req, res) {
  try {
    const { buffer, nombreExpediente } = await lssCoordinadorService.descargarExpedienteParaRevision(req.usuario.sub, req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreExpediente}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al descargar expediente para revisión:', err);
    return res.status(status).json({ message });
  }
}

async function postDictaminarExpedienteAprobado(req, res) {
  try {
    const resultado = await lssCoordinadorService.dictaminarExpedienteAprobado(req.usuario.sub, req.params.id);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al aprobar dictamen de expediente:');
  }
}

async function postDictaminarExpedienteRechazado(req, res) {
  try {
    const resultado = await lssCoordinadorService.dictaminarExpedienteRechazado(req.usuario.sub, req.params.id, req.body.observaciones);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al rechazar dictamen de expediente:');
  }
}

module.exports = {
  getEvaluacionesPendientesDictamen,
  getDescargarParaRevision,
  postDictaminarAprobado,
  postDictaminarRechazado,
  getSolicitudesCartaTermino,
  postMarcarCartaLista,
  getExpedientesPendientes,
  getDescargarExpediente,
  postDictaminarExpedienteAprobado,
  postDictaminarExpedienteRechazado,
};
