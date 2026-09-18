// recalcular-cupos-totales.js
//
// Ajuste ÚNICO por el cambio de modelo de cupos (Investigador deja de ser
// excepción y pasa a ser una característica normal de +1):
//   1) Catálogo: caracteristica 'Investigador'.incremento_cupos -> 1
//   2) profesor.cupos_totales de cada profesor que tiene Investigador:
//        cupos_totales = CUPOS_BASE (3) + incremento de su característica.
//
// Regla de negocio: todo profesor es "base" (3 cupos) y puede tener COMO
// MÁXIMO UNA característica adicional. Hoy el sistema (usuarios.service.js,
// formulario de crear usuario con multi-selección) permite guardar VARIAS
// filas aprobadas para el mismo profesor — hueco del módulo ADM, no de GR.
// Este script NO lo corrige ni elige por nadie: si un profesor tiene más de
// una característica aprobada, calcula con la suma (igual que
// usuarios.service.js hoy) pero lo marca con ⚠ para revisión manual.
//
// SEGURO POR DEFECTO: sin flags solo IMPRIME lo que cambiaría (dry-run).
// Para escribir:  node backend/src/lib/recalcular-cupos-totales.js --aplicar
// Idempotente (recalcula desde cero). Requiere DATABASE_URL en el entorno.

const prisma = require('./prisma');
const { contarCuposOcupados } = require('./cupos');

const CUPOS_BASE = 3;
const INCREMENTO_INVESTIGADOR = 1;
// Ortografía oficial: 'aprobada'. 'aprobado' se acepta SOLO para las filas
// viejas que usuarios.service.js escribió antes de unificar (hasta que se
// corra el UPDATE de normalización, ya no hace falta).
const ESTADOS_APROBADA = ['aprobado', 'aprobada'];
const APLICAR = process.argv.includes('--aplicar');

async function main() {
  console.log(APLICAR ? '=== MODO APLICAR ===' : '=== DRY-RUN (no escribe nada; usa --aplicar) ===');

  const investigador = await prisma.caracteristica.findUnique({ where: { nombre: 'Investigador' } });
  if (!investigador) {
    throw new Error("No existe la característica 'Investigador' en el catálogo. Corre seedCaracteristicas.js primero.");
  }
  console.log(`Catálogo: Investigador.incremento_cupos ${investigador.incremento_cupos} -> ${INCREMENTO_INVESTIGADOR}\n`);

  const profesores = await prisma.profesor.findMany({
    where: {
      solicitud_caracteristica: {
        some: { caracteristica_id: investigador.id, estado: { in: ESTADOS_APROBADA } },
      },
    },
    include: {
      usuario: { select: { correo_institucional: true } },
      solicitud_caracteristica: {
        where: { estado: { in: ESTADOS_APROBADA } },
        include: { caracteristica: true },
      },
    },
    orderBy: { id: 'asc' },
  });

  const cambios = [];
  for (const p of profesores) {
    const incrementos = p.solicitud_caracteristica.map((s) =>
      s.caracteristica_id === investigador.id ? INCREMENTO_INVESTIGADOR : s.caracteristica.incremento_cupos
    );
    const nuevoTotal = CUPOS_BASE + incrementos.reduce((a, b) => a + b, 0);
    const ocupados = await contarCuposOcupados(p.id);
    const nombres = p.solicitud_caracteristica.map((s) => s.caracteristica.nombre).join(' + ');

    const avisos = [];
    if (p.solicitud_caracteristica.length > 1) avisos.push('VIOLA la regla: máximo UNA característica adicional (hueco ADM) — revisar a mano');
    if (nuevoTotal < ocupados) avisos.push(`nuevo total < ocupados (${ocupados})`);

    console.log(
      `${p.usuario.correo_institucional.padEnd(38)} [${nombres}]  cupos_totales ${p.cupos_totales} -> ${nuevoTotal}` +
      `  (ocupados ahora: ${ocupados})${nuevoTotal === p.cupos_totales ? '  = sin cambio' : ''}` +
      (avisos.length ? `  ⚠ ${avisos.join('; ')}` : '')
    );

    if (nuevoTotal !== p.cupos_totales) cambios.push({ id: p.id, nuevoTotal });
  }

  console.log(`\n${profesores.length} profesor(es) con Investigador, ${cambios.length} con cambio de cupos_totales.`);

  if (!APLICAR) {
    console.log('Dry-run: no se escribió nada. Repite con --aplicar para ejecutar.');
    return;
  }

  await prisma.$transaction([
    prisma.caracteristica.update({ where: { id: investigador.id }, data: { incremento_cupos: INCREMENTO_INVESTIGADOR } }),
    ...cambios.map((c) => prisma.profesor.update({ where: { id: c.id }, data: { cupos_totales: c.nuevoTotal } })),
  ]);
  console.log('✅ Aplicado en una sola transacción.');
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
