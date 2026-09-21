// Layout del REPORTE MENSUAL DE ACTIVIDADES (una sola página, Carta vertical).
//
// Medidas tomadas de la plantilla oficial (assets/referencia/, solo referencia: no se usa en ejecución):
// posiciones de cajas y líneas, líneas base y tamaños de fuente de cada texto. Unidades en puntos (pt), origen
// arriba a la izquierda. Los rectángulos grises de la plantilla son marcadores de captura y NO se dibujan.
// La plantilla usa Lucida Sans Unicode, Arial Black y Trebuchet MS; aquí se sustituyen por Liberation Sans.
//
// "No. de Registro" se omite: la fila de Boleta se acomoda como Boleta | Porcentaje de Créditos, con esta
// última en la misma columna que "Correo electrónico".

const PAGINA = Object.freeze({ ancho: 612, alto: 792 });

const COLORES = Object.freeze({
  texto: '#000000',
  borde: '#000000',
  bordeActividades: '#CCCCCC',
  etiquetaSello: '#BFBFBF',
});

const CENTRO_X = PAGINA.ancho / 2;

const ENCABEZADO = Object.freeze({
  logoIpn: Object.freeze({ x: 40.3, y: 16.3, ancho: 44.7, alto: 66.3 }),
  // Zona del logo ESCOM (sin marco): el logo ocupa todo su ancho, centrado en vertical y con su proporción.
  logoEscom: Object.freeze({ x: 518.4, y: 15.15, ancho: 62.87, alto: 69.97 }),
  centroX: CENTRO_X,
  lineas: Object.freeze([
    Object.freeze({ texto: 'Instituto Politécnico Nacional', estilo: 'regular', tamano: 16.1, baseline: 32 }),
    Object.freeze({ texto: 'ESCUELA SUPERIOR DE CÓMPUTO', estilo: 'bold', tamano: 12, baseline: 49 }),
    Object.freeze({ texto: 'SUBDIRECCIÓN DE SERVICIOS EDUCATIVOS E INTEGRACIÓN SOCIAL', estilo: 'regular', tamano: 11, baseline: 66 }),
    Object.freeze({ texto: 'Departamento de Extensión y Apoyos Educativos.', estilo: 'regular', tamano: 11, baseline: 81 }),
  ]),
  // Zona entre los logos donde puede ir el texto del encabezado.
  xMinTexto: 92,
  xMaxTexto: 512,
});

const TITULO = Object.freeze({
  prefijo: 'REPORTE MENSUAL DE ACTIVIDADES NÚMERO:',
  // Reporte global (CU-REP-07): mismo lugar, tamaño y estilo; solo cambia el texto (sin número).
  global: 'REPORTE GLOBAL DE ACTIVIDADES',
  estilo: 'bold',
  tamano: 16.1,
  baseline: 101,
  centroX: CENTRO_X,
  xMin: 56,
  xMax: 560,
});

// La plantilla usa 13 pt; con Liberation Sans dos fechas largas no cabrían en la línea. Se usa 12 pt y, en el
// peor caso (p. ej. "1 de septiembre de 2025 al 30 de septiembre de 2025"), se reduce hasta tamanoMin.
const PERIODO = Object.freeze({
  etiqueta: 'Correspondiente al periodo mensual del:',
  etiquetaGlobal: 'Correspondiente al periodo del:', // el global abarca todo el servicio, no un mes
  conector: 'al',
  estilo: 'regular',
  tamano: 12,
  tamanoMin: 10,
  paso: 0.5,
  x: 56.4,
  xMax: 563.9,
  baseline: 128,
});

const DATOS = Object.freeze({
  caja: Object.freeze({ x: 56.68, y: 144.95, ancho: 502.55, alto: 132.09, grosor: 0.75 }),
  titulo: Object.freeze({ texto: 'Datos del Prestador o Prestadora', estilo: 'bold', tamano: 10, baseline: 159, centroX: 307.95 }),
  tamano: 10,
  tamanoMin: 8,
  paso: 0.5,
  interlineado: 1.15,
  // Borde derecho de los valores (borde de la caja menos relleno) y separación mínima entre columnas.
  derecha: 553,
  separacion: 6,
  columna1: 64,
  columna2: 232.4,
  // Alto disponible para el valor de una fila: una línea, o dos líneas solo a la fuente mínima.
  altoUnaLinea: 11.6,
  altoDosLineas: 19,
  filas: Object.freeze({
    nombre: Object.freeze({ etiqueta: 'Nombre:', x: 64, valorX: 114.4, baseline: 174, dosLineas: true }),
    carrera: Object.freeze({ etiqueta: 'Carrera:', x: 64, valorX: 114.4, baseline: 193, dosLineas: false }),
    boleta: Object.freeze({ etiqueta: 'Boleta:', x: 64, valorX: 114.4, baseline: 212, dosLineas: false }),
    creditos: Object.freeze({ etiqueta: 'Porcentaje de Créditos:', x: 232.4, valorX: 344.4, baseline: 212, dosLineas: false }),
    telefono: Object.freeze({ etiqueta: 'Teléfono Particular:', x: 64, valorX: 163.47, baseline: 231, dosLineas: false }),
    correo: Object.freeze({ etiqueta: 'Correo electrónico:', x: 232.4, valorX: 331.4, baseline: 231, dosLineas: false }),
    prestatario: Object.freeze({ etiqueta: 'Prestatario:', x: 64, valorX: 126.68, baseline: 249, dosLineas: false }),
    programa: Object.freeze({ etiqueta: 'Programa:', x: 64, valorX: 126.46, baseline: 268, dosLineas: true }),
  }),
});

// Tamaño fijo de 10 pt: no se reduce para que quepa. Si no cabe, se rechaza.
const ACTIVIDADES = Object.freeze({
  leyenda: Object.freeze({
    texto: 'Redacción en párrafos describiendo las actividades realizadas durante el periodo mensual.',
    textoGlobal: 'Redacción en párrafos describiendo las actividades realizadas durante el periodo.',
    estilo: 'boldItalic',
    // La plantilla usa 11.7 pt (Trebuchet); Liberation Sans Bold Italic es más ancha y a 11.7 pt saldría del recuadro.
    tamano: 11,
    x: 58.4,
    baseline: 304,
  }),
  caja: Object.freeze({ x: 55.1, y: 311.39, ancho: 502.6, alto: 314.21, grosor: 1, rellenoX: 12, rellenoY: 8 }),
  tamano: 10,
  interlineado: 1.3,
  separacionParrafos: 5,
});

// Área del texto de actividades (dentro de la caja, sin relleno lateral ni vertical).
const AREA_ACTIVIDADES = Object.freeze({
  x: ACTIVIDADES.caja.x + ACTIVIDADES.caja.rellenoX,
  y: ACTIVIDADES.caja.y + ACTIVIDADES.caja.rellenoY,
  ancho: ACTIVIDADES.caja.ancho - 2 * ACTIVIDADES.caja.rellenoX,
  alto: ACTIVIDADES.caja.alto - 2 * ACTIVIDADES.caja.rellenoY,
});

const FIRMAS = Object.freeze({
  grosorLinea: 0.5,
  yLinea: 689.5,
  etiquetaBaseline: 701,
  etiquetaTamano: 10,
  // Zona de la rúbrica: sobre la línea, hasta 160 x 50 pt, conservando proporción.
  rubrica: Object.freeze({ ancho: 160, alto: 50, separacionLinea: 2 }),
  nombreTamano: 10,
  nombreTamanoMin: 8,
  nombreInterlineado: 1.15,
  // El nombre va debajo de la etiqueta, dentro del campo de la plantilla. El fin del campo de Autorizó no baja con la
  // línea: "Responsable Directo" (baseline 766) sigue en su sitio y es su tope inferior.
  nombreTop: 705.5,
  elaboro: Object.freeze({ etiqueta: 'Elaboró', xIzq: 56.6, xDer: 218.1, campo: Object.freeze({ x: 55.05, ancho: 161.64, yFin: 733.5 }) }),
  autorizo: Object.freeze({ etiqueta: 'Autorizó', xIzq: 232.15, xDer: 393.67, campo: Object.freeze({ x: 231.05, ancho: 163.64, yFin: 756.5 }) }),
  responsable: Object.freeze({ texto: 'Responsable Directo', estilo: 'bold', tamano: 8, baseline: 766, centroX: 312.9 }),
});

const SELLO = Object.freeze({
  // Área reservada del sello (el rectángulo de la plantilla no se dibuja; la leyenda y la zona se conservan).
  area: Object.freeze({ x: 407.75, y: 621.1, ancho: 155.9, alto: 136.85 }),
  etiqueta: Object.freeze({ texto: 'Sello del Prestatario', estilo: 'regular', tamano: 11, baseline: 755, centroX: 485.7 }),
  // Zona del sello: dentro del área, bajo el borde del recuadro de actividades y sobre la etiqueta.
  zona: Object.freeze({ x: 413.75, y: 630, ancho: 143.9, alto: 112 }),
});

const PIE = Object.freeze({ texto: 'Página 1 de 1', estilo: 'regular', tamano: 8, baseline: 786, derecha: 584.2 });

module.exports = {
  PAGINA,
  COLORES,
  ENCABEZADO,
  TITULO,
  PERIODO,
  DATOS,
  ACTIVIDADES,
  AREA_ACTIVIDADES,
  FIRMAS,
  SELLO,
  PIE,
};
