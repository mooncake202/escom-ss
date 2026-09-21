// Medición y ajuste de texto para el layout del reporte mensual, con los anchos de glifo de Liberation Sans.
// Sin kerning: lo medido es igual o algo mayor que lo que dibuja el motor de PDF (mediciones conservadoras).

const { obtenerMedidor } = require('./reportes.fuentes');
const { ACTIVIDADES, AREA_ACTIVIDADES } = require('./reportes.plantilla');

// Margen para comparaciones de coma flotante.
const EPSILON = 1e-6;

function anchoTexto(texto, estilo, tamano) {
  return obtenerMedidor(estilo).ancho(texto, tamano);
}

// Ascender de la fuente (fracción del tamaño): la línea base queda a `ascender * tamano` bajo el borde superior.
const ascender = () => obtenerMedidor('regular').ascender;

/**
 * Parte un texto en líneas con corte voraz por espacios. `palabraLarga` es la primera palabra cuyo ancho por sí sola
 * excede `ancho` (no se puede partir): el motor de PDF la dejaría salirse del recuadro.
 */
function envolverTexto(texto, { estilo = 'regular', tamano, ancho }) {
  const medidor = obtenerMedidor(estilo);
  const espacio = medidor.ancho(' ', tamano);
  const lineas = [];
  let actual = '';
  let anchoActual = 0;
  let palabraLarga = null;

  for (const palabra of texto.split(' ').filter((p) => p !== '')) {
    const anchoPalabra = medidor.ancho(palabra, tamano);
    if (anchoPalabra > ancho + EPSILON && palabraLarga === null) palabraLarga = palabra;

    if (actual === '') {
      actual = palabra;
      anchoActual = anchoPalabra;
    } else if (anchoActual + espacio + anchoPalabra <= ancho + EPSILON) {
      actual += ` ${palabra}`;
      anchoActual += espacio + anchoPalabra;
    } else {
      lineas.push(actual);
      actual = palabra;
      anchoActual = anchoPalabra;
    }
  }
  if (actual !== '' || lineas.length === 0) lineas.push(actual);
  return { lineas, palabraLarga };
}

/**
 * Busca el mayor tamaño (de `tamanoMax` a `tamanoMin`, en pasos) con el que el texto, partido en líneas de `ancho`,
 * cabe en `alto`. Regresa { tamano, lineas, alto } o null si no cabe ni al tamaño mínimo. No usa el motor de PDF.
 */
function ajustarBloque(texto, { estilo = 'regular', ancho, alto, tamanoMax, tamanoMin, paso = 0.5, interlineado }) {
  for (let tamano = tamanoMax; tamano >= tamanoMin - EPSILON; tamano -= paso) {
    const { lineas, palabraLarga } = envolverTexto(texto, { estilo, tamano, ancho });
    if (palabraLarga !== null) continue;
    const altoBloque = lineas.length * tamano * interlineado;
    if (altoBloque <= alto + EPSILON) return { tamano, lineas, alto: altoBloque };
  }
  return null;
}

// ── Actividades ──────────────────────────────────────────────

const alturaLineaActividades = () => ACTIVIDADES.tamano * ACTIVIDADES.interlineado;

/** Alto que ocupan `lineas` renderizadas repartidas en `parrafos` párrafos. */
const altoActividades = (lineas, parrafos) => (
  lineas * alturaLineaActividades() + Math.max(0, parrafos - 1) * ACTIVIDADES.separacionParrafos
);

/** Máximo de líneas renderizadas que caben con `parrafos` párrafos (cada uno agrega su separación). */
function lineasMaximas(parrafos) {
  const disponible = AREA_ACTIVIDADES.alto - Math.max(0, parrafos - 1) * ACTIVIDADES.separacionParrafos;
  return Math.max(0, Math.floor((disponible + EPSILON) / alturaLineaActividades()));
}

/**
 * Mide las actividades (un párrafo por línea no vacía) a 10 pt en el ancho real del recuadro:
 * { parrafos, lineasRenderizadas, lineasMaximas, alto, altoDisponible, palabraLarga, cabe }.
 */
function medirActividades(lineasDeTexto) {
  let lineasRenderizadas = 0;
  let palabraLarga = null;
  for (const parrafo of lineasDeTexto) {
    const envuelto = envolverTexto(parrafo, { estilo: 'regular', tamano: ACTIVIDADES.tamano, ancho: AREA_ACTIVIDADES.ancho });
    lineasRenderizadas += envuelto.lineas.length;
    if (palabraLarga === null) palabraLarga = envuelto.palabraLarga;
  }
  const parrafos = lineasDeTexto.length;
  const alto = altoActividades(lineasRenderizadas, parrafos);
  return {
    parrafos,
    lineasRenderizadas,
    lineasMaximas: lineasMaximas(parrafos),
    alto,
    altoDisponible: AREA_ACTIVIDADES.alto,
    palabraLarga,
    cabe: palabraLarga === null && alto <= AREA_ACTIVIDADES.alto + EPSILON,
  };
}

module.exports = {
  anchoTexto,
  ascender,
  envolverTexto,
  ajustarBloque,
  alturaLineaActividades,
  altoActividades,
  lineasMaximas,
  medirActividades,
};
