// Generador del PDF del REPORTE MENSUAL DE ACTIVIDADES (una sola página, Carta vertical, layout de la plantilla oficial).
//
//   construirDatosPdf(resultado, actividades)   → datos ya validados con las utilidades de texto (Fase 2)
//   planificarPagina(datos, imagenes)           → lista de elementos con su posición (pura, sin motor de PDF)
//   generarPdfReporteMensual(datos, opciones)   → Buffer del PDF
//
// Las firmas son opcionales y definen la etapa: solo rúbrica del alumno; alumno + profesor; alumno + profesor + sello.
// Nada se reduce, recorta ni pagina en silencio: si algo no cabe se lanza un error explícito.

const { PDFDocument } = require('pdf-lib');
const { PRESTATARIO, TEXTO_RESPONSABLE_DIRECTO } = require('./reportes.shared');
const { FAMILIA_FUENTE, leerFuentesVerificadas, rutaFuente } = require('./reportes.fuentes');
const { CODIGOS_ERROR: CODIGOS_TEXTO, validarTextoLinea, validarActividades } = require('./reportes.texto');
const { leerLogo } = require('./reportes.assets');
const {
  PAGINA, COLORES, ENCABEZADO, TITULO, PERIODO, DATOS, ACTIVIDADES, AREA_ACTIVIDADES, FIRMAS, SELLO, PIE,
} = require('./reportes.plantilla');
const ASIS = require('./reportes.plantilla.asistencia');
const medidas = require('./reportes.medidas');

// Páginas del reporte nuevo: 1) actividades, 2) control de asistencia. Los PDF emitidos ANTES de esta hoja tienen una
// sola página y siguen siendo válidos para firmar y sellar (ver paginaDeFirmas / paginaDeAsistencia).
const PAGINAS_DEL_REPORTE = 2;
const PAGINA_REPORTE = 0;
const PAGINA_ASISTENCIA = 1;

const CODIGOS_ERROR = Object.freeze({
  REPORTE_NO_GENERABLE: 'REPORTE_NO_GENERABLE',
  DATO_REQUERIDO: 'DATO_REQUERIDO',
  DATOS_NO_IMPRIMIBLES: 'DATOS_NO_IMPRIMIBLES',
  DATO_EXCEDE_ANCHO: 'DATO_EXCEDE_ANCHO',
  ACTIVIDADES_EXCEDEN_ESPACIO: 'ACTIVIDADES_EXCEDEN_ESPACIO',
  ACTIVIDADES_PALABRA_DEMASIADO_LARGA: 'ACTIVIDADES_PALABRA_DEMASIADO_LARGA',
  IMAGEN_INVALIDA: 'IMAGEN_INVALIDA',
  PDF_PAGINAS_INVALIDAS: 'PDF_PAGINAS_INVALIDAS',
  PDF_ALMACENADO_INVALIDO: 'PDF_ALMACENADO_INVALIDO',
});

function crearError(mensaje, code, status = 422, extra = {}) {
  return Object.assign(new Error(mensaje), { status, code, ...extra });
}

// ── Datos ────────────────────────────────────────────────────

// Texto de una línea que se imprimirá: requerido y con glifos en la fuente (utilidades de la Fase 2).
function textoImpreso(valor, campo, etiqueta) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    throw crearError(`${etiqueta} es obligatorio para el reporte.`, CODIGOS_ERROR.DATO_REQUERIDO, 422, { campo });
  }
  try {
    return validarTextoLinea(String(valor), etiqueta);
  } catch (err) {
    if (err.code === CODIGOS_TEXTO.CARACTERES_NO_SOPORTADOS) {
      throw crearError(err.message, CODIGOS_ERROR.DATOS_NO_IMPRIMIBLES, 422, { campo, caracteres: err.caracteres });
    }
    throw crearError(err.message, CODIGOS_ERROR.DATO_REQUERIDO, 422, { campo });
  }
}

/**
 * Datos del PDF a partir del resultado de prepararReporteMensual y del texto de actividades del alumno.
 * Valida cada texto que se imprime; un dato incompatible produce un error explícito (con `campo`).
 * Las actividades se validan con validarActividades (sin límite de caracteres); el espacio lo controla el generador.
 */
function construirDatosPdf(resultado, actividades) {
  if (!resultado?.reporte || resultado.puedeGenerar !== true) {
    const motivos = (resultado?.motivosBloqueo ?? []).map((m) => m.codigo);
    throw crearError('El reporte todavía no se puede generar.', CODIGOS_ERROR.REPORTE_NO_GENERABLE, 409, { motivos });
  }
  const { alumno, profesor, servicio, reporte } = resultado;

  // El reporte global (CU-REP-07) usa la misma plantilla y no lleva número.
  const global = reporte.tipo === 'global';
  const numero = global ? null : reporte.numero;
  if (!global && (!Number.isInteger(numero) || numero < 1)) {
    throw crearError('El número de reporte no es válido.', CODIGOS_ERROR.DATO_REQUERIDO, 422, { campo: 'numeroReporte' });
  }

  return {
    tipoReporte: global ? 'global' : 'mensual',
    numeroReporte: numero,
    periodo: {
      inicioTexto: textoImpreso(reporte.periodo?.inicioTexto, 'periodo.inicio', 'La fecha de inicio del periodo'),
      finTexto: textoImpreso(reporte.periodo?.finTexto, 'periodo.fin', 'La fecha de fin del periodo'),
    },
    alumno: {
      nombreCompleto: textoImpreso(alumno?.nombreCompleto, 'alumno.nombreCompleto', 'El nombre del alumno'),
      carreraNombre: textoImpreso(alumno?.carreraNombre, 'alumno.carreraNombre', 'La carrera'),
      boleta: textoImpreso(alumno?.boleta, 'alumno.boleta', 'La boleta'),
      creditosTexto: textoImpreso(alumno?.creditosTexto, 'alumno.creditosTexto', 'El porcentaje de créditos'),
      telefono: textoImpreso(alumno?.telefono, 'alumno.telefono', 'El teléfono'),
      correoPersonal: textoImpreso(alumno?.correoPersonal, 'alumno.correoPersonal', 'El correo personal'),
    },
    prestatario: PRESTATARIO,
    programa: textoImpreso(servicio?.programa, 'servicio.programa', 'El programa'),
    profesor: {
      nombreCompleto: textoImpreso(profesor?.nombreCompleto, 'profesor.nombreCompleto', 'El nombre del profesor responsable'),
    },
    actividades: validarActividades(actividades),
    // Página 2 (Control de asistencia): SOLO para reportes mensuales. El global conserva su única página.
    // Ya viene armada por reportes.asistencia.js con las MISMAS bitácoras y los mismos totales que reconoce el
    // reporte: aquí no se recalcula ni se vuelve a consultar nada.
    asistencia: global ? null : (resultado.asistencia ?? null),
  };
}

// ── Imágenes (rúbricas y sello) ──────────────────────────────

const esPng = (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
const esJpeg = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

// Límites por omisión de una imagen: evitan bombas de descompresión y dimensiones absurdas.
// Quien recibe archivos de usuarios (rúbricas) puede pedir límites más estrictos.
const MAX_LADO_IMAGEN = 8000;
const MAX_PIXELES_IMAGEN = 25_000_000;

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// pdf-lib se queda en un ciclo infinito con algunos PNG truncados: la estructura se recorre antes con límites propios.
function dimensionesPngValidas(data) {
  let posicion = 8;
  let ancho = 0;
  let alto = 0;
  let hayDatos = false;
  let cerrado = false;
  while (posicion + 12 <= data.length) {
    const largo = data.readUInt32BE(posicion);
    const tipo = data.toString('latin1', posicion + 4, posicion + 8);
    const fin = posicion + 12 + largo;
    if (fin > data.length) return null;
    if (data.readUInt32BE(fin - 4) !== crc32(data.subarray(posicion + 4, fin - 4))) return null;
    if (posicion === 8) {
      if (tipo !== 'IHDR' || largo !== 13) return null;
      ancho = data.readUInt32BE(posicion + 8);
      alto = data.readUInt32BE(posicion + 12);
    } else if (tipo === 'IDAT') {
      hayDatos = true;
    } else if (tipo === 'IEND') {
      cerrado = true;
      break;
    }
    posicion = fin;
  }
  return cerrado && hayDatos && ancho > 0 && alto > 0 ? { ancho, alto } : null;
}

// Recorre los marcadores hasta el inicio del escaneo; exige encontrar las dimensiones (SOF) y el fin de imagen (EOI).
function dimensionesJpegValidas(data) {
  let posicion = 2;
  let dimensiones = null;
  while (posicion + 4 <= data.length) {
    if (data[posicion] !== 0xff) return null;
    const marcador = data[posicion + 1];
    if (marcador === 0xff) { posicion += 1; continue; }
    const largo = data.readUInt16BE(posicion + 2);
    if (largo < 2 || posicion + 2 + largo > data.length) return null;
    const esSof = marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador);
    if (esSof && largo >= 8) dimensiones = { alto: data.readUInt16BE(posicion + 5), ancho: data.readUInt16BE(posicion + 7) };
    if (marcador === 0xda) break;
    posicion += 2 + largo;
  }
  let ultimo = data.length - 1;
  while (ultimo > 0 && data[ultimo] === 0x00) ultimo -= 1;
  const cerrado = data[ultimo] === 0xd9 && data[ultimo - 1] === 0xff;
  return dimensiones && cerrado && dimensiones.ancho > 0 && dimensiones.alto > 0 ? dimensiones : null;
}

/**
 * Valida y decodifica una imagen PNG o JPEG de verdad: primero la estructura con límites propios y luego con pdf-lib
 * (el motor de PDF acepta bytes corruptos sin avisar). Regresa { data, format, ancho, alto } (píxeles) o null si no se dio imagen.
 * `limites` ({ maxLado, maxPixeles }) permite endurecer los topes de dimensiones; se revisan antes de decodificar.
 */
async function prepararImagen(imagen, etiqueta, { maxLado = MAX_LADO_IMAGEN, maxPixeles = MAX_PIXELES_IMAGEN } = {}) {
  if (imagen === null || imagen === undefined) return null;
  const invalida = (mensaje) => crearError(`${etiqueta} ${mensaje}`, CODIGOS_ERROR.IMAGEN_INVALIDA, 422);
  if (!(imagen instanceof Uint8Array)) throw invalida('debe ser un archivo de imagen.');
  const data = Buffer.from(imagen);
  const formato = esPng(data) ? 'png' : esJpeg(data) ? 'jpg' : null;
  if (!formato) throw invalida('debe ser PNG o JPG.');

  const dimensiones = formato === 'png' ? dimensionesPngValidas(data) : dimensionesJpegValidas(data);
  if (!dimensiones) throw invalida('está dañada o no es una imagen válida.');
  if (Math.max(dimensiones.ancho, dimensiones.alto) > maxLado || dimensiones.ancho * dimensiones.alto > maxPixeles) {
    throw invalida('tiene dimensiones demasiado grandes.');
  }

  try {
    // pdf-lib lee el ArrayBuffer completo: un Buffer pequeño de Node comparte el "pool" y fallaría; se pasa una copia propia.
    const bytes = new Uint8Array(data);
    const documento = await PDFDocument.create();
    const decodificada = formato === 'png' ? await documento.embedPng(bytes) : await documento.embedJpg(bytes);
    return { data, format: formato, ancho: decodificada.width, alto: decodificada.height };
  } catch {
    throw invalida('está dañada o no es una imagen válida.');
  }
}

// Mayor tamaño que cabe en la zona conservando proporción.
function ajustarImagen(imagen, zona) {
  const escala = Math.min(zona.ancho / imagen.ancho, zona.alto / imagen.alto);
  return { ancho: imagen.ancho * escala, alto: imagen.alto * escala };
}

// ── Planificación del layout (pura) ──────────────────────────

const topDe = (baseline, tamano) => baseline - medidas.ascender() * tamano;

// Elemento de texto en una línea. Solo uno de x / centroX / derecha define la posición horizontal.
function texto({ texto: contenido, estilo = 'regular', tamano, baseline, x, centroX, derecha, color = COLORES.texto }) {
  const ancho = medidas.anchoTexto(contenido, estilo, tamano);
  const base = { tipo: 'texto', texto: contenido, estilo, tamano, color, top: topDe(baseline, tamano), baseline };
  if (centroX !== undefined) return { ...base, ancho: ancho + 4, left: centroX - (ancho + 4) / 2, alineacion: 'center' };
  if (derecha !== undefined) return { ...base, ancho: ancho + 4, left: derecha - ancho - 4, alineacion: 'right' };
  return { ...base, left: x, alineacion: 'left', anchoMedido: ancho };
}

function exigirAncho(contenido, estilo, tamano, anchoMax, campo, etiqueta) {
  if (medidas.anchoTexto(contenido, estilo, tamano) > anchoMax) {
    throw crearError(`${etiqueta} es demasiado largo para imprimirse en el reporte.`, CODIGOS_ERROR.DATO_EXCEDE_ANCHO, 422, { campo });
  }
}

// Líneas de un valor de la tabla de datos, centradas verticalmente sobre la línea base de su fila.
function lineasDeValor(valor, fila, campo, etiqueta, anchoDisponible) {
  const ajuste = medidas.ajustarBloque(valor, {
    ancho: anchoDisponible,
    alto: fila.dosLineas ? DATOS.altoDosLineas : DATOS.altoUnaLinea,
    tamanoMax: DATOS.tamano,
    tamanoMin: DATOS.tamanoMin,
    paso: DATOS.paso,
    interlineado: DATOS.interlineado,
  });
  if (!ajuste) throw crearError(`${etiqueta} es demasiado largo para imprimirse en el reporte.`, CODIGOS_ERROR.DATO_EXCEDE_ANCHO, 422, { campo });

  const alturaLinea = ajuste.tamano * DATOS.interlineado;
  const primera = fila.baseline - ((ajuste.lineas.length - 1) * alturaLinea) / 2;
  return ajuste.lineas.map((linea, i) => texto({ texto: linea, tamano: ajuste.tamano, baseline: primera + i * alturaLinea, x: fila.valorX }));
}

function filasDeDatos(datos) {
  const f = DATOS.filas;
  const alLimite = (fila, limite) => limite - fila.valorX;
  const izquierda = DATOS.columna2 - DATOS.separacion;
  const valores = [
    [f.nombre, datos.alumno.nombreCompleto, 'alumno.nombreCompleto', 'El nombre del alumno', alLimite(f.nombre, DATOS.derecha)],
    [f.carrera, datos.alumno.carreraNombre, 'alumno.carreraNombre', 'La carrera', alLimite(f.carrera, DATOS.derecha)],
    [f.boleta, datos.alumno.boleta, 'alumno.boleta', 'La boleta', alLimite(f.boleta, izquierda)],
    [f.creditos, datos.alumno.creditosTexto, 'alumno.creditosTexto', 'El porcentaje de créditos', alLimite(f.creditos, DATOS.derecha)],
    [f.telefono, datos.alumno.telefono, 'alumno.telefono', 'El teléfono', alLimite(f.telefono, izquierda)],
    [f.correo, datos.alumno.correoPersonal, 'alumno.correoPersonal', 'El correo personal', alLimite(f.correo, DATOS.derecha)],
    [f.prestatario, datos.prestatario, 'prestatario', 'El prestatario', alLimite(f.prestatario, DATOS.derecha)],
    [f.programa, datos.programa, 'servicio.programa', 'El programa', alLimite(f.programa, DATOS.derecha)],
  ];
  return valores.flatMap(([fila, valor, campo, etiqueta, ancho]) => [
    texto({ texto: fila.etiqueta, tamano: DATOS.tamano, baseline: fila.baseline, x: fila.x }),
    ...lineasDeValor(valor, fila, campo, etiqueta, ancho),
  ]);
}

// Nombre bajo "Elaboró" / "Autorizó": centrado en el campo de la plantilla, de arriba abajo.
function nombreDeFirma(nombre, bloque, campo, etiqueta) {
  const ajuste = medidas.ajustarBloque(nombre, {
    ancho: bloque.campo.ancho - 4,
    alto: bloque.campo.yFin - FIRMAS.nombreTop,
    tamanoMax: FIRMAS.nombreTamano,
    tamanoMin: FIRMAS.nombreTamanoMin,
    paso: DATOS.paso,
    interlineado: FIRMAS.nombreInterlineado,
  });
  if (!ajuste) throw crearError(`${etiqueta} es demasiado largo para imprimirse en el reporte.`, CODIGOS_ERROR.DATO_EXCEDE_ANCHO, 422, { campo });

  const alturaLinea = ajuste.tamano * FIRMAS.nombreInterlineado;
  const centroX = bloque.campo.x + bloque.campo.ancho / 2;
  return ajuste.lineas.map((linea, i) => texto({
    texto: linea,
    tamano: ajuste.tamano,
    baseline: FIRMAS.nombreTop + medidas.ascender() * ajuste.tamano + i * alturaLinea,
    centroX,
  }));
}

// Sello: dentro de su zona reservada (SELLO.zona), centrado y conservando proporción. La usan el generador y el sellado
// de un PDF ya firmado (CU-REP-06).
function ubicarSello(imagen) {
  const { ancho, alto } = ajustarImagen(imagen, SELLO.zona);
  return { left: SELLO.zona.x + (SELLO.zona.ancho - ancho) / 2, top: SELLO.zona.y + (SELLO.zona.alto - alto) / 2, ancho, alto };
}

// Zona de la rúbrica de un bloque de firma: centrada en el bloque, sobre la línea, conservando proporción.
// La comparten el generador y el sellado de la firma del profesor sobre un PDF ya almacenado (una sola fuente de coordenadas).
function ubicarRubrica(bloque, imagen) {
  const centroX = (bloque.xIzq + bloque.xDer) / 2;
  const { ancho, alto } = ajustarImagen(imagen, FIRMAS.rubrica);
  const zonaBase = FIRMAS.yLinea - FIRMAS.rubrica.separacionLinea;
  return { left: centroX - ancho / 2, top: zonaBase - alto, ancho, alto };
}

function firma(bloque, nombre, campo, etiqueta, imagen) {
  const centroX = (bloque.xIzq + bloque.xDer) / 2;
  const elementos = [
    { tipo: 'linea', x: bloque.xIzq, y: FIRMAS.yLinea, ancho: bloque.xDer - bloque.xIzq, alto: FIRMAS.grosorLinea, color: COLORES.borde },
    texto({ texto: bloque.etiqueta, tamano: FIRMAS.etiquetaTamano, baseline: FIRMAS.etiquetaBaseline, centroX }),
    ...nombreDeFirma(nombre, bloque, campo, etiqueta),
  ];
  if (imagen) elementos.push({ tipo: 'imagen', imagen, ...ubicarRubrica(bloque, imagen) });
  return elementos;
}

/**
 * Elementos de la página con su posición absoluta (pt, origen arriba a la izquierda), en orden de dibujo.
 * `imagenes`: { alumno, profesor, sello } ya preparadas con prepararImagen (o null).
 */
function planificarPagina(datos, imagenes = {}, { llevaAsistencia = false } = {}) {
  const elementos = [];
  const rect = (caja, color, grosor = caja.grosor) => ({
    tipo: 'rect', left: caja.x, top: caja.y, ancho: caja.ancho, alto: caja.alto, grosor, color,
  });

  // Cajas
  elementos.push(rect(ACTIVIDADES.caja, COLORES.bordeActividades));
  elementos.push(rect(DATOS.caja, COLORES.borde));

  // Logos: IPN según la plantilla; ESCOM a todo el ancho de su zona, centrado en vertical. Siempre conservan proporción.
  const ipn = leerLogo('ipn');
  const escom = leerLogo('escom');
  const ajusteIpn = ajustarImagen(ipn, ENCABEZADO.logoIpn);
  elementos.push({
    tipo: 'imagen', imagen: ipn, ancho: ajusteIpn.ancho, alto: ajusteIpn.alto,
    left: ENCABEZADO.logoIpn.x + (ENCABEZADO.logoIpn.ancho - ajusteIpn.ancho) / 2,
    top: ENCABEZADO.logoIpn.y + (ENCABEZADO.logoIpn.alto - ajusteIpn.alto) / 2,
  });
  const zonaEscom = ENCABEZADO.logoEscom;
  const ajusteEscom = ajustarImagen(escom, zonaEscom);
  elementos.push({
    tipo: 'imagen', imagen: escom, ancho: ajusteEscom.ancho, alto: ajusteEscom.alto,
    left: zonaEscom.x + (zonaEscom.ancho - ajusteEscom.ancho) / 2,
    top: zonaEscom.y + (zonaEscom.alto - ajusteEscom.alto) / 2,
  });

  // Encabezado y título
  for (const linea of ENCABEZADO.lineas) {
    elementos.push(texto({ ...linea, centroX: ENCABEZADO.centroX }));
    exigirAncho(linea.texto, linea.estilo, linea.tamano, ENCABEZADO.xMaxTexto - ENCABEZADO.xMinTexto, 'encabezado', 'El encabezado');
  }
  const global = datos.tipoReporte === 'global';
  const titulo = global ? TITULO.global : `${TITULO.prefijo} ${datos.numeroReporte}`;
  exigirAncho(titulo, TITULO.estilo, TITULO.tamano, TITULO.xMax - TITULO.xMin, 'numeroReporte', 'El título del reporte');
  elementos.push(texto({ texto: titulo, estilo: TITULO.estilo, tamano: TITULO.tamano, baseline: TITULO.baseline, centroX: TITULO.centroX }));

  const periodo = `${global ? PERIODO.etiquetaGlobal : PERIODO.etiqueta} ${datos.periodo.inicioTexto} ${PERIODO.conector} ${datos.periodo.finTexto}`;
  const anchoPeriodo = PERIODO.xMax - PERIODO.x;
  let tamanoPeriodo = PERIODO.tamano;
  while (tamanoPeriodo > PERIODO.tamanoMin && medidas.anchoTexto(periodo, PERIODO.estilo, tamanoPeriodo) > anchoPeriodo) tamanoPeriodo -= PERIODO.paso;
  exigirAncho(periodo, PERIODO.estilo, tamanoPeriodo, anchoPeriodo, 'periodo', 'El periodo');
  elementos.push(texto({ texto: periodo, estilo: PERIODO.estilo, tamano: tamanoPeriodo, baseline: PERIODO.baseline, x: PERIODO.x }));

  // Datos del prestador
  elementos.push(texto({ ...DATOS.titulo, centroX: DATOS.titulo.centroX }));
  elementos.push(...filasDeDatos(datos));

  // Actividades
  elementos.push(texto({
    texto: global ? ACTIVIDADES.leyenda.textoGlobal : ACTIVIDADES.leyenda.texto,
    estilo: ACTIVIDADES.leyenda.estilo,
    tamano: ACTIVIDADES.leyenda.tamano,
    baseline: ACTIVIDADES.leyenda.baseline,
    x: ACTIVIDADES.leyenda.x,
  }));
  elementos.push({ tipo: 'actividades', parrafos: datos.actividades.lineas, ...AREA_ACTIVIDADES });

  // Firmas: Elaboró = alumno, Autorizó = profesor responsable
  elementos.push(...firma(FIRMAS.elaboro, datos.alumno.nombreCompleto, 'alumno.nombreCompleto', 'El nombre del alumno', imagenes.alumno));
  elementos.push(...firma(FIRMAS.autorizo, datos.profesor.nombreCompleto, 'profesor.nombreCompleto', 'El nombre del profesor responsable', imagenes.profesor));
  elementos.push(texto({ ...FIRMAS.responsable, texto: TEXTO_RESPONSABLE_DIRECTO }));

  // Sello: sin rectángulo; solo la imagen (si hay) dentro de su zona reservada y la leyenda
  if (imagenes.sello) elementos.push({ tipo: 'imagen', imagen: imagenes.sello, ...ubicarSello(imagenes.sello) });
  elementos.push(texto({ ...SELLO.etiqueta, centroX: SELLO.etiqueta.centroX, color: COLORES.etiquetaSello }));

  // Pie: "Página 1 de 2" solo cuando el documento lleva la hoja de Control de Asistencia (mensual). El global
  // conserva su "Página 1 de 1" de siempre.
  elementos.push(texto({ ...PIE, texto: llevaAsistencia ? ASIS.PIE_PAGINA_1.texto : PIE.texto, derecha: PIE.derecha }));
  return elementos;
}

// ── Página 2: CONTROL DE ASISTENCIA ──────────────────────────
//
// Mismo enfoque que la página 1: se planifica una lista de elementos con posición absoluta y se renderiza con el mismo
// motor, las mismas fuentes y las mismas utilidades de medida. La tabla tiene SIEMPRE 24 filas.

/** Texto centrado dentro de una celda, recortando por ancho si hiciera falta (nunca se desborda en silencio). */
function textoEnCelda(contenido, { centroX, ancho, baseline, tamano, estilo = 'regular', color = COLORES.texto }) {
  if (contenido === '' || contenido === null || contenido === undefined) return [];
  let usado = tamano;
  while (usado > 5 && medidas.anchoTexto(String(contenido), estilo, usado) > ancho) usado -= 0.25;
  return [texto({ texto: String(contenido), estilo, tamano: usado, baseline, centroX, color })];
}

/** Rúbrica del profesor dentro de una celda de la tabla, centrada y conservando proporción. */
function ubicarRubricaEnCelda(celda, imagen) {
  const zona = { ancho: celda.ancho - 4, alto: ASIS.TABLA.filas.alto - 2 };
  const { ancho, alto } = ajustarImagen(imagen, zona);
  return {
    left: celda.x + (celda.ancho - ancho) / 2,
    top: celda.top + (ASIS.TABLA.filas.alto - alto) / 2,
    ancho,
    alto,
  };
}

/** Rúbrica del profesor sobre la línea de "Responsable Directo" de la página 2. */
function ubicarRubricaResponsable(imagen) {
  const { linea, rubrica } = ASIS.RESPONSABLE;
  const { ancho, alto } = ajustarImagen(imagen, rubrica);
  return {
    left: linea.x + (linea.ancho - ancho) / 2,
    top: linea.y - rubrica.separacionLinea - alto,
    ancho,
    alto,
  };
}

/** Sello institucional dentro de su zona reservada de la página 2. */
function ubicarSelloAsistencia(imagen) {
  const { zona } = ASIS.SELLO;
  const { ancho, alto } = ajustarImagen(imagen, zona);
  return { left: zona.x + (zona.ancho - ancho) / 2, top: zona.y + (zona.alto - alto) / 2, ancho, alto };
}

/** Encabezado del formato: etiqueta fija + valor, con el valor recortado a su ancho disponible. */
function campoDeAsistencia(campo, valor, { valorX = null, anchoValor = null } = {}) {
  const c = ASIS.CAMPOS;
  const elementos = [texto({ texto: campo.etiqueta, estilo: c.estiloEtiqueta, tamano: c.tamano, baseline: campo.baseline, x: campo.x })];
  if (valor === null || valor === undefined || valor === '') return elementos;

  const x = valorX ?? campo.valorX;
  const ancho = anchoValor ?? campo.anchoValor;
  let tamano = c.tamano;
  while (tamano > 6 && medidas.anchoTexto(String(valor), c.estiloValor, tamano) > ancho) tamano -= 0.25;
  elementos.push(texto({ texto: String(valor), estilo: c.estiloValor, tamano, baseline: campo.baseline, x }));
  return elementos;
}

/**
 * Elementos de la página 2. `imagenes.profesor` se dibuja en la celda de Firma de CADA registro usado y sobre la línea
 * del responsable directo; `imagenes.sello`, en la zona de sello. Son la MISMA imagen del flujo actual, repetida.
 */
function planificarPaginaAsistencia(datos, imagenes = {}) {
  const elementos = [];
  const asistencia = datos.asistencia;
  const T = ASIS.TABLA;
  const C = ASIS.COLORES_ASISTENCIA;

  // Logos y encabezado: EXACTAMENTE los de la página 1, para que las dos hojas queden alineadas.
  const ipn = leerLogo('ipn');
  const escom = leerLogo('escom');
  const ajusteIpn = ajustarImagen(ipn, ENCABEZADO.logoIpn);
  elementos.push({
    tipo: 'imagen', imagen: ipn, ancho: ajusteIpn.ancho, alto: ajusteIpn.alto,
    left: ENCABEZADO.logoIpn.x + (ENCABEZADO.logoIpn.ancho - ajusteIpn.ancho) / 2,
    top: ENCABEZADO.logoIpn.y + (ENCABEZADO.logoIpn.alto - ajusteIpn.alto) / 2,
  });
  const ajusteEscom = ajustarImagen(escom, ENCABEZADO.logoEscom);
  elementos.push({
    tipo: 'imagen', imagen: escom, ancho: ajusteEscom.ancho, alto: ajusteEscom.alto,
    left: ENCABEZADO.logoEscom.x + (ENCABEZADO.logoEscom.ancho - ajusteEscom.ancho) / 2,
    top: ENCABEZADO.logoEscom.y + (ENCABEZADO.logoEscom.alto - ajusteEscom.alto) / 2,
  });
  for (const linea of ENCABEZADO.lineas) elementos.push(texto({ ...linea, centroX: ENCABEZADO.centroX }));

  // Título del formato
  elementos.push(texto({
    texto: ASIS.TITULO.texto, estilo: ASIS.TITULO.estilo, tamano: ASIS.TITULO.tamano,
    baseline: ASIS.TITULO.baseline, centroX: ASIS.TITULO.centroX,
  }));

  // Campos del encabezado — los MISMOS valores que imprime la página 1.
  const c = ASIS.CAMPOS;
  const anchoEtiquetaReporte = medidas.anchoTexto(c.reporte.etiqueta, c.estiloEtiqueta, c.tamano);
  elementos.push(...campoDeAsistencia(c.reporte, datos.numeroReporte, {
    valorX: c.reporte.x + anchoEtiquetaReporte + 4,
  }));

  elementos.push(...campoDeAsistencia(c.periodo, datos.periodo.inicioTexto));
  elementos.push(texto({ texto: c.periodo.conector, estilo: c.estiloEtiqueta, tamano: c.tamano, baseline: c.periodo.baseline, x: c.periodo.conectorX }));
  elementos.push(...campoDeAsistencia(
    { ...c.periodo, etiqueta: '' },
    datos.periodo.finTexto,
    { valorX: c.periodo.valor2X, anchoValor: c.periodo.anchoValor2 },
  ).slice(1));

  elementos.push(...campoDeAsistencia(c.nombre, datos.alumno.nombreCompleto));
  elementos.push(...campoDeAsistencia(c.boleta, datos.alumno.boleta));
  elementos.push(...campoDeAsistencia(c.carrera, datos.alumno.carreraNombre));

  // ── Tabla ──
  const filas = asistencia?.filas ?? [];

  // Cabecera negra
  elementos.push({ tipo: 'relleno', left: T.x, top: T.top, ancho: T.ancho, alto: T.cabecera.alto, color: C.cabeceraFondo });
  T.encabezados.forEach((enc, i) => {
    const col = ASIS.geometriaColumna(i);
    const alturaTexto = enc.lineas.length * T.cabecera.interlineado;
    const primeraBaseline = T.top + (T.cabecera.alto - alturaTexto) / 2 + medidas.ascender() * T.cabecera.tamano;
    enc.lineas.forEach((linea, j) => {
      elementos.push(texto({
        texto: linea, estilo: T.cabecera.estilo, tamano: T.cabecera.tamano,
        baseline: primeraBaseline + j * T.cabecera.interlineado,
        centroX: col.centroX, color: C.cabeceraTexto,
      }));
    });
  });

  // Filas sombreadas alternas (las pares del formato)
  filas.forEach((fila, i) => {
    if (i % 2 === 1) {
      elementos.push({ tipo: 'relleno', left: T.x, top: ASIS.topDeFila(i), ancho: T.ancho, alto: T.filas.alto, color: C.filaAlterna });
    }
  });

  // Totales: el de acumuladas va sombreado, como en el formato
  elementos.push({ tipo: 'relleno', left: T.x, top: ASIS.TOP_TOTALES + T.totales.alto, ancho: ASIS.geometriaColumna(ASIS.COLUMNA.HORAS).x - T.x, alto: T.totales.alto, color: C.totalFondo });

  // Rejilla: horizontales y verticales
  const linea = (x, y, ancho, alto) => ({ tipo: 'linea', x, y, ancho, alto, color: C.borde });
  const altoTabla = ASIS.ALTO_TABLA;
  for (let i = 0; i <= T.filas.cantidad; i += 1) {
    elementos.push(linea(T.x, ASIS.topDeFila(i), T.ancho, T.grosorBorde));
  }
  elementos.push(linea(T.x, T.top, T.ancho, T.grosorBorde));
  elementos.push(linea(T.x, ASIS.TOP_TOTALES + T.totales.alto, T.ancho, T.grosorBorde));
  elementos.push(linea(T.x, ASIS.TOP_TOTALES + 2 * T.totales.alto, T.ancho, T.grosorBorde));
  // Verticales: todas cruzan la cabecera y las 24 filas. En los dos renglones de totales el formato deja correr la
  // etiqueta, así que ahí solo quedan el borde exterior y los dos cortes de la celda del valor.
  const altoRejilla = ASIS.TOP_TOTALES - T.top;
  for (const x of T.columnas) {
    elementos.push({ tipo: 'linea', x, y: T.top, ancho: T.grosorBorde, alto: altoRejilla, color: C.borde });
  }
  const altoTotales = altoTabla - altoRejilla;
  const columnaHoras = ASIS.geometriaColumna(ASIS.COLUMNA.HORAS);
  for (const x of [T.x, columnaHoras.x, columnaHoras.xFin, T.x + T.ancho]) {
    elementos.push({ tipo: 'linea', x, y: ASIS.TOP_TOTALES, ancho: T.grosorBorde, alto: altoTotales, color: C.borde });
  }

  // Contenido de cada fila
  const baselineDeFila = (i) => ASIS.topDeFila(i) + (T.filas.alto + medidas.ascender() * T.filas.tamano) / 2 - 1;
  filas.forEach((fila, i) => {
    const celdas = [
      [ASIS.COLUMNA.NUMERO, String(fila.numero)],
      [ASIS.COLUMNA.FECHA, fila.fecha],
      [ASIS.COLUMNA.ENTRADA, fila.entrada],
      [ASIS.COLUMNA.SALIDA, fila.salida],
      [ASIS.COLUMNA.HORAS, fila.horas],
    ];
    for (const [indice, valor] of celdas) {
      const col = ASIS.geometriaColumna(indice);
      elementos.push(...textoEnCelda(valor, {
        centroX: col.centroX, ancho: col.ancho - 2 * T.padding,
        baseline: baselineDeFila(i), tamano: T.filas.tamano, estilo: T.filas.estilo,
      }));
    }
    // Firma del profesor: la MISMA rúbrica del flujo actual, solo en las filas con registro.
    if (fila.conRegistro && imagenes.profesor) {
      const col = ASIS.geometriaColumna(ASIS.COLUMNA.FIRMA);
      elementos.push({
        tipo: 'imagen', imagen: imagenes.profesor,
        ...ubicarRubricaEnCelda({ x: col.x, ancho: col.ancho, top: ASIS.topDeFila(i) }, imagenes.profesor),
      });
    }
  });

  // Totales
  const colHoras = ASIS.geometriaColumna(ASIS.COLUMNA.HORAS);
  const finEtiqueta = colHoras.x - T.padding;
  [
    [T.etiquetaTotalMes, asistencia?.totalMes ?? '', ASIS.TOP_TOTALES],
    [T.etiquetaTotalAcumulado, asistencia?.totalAcumulado ?? '', ASIS.TOP_TOTALES + T.totales.alto],
  ].forEach(([etiqueta, valor, top]) => {
    const baseline = top + (T.totales.alto + medidas.ascender() * T.totales.tamano) / 2 - 1;
    elementos.push(texto({ texto: etiqueta, estilo: T.totales.estilo, tamano: T.totales.tamano, baseline, derecha: finEtiqueta }));
    elementos.push(...textoEnCelda(valor, {
      centroX: colHoras.centroX, ancho: colHoras.ancho - 2 * T.padding,
      baseline, tamano: T.totales.tamano, estilo: T.totales.estilo,
    }));
  });

  // ── Responsable directo y sello ──
  const R = ASIS.RESPONSABLE;
  elementos.push({ tipo: 'linea', x: R.linea.x, y: R.linea.y, ancho: R.linea.ancho, alto: R.linea.grosor, color: C.borde });
  if (imagenes.profesor) {
    elementos.push({ tipo: 'imagen', imagen: imagenes.profesor, ...ubicarRubricaResponsable(imagenes.profesor) });
  }
  elementos.push(...campoDeAsistencia({ ...R.nombre }, asistencia?.responsable?.nombre ?? ''));
  elementos.push(...campoDeAsistencia({ ...R.cargo }, asistencia?.responsable?.cargo ?? ''));
  elementos.push(texto({ ...R.titulo, centroX: R.titulo.centroX }));

  if (imagenes.sello) elementos.push({ tipo: 'imagen', imagen: imagenes.sello, ...ubicarSelloAsistencia(imagenes.sello) });
  elementos.push(texto({ ...ASIS.SELLO.etiqueta, centroX: ASIS.SELLO.etiqueta.centroX, color: COLORES.etiquetaSello }));

  elementos.push(texto({ ...ASIS.PIE, derecha: ASIS.PIE.derecha }));
  return elementos;
}

// ── Actividades: control de espacio ──────────────────────────

const estiloActividades = (extra = {}) => ({
  fontFamily: FAMILIA_FUENTE,
  fontSize: ACTIVIDADES.tamano,
  lineHeight: ACTIVIDADES.interlineado,
  color: COLORES.texto,
  ...extra,
});

function errorPorExceso(m) {
  return crearError(
    `Tus actividades no caben en el espacio del reporte (${m.lineasRenderizadas} líneas; caben ${m.lineasMaximas} con ${m.parrafos} `
    + `${m.parrafos === 1 ? 'párrafo' : 'párrafos'}). Resume el texto e inténtalo de nuevo.`,
    CODIGOS_ERROR.ACTIVIDADES_EXCEDEN_ESPACIO,
    422,
    { lineasRenderizadas: m.lineasRenderizadas, lineasMaximas: m.lineasMaximas, parrafos: m.parrafos },
  );
}

/**
 * Comprueba que las actividades caben a 10 pt en el recuadro: 1) ninguna palabra excede el ancho; 2) medición con los
 * anchos de la fuente; 3) autoridad final: el propio motor de PDF renderiza el texto en un área del tamaño exacto del
 * recuadro y si necesita una segunda página, no caben. Regresa la medición o lanza ACTIVIDADES_*.
 */
async function verificarActividades(lineasDeTexto) {
  const m = medidas.medirActividades(lineasDeTexto);
  if (m.palabraLarga !== null) {
    const extracto = m.palabraLarga.length > 30 ? `${m.palabraLarga.slice(0, 30)}…` : m.palabraLarga;
    throw crearError(
      `Una palabra de las actividades es demasiado larga para el recuadro ("${extracto}"). Sepárala o acórtala.`,
      CODIGOS_ERROR.ACTIVIDADES_PALABRA_DEMASIADO_LARGA,
      422,
      { palabra: extracto },
    );
  }
  // Textos claramente enormes se rechazan sin gastar un render.
  if (m.lineasRenderizadas > m.lineasMaximas * 2) throw errorPorExceso(m);

  const motor = await cargarMotor();
  const h = motor.React.createElement;
  const parrafos = lineasDeTexto.map((linea, i) => h(
    motor.Text,
    { key: i, style: estiloActividades(i < lineasDeTexto.length - 1 ? { marginBottom: ACTIVIDADES.separacionParrafos } : {}) },
    linea,
  ));
  const sonda = await motor.renderToBuffer(h(
    motor.Document,
    null,
    h(motor.Page, { size: [AREA_ACTIVIDADES.ancho, AREA_ACTIVIDADES.alto], style: { padding: 0 } }, ...parrafos),
  ));
  if ((await PDFDocument.load(sonda)).getPageCount() > 1) throw errorPorExceso(m);
  return m;
}

// ── Motor de PDF ─────────────────────────────────────────────

let motorEnCarga = null;

// @react-pdf/renderer es ESM: se importa de forma dinámica y se registra la fuente aprobada una sola vez.
function cargarMotor() {
  if (!motorEnCarga) {
    motorEnCarga = (async () => {
      leerFuentesVerificadas();
      const React = require('react');
      const motor = await import('@react-pdf/renderer');
      motor.Font.register({
        family: FAMILIA_FUENTE,
        fonts: [
          { src: rutaFuente('regular') },
          { src: rutaFuente('bold'), fontWeight: 'bold' },
          { src: rutaFuente('boldItalic'), fontWeight: 'bold', fontStyle: 'italic' },
        ],
      });
      // Sin partir palabras con guiones: el corte en español no debe depender de patrones en inglés.
      motor.Font.registerHyphenationCallback((palabra) => [palabra]);
      return { ...motor, React };
    })().catch((err) => {
      motorEnCarga = null;
      throw err;
    });
  }
  return motorEnCarga;
}

function estiloDeTexto(el) {
  return {
    position: 'absolute',
    left: el.left,
    top: el.top,
    ...(el.ancho ? { width: el.ancho } : {}),
    fontFamily: FAMILIA_FUENTE,
    fontSize: el.tamano,
    fontWeight: el.estilo === 'regular' ? 'normal' : 'bold',
    fontStyle: el.estilo === 'boldItalic' ? 'italic' : 'normal',
    color: el.color,
    textAlign: el.alineacion,
  };
}

function renderizarElemento(motor, el, clave) {
  const h = motor.React.createElement;
  switch (el.tipo) {
    case 'texto':
      return h(motor.Text, { key: clave, style: estiloDeTexto(el) }, el.texto);
    case 'rect':
      return h(motor.View, {
        key: clave,
        style: {
          position: 'absolute', left: el.left, top: el.top, width: el.ancho, height: el.alto,
          borderWidth: el.grosor, borderColor: el.color, borderStyle: 'solid',
        },
      });
    case 'linea':
      return h(motor.View, {
        key: clave,
        style: { position: 'absolute', left: el.x, top: el.y, width: el.ancho, height: el.alto, backgroundColor: el.color },
      });
    // Rectángulo RELLENO (sin borde): cabecera de la tabla de asistencia y filas sombreadas.
    case 'relleno':
      return h(motor.View, {
        key: clave,
        style: {
          position: 'absolute', left: el.left, top: el.top, width: el.ancho, height: el.alto,
          backgroundColor: el.color,
        },
      });
    case 'imagen':
      return h(motor.Image, {
        key: clave,
        src: { data: el.imagen.data, format: el.imagen.format },
        style: { position: 'absolute', left: el.left, top: el.top, width: el.ancho, height: el.alto },
      });
    case 'actividades':
      return h(
        motor.View,
        { key: clave, style: { position: 'absolute', left: el.x, top: el.y, width: el.ancho, height: el.alto } },
        ...el.parrafos.map((parrafo, i) => h(
          motor.Text,
          { key: i, style: estiloActividades(i < el.parrafos.length - 1 ? { marginBottom: ACTIVIDADES.separacionParrafos } : {}) },
          parrafo,
        )),
      );
    default:
      throw new TypeError(`Elemento de layout desconocido: ${el.tipo}`);
  }
}

/**
 * PDF del reporte (Buffer). `rubricaAlumno`, `rubricaProfesor` y `selloInstitucional` son opcionales (Buffer PNG/JPG);
 * sin ellos se deja el espacio en blanco.
 *
 * Produce DOS páginas Carta: la 1 es el reporte de actividades y la 2 el Control de Asistencia. La rúbrica del
 * profesor y el sello se dibujan aquí solo cuando ya se conocen; en el flujo normal llegan después, estampados sobre
 * el PDF ya guardado (ver agregarRubricaProfesor / agregarSelloValidacion).
 */
async function generarPdfReporteMensual(datos, { rubricaAlumno = null, rubricaProfesor = null, selloInstitucional = null } = {}) {
  const imagenes = {
    alumno: await prepararImagen(rubricaAlumno, 'La rúbrica del alumno'),
    profesor: await prepararImagen(rubricaProfesor, 'La rúbrica del profesor'),
    sello: await prepararImagen(selloInstitucional, 'El sello institucional'),
  };
  await verificarActividades(datos.actividades.lineas);
  // El Control de Asistencia es EXCLUSIVO del reporte mensual: el global sigue siendo de una sola página.
  const llevaAsistencia = datos.asistencia !== null && datos.asistencia !== undefined;
  const elementos = planificarPagina(datos, imagenes, { llevaAsistencia });
  const elementosAsistencia = llevaAsistencia ? planificarPaginaAsistencia(datos, imagenes) : null;

  const motor = await cargarMotor();
  const h = motor.React.createElement;
  const estiloPagina = { fontFamily: FAMILIA_FUENTE, color: COLORES.texto };
  const pagina = (clave, lista) => h(
    motor.Page,
    { key: clave, size: [PAGINA.ancho, PAGINA.alto], style: estiloPagina },
    ...lista.map((el, i) => renderizarElemento(motor, el, i)),
  );
  const documento = h(
    motor.Document,
    { title: datos.tipoReporte === 'global' ? 'Reporte global de actividades' : 'Reporte mensual de actividades', author: PRESTATARIO, creator: 'Sistema de Servicio Social ESCOM', producer: 'escom-ss' },
    pagina('reporte', elementos),
    ...(elementosAsistencia ? [pagina('asistencia', elementosAsistencia)] : []),
  );
  const buffer = Buffer.from(await motor.renderToBuffer(documento));

  // Comprobación final: mensual = 2 páginas Carta (reporte + asistencia); global = 1.
  const paginasEsperadas = llevaAsistencia ? PAGINAS_DEL_REPORTE : 1;
  const pdf = await PDFDocument.load(buffer);
  const tamanosValidos = pdf.getPages().every((p) => {
    const { width, height } = p.getSize();
    return Math.round(width) === PAGINA.ancho && Math.round(height) === PAGINA.alto;
  });
  if (pdf.getPageCount() !== paginasEsperadas || !tamanosValidos) {
    throw crearError(
      `El PDF generado no cumple el formato (${pdf.getPageCount()} páginas).`,
      CODIGOS_ERROR.PDF_PAGINAS_INVALIDAS,
      500,
    );
  }
  return buffer;
}

/**
 * Agrega imágenes a un PDF ya generado, sin regenerar nada de su contenido: se parte de sus bytes.
 *
 * COMPATIBILIDAD: acepta documentos de UNA página (los reportes emitidos antes del Control de Asistencia) y de DOS
 * (los nuevos). Cada colocación indica en qué página va; las que apunten a una página que este documento no tiene
 * simplemente se omiten, para que un PDF histórico siga firmándose y sellándose exactamente como siempre.
 *
 * `colocaciones`: [{ pagina, ubicar(imagen) -> { left, top, ancho, alto } }]. Devuelve un Buffer NUEVO.
 */
async function agregarImagenesAlPdf(pdfOriginal, imagenBytes, etiqueta, colocaciones) {
  const imagen = await prepararImagen(imagenBytes, etiqueta);
  if (!imagen) throw crearError(`${etiqueta} es obligatoria.`, CODIGOS_ERROR.IMAGEN_INVALIDA, 422);

  const invalido = (mensaje) => crearError(mensaje, CODIGOS_ERROR.PDF_ALMACENADO_INVALIDO, 500);
  if (!(pdfOriginal instanceof Uint8Array)) throw invalido('El PDF almacenado no es válido.');

  // La lectura y la inspección van en el MISMO try: un PDF corrupto puede cargar y reventar al mirar sus páginas.
  let documento;
  let paginas = 0;
  let formatoValido = false;
  try {
    // updateMetadata:false conserva título, autor y fechas del PDF original.
    documento = await PDFDocument.load(new Uint8Array(pdfOriginal), { updateMetadata: false });
    paginas = documento.getPageCount();
    // 1 página = reporte histórico (antes del Control de Asistencia); 2 = reporte + asistencia. Ambos son válidos.
    formatoValido = paginas >= 1 && paginas <= PAGINAS_DEL_REPORTE
      && documento.getPages().every((p) => {
        const { width, height } = p.getSize();
        return Math.round(width) === PAGINA.ancho && Math.round(height) === PAGINA.alto;
      });
  } catch {
    throw invalido('El PDF almacenado no se pudo leer.');
  }
  if (!formatoValido) throw invalido('El PDF almacenado no tiene el formato del reporte.');

  const bytes = new Uint8Array(imagen.data);
  const incrustada = imagen.format === 'png' ? await documento.embedPng(bytes) : await documento.embedJpg(bytes);

  for (const { pagina, ubicar } of colocaciones) {
    if (pagina >= paginas) continue; // PDF histórico de una página: no hay hoja de asistencia que firmar
    const hoja = documento.getPage(pagina);
    const { height } = hoja.getSize();
    const { left, top, ancho, alto } = ubicar(imagen);
    // pdf-lib mide desde abajo a la izquierda; el layout, desde arriba.
    hoja.drawImage(incrustada, { x: left, y: height - top - alto, width: ancho, height: alto });
  }
  return Buffer.from(await documento.save());
}

/**
 * Colocaciones de la rúbrica del PROFESOR: su firma de "Autorizó" en la página 1 (comportamiento actual intacto) y, en
 * la hoja de asistencia, la firma de cada registro usado más la del responsable directo.
 *
 * `filasConRegistro` son los índices de fila (0..23) que sí llevan bitácora; si no se conocen, solo se firma el
 * responsable directo.
 */
function colocacionesRubricaProfesor(filasConRegistro = []) {
  return [
    { pagina: PAGINA_REPORTE, ubicar: (imagen) => ubicarRubrica(FIRMAS.autorizo, imagen) },
    { pagina: PAGINA_ASISTENCIA, ubicar: (imagen) => ubicarRubricaResponsable(imagen) },
    ...filasConRegistro.map((i) => ({
      pagina: PAGINA_ASISTENCIA,
      ubicar: (imagen) => {
        const col = ASIS.geometriaColumna(ASIS.COLUMNA.FIRMA);
        return ubicarRubricaEnCelda({ x: col.x, ancho: col.ancho, top: ASIS.topDeFila(i) }, imagen);
      },
    })),
  ];
}

/**
 * Agrega la rúbrica del profesor (PNG/JPG) al PDF que firmó el alumno (CU-REP-05): "Autorizó" en la página 1 y, en la
 * hoja de asistencia, la firma de cada registro y la del responsable directo. Es la MISMA imagen, repetida: no se pide
 * otra firma ni se almacenan 24.
 */
const agregarRubricaProfesor = (pdfAlumno, rubricaProfesor, filasConRegistro = []) => agregarImagenesAlPdf(
  pdfAlumno, rubricaProfesor, 'La rúbrica del profesor', colocacionesRubricaProfesor(filasConRegistro),
);

/** Agrega el sello de validación (PNG/JPG) al PDF firmado por alumno y profesor (CU-REP-06), en las dos hojas. */
const agregarSelloValidacion = (pdfFirmado, sello) => agregarImagenesAlPdf(
  pdfFirmado, sello, 'El sello de validación del prototipo',
  [
    { pagina: PAGINA_REPORTE, ubicar: ubicarSello },
    { pagina: PAGINA_ASISTENCIA, ubicar: ubicarSelloAsistencia },
  ],
);

module.exports = {
  CODIGOS_ERROR,
  PAGINAS_DEL_REPORTE,
  PAGINA_REPORTE,
  PAGINA_ASISTENCIA,
  planificarPaginaAsistencia,
  agregarImagenesAlPdf,
  colocacionesRubricaProfesor,
  construirDatosPdf,
  agregarRubricaProfesor,
  agregarSelloValidacion,
  prepararImagen,
  planificarPagina,
  verificarActividades,
  generarPdfReporteMensual,
};
