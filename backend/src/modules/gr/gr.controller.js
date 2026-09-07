const grService = require('./gr.service');
const multer = require('multer');

async function postEnviarSolicitud(req, res) {
  try {
    const resultado = await grService.enviarSolicitudRegistro(req.body);
    return res.status(201).json({ message: resultado.mensaje });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;

    if (status === 500) console.error('Error inesperado al enviar solicitud de registro:', err);

    const body = { message };
    if (err.code) body.code = err.code; // ej. OFERTA_SIN_CUPOS

    return res.status(status).json(body);
  }
}

async function getVerificarCorreo(req, res) {
  try {
    const { correo } = req.query;
    const resultado = await grService.verificarCorreoDisponible(correo);
    return res.status(200).json(resultado);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error inesperado al verificar correo:', err);
    return res.status(status).json({ message });
  }
}


async function getEstadoSolicitud(req, res) {
  try {
    const resultado = await grService.obtenerEstadoActualPorUsuarioId(req.usuario.sub);
    return res.status(200).json(resultado);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error inesperado al obtener estado de solicitud:', err);
    return res.status(status).json({ message });
  }
}

async function postCambiarOferta(req, res) {
  try {
    const resultado = await grService.cambiarOferta(req.usuario.sub, req.body);
    return res.status(200).json({ message: resultado.mensaje, estado_solicitud: resultado.estado_solicitud });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al cambiar de oferta:', err);
    const body = { message };
    if (err.code) body.code = err.code;
    return res.status(status).json(body);
  }
}

async function postContinuarSISS(req, res) {
  try {
    const resultado = await grService.continuarARegistroSISS(req.usuario.sub);
    return res.status(200).json({ message: resultado.mensaje, estado_solicitud: resultado.estado_solicitud });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al continuar a SISS:', err);
    return res.status(status).json({ message });
  }
}


async function getInfoSISS(req, res) {
  try {
    const info = await grService.obtenerInfoSISS(req.usuario.sub);
    return res.status(200).json(info);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al obtener info de SISS:', err);
    return res.status(status).json({ message });
  }
}

async function postConfirmarSISS(req, res) {
  try {
    const resultado = await grService.confirmarRegistroSISS(req.usuario.sub);
    return res.status(200).json({ message: resultado.mensaje, estado_solicitud: resultado.estado_solicitud });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al confirmar registro SISS:', err);
    return res.status(status).json({ message });
  }
}

const LIMITE_TAMANO_BYTES = 1.5 * 1024 * 1024; // 1.5 MB — debe coincidir exacto con el frontend

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_TAMANO_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('SOLO_PDF'));
    }
    cb(null, true);
  },
}).fields([
  { name: 'cartaCreditos', maxCount: 1 },
  { name: 'seguroSocial', maxCount: 1 },
]);

function postAdjuntarDocumentacion(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'El archivo excede el tamaño máximo permitido (1.5 MB).' });
      }
      if (err.message === 'SOLO_PDF') {
        return res.status(400).json({ message: 'Solo se permiten archivos en formato PDF.' });
      }
      console.error('Error al procesar archivos:', err);
      return res.status(500).json({ message: 'Ocurrió un error al procesar los archivos.' });
    }

    try {
      const cartaCreditos = req.files?.cartaCreditos?.[0];
      const seguroSocial = req.files?.seguroSocial?.[0];
      const resultado = await grService.adjuntarDocumentacionInicial(req.usuario.sub, { cartaCreditos, seguroSocial });
      return res.status(200).json({ message: resultado.mensaje, estado_solicitud: resultado.estado_solicitud });
    } catch (error) {
      const status = error.status || 500;
      const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : error.message;
      if (status === 500) console.error('Error al adjuntar documentación:', error);
      return res.status(status).json({ message });
    }
  });
}


function crearHandlerAccion(fn, mensajeInterno) {
  return async (req, res) => {
    try {
      const resultado = await fn(req.usuario.sub);
      return res.status(200).json({ message: resultado.mensaje, estado_solicitud: resultado.estado_solicitud });
    } catch (err) {
      const status = err.status || 500;
      const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
      if (status === 500) console.error(mensajeInterno, err);
      return res.status(status).json({ message });
    }
  };
}

const postContinuarCartaCompromiso = crearHandlerAccion(grService.continuarACartaCompromiso, 'Error al continuar a carta compromiso:');
const postCorregirDocumentacion = crearHandlerAccion(grService.corregirDocumentacion, 'Error al corregir documentación:');
const postCorregirSISS = crearHandlerAccion(grService.corregirRegistroSISS, 'Error al corregir SISS:');
const postModificarSolicitud = crearHandlerAccion(grService.iniciarModificarSolicitud, 'Error al iniciar modificación de solicitud:');

async function getMisDocumentos(req, res) {
  try {
    const documentos = await grService.obtenerMisDocumentos(req.usuario.sub);
    return res.status(200).json(documentos);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error al obtener documentos:', err);
    return res.status(status).json({ message });
  }
}


module.exports = { 
  postEnviarSolicitud, 
  getVerificarCorreo, 
  getEstadoSolicitud,
  postCambiarOferta,
  postContinuarSISS,
  getInfoSISS,
  postConfirmarSISS,
  postAdjuntarDocumentacion,
  postContinuarCartaCompromiso,
  postCorregirDocumentacion, 
  postCorregirSISS,
  postModificarSolicitud,
  getMisDocumentos,
};


