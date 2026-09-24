// Generador del PDF de EVALUACIÓN DE DESEMPEÑO (CU-LSS-03/04).
//
// MECANISMO (v2 — AcroForm real, reemplaza el overlay por coordenadas
// manuales de la versión anterior): assets/plantilla-evaluacion-v2.pdf
// ya tiene, PERSISTIDOS como campos reales del PDF (no como constantes
// JS), 8 TextField + 28 CheckBox con nombres autoexplicativos — ver
// scripts/generar-plantilla-v2.js para cómo se construyó esa plantilla
// y por qué (el enfoque anterior de "dibujar texto/X a mano con
// coordenadas" demostró ser frágil: encabezados de tabla mal medidos,
// X descentradas, zonas de imagen invertidas por ser solo números sin
// nombre).
//
// generarPdfEvaluacion ahora SOLO llena por nombre:
//   form.getTextField('campo_nombre').setText(...)
//   form.getCheckBox('factor_calidad_trabajo_100').check()
// y aplana el formulario (form.flatten()) para que el resultado sea
// texto/marca fija, no un formulario editable — el PDF final se ve y se
// comporta exactamente como el documento en papel ya rellenado.
//
// agregarRubricaProfesor/agregarSelloCoordinacion NO cambiaron de
// mecanismo (pdf-lib, incrustar imagen en una zona, sin regenerar
// nada) — solo se recalibraron sus zonas: rúbrica del profesor a la
// IZQUIERDA (sin caja, arriba de la línea de firma), sello de
// coordinación a la DERECHA (dentro de la caja con borde) — confirmado
// contra la referencia visual real del formato.
//
// BASE ACTUAL: assets/plantilla-evaluacion.pdf es ahora una copia
// DIRECTA de Reporte-Desempeno-Base.pdf (exportado real de Microsoft
// Word, raíz del proyecto) — YA NO pasa por LibreOffice (ver
// scripts/generar-plantilla-v2.js para el porqué). 1 sola página
// nativa, sin reflow que recortar.

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { crearError } = require('./validators');
const { FACTORES_EVALUACION, SUMA_TOTAL_MAXIMA } = require('./lss.shared');

const RUTA_PLANTILLA = path.join(__dirname, 'assets/plantilla-evaluacion-v2.pdf');

const PAGINA = { ancho: 612, alto: 792 }; // Carta vertical, en pt — confirmado con `pdfinfo` sobre la plantilla real.

// Zonas de imagen — coordenadas confirmadas con la grilla de referencia
// usada para construir plantilla-evaluacion-v2.pdf (ver
// scripts/generar-plantilla-v2.js, ZONA_RUBRICA/ZONA_SELLO ahí son la
// fuente de verdad; se duplican aquí porque agregarRubricaProfesor/
// agregarSelloCoordinacion corren en un momento distinto del flujo,
// sobre un PDF ya aplanado, no sobre el AcroForm).
const ZONA_RUBRICA = { x: 33, y: 690, ancho: 210, alto: 52 }; // IZQUIERDA — firma del profesor.
const ZONA_SELLO = { x: 410, y: 660, ancho: 148, alto: 85 }; // DERECHA — sello de coordinación.

// FACTORES_EVALUACION (lss.shared.js) usa nombres en español con
// acentos/espacios — los nombres de CheckBox del AcroForm usan slugs
// simples (ver scripts/generar-plantilla-v2.js). Este mapeo es la ÚNICA
// fuente de verdad de esa correspondencia — si se agrega un factor
// nuevo algún día, hay que agregarlo aquí Y en el script de la
// plantilla.
const SLUG_FACTOR = {
  'Calidad del trabajo': 'calidad_trabajo',
  'Aplicación de conocimientos': 'aplicacion_conocimientos',
  'Adquisición de conocimientos': 'adquisicion_conocimientos',
  'Disciplina': 'disciplina',
  'Presentación personal': 'presentacion_personal',
  'Iniciativa': 'iniciativa',
  'Relaciones interpersonales': 'relaciones_interpersonales',
};

let plantillaCache = null;
function leerPlantilla() {
  if (!plantillaCache) {
    if (!fs.existsSync(RUTA_PLANTILLA)) {
      throw crearError('No se encontró la plantilla del formato de evaluación en el servidor.', 500, 'PLANTILLA_NO_ENCONTRADA');
    }
    plantillaCache = fs.readFileSync(RUTA_PLANTILLA);
  }
  return plantillaCache;
}

/**
 * datos: { alumno: { nombreCompleto, boleta, carreraNombre }, unidadAcademica,
 *          periodo: { inicioTexto, finTexto }, observaciones,
 *          responsable: { nombreCompleto },
 *          valores: { [nombreFactor]: puntaje }, sumaTotal }
 * `valores`/`sumaTotal` deben venir YA validados y recalculados por quien
 * llama (lss-profesor.service.js, validarYCalcularPuntajes) — este archivo
 * solo llena el formulario, no vuelve a validar.
 */
async function generarPdfEvaluacion(datos) {
  if (!datos?.alumno?.nombreCompleto || !datos?.alumno?.boleta) {
    throw crearError('Faltan datos del alumno para generar el PDF de evaluación.', 422, 'DATO_REQUERIDO');
  }
  if (!datos?.valores || typeof datos.sumaTotal !== 'number') {
    throw crearError('Faltan los puntajes por factor para generar el PDF de evaluación.', 422, 'DATO_REQUERIDO');
  }

  const documento = await PDFDocument.load(leerPlantilla());
  const { width, height } = documento.getPage(0).getSize();
  if (Math.round(width) !== PAGINA.ancho || Math.round(height) !== PAGINA.alto) {
    throw crearError(`La plantilla de evaluación no tiene el formato esperado (${width}x${height} pt).`, 500, 'PLANTILLA_INVALIDA');
  }

  const form = documento.getForm();

  form.getTextField('campo_nombre').setText(datos.alumno.nombreCompleto);
  form.getTextField('campo_boleta').setText(datos.alumno.boleta);
  form.getTextField('campo_carrera').setText(datos.alumno.carreraNombre || '');
  form.getTextField('campo_periodo_inicio').setText(datos.periodo?.inicioTexto || '');
  form.getTextField('campo_periodo_fin').setText(datos.periodo?.finTexto || '');
  form.getTextField('campo_observaciones').setText(datos.observaciones || '');
  form.getTextField('campo_suma_total').setText(String(datos.sumaTotal));
  form.getTextField('campo_nombre_profesor').setText(datos.responsable?.nombreCompleto || '');

  // Una "X" (marca nativa del CheckBox) por factor, SOLO en la casilla
  // del valor elegido — las otras 3 de cada factor quedan sin marcar.
  FACTORES_EVALUACION.forEach((factor) => {
    const puntaje = datos.valores[factor.nombre];
    const slug = SLUG_FACTOR[factor.nombre];
    if (slug && puntaje != null) {
      form.getCheckBox(`factor_${slug}_${puntaje}`).check();
    }
  });

  // Aplana: el resultado es texto/marca fija, no un formulario editable
  // — mismo criterio que un documento impreso ya rellenado.
  form.flatten();

  const buffer = Buffer.from(await documento.save());

  // Misma comprobación final de siempre: 1 sola página tamaño Carta.
  const verificacion = await PDFDocument.load(buffer);
  const tamañoFinal = verificacion.getPage(0).getSize();
  if (verificacion.getPageCount() !== 1 || Math.round(tamañoFinal.width) !== PAGINA.ancho || Math.round(tamañoFinal.height) !== PAGINA.alto) {
    throw crearError(`El PDF de evaluación generado no cumple el formato (${verificacion.getPageCount()} páginas, ${tamañoFinal.width}x${tamañoFinal.height} pt).`, 500, 'PDF_PAGINAS_INVALIDAS');
  }
  return buffer;
}

/**
 * Incrusta UNA imagen (PNG/JPG) sobre un PDF ya generado, dentro de `zona`
 * — mismo patrón exacto que agregarImagenAlPdf de Reportes (pdf-lib:
 * PDFDocument.load, embedPng/embedJpg, drawImage), sin regenerar ningún
 * otro contenido del documento. Regresa un Buffer NUEVO; el original no se
 * modifica. Compartida entre agregarRubricaProfesor (CU-LSS-03) y
 * agregarSelloCoordinacion (CU-LSS-04) — misma mecánica, distinta zona.
 */
async function incrustarImagen(pdfBase, imagenBuffer, zona, etiqueta) {
  if (!(pdfBase instanceof Uint8Array)) throw crearError('El PDF base no es válido.', 500, 'PDF_ALMACENADO_INVALIDO');
  if (!(imagenBuffer instanceof Uint8Array) || imagenBuffer.length === 0) {
    throw crearError(`${etiqueta} es obligatoria.`, 422, 'IMAGEN_INVALIDA');
  }

  const documento = await PDFDocument.load(new Uint8Array(pdfBase), { updateMetadata: false });
  const pagina = documento.getPage(0);
  const { height } = pagina.getSize();

  const esPng = imagenBuffer.length > 8 && imagenBuffer[0] === 0x89 && imagenBuffer[1] === 0x50;
  const incrustada = esPng ? await documento.embedPng(imagenBuffer) : await documento.embedJpg(imagenBuffer);

  // Ajusta conservando proporción dentro de la zona, centrada.
  const escala = Math.min(zona.ancho / incrustada.width, zona.alto / incrustada.height);
  const ancho = incrustada.width * escala;
  const alto = incrustada.height * escala;
  const left = zona.x + (zona.ancho - ancho) / 2;
  const top = zona.y + (zona.alto - alto) / 2;

  // pdf-lib mide desde abajo a la izquierda; la zona está medida desde arriba.
  pagina.drawImage(incrustada, { x: left, y: height - top - alto, width: ancho, height: alto });
  return Buffer.from(await documento.save());
}

const agregarRubricaProfesor = (pdfBase, rubricaBuffer) => incrustarImagen(pdfBase, rubricaBuffer, ZONA_RUBRICA, 'La rúbrica del profesor');

/**
 * Incrusta el sello de coordinación (CU-LSS-04) sobre el PDF que YA tiene
 * la rúbrica del profesor — se llama DESPUÉS de agregarRubricaProfesor,
 * nunca la reemplaza (ambas imágenes coexisten en zonas distintas).
 */
const agregarSelloCoordinacion = (pdfBase, selloBuffer) => incrustarImagen(pdfBase, selloBuffer, ZONA_SELLO, 'El sello de coordinación');

module.exports = { generarPdfEvaluacion, agregarRubricaProfesor, agregarSelloCoordinacion, PAGINA, ZONA_RUBRICA, ZONA_SELLO };
