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
async function prepararReporteParaPdf(usuarioId, actividades, deps = {}, preparar = prepararReporteMensual) {
  const resultado = await preparar(usuarioId, deps);

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
