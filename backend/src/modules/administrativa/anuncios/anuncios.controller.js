// CU-ADM-02 / CU-ADM-07. El autor y el rol salen SIEMPRE de req.usuario: el cuerpo de la petición
// nunca puede decidir quién publica ni con qué origen.

const servicio = require('./anuncios.service');

function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

// `?limite=3` lo usa el resumen del dashboard. La regla de visibilidad es la misma que la del
// historial completo: solo cambia cuántos se devuelven.
function leerLimite(valor) {
  if (valor === undefined) return null;
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function getAnuncios(req, res) {
  try {
    return res.status(200).json(await servicio.listarParaAlumno({
      usuarioId: req.usuario.sub,
      limite: leerLimite(req.query.limite),
    }));
  } catch (err) {
    return manejarError(err, res, 'Error al listar los anuncios del alumno:');
  }
}

async function postVisto(req, res) {
  try {
    return res.status(200).json(await servicio.marcarVisto({
      usuarioId: req.usuario.sub,
      anuncioId: req.params.id,
    }));
  } catch (err) {
    return manejarError(err, res, 'Error al marcar un anuncio como visto:');
  }
}

async function getMisAnuncios(req, res) {
  try {
    return res.status(200).json(await servicio.listarMios({
      usuarioId: req.usuario.sub,
      rol: req.usuario.rol,
    }));
  } catch (err) {
    return manejarError(err, res, 'Error al listar el historial de anuncios:');
  }
}

async function postAnuncio(req, res) {
  try {
    const { titulo, contenido } = req.body ?? {};
    const resultado = await servicio.publicar({
      usuarioId: req.usuario.sub,
      rol: req.usuario.rol,
      titulo,
      contenido,
    });
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al publicar un anuncio:');
  }
}

module.exports = { getAnuncios, postVisto, getMisAnuncios, postAnuncio };
