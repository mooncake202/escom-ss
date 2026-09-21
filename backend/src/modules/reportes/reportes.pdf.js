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
const medidas = require('./reportes.medidas');

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
function planificarPagina(datos, imagenes = {}) {
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

  // Pie
  elementos.push(texto({ ...PIE, derecha: PIE.derecha }));
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
 * PDF del reporte mensual (Buffer). `rubricaAlumno`, `rubricaProfesor` y `selloInstitucional` son opcionales
 * (Buffer PNG/JPG); sin ellos se deja el espacio en blanco. Siempre produce exactamente una página Carta o lanza error.
 */
async function generarPdfReporteMensual(datos, { rubricaAlumno = null, rubricaProfesor = null, selloInstitucional = null } = {}) {
  const imagenes = {
    alumno: await prepararImagen(rubricaAlumno, 'La rúbrica del alumno'),
    profesor: await prepararImagen(rubricaProfesor, 'La rúbrica del profesor'),
    sello: await prepararImagen(selloInstitucional, 'El sello institucional'),
  };
  await verificarActividades(datos.actividades.lineas);
  const elementos = planificarPagina(datos, imagenes);

  const motor = await cargarMotor();
  const h = motor.React.createElement;
  const documento = h(
    motor.Document,
    { title: datos.tipoReporte === 'global' ? 'Reporte global de actividades' : 'Reporte mensual de actividades', author: PRESTATARIO, creator: 'Sistema de Servicio Social ESCOM', producer: 'escom-ss' },
    h(
      motor.Page,
      { size: [PAGINA.ancho, PAGINA.alto], style: { fontFamily: FAMILIA_FUENTE, color: COLORES.texto } },
      ...elementos.map((el, i) => renderizarElemento(motor, el, i)),
    ),
  );
  const buffer = Buffer.from(await motor.renderToBuffer(documento));

  // Comprobación final: el reporte mensual es SIEMPRE una sola página Carta.
  const pdf = await PDFDocument.load(buffer);
  const { width, height } = pdf.getPage(0).getSize();
  if (pdf.getPageCount() !== 1 || Math.round(width) !== PAGINA.ancho || Math.round(height) !== PAGINA.alto) {
    throw crearError(
      `El PDF generado no cumple el formato (${pdf.getPageCount()} páginas, ${width}x${height} pt).`,
      CODIGOS_ERROR.PDF_PAGINAS_INVALIDAS,
      500,
    );
  }
  return buffer;
}

/**
 * Agrega UNA imagen a un PDF ya generado (el del reporte, una página Carta) sin regenerar nada de su contenido: se parte de
 * sus bytes. `ubicar(imagen)` da la posición (pt, origen arriba a la izquierda). Devuelve un Buffer NUEVO; el original no se
 * modifica. `etiqueta` nombra la imagen en los mensajes.
 */
async function agregarImagenAlPdf(pdfOriginal, imagenBytes, etiqueta, ubicar) {
  const imagen = await prepararImagen(imagenBytes, etiqueta);
  if (!imagen) throw crearError(`${etiqueta} es obligatoria.`, CODIGOS_ERROR.IMAGEN_INVALIDA, 422);

  const invalido = (mensaje) => crearError(mensaje, CODIGOS_ERROR.PDF_ALMACENADO_INVALIDO, 500);
  if (!(pdfOriginal instanceof Uint8Array)) throw invalido('El PDF almacenado no es válido.');
  let documento;
  let formatoValido = false;
  try {
    // updateMetadata:false conserva título, autor y fechas del PDF original.
    documento = await PDFDocument.load(new Uint8Array(pdfOriginal), { updateMetadata: false });
    if (documento.getPageCount() === 1) {
      const { width, height } = documento.getPage(0).getSize();
      formatoValido = Math.round(width) === PAGINA.ancho && Math.round(height) === PAGINA.alto;
    }
  } catch {
    throw invalido('El PDF almacenado no se pudo leer.');
  }
  if (!formatoValido) throw invalido('El PDF almacenado no tiene el formato del reporte mensual.');
  const { height } = documento.getPage(0).getSize();

  const bytes = new Uint8Array(imagen.data);
  const incrustada = imagen.format === 'png' ? await documento.embedPng(bytes) : await documento.embedJpg(bytes);
  const { left, top, ancho, alto } = ubicar(imagen);
  // pdf-lib mide desde abajo a la izquierda; el layout, desde arriba.
  documento.getPage(0).drawImage(incrustada, { x: left, y: height - top - alto, width: ancho, height: alto });
  return Buffer.from(await documento.save());
}

/** Agrega la rúbrica del profesor (PNG/JPG) al PDF que firmó el alumno, en el espacio de "Autorizó" (CU-REP-05). */
const agregarRubricaProfesor = (pdfAlumno, rubricaProfesor) => agregarImagenAlPdf(
  pdfAlumno, rubricaProfesor, 'La rúbrica del profesor', (imagen) => ubicarRubrica(FIRMAS.autorizo, imagen),
);

/** Agrega el sello de validación del prototipo (PNG/JPG) al PDF firmado por alumno y profesor, en SELLO.zona (CU-REP-06). */
const agregarSelloValidacion = (pdfFirmado, sello) => agregarImagenAlPdf(pdfFirmado, sello, 'El sello de validación del prototipo', ubicarSello);

module.exports = {
  CODIGOS_ERROR,
  construirDatosPdf,
  agregarRubricaProfesor,
  agregarSelloValidacion,
  prepararImagen,
  planificarPagina,
  verificarActividades,
  generarPdfReporteMensual,
};
