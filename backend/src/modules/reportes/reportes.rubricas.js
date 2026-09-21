// CU-REP-01 fase 4: rúbrica del alumno. Se sube UNA sola vez, se guarda cifrada y después se reutiliza.
// Guardarla NO firma ni envía ningún reporte (sin documento, hash ni sello de tiempo).
//
// Disco: uploads/rubricas/<usuario_id>/<uuid>.enc (AES-256-GCM). BD: usuario.rubrica_imagen guarda solo la ruta relativa,
// junto con rubrica_ip y rubrica_fecha_registro. Ni la ruta ni los bytes salen del servidor.

const fs = require('fs');
const path = require('path');
const { cifrarBuffer, descifrarBuffer, generarNombreSeguro } = require('../../lib/fileEncryption');
const { prepararImagen } = require('./reportes.pdf');

const RUTA_BASE_RUBRICAS = path.join(__dirname, '../../../uploads/rubricas');
const LIMITE_BYTES = 3 * 1024 * 1024;
// La rúbrica se imprime en 160 x 50 pt: sobra con estas dimensiones y evita PNG que ocupan mucha memoria al decodificarse.
const LIMITES_IMAGEN = Object.freeze({ maxLado: 4000, maxPixeles: 8_000_000 });
const LONGITUD_MAX_IP = 45;

const CODIGOS_ERROR = Object.freeze({
  RUBRICA_REQUERIDA: 'RUBRICA_REQUERIDA',
  RUBRICA_MUY_GRANDE: 'RUBRICA_MUY_GRANDE',
  RUBRICA_YA_REGISTRADA: 'RUBRICA_YA_REGISTRADA',
  RUBRICA_NO_DISPONIBLE: 'RUBRICA_NO_DISPONIBLE',
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

// Ruta absoluta de un archivo guardado, solo si está dentro de la carpeta del propio usuario.
function resolverRuta(rutaRelativa, usuarioId, rutaBase) {
  const carpeta = path.resolve(rutaBase, String(usuarioId));
  const absoluta = path.resolve(rutaBase, rutaRelativa);
  return absoluta.startsWith(carpeta + path.sep) ? absoluta : null;
}

async function consultarRubrica(prisma, usuarioId) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, rubrica_imagen: true } });
  if (!usuario) throw crearError('No se encontró tu cuenta.', 404);
  return usuario.rubrica_imagen;
}

/** Estado de la rúbrica de cualquier usuario (alumno o profesor): solo si existe, nunca su ruta ni sus bytes. */
async function consultarEstadoRubrica(usuarioId, { prisma } = {}) {
  const tiene = Boolean(await consultarRubrica(prisma ?? require('../../lib/prisma'), usuarioId));
  return { tieneRubrica: tiene, requiereSubirRubrica: !tiene };
}

/**
 * Valida y guarda la rúbrica del alumno. Solo la primera vez: si ya hay una, 409 sin reemplazar nada.
 * `archivo`: { buffer } del multipart en memoria. Regresa solo el estado (nunca la ruta ni los bytes).
 */
async function guardarRubrica(usuarioId, archivo, { ip = null, prisma, ahora = new Date(), rutaBase = RUTA_BASE_RUBRICAS } = {}) {
  const bd = prisma ?? require('../../lib/prisma');

  if (await consultarRubrica(bd, usuarioId)) throw errorYaRegistrada();

  if (!archivo || !(archivo.buffer instanceof Uint8Array) || archivo.buffer.length === 0) {
    throw crearError('Selecciona la imagen de tu rúbrica.', 400, CODIGOS_ERROR.RUBRICA_REQUERIDA);
  }
  if (archivo.buffer.length > LIMITE_BYTES) {
    throw crearError('La imagen de la rúbrica excede el tamaño máximo permitido (3 MB).', 413, CODIGOS_ERROR.RUBRICA_MUY_GRANDE);
  }
  // Las mismas protecciones que usa el generador del PDF (estructura, decodificación real, dimensiones).
  const imagen = await prepararImagen(archivo.buffer, 'La rúbrica', LIMITES_IMAGEN);

  const rutaRelativa = path.posix.join(String(usuarioId), generarNombreSeguro('enc'));
  const rutaAbsoluta = path.join(rutaBase, rutaRelativa);
  await fs.promises.mkdir(path.dirname(rutaAbsoluta), { recursive: true, mode: 0o700 });
  try {
    await fs.promises.writeFile(rutaAbsoluta, cifrarBuffer(imagen.data), { flag: 'wx', mode: 0o600 });
  } catch (err) {
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
 * Bytes de la rúbrica guardada (PNG/JPEG originales) para el generador del PDF, o null si el alumno aún no la sube.
 * Si está registrada pero no se puede leer (archivo ausente, alterado o ruta fuera de su carpeta): 500 sin detalles.
 */
async function obtenerRubricaAlumno(usuarioId, { prisma, rutaBase = RUTA_BASE_RUBRICAS } = {}) {
  const bd = prisma ?? require('../../lib/prisma');
  const rutaRelativa = await consultarRubrica(bd, usuarioId);
  if (!rutaRelativa) return null;

  try {
    const absoluta = resolverRuta(rutaRelativa, usuarioId, rutaBase);
    if (!absoluta) throw new Error('ruta fuera de la carpeta del usuario');
    return descifrarBuffer(await fs.promises.readFile(absoluta));
  } catch (err) {
    console.error(`No se pudo leer la rúbrica del usuario ${usuarioId}:`, err.message);
    throw crearError('No se pudo recuperar tu rúbrica guardada. Contacta a soporte.', 500, CODIGOS_ERROR.RUBRICA_NO_DISPONIBLE);
  }
}

module.exports = {
  RUTA_BASE_RUBRICAS,
  LIMITE_BYTES,
  LIMITES_IMAGEN,
  CODIGOS_ERROR,
  normalizarIp,
  consultarEstadoRubrica,
  guardarRubrica,
  obtenerRubricaAlumno,
};
