const multer = require('multer');
const lssAlumnoService = require('./lss-alumno.service');

// Mismo patrón de manejo de errores que ah-alumno.controller.js
// (err.status || 500, mensaje genérico en 500, err.code reenviado si existe).
function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

async function getEstadoRequisitos(req, res) {
  try {
    const resultado = await lssAlumnoService.obtenerEstadoRequisitos(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener estado de requisitos LSS:');
  }
}

async function postIniciarEvaluacion(req, res) {
  try {
    const resultado = await lssAlumnoService.iniciarEvaluacion(req.usuario.sub, req.body.reportesValidadosSiss);
    return res.status(201).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al iniciar evaluación de desempeño:');
  }
}

// ── CU-LSS-02 ─────────────────────────────────────────────────

async function getEstadoEvaluacion(req, res) {
  try {
    const resultado = await lssAlumnoService.obtenerEstadoEvaluacion(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener estado de evaluación:');
  }
}

async function postReenviarEvaluacion(req, res) {
  try {
    const resultado = await lssAlumnoService.reenviarSolicitudEvaluacion(req.usuario.sub, req.body.reportesValidadosSiss);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al reenviar solicitud de evaluación:');
  }
}

// No usa manejarError: la respuesta exitosa es binaria (el PDF), no JSON —
// mismo patrón que gr-coordinador.controller.js:getDescargarDocumento.
async function getDescargarEvaluacion(req, res) {
  try {
    const { buffer, nombreExpediente } = await lssAlumnoService.marcarEvaluacionDescargada(req.usuario.sub);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreExpediente}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al descargar evaluación:', err);
    return res.status(status).json({ message });
  }
}

async function postConfirmarSiss(req, res) {
  try {
    const resultado = await lssAlumnoService.confirmarSubidaSiss(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al confirmar subida a SISS:');
  }
}

async function postCartaTermino(req, res) {
  try {
    const resultado = await lssAlumnoService.solicitarCartaTermino(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al solicitar carta de término:');
  }
}

// ── CU-LSS-05 ─────────────────────────────────────────────────

async function getEstadoCarta(req, res) {
  try {
    const resultado = await lssAlumnoService.obtenerEstadoCarta(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener estado de carta de término:');
  }
}

async function postConfirmarRecogida(req, res) {
  try {
    const resultado = await lssAlumnoService.confirmarRecogida(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al confirmar recogida de carta de término:');
  }
}

// ── CU-LSS-07 ─────────────────────────────────────────────────

async function getInfoExpediente(req, res) {
  try {
    const resultado = await lssAlumnoService.obtenerInfoExpediente(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener información de expediente LSS:');
  }
}

// Mismo patrón exacto que uploadExpediente en gr.controller.js: multer en
// memoria, límite por archivo, filtro real de mimetype PDF (RN-LSS-20).
const LIMITE_ARCHIVO_EXPEDIENTE_LSS_BYTES = 1 * 1024 * 1024; // 1 MB por archivo individual — igual al límite del combinado, no tiene sentido permitir uno más grande.

const uploadExpedienteLss = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_ARCHIVO_EXPEDIENTE_LSS_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('SOLO_PDF'));
    cb(null, true);
  },
}).fields([
  { name: 'cartaCompromiso', maxCount: 1 },
  { name: 'cartaTermino', maxCount: 1 },
  { name: 'dictamen', maxCount: 1 },
]);

function postSubirExpedienteLss(req, res) {
  uploadExpedienteLss(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Alguno de los archivos excede el tamaño máximo permitido (1 MB por documento).' });
      }
      if (err.message === 'SOLO_PDF') {
        return res.status(400).json({ message: 'Solo se permiten archivos en formato PDF.' });
      }
      console.error('Error al procesar archivos del expediente LSS:', err);
      return res.status(500).json({ message: 'Ocurrió un error al procesar los archivos.' });
    }
    try {
      const archivos = {
        cartaCompromiso: req.files?.cartaCompromiso?.[0],
        cartaTermino: req.files?.cartaTermino?.[0],
        dictamen: req.files?.dictamen?.[0],
      };
      const resultado = await lssAlumnoService.subirExpedienteLss(req.usuario.sub, archivos);
      return res.status(200).json(resultado);
    } catch (error) {
      return manejarError(error, res, 'Error al subir expediente LSS:');
    }
  });
}

async function getDescargarExpedienteLss(req, res) {
  try {
    const { buffer, nombreExpediente } = await lssAlumnoService.descargarExpedienteLss(req.usuario.sub);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreExpediente}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al descargar expediente LSS:', err);
    return res.status(status).json({ message });
  }
}

// ── CU-LSS-08 ─────────────────────────────────────────────────

async function getEstadoExpediente(req, res) {
  try {
    const resultado = await lssAlumnoService.obtenerEstadoExpediente(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener estado del expediente LSS:');
  }
}

async function postSolicitarConstancia(req, res) {
  try {
    const resultado = await lssAlumnoService.solicitarConstanciaTermino(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al solicitar constancia de término:');
  }
}

async function postCorregirExpedienteLss(req, res) {
  try {
    const resultado = await lssAlumnoService.corregirExpedienteLss(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al corregir expediente LSS:');
  }
}

// ── CU-LSS-10 ─────────────────────────────────────────────────

async function getEstadoConstancia(req, res) {
  try {
    const resultado = await lssAlumnoService.obtenerEstadoConstancia(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    return manejarError(err, res, 'Error al obtener estado de la constancia de término:');
  }
}

async function getDescargarConstancia(req, res) {
  try {
    const { buffer, nombreExpediente } = await lssAlumnoService.descargarConstancia(req.usuario.sub);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreExpediente}"`);
    return res.status(200).send(buffer);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al descargar constancia de término:', err);
    return res.status(status).json({ message });
  }
}

module.exports = {
  getEstadoRequisitos,
  postIniciarEvaluacion,
  getEstadoEvaluacion,
  postReenviarEvaluacion,
  getDescargarEvaluacion,
  postConfirmarSiss,
  postCartaTermino,
  getEstadoCarta,
  postConfirmarRecogida,
  getInfoExpediente,
  postSubirExpedienteLss,
  getDescargarExpedienteLss,
  getEstadoExpediente,
  postSolicitarConstancia,
  postCorregirExpedienteLss,
  getEstadoConstancia,
  getDescargarConstancia,
};
