// index.js — cred-gr-ah-lss
//
// Corre, en orden de dependencia, todo el ciclo completo del alumno:
// CRED -> ofertas mínimas (PRO) -> GR -> AH -> reportes mínimos (REP) -> LSS.
// Depende de demo-final/00-comun/ ya corrido antes que esto.
//
// Uso (mismo patrón que 00-comun/index.js):
//   docker compose exec -T backend node backend/src/seeds/demo-final/cred-gr-ah-lss/index.js
//
// Cada paso es idempotente por sí mismo (ver el comentario de cada
// archivo), pero esto NO está pensado para correrse dos veces seguidas
// sobre datos ya procesados por 03-gr.js en adelante — igual que esos
// archivos, está pensado para una BD recién vaciada y recién corrida
// 00-comun/.

const prisma = require('../../../lib/prisma');
const cred = require('./01-cred');
const ofertasMinimas = require('./02-ofertas-minimas');
const gr = require('./03-gr');
const ah = require('./04-ah');
const reportesMinimos = require('./05-reportes-minimos');
const lss = require('./06-lss');

async function main() {
  console.log('── 1. CRED (7 profesores) ──');
  await cred.main();

  console.log('── 2. Ofertas mínimas (placeholder de PRO) ──');
  await ofertasMinimas.main();

  console.log('── 3. GR (13 escenarios) ──');
  await gr.main();

  console.log('── 4. AH (8 escenarios) ──');
  await ah.main();

  console.log('── 5. Reportes mínimos (placeholder de REP, para LSS) ──');
  await reportesMinimos.main();

  console.log('── 6. LSS (4 escenarios) ──');
  await lss.main();

  console.log('✅ cred-gr-ah-lss completo.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ cred-gr-ah-lss falló:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main };
