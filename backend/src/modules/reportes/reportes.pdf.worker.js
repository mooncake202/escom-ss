// Entrada de cada hilo del pool de reportes.pdf.workerPool.js. Corre en su propio contexto de V8: requiere su propia
// copia de reportes.pdf.core.js (motor @react-pdf/renderer, fuentes y assets), que se "calienta" una sola vez por
// hilo, no por PDF — el pool mantiene los hilos vivos, nunca crea uno nuevo por petición.
//
// Protocolo con el hilo principal (ver workerPool.js): recibe { id, tipo, ...carga } y responde siempre
// { id, ok: true, resultado } o { id, ok: false, error: { message, propiedades } }. `propiedades` captura status/
// code/campo/etc. tal como los deja crearError (Object.assign sobre el Error), para reconstruir un error equivalente
// del lado del hilo principal sin acoplar este archivo a los nombres de esos campos.
//
// Dos tipos de tarea, ambos encontrados como bloqueantes del hilo principal al medir PR-03/PR-05 (ver k6):
// - 'generarPdf': el render real del motor @react-pdf/renderer.
// - 'descifrarRubrica': el descifrado AES de la rúbrica del alumno (fileEncryption.js), que corría ANTES de
//   generarPdfReporteMensual y por eso no se beneficiaba de moverla solo a ella (primer intento, sin mejora medible).

const { parentPort } = require('worker_threads');
const { generarPdfReporteMensual } = require('./reportes.pdf.core');
const { descifrarBuffer } = require('../../lib/fileEncryption');

function serializarError(err) {
  const propiedades = {};
  for (const clave of Object.keys(err)) propiedades[clave] = err[clave];
  return { message: err.message, propiedades };
}

const manejadores = {
  generarPdf: ({ datos, opciones }) => generarPdfReporteMensual(datos, opciones),
  descifrarRubrica: ({ buffer }) => descifrarBuffer(Buffer.from(buffer)),
};

parentPort.on('message', async ({ id, tipo, ...carga }) => {
  try {
    const resultado = await manejadores[tipo](carga);
    parentPort.postMessage({ id, ok: true, resultado });
  } catch (err) {
    parentPort.postMessage({ id, ok: false, error: serializarError(err) });
  }
});
