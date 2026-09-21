// CU-REP-01 fase 5: vista previa del reporte mensual. Solo lectura y en memoria.
// NO firma ni envía: no crea documento, reporte ni revisión, no calcula SHA-256, no pide sello de tiempo y no guarda el PDF.

const { generarPdfReporteMensual } = require('./reportes.pdf');
const { CODIGOS_ERROR, prepararReporteParaPdf } = require('./reportes-preparacion');

/**
 * Genera el PDF de vista previa con los datos reales del reporte, las actividades ingresadas y la rúbrica registrada.
 * `deps`: { prisma, ahora, rutaBase } (para pruebas; `rutaBase` es la carpeta de rúbricas). Regresa { pdf: Buffer, numeroReporte }.
 */
async function generarVistaPreviaReporteMensual(usuarioId, actividades, deps = {}) {
  const { datos, rubricaAlumno } = await prepararReporteParaPdf(usuarioId, actividades, {
    prisma: deps.prisma, ahora: deps.ahora, rutaBaseRubricas: deps.rutaBase,
  });
  const pdf = await generarPdfReporteMensual(datos, { rubricaAlumno });
  return { pdf, numeroReporte: datos.numeroReporte };
}

module.exports = { CODIGOS_ERROR, generarVistaPreviaReporteMensual };
