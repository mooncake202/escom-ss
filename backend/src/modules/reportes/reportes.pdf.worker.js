// Entrada de cada hilo del pool de reportes.pdf.workerPool.js. Corre en su propio contexto de V8: requiere su propia
// copia de reportes.pdf.core.js (motor @react-pdf/renderer, fuentes y assets), que se "calienta" una sola vez por
// hilo, no por PDF — el pool mantiene los hilos vivos, nunca crea uno nuevo por petición.
//
// Protocolo con el hilo principal (ver workerPool.js): recibe { id, datos, opciones } y responde siempre
// { id, ok: true, buffer } o { id, ok: false, error: { message, propiedades } }. `propiedades` captura status/code/
// campo/etc. tal como los deja crearError (Object.assign sobre el Error), para reconstruir un error equivalente del
// lado del hilo principal sin acoplar este archivo a los nombres de esos campos.

const { parentPort } = require('worker_threads');
const { generarPdfReporteMensual } = require('./reportes.pdf.core');

function serializarError(err) {
  const propiedades = {};
  for (const clave of Object.keys(err)) propiedades[clave] = err[clave];
  return { message: err.message, propiedades };
}

parentPort.on('message', async ({ id, datos, opciones }) => {
  try {
    const buffer = await generarPdfReporteMensual(datos, opciones);
    parentPort.postMessage({ id, ok: true, buffer });
  } catch (err) {
    parentPort.postMessage({ id, ok: false, error: serializarError(err) });
  }
});
