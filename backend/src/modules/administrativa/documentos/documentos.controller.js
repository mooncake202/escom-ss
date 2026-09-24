// CU-ADM-13 (consulta) y CU-ADM-14 (carta compromiso firmada).
//
// El alumno y el coordinador salen SIEMPRE de req.usuario. Ningún endpoint acepta el autor, el rol
// ni el estado del documento desde el cuerpo de la petición.

const multer = require('multer');
const documentosService = require('./documentos.service');
const cartaService = require('./carta-firmada.service');

// Mismo criterio que el expediente de baja: un solo PDF, en memoria, cifrado antes de tocar disco.
const LIMITE_CARTA_BYTES = 5 * 1024 * 1024;

const subirCartaFirmada = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_CARTA_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('SOLO_PDF'));
    cb(null, true);
  },
}).single('carta');

function manejarError(err, res, mensajeInterno) {
  const status = err.status || 500;
  const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
  if (status === 500) console.error(mensajeInterno, err);
  const body = { message };
  if (err.code) body.code = err.code;
  return res.status(status).json(body);
}

function enviarPdf(res, { pdf, nombreSugerido }, descargar) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${descargar ? 'attachment' : 'inline'}; filename="${nombreSugerido}"`);
  return res.send(pdf);
}

// ── CU-ADM-13 ───────────────────────────────────────────────────────────────

async function getMiExpediente(req, res) {
  try {
    return res.status(200).json(await documentosService.obtenerMiExpediente({ usuarioId: req.usuario.sub }));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el expediente del alumno:');
  }
}

async function getAlumnos(_req, res) {
  try {
    return res.status(200).json(await documentosService.listarAlumnosConDocumentos());
  } catch (err) {
    return manejarError(err, res, 'Error al listar alumnos con documentos:');
  }
}

async function getExpedienteDeAlumno(req, res) {
  try {
    return res.status(200).json(await documentosService.obtenerExpedienteDeAlumno({ boleta: req.params.boleta }));
  } catch (err) {
    return manejarError(err, res, 'Error al consultar el expediente de un alumno:');
  }
}

// Sirve el PDF descifrado. `?descargar=1` fuerza la descarga; por omisión se abre en el visor.
async function getArchivo(req, res) {
  try {
    const archivo = await documentosService.obtenerArchivo({
      usuarioId: req.usuario.sub,
      rol: req.usuario.rol,
      documentoId: req.params.id,
    });
    return enviarPdf(res, archivo, req.query.descargar === '1');
  } catch (err) {
    return manejarError(err, res, 'Error al abrir un documento:');
  }
}

// ── CU-ADM-14 ───────────────────────────────────────────────────────────────

async function getAlumnosCarta(_req, res) {
  try {
    return res.status(200).json(await cartaService.listarAlumnos());
  } catch (err) {
    return manejarError(err, res, 'Error al listar alumnos para carta compromiso:');
  }
}

// multipart/form-data: campo `carta` con el PDF; la boleta viaja en la ruta.
function postCartaFirmada(req, res) {
  subirCartaFirmada(req, res, async (errArchivo) => {
    if (errArchivo) {
      if (errArchivo.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'La carta excede el tamaño máximo permitido (5 MB).', code: 'ARCHIVO_MUY_GRANDE' });
      }
      if (errArchivo.message === 'SOLO_PDF') {
        return res.status(400).json({ message: 'Solo se aceptan archivos PDF.', code: 'SOLO_PDF' });
      }
      console.error('Error al procesar la carta compromiso firmada:', errArchivo);
      return res.status(500).json({ message: 'Ocurrió un error al procesar el archivo.' });
    }
    try {
      const resultado = await cartaService.registrarCarta({
        usuarioId: req.usuario.sub,
        boleta: req.params.boleta,
        archivoPdf: req.file,
      });
      return res.status(resultado.sustituida ? 200 : 201).json(resultado);
    } catch (err) {
      return manejarError(err, res, 'Error al registrar la carta compromiso firmada:');
    }
  });
}

module.exports = {
  getMiExpediente,
  getAlumnos,
  getExpedienteDeAlumno,
  getArchivo,
  getAlumnosCarta,
  postCartaFirmada,
};
