// sembrar-sello-coordinacion-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) — siembra el sello
// ÚNICO Y GLOBAL de coordinación en la ruta real que usa CU-LSS-04:
// uploads/coordinador/Sellos/sello-escom.enc (ver lss.rubricas.js). Sin
// esto, dictaminarAprobado rechaza con SELLO_NO_ENCONTRADO (409) — es un
// requisito real del flujo, no solo de este seed.
//
// A diferencia de la rúbrica del profesor (una por correo institucional),
// el sello NO lleva identidad — es el mismo para cualquier coordinador que
// dictamine (representa el sello de la dependencia, no una firma personal).
//
// Idempotente: si ya existe un sello sembrado, NO lo sobreescribe
// (guardarSelloCoordinacionSiFalta regresa creada:false).
//
// USO:
//   docker compose exec backend node backend/src/modules/lss/seeds/sembrar-sello-coordinacion-prueba.js

const fs = require('fs');
const path = require('path');

const SELLO_PATH = path.join(__dirname, '../../../../../EscudoESCOM.png');
if (!fs.existsSync(SELLO_PATH)) {
  console.error('❌ No se encontró la imagen de sello necesaria para este seed.');
  console.error(`   Ruta absoluta esperada: ${SELLO_PATH}`);
  process.exit(1);
}
const SELLO = fs.readFileSync(SELLO_PATH);

const { guardarSelloCoordinacionSiFalta, rutaSelloCoordinacion } = require('../lss.rubricas');

function main() {
  const { creada, ruta } = guardarSelloCoordinacionSiFalta(SELLO);

  if (creada) {
    console.log('✅ Sello de coordinación sembrado en:');
    console.log(`   ${ruta}`);
  } else {
    console.log('ℹ️ Ya existía un sello de coordinación sembrado — no se modificó nada.');
    console.log(`   ${ruta}`);
  }

  console.log('\nPara revertir manualmente lo que creó este script:');
  console.log(`  rm "${rutaSelloCoordinacion()}"`);
}

main();
