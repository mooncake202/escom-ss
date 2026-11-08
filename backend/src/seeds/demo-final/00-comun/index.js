// index.js — 00-comun
//
// Corre, en orden de dependencia, todo lo realmente compartido del sistema:
// catálogos -> coordinadores -> calendario -> recursos/contacto. Es seguro
// correrlo más de una vez (cada paso es idempotente, ver cada archivo).
//
// Uso (mismo patrón que los demás seeds del repo):
//   docker compose cp backend/src/seeds/demo-final/00-comun backend:/app/backend/src/seeds/demo-final/00-comun
//   docker compose exec -T backend node backend/src/seeds/demo-final/00-comun/index.js

const prisma = require('../../../lib/prisma');
const catalogos = require('./01-catalogos');
const coordinadores = require('./02-coordinadores');
const calendario = require('./03-calendario');
const recursosContacto = require('./04-recursos-contacto');

async function main() {
  console.log('── 1. Catálogos (carrera, caracteristica) ──');
  await catalogos.main();

  console.log('── 2. Coordinadores compartidos ──');
  await coordinadores.main();

  console.log('── 3. Calendario (festivos, vacaciones, periodos de registro) ──');
  await calendario.main();

  console.log('── 4. Recursos y contacto institucional ──');
  await recursosContacto.main();

  console.log('✅ 00-comun completo.');
}

main()
  .catch((e) => {
    console.error('❌ 00-comun falló:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
