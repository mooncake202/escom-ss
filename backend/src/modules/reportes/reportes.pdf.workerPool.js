// Pool persistente de worker_threads para generarPdfReporteMensual (el único paso de todo el módulo de reportes
// que bloquea el hilo principal de Node con cómputo real: el motor @react-pdf/renderer). Nace de la prueba PR-03/
// PR-05 (ver pruebas/k6): con 50 alumnos concurrentes generando vista previa a la vez, el p95 llegaba a 7.8-14.8 s
// contra el umbral de 3 s del RNF 5, porque las 50 peticiones se resolvían una tras otra en el único hilo de V8.
//
// No agrega ninguna dependencia nueva: usa solo el módulo nativo worker_threads. El tamaño del pool es, por
// omisión, el número de vCPU disponibles (PDF_WORKER_POOL_SIZE lo puede fijar explícitamente) — con 1 vCPU el pool
// queda en 1 hilo, es decir, el mismo comportamiento serial de antes.
//
// Los hilos se crean UNA SOLA VEZ y se reutilizan (nunca uno nuevo por petición): cada uno "calienta" su propio
// registro de fuentes del motor (reportes.pdf.core.js, cargarMotor) la primera vez que procesa un PDF, no en cada
// llamada. Las peticiones que llegan cuando todos los hilos están ocupados se encolan en orden de llegada (FIFO).

const os = require('os');
const path = require('path');
const { Worker } = require('worker_threads');

const TAMANO_POOL = Math.max(1, Number(process.env.PDF_WORKER_POOL_SIZE) || os.cpus().length);
const RUTA_WORKER = path.join(__dirname, 'reportes.pdf.worker.js');

let siguienteId = 0;
const pendientes = new Map(); // id -> { resolve, reject }
const cola = []; // tareas en espera de un hilo libre: { id, datos, opciones }
let hilos = null; // [{ worker, ocupado }], creados de forma perezosa (primera llamada real, nunca en pruebas que no la usan)

function crearHilo() {
  const worker = new Worker(RUTA_WORKER);
  const entrada = { worker, ocupado: false };
  worker.on('message', ({ id, ok, buffer, error }) => {
    const tarea = pendientes.get(id);
    pendientes.delete(id);
    entrada.ocupado = false;
    if (tarea) {
      if (ok) tarea.resolve(Buffer.from(buffer));
      else tarea.reject(Object.assign(new Error(error.message), error.propiedades));
    }
    if (cola.length > 0) despacharSiguiente(entrada);
    else entrada.worker.unref(); // sin trabajo pendiente en este hilo: no debe retener el proceso
  });
  // Un hilo nunca debería morir solo (no hay process.exit ni código que lo mate); si ocurre, se rechazan sus
  // tareas en curso en vez de dejarlas colgadas para siempre.
  worker.on('error', (err) => {
    for (const [id, tarea] of pendientes) {
      pendientes.delete(id);
      tarea.reject(err);
    }
  });
  // Arranca sin referencia: un hilo recién creado no tiene trabajo todavía, así que no debe impedir que el
  // proceso (o un test) termine. despacharSiguiente() lo referencia justo antes de postMessage, y el propio
  // 'message' lo desreferencia de nuevo en cuanto queda libre sin nada más en la cola.
  worker.unref();
  return entrada;
}

function obtenerHilos() {
  if (!hilos) hilos = Array.from({ length: TAMANO_POOL }, crearHilo);
  return hilos;
}

function despacharSiguiente(entrada) {
  if (entrada.ocupado || cola.length === 0) return;
  const tarea = cola.shift();
  entrada.ocupado = true;
  entrada.worker.ref(); // tiene trabajo real en curso: sí debe retener el proceso hasta que responda
  entrada.worker.postMessage({ id: tarea.id, datos: tarea.datos, opciones: tarea.opciones });
}

/** Mismo contrato que generarPdfReporteMensual(datos, opciones) de reportes.pdf.core.js, pero ejecutado en el pool. */
function generarPdfEnPool(datos, opciones) {
  return new Promise((resolve, reject) => {
    const id = siguienteId += 1;
    pendientes.set(id, { resolve, reject });
    cola.push({ id, datos, opciones });
    const libre = obtenerHilos().find((h) => !h.ocupado);
    if (libre) despacharSiguiente(libre);
  });
}

/** Solo para pruebas: cierra todos los hilos y limpia el estado, para no dejar handles abiertos entre archivos. */
async function cerrarPool() {
  if (!hilos) return;
  await Promise.all(hilos.map((h) => h.worker.terminate()));
  hilos = null;
}

module.exports = { generarPdfEnPool, cerrarPool, TAMANO_POOL };
