// Imágenes fijas del reporte mensual:
//  - Logos institucionales (assets/logos/), versionados con el código y verificados por SHA-256 antes de usarse:
//    ya recortados y optimizados a partir de los PNG originales de IPN y ESCOM, sin redibujar, sin cambiar colores
//    y con la proporción original.
//  - Sello institucional, que Coordinación agrega al aprobar (CU-REP-06): a diferencia de los logos, NO es un
//    archivo versionado con el código — es un único sello fijo del sistema (Coordinación no lo sube) que vive
//    cifrado en uploads/ con el mismo mecanismo AES-256-GCM que documentos y rúbricas (lib/fileEncryption.js).
//    Su integridad la da esa misma autenticación, no un SHA-256 fijo.
// El PDF de referencia de la plantilla NO se usa en tiempo de ejecución.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { descifrarBuffer } = require('../../lib/fileEncryption');
const { RUTA_BASE_COORDINADOR } = require('./reportes.shared');

const DIRECTORIO_LOGOS = path.join(__dirname, 'assets', 'logos');
const RUTA_SELLO = path.join(RUTA_BASE_COORDINADOR, 'Sellos', 'sello-escom.enc');

const LOGOS = Object.freeze({
  ipn: Object.freeze({
    archivo: 'ipn.png',
    sha256: 'c47c1ef18b35810d7f4b2cd4f8fb73bae1c1344fd7476c7153b80f09bb267d0d',
  }),
  escom: Object.freeze({
    archivo: 'escom.png',
    sha256: 'b8962cb65dc77725d9c63511522034bb6a56bd7a675fb53e9b62fdaa140bbe49',
  }),
});

const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function crearError(mensaje, code) {
  return Object.assign(new Error(mensaje), { code });
}

// Ancho y alto de un PNG (cabecera IHDR).
function dimensionesPng(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(FIRMA_PNG)) {
    throw crearError('El archivo no es un PNG válido.', 'LOGO_INVALIDO');
  }
  return { ancho: buffer.readUInt32BE(16), alto: buffer.readUInt32BE(20) };
}

const cache = new Map();

// Lectura verificada de una imagen fija: existe, coincide con el SHA-256 aprobado y es un PNG legible.
function leerVerificada({ tabla, directorio, nombre, etiqueta, codigos, leer }) {
  const imagen = tabla[nombre];
  if (!imagen) throw new TypeError(`${etiqueta} desconocido: ${String(nombre)}. Usa ${Object.keys(tabla).map((n) => `"${n}"`).join(' o ')}.`);
  const clave = `${etiqueta}:${nombre}`;
  if (!leer && cache.has(clave)) return cache.get(clave);

  let contenido;
  try {
    contenido = (leer ?? ((ruta) => fs.readFileSync(ruta)))(path.join(directorio, imagen.archivo));
  } catch (err) {
    throw crearError(`No se pudo leer el ${etiqueta.toLowerCase()} ${imagen.archivo} del reporte (${err.code ?? err.message}).`, codigos.noEncontrado);
  }
  const real = crypto.createHash('sha256').update(contenido).digest('hex');
  if (real !== imagen.sha256) {
    throw crearError(`El ${etiqueta.toLowerCase()} ${imagen.archivo} no coincide con la versión aprobada (SHA-256 ${real}).`, codigos.alterado);
  }

  const resultado = Object.freeze({ data: contenido, format: 'png', ...dimensionesPng(contenido) });
  if (!leer) cache.set(clave, resultado);
  return resultado;
}

/**
 * Logo verificado: { data: Buffer, format: 'png', ancho, alto } (dimensiones en píxeles).
 * Lanza LOGO_NO_ENCONTRADO / LOGO_ALTERADO. `leer` es solo para pruebas (no usa la caché).
 */
function leerLogo(nombre, { leer = null } = {}) {
  return leerVerificada({
    tabla: LOGOS, directorio: DIRECTORIO_LOGOS, nombre, etiqueta: 'Logo', leer,
    codigos: { noEncontrado: 'LOGO_NO_ENCONTRADO', alterado: 'LOGO_ALTERADO' },
  });
}

/**
 * Sello institucional verificado: { data: Buffer, format: 'png', ancho, alto } (mismo formato que leerLogo).
 * Se lee cifrado (AES-256-GCM, lib/fileEncryption.js) desde uploads/coordinador/Sellos/sello-escom.enc — nunca en
 * claro desde assets/. La propia autenticación de AES-GCM detecta cualquier alteración del archivo; no hay un
 * SHA-256 fijo que mantener porque, a diferencia de los logos, no es un archivo versionado con el código.
 * Lanza SELLO_NO_ENCONTRADO / SELLO_ALTERADO. `leer` y `rutaSello` son solo para pruebas (no usan la caché real).
 */
function leerSello({ leer = null, rutaSello = RUTA_SELLO } = {}) {
  if (!leer && cache.has(rutaSello)) return cache.get(rutaSello);

  let cifrado;
  try {
    cifrado = (leer ?? ((ruta) => fs.readFileSync(ruta)))(rutaSello);
  } catch (err) {
    throw crearError(`No se pudo leer el sello institucional (${err.code ?? err.message}).`, 'SELLO_NO_ENCONTRADO');
  }

  let contenido;
  try {
    contenido = descifrarBuffer(cifrado);
  } catch (err) {
    throw crearError(`El sello institucional no se pudo descifrar: pudo alterarse o la llave de cifrado no coincide (${err.message}).`, 'SELLO_ALTERADO');
  }

  let dimensiones;
  try {
    dimensiones = dimensionesPng(contenido);
  } catch {
    throw crearError('El sello institucional descifrado no es un PNG válido.', 'SELLO_ALTERADO');
  }

  const resultado = Object.freeze({ data: contenido, format: 'png', ...dimensiones });
  if (!leer) cache.set(rutaSello, resultado);
  return resultado;
}

module.exports = { DIRECTORIO_LOGOS, RUTA_SELLO, LOGOS, dimensionesPng, leerLogo, leerSello };
