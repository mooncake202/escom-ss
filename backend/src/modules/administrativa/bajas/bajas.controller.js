const multer = require('multer');
const bajasService = require('./bajas.service');

const LIMITE_EXPEDIENTE_BYTES = 5 * 1024 * 1024; // el expediente de baja es un solo PDF

// Mismo patrón que gr.controller.js: el archivo vive en memoria y se cifra antes de tocar el disco.
const subirExpedienteBaja = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_EXPEDIENTE_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('SOLO_PDF'));
    cb(null, true);
  },
}).single('expediente');

// Mismo manejador que calendario y características; reenvía `code` y `datos` para que el front
// pueda explicar el caso concreto.
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  if (err.datos) body.datos = err.datos;
  return res.status(status).json(body);
}

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('Identificador de solicitud inválido.');
    err.status = 400;
    throw err;
  }
  return id;
}

// ── CU-ADM-09 · Profesor ────────────────────────────────────────────────────

async function getMisAlumnos(req, res) {
  try {
    return res.status(200).json(await bajasService.listarMisAlumnos({ usuarioId: req.usuario.sub }));
  } catch (err) {
    return manejarError(err, res, 'Error al listar los alumnos del profesor:');
  }
}

async function postBajaProfesor(req, res) {
  try {
    const resultado = await bajasService.solicitarBajaProfesor({
      usuarioId: req.usuario.sub,
      alumnoBoleta: req.body?.alumnoBoleta,
      motivo: req.body?.motivo,
    });
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al solicitar la baja del alumno:');
  }
}

async function postAmonestacion(req, res) {
  try {
    const resultado = await bajasService.amonestarAlumno({
      usuarioId: req.usuario.sub,
      alumnoBoleta: req.body?.alumnoBoleta,
      observaciones: req.body?.observaciones,
    });
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al amonestar al alumno:');
  }
}

// ── CU-ADM-11 · Alumno ──────────────────────────────────────────────────────

async function getMiSolicitud(req, res) {
  try {
    return res.status(200).json(await bajasService.consultarMiSolicitud({ usuarioId: req.usuario.sub }));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar la solicitud de baja del alumno:');
  }
}

// Las dos entradas del expediente comparten multer y sus errores: subirlo con la solicitud nueva
// (ADM-11) y adjuntarlo a la que pidió el profesor (ADM-09 → ADM-11).
function conExpedientePdf(req, res, continuar) {
  subirExpedienteBaja(req, res, async (errArchivo) => {
    if (errArchivo) {
      if (errArchivo.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'El expediente excede el tamaño máximo permitido (5 MB).' });
      }
      if (errArchivo.message === 'SOLO_PDF') {
        return res.status(400).json({ message: 'Solo se permiten archivos en formato PDF.' });
      }
      console.error('Error al procesar el expediente de baja:', errArchivo);
      return res.status(500).json({ message: 'Ocurrió un error al procesar el archivo.' });
    }
    return continuar();
  });
}

function postBajaAlumno(req, res) {
  conExpedientePdf(req, res, async () => {
    try {
      const resultado = await bajasService.solicitarBajaAlumno({
        usuarioId: req.usuario.sub,
        motivo: req.body?.motivo,
        archivoPdf: req.file,
      });
      return res.status(201).json(resultado);
    } catch (err) {
      return manejarError(err, res, 'Error al registrar la solicitud de baja del alumno:');
    }
  });
}

// El alumno completa con su expediente la baja que solicitó su profesor. No recibe id de solicitud:
// sale de su token, así que no puede tocar la de nadie más.
function postCompletarExpediente(req, res) {
  conExpedientePdf(req, res, async () => {
    try {
      const resultado = await bajasService.completarExpedienteDeBaja({
        usuarioId: req.usuario.sub,
        archivoPdf: req.file,
      });
      return res.status(200).json(resultado);
    } catch (err) {
      return manejarError(err, res, 'Error al adjuntar el expediente de baja:');
    }
  });
}

// ── CU-ADM-12 · Coordinación ────────────────────────────────────────────────

async function getSolicitudes(req, res) {
  try {
    return res.status(200).json(await bajasService.listarSolicitudes());
  } catch (err) {
    return manejarError(err, res, 'Error al listar las solicitudes de baja:');
  }
}

async function getSolicitud(req, res) {
  try {
    return res.status(200).json(await bajasService.obtenerSolicitud({ solicitudId: leerId(req) }));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar la solicitud de baja:');
  }
}

async function getExpediente(req, res) {
  try {
    const { pdf, boleta } = await bajasService.obtenerExpediente({ solicitudId: leerId(req) });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="expediente-baja-${boleta}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener el expediente de baja:');
  }
}

async function postEnRevision(req, res) {
  try {
    const resultado = await bajasService.marcarEnRevision({
      solicitudId: leerId(req),
      coordinadorUsuarioId: req.usuario.sub,
    });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al marcar la solicitud de baja en revisión:');
  }
}

async function postAprobar(req, res) {
  try {
    const resultado = await bajasService.aprobarSolicitud({
      solicitudId: leerId(req),
      coordinadorUsuarioId: req.usuario.sub,
      comentario: req.body?.comentario,
    });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al aprobar la solicitud de baja:');
  }
}

async function postRechazar(req, res) {
  try {
    const resultado = await bajasService.rechazarSolicitud({
      solicitudId: leerId(req),
      coordinadorUsuarioId: req.usuario.sub,
      comentario: req.body?.comentario,
    });
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al rechazar la solicitud de baja:');
  }
}

module.exports = {
  getMisAlumnos, postBajaProfesor, postAmonestacion,
  getMiSolicitud, postBajaAlumno, postCompletarExpediente,
  getSolicitudes, getSolicitud, getExpediente, postEnRevision, postAprobar, postRechazar,
};
