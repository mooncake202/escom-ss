// test-cron-vencimiento.js
//
// Prueba manual del cron de vencimiento de actividades (AH02) sin esperar
// a las 06:00 UTC — llama directamente a marcarActividadesVencidas(), la
// misma función que usa el schedule real de producción (ah.cron.js), sin
// pasar por node-cron ni por HTTP.
//
// ADVERTENCIA: esto SÍ escribe datos reales — cualquier actividad con
// fecha_limite pasada y estado 'sin_comenzar'/'en_progreso' en tu BD real
// quedará marcada como 'vencida', igual que lo haría el cron en producción.
//
// CÓMO CORRERLO (el backend corre en Docker, @prisma/client solo existe
// dentro del contenedor):
//   docker compose exec backend node backend/test-cron-vencimiento.js
//
// Si tu setup corre node directo en el host con acceso a la BD, también
// sirve: node test-cron-vencimiento.js

const prisma = require('./src/lib/prisma');
const { marcarActividadesVencidas } = require('./src/modules/ah/ah.cron');

const ESTADOS_MARCABLES_VENCIDA = ['sin_comenzar', 'en_progreso'];

function calcularCorteMedianocheUTC() {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
}

async function listarConDatosAlumno(where) {
  return prisma.actividad.findMany({
    where,
    include: {
      solicitud_registro: { include: { alumno: { include: { usuario: true } } } },
    },
    orderBy: { id: 'asc' },
  });
}

function describir(a) {
  const al = a.solicitud_registro?.alumno;
  const nombre = al ? `${al.usuario.nombre} ${al.usuario.apellidos} (boleta ${al.boleta}, usuario_id ${al.usuario_id})` : 'alumno desconocido';
  return `  - id=${a.id} "${a.titulo}" estado=${a.estado} fecha_limite=${a.fecha_limite.toISOString().slice(0, 10)} | ${nombre}`;
}

async function main() {
  const corte = calcularCorteMedianocheUTC();
  console.log(`Corte UTC usado (medianoche de hoy): ${corte.toISOString()}\n`);

  // ── ANTES ────────────────────────────────────────────────────────────────
  const candidatasAntes = await listarConDatosAlumno({
    fecha_limite: { lt: corte },
    estado: { in: ESTADOS_MARCABLES_VENCIDA },
  });

  console.log(`Actividades que DEBERÍAN pasar a 'vencida': ${candidatasAntes.length}`);
  candidatasAntes.forEach(a => console.log(describir(a)));

  if (candidatasAntes.length === 0) {
    console.log('\n⚠️  No hay ninguna actividad candidata en este momento.');
    console.log('   Inserta una a mano con fecha_limite pasada y estado "sin_comenzar" o');
    console.log('   "en_progreso" para poder probar el cron, y vuelve a correr este script.');
  }

  // Actividades futuras (control): NO deben tocarse.
  const controlAntes = await listarConDatosAlumno({ fecha_limite: { gte: corte } });
  console.log(`\nActividades con fecha_limite futura (control, NO deben cambiar): ${controlAntes.length}`);
  controlAntes.slice(0, 10).forEach(a => console.log(describir(a)));
  if (controlAntes.length > 10) console.log(`  ... y ${controlAntes.length - 10} más (no impresas)`);

  // ── EJECUCIÓN ────────────────────────────────────────────────────────────
  console.log('\nEjecutando marcarActividadesVencidas()...\n');
  await marcarActividadesVencidas();

  // ── DESPUÉS ──────────────────────────────────────────────────────────────
  const idsCandidatas = candidatasAntes.map(a => a.id);
  const candidatasDespues = idsCandidatas.length
    ? await prisma.actividad.findMany({ where: { id: { in: idsCandidatas } }, orderBy: { id: 'asc' } })
    : [];

  const todasVencidas = candidatasDespues.every(a => a.estado === 'vencida');
  console.log(`Actividades candidatas ahora con estado 'vencida': ${candidatasDespues.filter(a => a.estado === 'vencida').length}/${candidatasDespues.length}`);
  candidatasDespues.forEach(a => console.log(`  - id=${a.id} "${a.titulo}" estado=${a.estado}`));
  console.log(todasVencidas ? '✅ Todas las candidatas quedaron vencida.' : '❌ Alguna candidata NO quedó vencida.');

  const idsControl = controlAntes.map(a => a.id);
  const controlDespues = idsControl.length
    ? await prisma.actividad.findMany({ where: { id: { in: idsControl } } })
    : [];
  const mapaEstadoAntes = new Map(controlAntes.map(a => [a.id, a.estado]));
  const controlIntacto = controlDespues.every(a => mapaEstadoAntes.get(a.id) === a.estado);

  console.log(`\nActividades futuras (control) que NO cambiaron: ${controlDespues.filter(a => mapaEstadoAntes.get(a.id) === a.estado).length}/${controlDespues.length}`);
  console.log(controlIntacto ? '✅ Ninguna actividad futura fue tocada.' : '❌ Alguna actividad futura SÍ cambió (no debería).');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al correr la prueba:', e);
  process.exit(1);
});
