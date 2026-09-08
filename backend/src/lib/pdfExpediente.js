const { PDFDocument } = require('pdf-lib');
const { execFile } = require('child_process');
const util = require('util');
const fs = require('fs');
const os = require('os');
const path = require('path');

const execFileAsync = util.promisify(execFile);

/**
 * Une varios PDFs (en el orden dado) en uno solo, página por página.
 * @param {Buffer[]} buffers
 * @returns {Promise<Buffer>}
 */
async function unirPdfs(buffers) {
  const pdfFinal = await PDFDocument.create();
  for (const buffer of buffers) {
    // Muchos documentos oficiales (CURP del gob.mx, constancias) traen
    // restricciones de edición/impresión activadas por el emisor — eso no
    // es una contraseña de apertura, solo un candado de "no modificar".
    // Como aquí solo LEEMOS el contenido para copiarlo (nunca lo editamos),
    // es seguro ignorarlo.
    const pdfOrigen = await PDFDocument.load(buffer, { ignoreEncryption: true });


    const paginas = await pdfFinal.copyPages(pdfOrigen, pdfOrigen.getPageIndices());
    paginas.forEach((pagina) => pdfFinal.addPage(pagina));
  }
  const bytes = await pdfFinal.save();
  return Buffer.from(bytes);
}

/**
 * Comprime un PDF con Ghostscript. nivelCalidad: '/ebook' (moderado) o
 * '/screen' (agresivo). Usa archivos temporales porque Ghostscript no
 * trabaja directo sobre buffers en memoria.
 * @param {Buffer} buffer
 * @param {'/ebook'|'/screen'} nivelCalidad
 * @returns {Promise<Buffer>}
 */
async function comprimirPdfGhostscript(buffer, nivelCalidad) {
  const carpetaTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-'));
  const rutaEntrada = path.join(carpetaTemp, 'entrada.pdf');
  const rutaSalida = path.join(carpetaTemp, 'salida.pdf');

  try {
    fs.writeFileSync(rutaEntrada, buffer);

    await execFileAsync('gs', [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${nivelCalidad}`,
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      `-sOutputFile=${rutaSalida}`,
      rutaEntrada,
    ]);

    return fs.readFileSync(rutaSalida);
  } finally {
    try { fs.rmSync(carpetaTemp, { recursive: true, force: true }); } catch {}
  }
}

module.exports = { unirPdfs, comprimirPdfGhostscript };
