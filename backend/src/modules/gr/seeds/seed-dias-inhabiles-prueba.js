// seed-dias-inhabiles-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) para tener días
// inhábiles reales en el calendario, útil para probar RN-AH-14
// (esDiaLaborable, CU-AH-03) sin depender de que el seed principal ya
// tenga inhábiles cerca de "hoy".
//
// Qué hace: inserta en evento_calendario dos días inhábiles SUELTOS (no
// un rango — fecha_fin queda NULL) para el 8 y 9 de septiembre de 2026,
// usando el primer coordinador que exista en la BD. Es idempotente: si ya
// existe un evento_calendario con esa fecha_inicio exacta y
// tipo='Inhabil', lo salta en vez de duplicarlo.
//
// USO:
//   node backend/src/modules/gr/seeds/seed-dias-inhabiles-prueba.js

const prisma = require('../../../lib/prisma');

const FECHAS_INHABILES = [
  new Date(Date.UTC(2026, 8, 8)), // 8 de septiembre de 2026
  new Date(Date.UTC(2026, 8, 9)), // 9 de septiembre de 2026
];

async function main() {
  const coordinador = await prisma.coordinador.findFirst();
  if (!coordinador) {
    console.error('❌ No existe ningún coordinador en la BD — no se puede asignar coordinador_id.');
    process.exit(1);
  }
  console.log(`Usando coordinador_id=${coordinador.id}.\n`);

  const resultados = [];

  for (const fecha of FECHAS_INHABILES) {
    const existente = await prisma.evento_calendario.findFirst({
      where: { tipo: 'Inhabil', fecha_inicio: fecha },
    });

    if (existente) {
      console.log(`↷ Ya existía un evento_calendario Inhabil para ${fecha.toISOString().slice(0, 10)} (id=${existente.id}) — se omite.`);
      resultados.push({ fecha, id: existente.id, yaExistia: true });
      continue;
    }

    const creado = await prisma.evento_calendario.create({
      data: {
        coordinador_id: coordinador.id,
        nombre: `[PRUEBA] Día inhábil ${fecha.toISOString().slice(0, 10)}`,
        tipo: 'Inhabil',
        fecha_inicio: fecha,
        fecha_fin: null,
      },
    });
    console.log(`✅ Creado evento_calendario id=${creado.id} para ${fecha.toISOString().slice(0, 10)}.`);
    resultados.push({ fecha, id: creado.id, yaExistia: false });
  }

  console.log('\n--- Resumen ---');
  resultados.forEach((r) => {
    console.log(`${r.fecha.toISOString().slice(0, 10)} -> id=${r.id}${r.yaExistia ? ' (ya existía)' : ' (creado)'}`);
  });

  console.log('\n--- Verificación en BD ---');
  const confirmacion = await prisma.evento_calendario.findMany({
    where: { tipo: 'Inhabil', fecha_inicio: { in: FECHAS_INHABILES } },
    orderBy: { fecha_inicio: 'asc' },
  });
  confirmacion.forEach((e) => {
    console.log(`id=${e.id} | fecha_inicio=${e.fecha_inicio.toISOString().slice(0, 10)} | fecha_fin=${e.fecha_fin} | tipo=${e.tipo} | coordinador_id=${e.coordinador_id}`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al sembrar días inhábiles de prueba:', e);
  process.exit(1);
});
