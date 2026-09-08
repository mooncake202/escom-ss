// test-cron-gr.js
//
// Script de prueba MANUAL (no CI) para GR — llama directamente a las
// funciones batch reales del cron (ejecutarVencimientoReloj1 /
// ejecutarVencimientoReloj2 de gr.cron.js), NO a verificarYAplicarVencimiento
// aislado, para verificar que el cron real (candidatas + batch) funciona
// end-to-end. Mismo estilo que test-cron-vencimiento.js (AH).
//
// USO:
//   docker compose exec backend node test-cron-gr.js

const prisma = require('./src/lib/prisma');
const { ejecutarVencimientoReloj1, ejecutarVencimientoReloj2 } = require('./src/modules/gr/gr.cron');

async function main() {
  console.log('--- Ejecutando ejecutarVencimientoReloj1() (batch real, cron) ---');
  const vencidasReloj1 = await ejecutarVencimientoReloj1();
  console.log(`Resultado Reloj 1: ${vencidasReloj1} solicitudes vencidas.\n`);

  console.log('--- Ejecutando ejecutarVencimientoReloj2() (batch real, cron) ---');
  const vencidasReloj2 = await ejecutarVencimientoReloj2();
  console.log(`Resultado Reloj 2: ${vencidasReloj2} solicitudes vencidas.\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error en test-cron-gr.js:', e);
  process.exit(1);
});
