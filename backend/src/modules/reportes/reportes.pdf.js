// Punto de entrada público del módulo: mismo contrato exacto que antes (mismos nombres, mismas firmas), así que
// ningún archivo que ya hace require('./reportes.pdf') necesita cambiar. La única diferencia es generarPdfReporteMensual:
// en vez de ejecutar el motor @react-pdf/renderer directo en el hilo principal, la despacha al pool de workers
// (reportes.pdf.workerPool.js) para que no bloquee las demás peticiones del servidor mientras genera un PDF.
//
// El resto de las funciones (construirDatosPdf, agregarRubricaProfesor, agregarSelloValidacion, etc.) no son el
// cuello de botella detectado en PR-03/PR-05 — son cómputo ligero o solo tocan un PDF ya generado — así que se
// reexportan sin cambios desde reportes.pdf.core.js.

const core = require('./reportes.pdf.core');
const { generarPdfEnPool } = require('./reportes.pdf.workerPool');

module.exports = {
  ...core,
  generarPdfReporteMensual: (datos, opciones) => generarPdfEnPool(datos, opciones),
};
