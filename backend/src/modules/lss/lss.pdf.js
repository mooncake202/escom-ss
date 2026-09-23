// Generador del PDF de EVALUACIÓN DE DESEMPEÑO (CU-LSS-03), replicando
// ESTRUCTURALMENTE (no pixel-perfect) el layout de "Reporte de Desempe.docx"
// — mismo estándar de fidelidad que ya usa Reportes con su propio formato
// oficial (reportes.pdf.js: layout medido a mano, no plantilla convertida).
//
// Usa los puntajes REALES capturados en el formulario del profesor
// (FACTORES_EVALUACION, fuente canónica en lss.shared.js — confirmada
// contra el mockup FormEvaluacion.jsx, no contra el .docx): cada factor
// muestra el nivel que el profesor eligió realmente, resaltado, más la
// suma total RECALCULADA en servidor (lss-profesor.service.js nunca
// confía en el total que mande el cliente).
//
// generarPdfEvaluacion(datos)              -> Buffer del PDF (desde cero)
// agregarRubricaProfesor(pdfBase, rubrica) -> Buffer NUEVO con la rúbrica
//   incrustada, sin regenerar el resto — mismo patrón de pdf-lib que ya usa
//   Reportes (agregarImagenAlPdf: PDFDocument.load, embedPng/embedJpg, drawImage).

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { crearError } = require('./validators');
const { FACTORES_EVALUACION, SUMA_TOTAL_MAXIMA } = require('./lss.shared');

const RUTA_LOGO_IPN = path.join(__dirname, 'assets/logos/ipn.png');
const RUTA_LOGO_ESCOM = path.join(__dirname, 'assets/logos/escom.png');

const PAGINA = { ancho: 612, alto: 792 }; // Carta vertical, en pt — igual que Reportes.

// Zona reservada para la rúbrica del profesor, bajo la línea de
// "Nombre, Cargo y Firma de Responsable Directo" (blanco en el formato
// original — se llena a mano en el papel, aquí se incrusta la imagen).
const ZONA_RUBRICA = { x: 356, y: 660, ancho: 180, alto: 60 };

let motorEnCarga = null;
function cargarMotor() {
  if (!motorEnCarga) {
    motorEnCarga = (async () => {
      const React = require('react');
      const motor = await import('@react-pdf/renderer');
      return { ...motor, React };
    })().catch((err) => {
      motorEnCarga = null;
      throw err;
    });
  }
  return motorEnCarga;
}

function campo(h, Text, View, etiqueta, valor) {
  return h(View, { style: { flexDirection: 'row', marginBottom: 4 } },
    h(Text, { style: { fontSize: 9, fontWeight: 700, marginRight: 4 } }, `${etiqueta}:`),
    h(Text, { style: { fontSize: 9, borderBottom: '1pt solid #000', flexGrow: 1, paddingBottom: 1 } }, valor || ' '),
  );
}

/**
 * Una fila por factor, mostrando el NIVEL REALMENTE ELEGIDO por el profesor
 * (resaltado con fondo), no las 4 opciones completas — a diferencia de la
 * tabla en blanco anterior, esto refleja la evaluación real capturada.
 */
function filaFactor(h, Text, View, factor, puntajeElegido) {
  const opcionElegida = factor.opciones.find((o) => o.valor === puntajeElegido);
  return h(View, { style: { flexDirection: 'row', borderBottom: '0.5pt solid #999', backgroundColor: '#f0f7ff' }, wrap: false },
    h(View, { style: { width: '30%', padding: 4, borderRight: '0.5pt solid #999' } },
      h(Text, { style: { fontSize: 8, fontWeight: 700 } }, factor.nombre)),
    h(View, { style: { width: '55%', padding: 4, borderRight: '0.5pt solid #999' } },
      h(Text, { style: { fontSize: 8 } }, opcionElegida?.label ?? '—')),
    h(View, { style: { width: '15%', padding: 4 } },
      h(Text, { style: { fontSize: 9, fontWeight: 700, textAlign: 'center' } }, String(puntajeElegido ?? '—'))),
  );
}

/**
 * datos: { alumno: { nombreCompleto, boleta, carrera }, unidadAcademica,
 *          periodo: { inicioTexto, finTexto }, observaciones,
 *          responsable: { nombreCompleto },
 *          valores: { [nombreFactor]: puntaje }, sumaTotal }
 * `valores`/`sumaTotal` deben venir YA validados y recalculados por quien
 * llama (lss-profesor.service.js, validarYCalcularPuntajes) — este archivo
 * solo dibuja, no vuelve a validar.
 */
async function generarPdfEvaluacion(datos) {
  if (!datos?.alumno?.nombreCompleto || !datos?.alumno?.boleta) {
    throw crearError('Faltan datos del alumno para generar el PDF de evaluación.', 422, 'DATO_REQUERIDO');
  }
  if (!datos?.valores || typeof datos.sumaTotal !== 'number') {
    throw crearError('Faltan los puntajes por factor para generar el PDF de evaluación.', 422, 'DATO_REQUERIDO');
  }

  const motor = await cargarMotor();
  const h = motor.React.createElement;
  const { Document, Page, View, Text, Image } = motor;

  const logoIpn = fs.existsSync(RUTA_LOGO_IPN) ? RUTA_LOGO_IPN : null;
  const logoEscom = fs.existsSync(RUTA_LOGO_ESCOM) ? RUTA_LOGO_ESCOM : null;

  const documento = h(
    Document,
    { title: 'Evaluación de desempeño del prestador de servicio social', author: 'Instituto Politécnico Nacional', creator: 'Sistema de Servicio Social ESCOM' },
    h(
      Page,
      { size: [PAGINA.ancho, PAGINA.alto], style: { padding: 36, fontSize: 9, fontFamily: 'Helvetica' } },
      // Encabezado
      h(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 } },
        logoIpn ? h(Image, { src: logoIpn, style: { width: 40, height: 40, marginRight: 10 } }) : null,
        h(View, { style: { flexGrow: 1, alignItems: 'center' } },
          h(Text, { style: { fontSize: 10, fontWeight: 700 } }, 'Instituto Politécnico Nacional'),
          h(Text, { style: { fontSize: 8 } }, 'SUBDIRECCIÓN DE SERVICIOS EDUCATIVOS E INTEGRACIÓN SOCIAL'),
          h(Text, { style: { fontSize: 8 } }, 'Departamento de Extensión y Apoyos Educativos.'),
          h(Text, { style: { fontSize: 10, fontWeight: 700, marginTop: 4 } }, 'FORMATO DE EVALUACIÓN DEL PRESTADOR DE SERVICIO SOCIAL'),
        ),
        logoEscom ? h(Image, { src: logoEscom, style: { width: 40, height: 40, marginLeft: 10 } }) : null,
      ),
      // Campos variables
      h(View, { style: { marginBottom: 10 } },
        h(View, { style: { flexDirection: 'row' } },
          h(View, { style: { width: '65%' } }, campo(h, Text, View, 'Nombre del Prestador', datos.alumno.nombreCompleto)),
          h(View, { style: { width: '35%' } }, campo(h, Text, View, 'Boleta', datos.alumno.boleta)),
        ),
        campo(h, Text, View, 'Unidad Académica', datos.unidadAcademica || 'ESCOM'),
        campo(h, Text, View, 'Carrera', datos.alumno.carreraNombre || ''),
        h(View, { style: { flexDirection: 'row' } },
          h(View, { style: { width: '50%' } }, campo(h, Text, View, 'Periodo de Servicio Social (inicio)', datos.periodo?.inicioTexto)),
          h(View, { style: { width: '50%' } }, campo(h, Text, View, 'al', datos.periodo?.finTexto)),
        ),
      ),
      // Tabla de factores con el nivel REAL elegido por el profesor.
      h(View, { style: { border: '0.5pt solid #999', marginBottom: 10 } },
        h(View, { style: { flexDirection: 'row', backgroundColor: '#eee', borderBottom: '0.5pt solid #999' } },
          h(Text, { style: { width: '30%', fontSize: 7, fontWeight: 700, padding: 3 } }, 'FACTOR'),
          h(Text, { style: { width: '55%', fontSize: 7, fontWeight: 700, padding: 3 } }, 'NIVEL SELECCIONADO'),
          h(Text, { style: { width: '15%', fontSize: 7, fontWeight: 700, padding: 3 } }, 'PUNTOS'),
        ),
        ...FACTORES_EVALUACION.map((factor) => filaFactor(h, Text, View, factor, datos.valores[factor.nombre])),
        h(View, { style: { flexDirection: 'row', backgroundColor: '#eee' } },
          h(Text, { style: { width: '85%', fontSize: 8, fontWeight: 700, padding: 4, textAlign: 'right' } }, 'SUMA TOTAL DE PUNTOS'),
          h(Text, { style: { width: '15%', fontSize: 9, fontWeight: 700, padding: 4, textAlign: 'center' } }, `${datos.sumaTotal} / ${SUMA_TOTAL_MAXIMA}`),
        ),
      ),
      // Observaciones
      h(View, { style: { marginBottom: 20 } },
        h(Text, { style: { fontSize: 9, fontWeight: 700, marginBottom: 3 } }, 'Observaciones:'),
        h(Text, { style: { fontSize: 9, minHeight: 40, border: '0.5pt solid #999', padding: 4 } }, datos.observaciones || ''),
      ),
      // Pie: sello (zona en blanco, CU-LSS-04) + firma (zona en blanco -> rúbrica del profesor)
      h(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 } },
        h(View, { style: { width: '45%', alignItems: 'center' } },
          h(Text, { style: { fontSize: 8, borderTop: '1pt solid #000', paddingTop: 4, width: '100%', textAlign: 'center' } }, 'Sello de la dependencia'),
          h(Text, { style: { fontSize: 8, marginTop: 4 } }, 'Nombre de la Dependencia: ESCOM'),
        ),
        h(View, { style: { width: '45%', alignItems: 'center' } },
          // Espacio en blanco reservado — aquí se incrusta la rúbrica del
          // profesor DESPUÉS, con agregarRubricaProfesor (pdf-lib), sin
          // regenerar este PDF.
          h(View, { style: { height: ZONA_RUBRICA.alto } }),
          h(Text, { style: { fontSize: 8, borderTop: '1pt solid #000', paddingTop: 4, width: '100%', textAlign: 'center' } }, 'Nombre, Cargo y Firma de Responsable Directo'),
          h(Text, { style: { fontSize: 8, marginTop: 2 } }, datos.responsable?.nombreCompleto || ''),
        ),
      ),
    ),
  );

  const buffer = Buffer.from(await motor.renderToBuffer(documento));

  // Comprobación final: siempre 1 sola página tamaño Carta (mismo criterio
  // de verificación que usa Reportes con PDFDocument.load).
  const pdf = await PDFDocument.load(buffer);
  const { width, height } = pdf.getPage(0).getSize();
  if (pdf.getPageCount() !== 1 || Math.round(width) !== PAGINA.ancho || Math.round(height) !== PAGINA.alto) {
    throw crearError(`El PDF de evaluación generado no cumple el formato (${pdf.getPageCount()} páginas, ${width}x${height} pt).`, 500, 'PDF_PAGINAS_INVALIDAS');
  }
  return buffer;
}

/**
 * Incrusta la rúbrica del profesor (PNG/JPG) sobre un PDF ya generado, en
 * ZONA_RUBRICA — mismo patrón exacto que agregarImagenAlPdf de Reportes
 * (pdf-lib: PDFDocument.load, embedPng/embedJpg, drawImage), sin regenerar
 * ningún otro contenido del documento. Regresa un Buffer NUEVO.
 */
async function agregarRubricaProfesor(pdfBase, rubricaBuffer) {
  if (!(pdfBase instanceof Uint8Array)) throw crearError('El PDF base no es válido.', 500, 'PDF_ALMACENADO_INVALIDO');
  if (!(rubricaBuffer instanceof Uint8Array) || rubricaBuffer.length === 0) {
    throw crearError('La rúbrica del profesor es obligatoria.', 422, 'IMAGEN_INVALIDA');
  }

  const documento = await PDFDocument.load(new Uint8Array(pdfBase), { updateMetadata: false });
  const pagina = documento.getPage(0);
  const { height } = pagina.getSize();

  const esPng = rubricaBuffer.length > 8 && rubricaBuffer[0] === 0x89 && rubricaBuffer[1] === 0x50;
  const incrustada = esPng ? await documento.embedPng(rubricaBuffer) : await documento.embedJpg(rubricaBuffer);

  // Ajusta conservando proporción dentro de ZONA_RUBRICA, centrada.
  const escala = Math.min(ZONA_RUBRICA.ancho / incrustada.width, ZONA_RUBRICA.alto / incrustada.height);
  const ancho = incrustada.width * escala;
  const alto = incrustada.height * escala;
  const left = ZONA_RUBRICA.x + (ZONA_RUBRICA.ancho - ancho) / 2;
  const top = ZONA_RUBRICA.y + (ZONA_RUBRICA.alto - alto) / 2;

  // pdf-lib mide desde abajo a la izquierda; ZONA_RUBRICA está medida desde arriba.
  pagina.drawImage(incrustada, { x: left, y: height - top - alto, width: ancho, height: alto });
  return Buffer.from(await documento.save());
}

module.exports = { generarPdfEvaluacion, agregarRubricaProfesor, PAGINA, ZONA_RUBRICA };
