// test-compresion-expediente.js
//
// Llama directamente a grService.subirExpediente() sin pasar por HTTP ni
// por multer — así se puede probar con archivos de cualquier tamaño, sin
// que el límite de 1MB por archivo de la capa HTTP se interponga.
//
// ADVERTENCIA: esto SÍ escribe datos reales (igual que una subida real
// desde el navegador) — actualiza la solicitud del alumno y crea/actualiza
// su documento de expediente en la BD real.
//
// USO (desde dentro del contenedor, parado en /app/backend):
//   node test-compresion-expediente.js <boleta> <ruta-pdf-a-probar>
//
// Ejemplo:
//   node test-compresion-expediente.js 2022635555 /app/pesado.pdf

const fs = require('fs');
const prisma = require('./src/lib/prisma');
const grService = require('./src/modules/gr/gr.service');

async function main() {
  const [, , boleta, rutaPdfPesado] = process.argv;
  if (!boleta || !rutaPdfPesado) {
    console.error('Uso: node test-compresion-expediente.js <boleta> <ruta-pdf-pesado>');
    process.exit(1);
  }

  const alumno = await prisma.alumno.findUnique({
    where: { boleta },
    include: { usuario: true, solicitud_registro: true },
  });

  if (!alumno) throw new Error(`No existe el alumno con boleta ${boleta}`);
  if (!alumno.solicitud_registro) throw new Error('Ese alumno no tiene solicitud de registro.');

  console.log(`Alumno: ${alumno.usuario.nombre} ${alumno.usuario.apellidos}`);
  console.log(`Estado actual de la solicitud: ${alumno.solicitud_registro.estado_solicitud}`);
  console.log(`Requiere dictamen: ${alumno.solicitud_registro.dictamen !== null}`);

  if (alumno.solicitud_registro.estado_solicitud !== 'adjuntar_expediente') {
    console.log('\n⚠️  El alumno NO está en estado "adjuntar_expediente" — la función lo va a rechazar.');
    console.log('   Ponlo en ese estado primero con el UPDATE de siempre y vuelve a correr este script.\n');
  }

  const bufferPesado = fs.readFileSync(rutaPdfPesado);
  const bufferPequeno = fs.readFileSync('/app/muestra.pdf');

  console.log(`\nArchivo a probar: ${rutaPdfPesado} (${(bufferPesado.length / 1024 / 1024).toFixed(2)} MB)`);

  const archivos = {
    cartaCompromiso: { buffer: bufferPequeno },
    curp: { buffer: bufferPequeno },
    constanciaCreditos: { buffer: bufferPesado }, // aquí va el archivo pesado a probar
    dictamen: alumno.solicitud_registro.dictamen !== null ? { buffer: bufferPequeno } : undefined,
  };

  console.log('\nProcesando (unión + compresión si hace falta)...\n');
  const inicio = Date.now();

  try {
    const resultado = await grService.subirExpediente(alumno.usuario_id, archivos);
    console.log('✅ ÉXITO:', resultado);
  } catch (err) {
    console.log('❌ FALLÓ:', err.message);
    if (err.code) console.log('   código:', err.code);
  }

  console.log(`\nTiempo total: ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
