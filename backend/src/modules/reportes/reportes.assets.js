// Imágenes fijas del reporte mensual, versionadas con el código y verificadas por SHA-256 antes de usarse:
//  - Logos institucionales (assets/logos/), ya recortados y optimizados a partir de los PNG originales de IPN y ESCOM:
//    sin redibujar, sin cambiar colores y con la proporción original.
//  - Sello de validación del prototipo (assets/sellos/), que Coordinación agrega al aprobar (CU-REP-06).
// El PDF de referencia de la plantilla NO se usa en tiempo de ejecución.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIRECTORIO_LOGOS = path.join(__dirname, 'assets', 'logos');
const DIRECTORIO_SELLOS = path.join(__dirname, 'assets', 'sellos');

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

// Sello fijo del prototipo (no es un sello institucional oficial).
const SELLOS = Object.freeze({
  prototipo: Object.freeze({
    archivo: 'sello-prototipo.png',
    sha256: 'bc6a4d2d36c20be63ebabd46ccb8876d00de18ae02aeaa3b737becf8f1567694',
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
 * Sello de validación del prototipo verificado (mismo formato que leerLogo).
 * Lanza SELLO_NO_ENCONTRADO / SELLO_ALTERADO. `leer` es solo para pruebas (no usa la caché).
 */
function leerSello(nombre = 'prototipo', { leer = null } = {}) {
  return leerVerificada({
    tabla: SELLOS, directorio: DIRECTORIO_SELLOS, nombre, etiqueta: 'Sello', leer,
    codigos: { noEncontrado: 'SELLO_NO_ENCONTRADO', alterado: 'SELLO_ALTERADO' },
  });
}

module.exports = { DIRECTORIO_LOGOS, DIRECTORIO_SELLOS, LOGOS, SELLOS, dimensionesPng, leerLogo, leerSello };
