// 01-catalogos.js
//
// Catálogos globales del sistema: `carrera` y `caracteristica`. Una sola
// versión para todo el sistema (demo-final y, más adelante, video-tutorial).
//
// `caracteristica` es un ESPEJO del catálogo real que vive en
// backend/src/lib/seedCaracteristicas.js (dueña: Sol, módulo AMD CU-ADM-15/16).
// Ese archivo sigue siendo la fuente de verdad para AMD. Si Sol lo corrige,
// este array debe actualizarse igual para que ambas partes queden con el
// mismo catálogo — ver backend/src/seeds/README.md.

const prisma = require('../../../lib/prisma');

const CARRERAS = ['ISC', 'IA', 'LCD'];

const CARACTERISTICAS = [
  { nombre: 'Investigador', incremento_cupos: 1 },
  { nombre: 'Presidente_de_academia', incremento_cupos: 2 },
  { nombre: 'Coordinador', incremento_cupos: 2 },
  { nombre: 'Jefe_de_departamento', incremento_cupos: 3 },
  { nombre: 'Funcionario', incremento_cupos: 3 },
  { nombre: 'Profesor_coordinador_de_clubes', incremento_cupos: 3 },
];

async function crearCarreras() {
  const idPorNombre = {};
  for (const nombre of CARRERAS) {
    let carrera = await prisma.carrera.findFirst({ where: { nombre } });
    if (!carrera) {
      carrera = await prisma.carrera.create({ data: { nombre } });
      console.log(`✅ carrera creada: ${nombre} (id ${carrera.id})`);
    } else {
      console.log(`↷ carrera ya existía: ${nombre} (id ${carrera.id})`);
    }
    idPorNombre[nombre] = carrera.id;
  }
  return idPorNombre;
}

async function crearCaracteristicas() {
  for (const c of CARACTERISTICAS) {
    const resultado = await prisma.caracteristica.upsert({
      where: { nombre: c.nombre },
      update: { incremento_cupos: c.incremento_cupos },
      create: c,
    });
    console.log(`✅ característica: ${resultado.nombre} (incremento_cupos: ${resultado.incremento_cupos})`);
  }
}

async function main() {
  const carrerasIds = await crearCarreras();
  await crearCaracteristicas();
  return { carrerasIds };
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en 01-catalogos.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, CARRERAS, CARACTERISTICAS };
