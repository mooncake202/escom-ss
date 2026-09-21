// Fuente embebida de los PDF de Reportes: Liberation Sans 2.1.5 (SIL OFL 1.1), Regular, Bold y Bold Italic,
// guardada en assets/fonts/ con su LICENSE y AUTHORS. No depende de fuentes instaladas en el host ni en el contenedor.
//
// Aquí se verifica la integridad de los archivos, se lee qué caracteres tienen glifo y se miden textos con los
// anchos de glifo del propio TTF (tablas cmap, head, hhea y hmtx); el registro de la fuente en el PDF corresponde
// al generador.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIRECTORIO_FUENTES = path.join(__dirname, 'assets', 'fonts');
const FAMILIA_FUENTE = 'Liberation Sans';

// SHA-256 de los TTF de liberation-fonts-ttf-2.1.5.tar.gz (GitHub liberationfonts/liberation-fonts).
const FUENTES = Object.freeze({
  regular: Object.freeze({
    archivo: 'LiberationSans-Regular.ttf',
    sha256: '76d04c18ea243f426b7de1f3ad208e927008f961dc5945e5aad352d0dfde8ee8',
  }),
  bold: Object.freeze({
    archivo: 'LiberationSans-Bold.ttf',
    sha256: '788abee4c806d660e8aee46689dd8540cd4bb98da03dcc9d171ce3efd99a9173',
  }),
  // Solo para el texto fijo de la leyenda de actividades (no se usa con texto del usuario).
  boldItalic: Object.freeze({
    archivo: 'LiberationSans-BoldItalic.ttf',
    sha256: '698da70fc191cc5f33ad4d6d3fe830fe4624b898ea2e3169955928b7c491f1ee',
  }),
});

function crearError(mensaje, code) {
  return Object.assign(new Error(mensaje), { code });
}

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

function rutaFuente(estilo) {
  const fuente = FUENTES[estilo];
  if (!fuente) throw new TypeError(`Estilo de fuente desconocido: ${String(estilo)}. Usa "regular", "bold" o "boldItalic".`);
  return path.join(DIRECTORIO_FUENTES, fuente.archivo);
}

/**
 * Lee cada TTF y comprueba su SHA-256. Regresa { regular, bold, boldItalic } (Buffers) o lanza un error claro
 * (FUENTE_NO_ENCONTRADA / FUENTE_ALTERADA). `leer` es solo para pruebas.
 */
function leerFuentesVerificadas({ leer = (ruta) => fs.readFileSync(ruta) } = {}) {
  const buffers = {};
  for (const [estilo, { archivo, sha256: esperado }] of Object.entries(FUENTES)) {
    let contenido;
    try {
      contenido = leer(rutaFuente(estilo));
    } catch (err) {
      throw crearError(`No se pudo leer la fuente ${archivo} del reporte (${err.code ?? err.message}).`, 'FUENTE_NO_ENCONTRADA');
    }
    const real = sha256(contenido);
    if (real !== esperado) {
      throw crearError(`La fuente ${archivo} no coincide con la versión aprobada (SHA-256 ${real}).`, 'FUENTE_ALTERADA');
    }
    buffers[estilo] = contenido;
  }
  return buffers;
}

// ── Lectura de la tabla cmap (TrueType) ──────────────────────

// Desplazamiento de una tabla del TTF, o lanza FUENTE_INVALIDA si no existe.
function desplazamientoDeTabla(ttf, etiqueta) {
  if (ttf.length < 12) throw crearError('El archivo de fuente es demasiado corto.', 'FUENTE_INVALIDA');
  const numTablas = ttf.readUInt16BE(4);
  for (let i = 0; i < numTablas; i += 1) {
    const registro = 12 + i * 16;
    if (registro + 16 > ttf.length) break;
    if (ttf.toString('latin1', registro, registro + 4) === etiqueta) return ttf.readUInt32BE(registro + 8);
  }
  throw crearError(`La fuente no tiene tabla ${etiqueta}.`, 'FUENTE_INVALIDA');
}

// Formato 4 (BMP): segmentos con idDelta / idRangeOffset. Un glifo 0 es .notdef, o sea "sin glifo".
function leerFormato4(ttf, inicio, alCodigo) {
  const segmentos = ttf.readUInt16BE(inicio + 6) / 2;
  const fines = inicio + 14;
  const inicios = fines + segmentos * 2 + 2;
  const deltas = inicios + segmentos * 2;
  const desplazamientos = deltas + segmentos * 2;

  for (let s = 0; s < segmentos; s += 1) {
    const fin = ttf.readUInt16BE(fines + s * 2);
    const primero = ttf.readUInt16BE(inicios + s * 2);
    const delta = ttf.readUInt16BE(deltas + s * 2);
    const posDesplazamiento = desplazamientos + s * 2;
    const desplazamiento = ttf.readUInt16BE(posDesplazamiento);
    for (let c = primero; c <= fin && c < 0xffff; c += 1) {
      let glifo;
      if (desplazamiento === 0) {
        glifo = (c + delta) & 0xffff;
      } else {
        const posGlifo = posDesplazamiento + desplazamiento + (c - primero) * 2;
        if (posGlifo + 2 > ttf.length) continue;
        glifo = ttf.readUInt16BE(posGlifo);
        if (glifo !== 0) glifo = (glifo + delta) & 0xffff;
      }
      if (glifo !== 0) alCodigo(c, glifo);
    }
  }
}

// Formato 12 (todo Unicode): grupos consecutivos.
function leerFormato12(ttf, inicio, alCodigo) {
  const grupos = ttf.readUInt32BE(inicio + 12);
  for (let g = 0; g < grupos; g += 1) {
    const pos = inicio + 16 + g * 12;
    if (pos + 12 > ttf.length) break;
    const primero = ttf.readUInt32BE(pos);
    const fin = ttf.readUInt32BE(pos + 4);
    const glifoInicial = ttf.readUInt32BE(pos + 8);
    for (let c = primero; c <= fin; c += 1) if (glifoInicial + (c - primero) !== 0) alCodigo(c, glifoInicial + (c - primero));
  }
}

// Recorre todas las subtablas Unicode del cmap llamando alCodigo(puntoDeCodigo, idDeGlifo) por cada glifo real.
function recorrerCmap(ttf, alCodigo) {
  const cmap = desplazamientoDeTabla(ttf, 'cmap');
  const subtablas = ttf.readUInt16BE(cmap + 2);
  for (let i = 0; i < subtablas; i += 1) {
    const registro = cmap + 4 + i * 8;
    const plataforma = ttf.readUInt16BE(registro);
    const codificacion = ttf.readUInt16BE(registro + 2);
    const esUnicode = plataforma === 0 || (plataforma === 3 && (codificacion === 1 || codificacion === 10));
    if (!esUnicode) continue;
    const inicio = cmap + ttf.readUInt32BE(registro + 4);
    const formato = ttf.readUInt16BE(inicio);
    if (formato === 4) leerFormato4(ttf, inicio, alCodigo);
    else if (formato === 12) leerFormato12(ttf, inicio, alCodigo);
  }
}

/** Conjunto de puntos de código Unicode que tienen glifo en un TTF. */
function leerCodigosSoportados(ttf) {
  const codigos = new Set();
  recorrerCmap(ttf, (codigo) => codigos.add(codigo));
  if (codigos.size === 0) throw crearError('La fuente no expone caracteres Unicode.', 'FUENTE_INVALIDA');
  return codigos;
}

// ── Métricas para medir texto ────────────────────────────────

/**
 * Métricas de un TTF: unidades por em, ascender/descender (hhea) y avance horizontal de cada carácter.
 * No incluye kerning ni ligaduras: el ancho medido es igual o algo mayor que el que dibuja el motor de PDF
 * (por eso las mediciones son conservadoras).
 */
function leerMetricas(ttf) {
  const unidadesPorEm = ttf.readUInt16BE(desplazamientoDeTabla(ttf, 'head') + 18);
  const hhea = desplazamientoDeTabla(ttf, 'hhea');
  const ascender = ttf.readInt16BE(hhea + 4);
  const descender = ttf.readInt16BE(hhea + 6);
  const numMetricas = ttf.readUInt16BE(hhea + 34);
  const hmtx = desplazamientoDeTabla(ttf, 'hmtx');

  const avanceDeGlifo = (glifo) => ttf.readUInt16BE(hmtx + Math.min(glifo, numMetricas - 1) * 4);
  const glifos = new Map();
  recorrerCmap(ttf, (codigo, glifo) => glifos.set(codigo, glifo));
  if (glifos.size === 0 || !unidadesPorEm) throw crearError('La fuente no expone métricas válidas.', 'FUENTE_INVALIDA');

  const avances = new Map();
  for (const [codigo, glifo] of glifos) avances.set(codigo, avanceDeGlifo(glifo));
  return { unidadesPorEm, ascender, descender, avances, avanceSinGlifo: avanceDeGlifo(0) };
}

const metricasEnCache = new Map();

/**
 * Medidor de texto para un estilo ('regular' | 'bold' | 'boldItalic'). ancho(texto, tamano) devuelve puntos.
 * Verifica el SHA-256 de la fuente antes de leerla.
 */
function obtenerMedidor(estilo) {
  if (!FUENTES[estilo]) throw new TypeError(`Estilo de fuente desconocido: ${String(estilo)}.`);
  if (!metricasEnCache.has(estilo)) metricasEnCache.set(estilo, leerMetricas(leerFuentesVerificadas()[estilo]));
  const metricas = metricasEnCache.get(estilo);
  const { unidadesPorEm, avances, avanceSinGlifo } = metricas;
  return {
    ascender: metricas.ascender / unidadesPorEm,
    descender: -metricas.descender / unidadesPorEm,
    ancho(texto, tamano) {
      let unidades = 0;
      for (const caracter of texto) unidades += avances.get(caracter.codePointAt(0)) ?? avanceSinGlifo;
      return (unidades * tamano) / unidadesPorEm;
    },
  };
}

let coberturaEnCache = null;

/**
 * Caracteres que se pueden imprimir en TODOS los estilos usados (Regular y Bold): un texto en negritas no puede
 * cambiar de glifos. Verifica el SHA-256 de la fuente antes de leerla y guarda el resultado en memoria.
 */
function obtenerCobertura() {
  if (coberturaEnCache) return coberturaEnCache;
  const { regular, bold } = leerFuentesVerificadas();
  const enBold = leerCodigosSoportados(bold);
  coberturaEnCache = new Set([...leerCodigosSoportados(regular)].filter((c) => enBold.has(c)));
  return coberturaEnCache;
}

const tieneGlifo = (codigo) => obtenerCobertura().has(codigo);

module.exports = {
  DIRECTORIO_FUENTES,
  FAMILIA_FUENTE,
  FUENTES,
  rutaFuente,
  leerFuentesVerificadas,
  leerCodigosSoportados,
  leerMetricas,
  obtenerMedidor,
  obtenerCobertura,
  tieneGlifo,
};
