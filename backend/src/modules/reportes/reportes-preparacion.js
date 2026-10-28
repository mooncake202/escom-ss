// Preparación común de la vista previa y del envío: mismos datos, mismas validaciones y misma rúbrica, para que el PDF
// que se revisa sea el que se envía. Solo lectura.

const { prepararReporteMensual } = require('./reportes-alumno.service');
const { construirDatosPdf } = require('./reportes.pdf');
const { obtenerRubricaAlumno } = require('./reportes.rubricas');

const CODIGOS_ERROR = Object.freeze({
  REPORTE_NO_GENERABLE: 'REPORTE_NO_GENERABLE',
  RUBRICA_NO_REGISTRADA: 'RUBRICA_NO_REGISTRADA',
});

function crearError(mensaje, status, code, extra = {}) {
  return Object.assign(new Error(mensaje), { status, code, ...extra });
}

const errorSinRubrica = () => crearError(
  'Registra tu rúbrica antes de continuar con el reporte.',
  409,
  CODIGOS_ERROR.RUBRICA_NO_REGISTRADA,
);

/**
 * Valida el reporte y arma lo necesario para generar el PDF: { resultado, datos, rubricaAlumno }.
 * Repite todas las validaciones (el backend es la autoridad). `deps`: { prisma, ahora, rutaBaseRubricas }. `preparar` elige qué
 * reporte se valida (por omisión el mensual; el global pasa prepararReporteGlobal): la validación y el PDF son los mismos.
 */
// Diagnóstico temporal (PDF_DEBUG_TIEMPOS=1): mide la fase de consultas a la BD (prepararReporteMensual/Global),
// la única parte de este archivo que NO pasa por el pool de workers. Se quita una vez identificado el cuello de
// botella real de PR-03/PR-05; no debe quedar en el código final.
const DEBUG_TIEMPOS = process.env.PDF_DEBUG_TIEMPOS === '1';

async function prepararReporteParaPdf(usuarioId, actividades, deps = {}, preparar = prepararReporteMensual) {
  const inicioBd = DEBUG_TIEMPOS ? process.hrtime.bigint() : null;
  const resultado = await preparar(usuarioId, deps);
  if (DEBUG_TIEMPOS) {
    console.log(`[fase] bd ms=${(Number(process.hrtime.bigint() - inicioBd) / 1e6).toFixed(1)}`);
  }

  if (!resultado.puedeGenerar) {
    throw crearError('El reporte todavía no se puede generar.', 409, CODIGOS_ERROR.REPORTE_NO_GENERABLE, { motivosBloqueo: resultado.motivosBloqueo });
  }
  if (resultado.firma.requiereSubirRubrica) throw errorSinRubrica();

  const datos = construirDatosPdf(resultado, actividades);
  const rubricaAlumno = await obtenerRubricaAlumno(usuarioId, { prisma: deps.prisma, rutaBase: deps.rutaBaseRubricas });
  if (!rubricaAlumno) throw errorSinRubrica();

  return { resultado, datos, rubricaAlumno };
}

module.exports = { CODIGOS_ERROR, crearError, prepararReporteParaPdf };
