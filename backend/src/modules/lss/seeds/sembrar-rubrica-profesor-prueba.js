// sembrar-rubrica-profesor-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) — siembra la rúbrica
// (imagen de firma) de un profesor en la ruta real que usa CU-LSS-03:
// uploads/profesores/<correo_institucional>/Rubrica/rubrica.enc (ver
// lss.rubricas.js). Sin esto, registrarEvaluacion/rechazarPorSiss/
// corregirYReenviar rechazan con RUBRICA_NO_ENCONTRADA (409) — es un
// requisito real del flujo, no solo de este seed.
//
// Idempotente: si el profesor ya tiene una rúbrica guardada, NO la
// sobreescribe (guardarRubricaProfesorSiFalta regresa creada:false).
//
// USO:
//   1. Edita PROFESOR_USUARIO_ID abajo.
//   2. docker compose exec backend node backend/src/modules/lss/seeds/sembrar-rubrica-profesor-prueba.js

const fs = require('fs');
const path = require('path');

const FIRMA_PATH = path.join(__dirname, '../../../../../PROFESOR_FIRMA.png');
if (!fs.existsSync(FIRMA_PATH)) {
  console.error('❌ No se encontró la imagen de firma necesaria para este seed.');
  console.error(`   Ruta absoluta esperada: ${FIRMA_PATH}`);
  process.exit(1);
}
const FIRMA = fs.readFileSync(FIRMA_PATH);

const prisma = require('../../../lib/prisma');
const { guardarRubricaProfesorSiFalta, rutaRubricaProfesor } = require('../lss.rubricas');

const PROFESOR_USUARIO_ID = 2; // <-- edita este valor antes de correr

async function main() {
  const profesor = await prisma.profesor.findUnique({
    where: { usuario_id: PROFESOR_USUARIO_ID },
    include: { usuario: true },
  });

  if (!profesor) {
    console.error(`❌ No existe profesor con usuario_id=${PROFESOR_USUARIO_ID}.`);
    process.exit(1);
  }

  const correo = profesor.usuario.correo_institucional;
  const { creada, ruta } = guardarRubricaProfesorSiFalta(correo, FIRMA);

  if (creada) {
    console.log(`✅ Rúbrica sembrada para ${correo} (usuario_id=${PROFESOR_USUARIO_ID}) en:`);
    console.log(`   ${ruta}`);
  } else {
    console.log(`ℹ️ El profesor ${correo} ya tenía una rúbrica guardada — no se modificó nada.`);
    console.log(`   ${ruta}`);
  }

  console.log('\nPara revertir manualmente lo que creó este script:');
  console.log(`  rm "${rutaRubricaProfesor(correo)}"`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al sembrar rúbrica de profesor:', e);
  process.exit(1);
});
