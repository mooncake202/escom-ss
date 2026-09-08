// generar-pdf-pesado.js
//
// Genera un PDF de prueba deliberadamente pesado, duplicando las páginas
// de un PDF real existente hasta alcanzar (o superar) el tamaño objetivo.
// Útil para forzar el flujo de compresión de CU-GR-10 sin necesitar
// conseguir archivos reales pesados.
//
// USO (desde dentro del contenedor del backend, donde pdf-lib ya está instalado):
//   node generar-pdf-pesado.js <ruta-pdf-origen> <ruta-pdf-salida> <mb-objetivo>
//
// Ejemplo:
//   node /app/generar-pdf-pesado.js /app/muestra.pdf /app/pesado.pdf 3

const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function main() {
  const [, , rutaOrigen, rutaSalida, mbObjetivoStr] = process.argv;

  if (!rutaOrigen || !rutaSalida) {
    console.error('Uso: node generar-pdf-pesado.js <origen.pdf> <salida.pdf> [mb-objetivo=3]');
    process.exit(1);
  }

  const mbObjetivo = parseFloat(mbObjetivoStr || '3');
  const bytesObjetivo = mbObjetivo * 1024 * 1024;

  const bufferOrigen = fs.readFileSync(rutaOrigen);
  const pdfOrigen = await PDFDocument.load(bufferOrigen, { ignoreEncryption: true });

  const pdfFinal = await PDFDocument.create();
  let tamanoActual = 0;
  let vueltas = 0;

  console.log(`Duplicando páginas hasta alcanzar ~${mbObjetivo} MB...`);

  while (tamanoActual < bytesObjetivo && vueltas < 1000) {
    const indices = pdfOrigen.getPageIndices();
    const paginas = await pdfFinal.copyPages(pdfOrigen, indices);
    paginas.forEach((p) => pdfFinal.addPage(p));
    const bytes = await pdfFinal.save();
    tamanoActual = bytes.length;
    vueltas++;
    if (vueltas % 10 === 0) {
      console.log(`  vuelta ${vueltas}: ${(tamanoActual / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  const bytesFinales = await pdfFinal.save();
  fs.writeFileSync(rutaSalida, bytesFinales);

  console.log(`\nListo: ${rutaSalida}`);
  console.log(`Tamaño final: ${(bytesFinales.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Páginas totales: ${pdfFinal.getPageCount()}`);
}

main().catch((err) => {
  console.error('Error al generar el PDF de prueba:', err);
  process.exit(1);
});
