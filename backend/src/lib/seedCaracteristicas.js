// Colócalo junto a tu prisma.js real (ej. backend/src/lib/seedCaracteristicas.js)
// para que el require de abajo lo encuentre con './prisma'.

const prisma = require('./prisma');

// Valores tomados de profesoresData.js (CARACTERISTICAS), ahora como fuente única de verdad en BD.
const CARACTERISTICAS = [
  { nombre: 'Presidente_de_academia', incremento_cupos: 2 },
  { nombre: 'Coordinador', incremento_cupos: 2 },
  { nombre: 'Jefe_de_departamento', incremento_cupos: 3 },
  { nombre: 'Funcionario', incremento_cupos: 3 },
  { nombre: 'Profesor_coordinador_de_clubes', incremento_cupos: 3 },
  { nombre: 'Investigador', incremento_cupos: 0 },
];

async function main() {
  for (const c of CARACTERISTICAS) {
    const resultado = await prisma.caracteristica.upsert({
      where: { nombre: c.nombre },
      update: { incremento_cupos: c.incremento_cupos },
      create: c,
    });
    console.log(`✓ ${resultado.nombre} (incremento_cupos: ${resultado.incremento_cupos})`);
  }
}

main()
  .catch((e) => {
    console.error('Error al sembrar caracteristica:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());