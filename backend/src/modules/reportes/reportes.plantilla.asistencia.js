// Layout de la PÁGINA 2 del reporte: CONTROL DE ASISTENCIA (Carta vertical, misma hoja que el mensual/global).
//
// Medidas derivadas de la plantilla institucional de referencia (assets/referencia/, solo referencia: no se usa en
// ejecución), con el mismo criterio que reportes.plantilla.js: unidades en puntos (pt), origen arriba a la izquierda.
//
// El ENCABEZADO (logos IPN/ESCOM y las cuatro líneas institucionales) NO se redefine aquí: se reutiliza tal cual el de
// la página 1, porque es el mismo bloque en las dos hojas y así ambas quedan alineadas al punto. Lo que cambia es el
// título y todo lo que va debajo.
//
// La tabla tiene EXACTAMENTE 24 filas, como el formato oficial: no crece, no se reduce y no genera páginas nuevas.
//
// SOLO REPORTES MENSUALES: el reporte global conserva su única página y no lleva Control de Asistencia.

const { PAGINA, COLORES, ENCABEZADO } = require('./reportes.plantilla');

const CENTRO_X = PAGINA.ancho / 2;

const COLORES_ASISTENCIA = Object.freeze({
  // Cabecera de la tabla: fondo negro con texto blanco, como el formato.
  cabeceraFondo: '#1A1A1A',
  cabeceraTexto: '#FFFFFF',
  // Filas alternas (las pares van sombreadas en el formato).
  filaAlterna: '#D9D9D9',
  totalFondo: '#D9D9D9',
  borde: '#000000',
});

const TITULO = Object.freeze({
  texto: 'CONTROL DE ASISTENCIA',
  estilo: 'bold',
  tamano: 16.1,
  // Misma línea base que el título de la página 1: las dos hojas arrancan su contenido a la misma altura.
  baseline: 101,
  centroX: CENTRO_X,
  xMin: 56,
  xMax: 560,
});

// Campos del encabezado del formato. `etiquetaX` es donde inicia la etiqueta y `valorX` donde inicia el valor; el valor
// se recorta por ancho con las mismas utilidades de texto que la página 1.
const CAMPOS = Object.freeze({
  tamano: 9.5,
  estiloEtiqueta: 'regular',
  estiloValor: 'regular',
  // "Correspondiente al reporte mensual de actividades número: N"
  reporte: Object.freeze({
    etiqueta: 'Correspondiente al reporte mensual de actividades número:',
    x: 28,
    baseline: 122,
    anchoValor: 120,
  }),
  periodo: Object.freeze({
    etiqueta: 'Periodo del:',
    conector: 'al:',
    x: 28,
    baseline: 140,
    valorX: 92,
    anchoValor: 130,
    conectorX: 232,
    valor2X: 258,
    anchoValor2: 140,
  }),
  nombre: Object.freeze({
    etiqueta: 'Nombre del Prestador:',
    x: 28,
    baseline: 158,
    valorX: 132,
    anchoValor: 280,
  }),
  boleta: Object.freeze({
    etiqueta: 'Boleta:',
    x: 428,
    baseline: 158,
    valorX: 462,
    anchoValor: 106,
  }),
  carrera: Object.freeze({
    etiqueta: 'Carrera:',
    x: 28,
    baseline: 176,
    valorX: 132,
    anchoValor: 280,
  }),
});

// ── Tabla ────────────────────────────────────────────────────
//
// Bordes verticales en `columnas` (7 líneas: los dos extremos y los cinco cortes internos).

const TABLA = Object.freeze({
  x: 28,
  ancho: 540,
  top: 188,
  grosorBorde: 0.6,
  // Cabecera negra con encabezados de dos líneas.
  cabecera: Object.freeze({ alto: 26, tamano: 9, estilo: 'bold', interlineado: 10.5 }),
  // 24 filas de 17 pt: 408 pt en total. Ninguna de las dos cantidades es negociable (formato oficial).
  filas: Object.freeze({ cantidad: 24, alto: 17, tamano: 8.5, estilo: 'regular' }),
  // Los dos renglones de totales, debajo de la fila 24.
  totales: Object.freeze({ alto: 17, tamano: 9, estilo: 'bold' }),
  // Cortes verticales de columna, en X absoluta.
  columnas: Object.freeze([28, 58, 200, 284, 369, 428, 568]),
  // Encabezados de cada columna (dos líneas donde el formato las parte).
  encabezados: Object.freeze([
    Object.freeze({ lineas: ['No.'] }),
    Object.freeze({ lineas: ['Fecha'] }),
    Object.freeze({ lineas: ['Hora de', 'Entrada'] }),
    Object.freeze({ lineas: ['Hora de', 'Salida'] }),
    Object.freeze({ lineas: ['Horas', 'por día'] }),
    Object.freeze({ lineas: ['Firma'] }),
  ]),
  etiquetaTotalMes: 'TOTAL DE HORAS PRESTADAS POR MES',
  etiquetaTotalAcumulado: 'TOTAL DE HORAS PRESTADAS ACUMULADAS',
  // Margen interior de las celdas de texto.
  padding: 3,
});

// Índices de columna, para que ni el generador ni las pruebas usen números sueltos.
const COLUMNA = Object.freeze({ NUMERO: 0, FECHA: 1, ENTRADA: 2, SALIDA: 3, HORAS: 4, FIRMA: 5 });

/** Borde izquierdo, derecho, ancho y centro de una columna. */
function geometriaColumna(indice) {
  const x = TABLA.columnas[indice];
  const xFin = TABLA.columnas[indice + 1];
  return { x, xFin, ancho: xFin - x, centroX: (x + xFin) / 2 };
}

/** Top absoluto de la fila `i` (0 = primera fila de datos, bajo la cabecera). */
const topDeFila = (i) => TABLA.top + TABLA.cabecera.alto + i * TABLA.filas.alto;

const TOP_TOTALES = topDeFila(TABLA.filas.cantidad);
const ALTO_TABLA = TABLA.cabecera.alto + TABLA.filas.cantidad * TABLA.filas.alto + 2 * TABLA.totales.alto;

// ── Responsable directo y sello ──────────────────────────────

const RESPONSABLE = Object.freeze({
  // Línea de firma, centrada en la mitad izquierda de la hoja.
  linea: Object.freeze({ x: 120, ancho: 200, y: 706, grosor: 0.6 }),
  // Zona de la rúbrica del profesor: sobre la línea, conservando proporción (mismo criterio que la página 1).
  rubrica: Object.freeze({ ancho: 160, alto: 44, separacionLinea: 2 }),
  etiquetaTamano: 9.5,
  nombre: Object.freeze({ etiqueta: 'Nombre:', x: 74, baseline: 730, valorX: 124, anchoValor: 210 }),
  cargo: Object.freeze({ etiqueta: 'Cargo:', x: 74, baseline: 745, valorX: 124, anchoValor: 210 }),
  titulo: Object.freeze({ texto: 'Responsable Directo', estilo: 'bold', tamano: 9.5, baseline: 776, centroX: 220 }),
});

const SELLO = Object.freeze({
  // Zona reservada del sello, a la derecha y sobre su leyenda.
  zona: Object.freeze({ x: 380, y: 666, ancho: 188, alto: 98 }),
  etiqueta: Object.freeze({ texto: 'Sello del Prestatario', estilo: 'bold', tamano: 9.5, baseline: 776, centroX: 474 }),
});

const PIE = Object.freeze({ texto: 'Página 2 de 2', estilo: 'regular', tamano: 8, baseline: 786, derecha: 584.2 });

// El pie de la página 1 cambia de "Página 1 de 1" a "Página 1 de 2" cuando el documento lleva la hoja de asistencia.
const PIE_PAGINA_1 = Object.freeze({ texto: 'Página 1 de 2' });

module.exports = {
  PAGINA,
  COLORES,
  COLORES_ASISTENCIA,
  ENCABEZADO,
  TITULO,
  CAMPOS,
  TABLA,
  COLUMNA,
  geometriaColumna,
  topDeFila,
  TOP_TOTALES,
  ALTO_TABLA,
  RESPONSABLE,
  SELLO,
  PIE,
  PIE_PAGINA_1,
};
