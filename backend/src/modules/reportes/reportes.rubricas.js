// CU-REP-01 fase 4 / CU-REP-05: rúbrica del alumno y del profesor. Se sube UNA sola vez, se guarda cifrada y
// después se reutiliza. Guardarla NO firma ni envía ningún reporte (sin documento, hash ni sello de tiempo).
//
// Disco (reorganización de almacenamiento — antes vivía en uploads/rubricas/<usuario_id>/<uuid>.enc para ambos):
//   Alumno:   uploads/documentos/<boleta>/Rubrica/rubrica.enc              (misma carpeta que sus PDFs de Reportes)
//   Profesor: uploads/profesores/<correo_institucional>/Rubrica/rubrica.enc
// El nombre del archivo es fijo ("rubrica.enc"): con la regla de una sola rúbrica por usuario no hace falta un
// nombre aleatorio como el de los PDFs. BD: usuario.rubrica_imagen guarda solo la ruta relativa (a la base que le
// toque por rol), junto con rubrica_ip y rubrica_fecha_registro. Ni la ruta ni los bytes salen del servidor.
//
// La identidad (boleta o correo) SIEMPRE sale de la BD a partir del usuario_id del token — nunca del cliente — y se
// valida antes de usarla como segmento de ruta (mismo criterio que ya aplica el PDF con la boleta).

const fs = require('fs');
const path = require('path');
const { cifrarBuffer, descifrarBuffer } = require('../../lib/fileEncryption');
const { prepararImagen } = require('./reportes.pdf');
const { RUTA_BASE_DOCUMENTOS, RUTA_BASE_PROFESORES } = require('./reportes.shared');

const LIMITE_BYTES = 3 * 1024 * 1024;
// La rúbrica se imprime en 160 x 50 pt: sobra con estas dimensiones y evita PNG que ocupan mucha memoria al decodificarse.
const LIMITES_IMAGEN = Object.freeze({ maxLado: 4000, maxPixeles: 8_000_000 });
const LONGITUD_MAX_IP = 45;
const NOMBRE_ARCHIVO = 'rubrica.enc';

// Mismo patrón que ya exige el PDF para la boleta (reportes-envio.service.js); el del correo institucional es un
// formato de correo simple, sin "/" ni espacios, para que nunca pueda escapar de su carpeta.
const SEGMENTO_BOLETA_VALIDO = /^[A-Za-z0-9]{1,10}$/;
const SEGMENTO_CORREO_VALIDO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const CODIGOS_ERROR = Object.freeze({
  RUBRICA_REQUERIDA: 'RUBRICA_REQUERIDA',
  RUBRICA_MUY_GRANDE: 'RUBRICA_MUY_GRANDE',
  RUBRICA_YA_REGISTRADA: 'RUBRICA_YA_REGISTRADA',
  RUBRICA_NO_DISPONIBLE: 'RUBRICA_NO_DISPONIBLE',
  CUENTA_NO_SOPORTADA: 'CUENTA_NO_SOPORTADA',
});

function crearError(mensaje, status, code) {
  return Object.assign(new Error(mensaje), { status, code });
}

const errorYaRegistrada = () => crearError(
  'Ya tienes una rúbrica registrada. Se reutilizará automáticamente en tus reportes.',
  409,
  CODIGOS_ERROR.RUBRICA_YA_REGISTRADA,
);

const borrarSilencioso = (ruta) => fs.promises.rm(ruta, { force: true }).catch(() => {});

function normalizarIp(ip) {
  return typeof ip === 'string' && ip.length > 0 && ip.length <= LONGITUD_MAX_IP ? ip : null;
}

/**
 * Identidad de quien sube/lee su rúbrica — SIEMPRE resuelta en el servidor a partir de usuario_id (nunca del
 * cliente): alumno por su boleta (bajo uploads/documentos, junto a sus PDFs) o profesor por su correo_institucional
 * (bajo uploads/profesores). `rutaBaseOverride` (pruebas) sustituye la base real por la que le toque según el rol.
 */
async function resolverIdentidadRubrica(prisma, usuarioId, rutaBaseOverride) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, rol: true, rubrica_imagen: true, correo_institucional: true, alumno: { select: { boleta: true } } },
  });
  if (!usuario) throw crearError('No se encontró tu cuenta.', 404);

  if (usuario.rol === 'alumno_asignado' || usuario.rol === 'alumno_sin_asignar') {
    const boleta = usuario.alumno?.boleta;
    if (!boleta || !SEGMENTO_BOLETA_VALIDO.test(boleta)) {
      throw crearError('No se pudo identificar tu cuenta para guardar la rúbrica.', 500, CODIGOS_ERROR.CUENTA_NO_SOPORTADA);
    }
    return { clave: boleta, rutaBase: rutaBaseOverride ?? RUTA_BASE_DOCUMENTOS, rubricaImagen: usuario.rubrica_imagen };
  }

  if (usuario.rol === 'profesor') {
    const correo = usuario.correo_institucional;
    if (!correo || !SEGMENTO_CORREO_VALIDO.test(correo)) {
      throw crearError('No se pudo identificar tu cuenta para guardar la rúbrica.', 500, CODIGOS_ERROR.CUENTA_NO_SOPORTADA);
    }
    return { clave: correo, rutaBase: rutaBaseOverride ?? RUTA_BASE_PROFESORES, rubricaImagen: usuario.rubrica_imagen };
  }

  throw crearError('Este tipo de cuenta no puede registrar una rúbrica.', 403, CODIGOS_ERROR.CUENTA_NO_SOPORTADA);
}

// Ruta absoluta de un archivo guardado, solo si está dentro de la carpeta <clave>/Rubrica/ de su propio dueño.
function resolverRuta(rutaRelativa, clave, rutaBase) {
  const carpeta = path.resolve(rutaBase, clave, 'Rubrica');
  const absoluta = path.resolve(rutaBase, rutaRelativa);
  return absoluta.startsWith(carpeta + path.sep) ? absoluta : null;
}

/** Estado de la rúbrica de cualquier usuario (alumno o profesor): solo si existe, nunca su ruta ni sus bytes. */
async function consultarEstadoRubrica(usuarioId, { prisma } = {}) {
  const bd = prisma ?? require('../../lib/prisma');
  const { rubricaImagen } = await resolverIdentidadRubrica(bd, usuarioId);
  return { tieneRubrica: Boolean(rubricaImagen), requiereSubirRubrica: !rubricaImagen };
}

/**
 * Valida y guarda la rúbrica del usuario (alumno o profesor, según su rol). Solo la primera vez: si ya hay una,
 * 409 sin reemplazar nada. `archivo`: { buffer } del multipart en memoria. Regresa solo el estado (nunca la ruta
 * ni los bytes). `rutaBase` (pruebas) sustituye la base real que le toque por rol.
 */
async function guardarRubrica(usuarioId, archivo, { ip = null, prisma, ahora = new Date(), rutaBase } = {}) {
  const bd = prisma ?? require('../../lib/prisma');
  const identidad = await resolverIdentidadRubrica(bd, usuarioId, rutaBase);
  if (identidad.rubricaImagen) throw errorYaRegistrada();

  if (!archivo || !(archivo.buffer instanceof Uint8Array) || archivo.buffer.length === 0) {
    throw crearError('Selecciona la imagen de tu rúbrica.', 400, CODIGOS_ERROR.RUBRICA_REQUERIDA);
  }
  if (archivo.buffer.length > LIMITE_BYTES) {
    throw crearError('La imagen de la rúbrica excede el tamaño máximo permitido (3 MB).', 413, CODIGOS_ERROR.RUBRICA_MUY_GRANDE);
  }
  // Las mismas protecciones que usa el generador del PDF (estructura, decodificación real, dimensiones).
  const imagen = await prepararImagen(archivo.buffer, 'La rúbrica', LIMITES_IMAGEN);

  const rutaRelativa = path.posix.join(identidad.clave, 'Rubrica', NOMBRE_ARCHIVO);
  const rutaAbsoluta = path.join(identidad.rutaBase, rutaRelativa);
  await fs.promises.mkdir(path.dirname(rutaAbsoluta), { recursive: true, mode: 0o700 });
  try {
    await fs.promises.writeFile(rutaAbsoluta, cifrarBuffer(imagen.data), { flag: 'wx', mode: 0o600 });
  } catch (err) {
    // El nombre es fijo (rubrica.enc): a diferencia de los PDF (nombre aleatorio), dos subidas simultáneas de la
    // MISMA cuenta compiten por el mismo archivo. Si ya existe, ganó la otra — no es nuestro archivo, no se borra.
    if (err.code === 'EEXIST') throw errorYaRegistrada();
    await borrarSilencioso(rutaAbsoluta);
    throw err;
  }

  // Condicional en la BD: si otra petición guardó primero, esta pierde y limpia su archivo.
  let actualizadas;
  try {
    ({ count: actualizadas } = await bd.usuario.updateMany({
      where: { id: usuarioId, rubrica_imagen: null },
      data: { rubrica_imagen: rutaRelativa, rubrica_ip: normalizarIp(ip), rubrica_fecha_registro: ahora },
    }));
  } catch (err) {
    await borrarSilencioso(rutaAbsoluta);
    throw err;
  }
  if (actualizadas !== 1) {
    await borrarSilencioso(rutaAbsoluta);
    throw errorYaRegistrada();
  }

  return { tieneRubrica: true, requiereSubirRubrica: false, fechaRegistro: ahora.toISOString() };
}

/**
 * Bytes de la rúbrica guardada (PNG/JPEG originales) para el generador del PDF, o null si el usuario aún no la
 * sube. Si está registrada pero no se puede leer (archivo ausente, alterado o ruta fuera de su carpeta): 500 sin
 * detalles. `rutaBase` (pruebas) sustituye la base real que le toque por rol.
 */
async function obtenerRubricaAlumno(usuarioId, { prisma, rutaBase } = {}) {
  const bd = prisma ?? require('../../lib/prisma');
  const identidad = await resolverIdentidadRubrica(bd, usuarioId, rutaBase);
  if (!identidad.rubricaImagen) return null;

  try {
    const absoluta = resolverRuta(identidad.rubricaImagen, identidad.clave, identidad.rutaBase);
    if (!absoluta) throw new Error('ruta fuera de la carpeta del usuario');
    return descifrarBuffer(await fs.promises.readFile(absoluta));
  } catch (err) {
    console.error(`No se pudo leer la rúbrica del usuario ${usuarioId}:`, err.message);
    throw crearError('No se pudo recuperar tu rúbrica guardada. Contacta a soporte.', 500, CODIGOS_ERROR.RUBRICA_NO_DISPONIBLE);
  }
}

module.exports = {
  LIMITE_BYTES,
  LIMITES_IMAGEN,
  CODIGOS_ERROR,
  normalizarIp,
  consultarEstadoRubrica,
  guardarRubrica,
  obtenerRubricaAlumno,
};
