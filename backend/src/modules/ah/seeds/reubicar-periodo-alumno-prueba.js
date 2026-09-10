// reubicar-periodo-alumno-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI, no se corre en
// pipelines) para poder probar CU-AH-02 (servicioIniciado) y el cron de
// vencimiento de actividades (AH02) sobre un alumno ORGÁNICO real ya
// existente en la BD, sin inventar datos sintéticos.
//
// Qué hace: crea un evento_calendario + periodo_registro NUEVOS (nunca toca
// los originales — otros alumnos pueden compartir ese mismo periodo_registro)
// con fecha_inicio = AYER, conservando el mismo "delta" de días respecto al
// periodo original para fecha_fin y fecha_max_expediente. Luego apunta el
// periodo_registro_id de UN solicitud_registro puntual al nuevo periodo.
//
// Con esto, hoy mismo:
//   (a) CU-AH-02 calculará servicioIniciado = true para ese alumno (su
//       periodo ya "inició" ayer).
//   (b) El profesor podrá asignarle desde CU-AH-01 una actividad real con
//       fecha_limite = hoy (la fecha mínima que pasa la validación, porque
//       debe ser posterior al inicio de AYER), y mañana esa actividad
//       cumplirá fecha_limite < hoy de forma 100% orgánica, sin forzar nada
//       más — lista para que el cron real o test-cron-vencimiento.js la
//       marque como vencida.
//
// USO:
//   docker compose exec backend node backend/src/modules/ah/seeds/reubicar-periodo-alumno-prueba.js <solicitud_registro_id>

const prisma = require('../../../lib/prisma');

/**
 * "Ayer" en día calendario de México (America/Mexico_City), no de UTC —
 * México va detrás de UTC, así que "ayer en UTC" puede seguir siendo "hoy"
 * en hora de México según la hora del día en que se corra el script. Se usa
 * Intl.DateTimeFormat con el timezone explícito (no se hardcodea el offset
 * -6) para obtener el día calendario real de México en este instante.
 *
 * El resultado se guarda como el inicio de ese día calendario mexicano
 * expresado en UTC (medianoche México = 06:00 UTC, mismo criterio que ya
 * usa gr.service.js para Reloj 1/Reloj 2) — fecha_inicio es @db.Date, así
 * que solo importa que caiga en el día calendario correcto.
 */
function ayerUTC() {
  const ahora = new Date();

  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(ahora);
  const obtener = (tipo) => Number(partes.find(p => p.type === tipo).value);

  const anioMx = obtener('year');
  const mesMx = obtener('month') - 1; // 0-indexado para Date.UTC
  const diaMx = obtener('day');

  // Restar 1 día calendario a la fecha de México actual (Date.UTC normaliza
  // solo, sin necesidad de manejar manualmente el desborde de mes/año).
  const ayerCalendarioMx = new Date(Date.UTC(anioMx, mesMx, diaMx - 1));

  return new Date(Date.UTC(
    ayerCalendarioMx.getUTCFullYear(),
    ayerCalendarioMx.getUTCMonth(),
    ayerCalendarioMx.getUTCDate(),
    6, 0, 0, 0,
  ));
}

function hoyUTC() {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
}

function sumarDias(fecha, dias) {
  const base = new Date(fecha);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + dias));
}

function diasEntre(desde, hasta) {
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  return Math.round((hasta.getTime() - desde.getTime()) / MS_POR_DIA);
}

async function main() {
  const [, , solicitudIdArg] = process.argv;
  if (!solicitudIdArg || isNaN(Number(solicitudIdArg))) {
    console.error('Uso: node backend/src/modules/ah/seeds/reubicar-periodo-alumno-prueba.js <solicitud_registro_id>');
    process.exit(1);
  }
  const solicitudId = Number(solicitudIdArg);

  // 1. Cargar el solicitud_registro real con su periodo_registro -> evento_calendario orgánicos.
  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: solicitudId },
    include: {
      alumno: true,
      periodo_registro: { include: { evento_calendario: true } },
    },
  });

  if (!solicitud) {
    console.error(`❌ No existe solicitud_registro con id=${solicitudId}.`);
    process.exit(1);
  }
  if (!solicitud.periodo_registro || !solicitud.periodo_registro.evento_calendario) {
    console.error(`❌ La solicitud_registro id=${solicitudId} no tiene periodo_registro/evento_calendario asignado — no hay nada que reubicar.`);
    process.exit(1);
  }

  const periodoOriginal = solicitud.periodo_registro;
  const eventoOriginal = periodoOriginal.evento_calendario;
  const periodoOriginalId = periodoOriginal.id;

  // 2. Delta de días entre la fecha_inicio ORIGINAL y AYER.
  const ayer = ayerUTC();
  const delta = diasEntre(eventoOriginal.fecha_inicio, ayer);

  console.log(`Solicitud id=${solicitudId} — alumno boleta ${solicitud.alumno.boleta}`);
  console.log(`Periodo original id=${periodoOriginalId}: fecha_inicio=${eventoOriginal.fecha_inicio.toISOString().slice(0, 10)} (NO se toca)`);
  console.log(`Ayer (UTC): ${ayer.toISOString().slice(0, 10)} — delta aplicado: ${delta} día(s)\n`);

  // 3. Nuevo evento_calendario (nunca se edita el original).
  const nuevoEvento = await prisma.evento_calendario.create({
    data: {
      coordinador_id: eventoOriginal.coordinador_id,
      nombre: `${eventoOriginal.nombre} [PRUEBA reubicado solicitud ${solicitudId}]`,
      tipo: 'Periodo',
      fecha_inicio: ayer,
      fecha_fin: eventoOriginal.fecha_fin ? sumarDias(eventoOriginal.fecha_fin, delta) : null,
      hora: eventoOriginal.hora ?? null,
    },
  });

  // 4. Nuevo periodo_registro asociado al evento nuevo.
  const nuevoPeriodo = await prisma.periodo_registro.create({
    data: {
      evento_calendario_id: nuevoEvento.id,
      anio: periodoOriginal.anio,
      semestre: periodoOriginal.semestre,
      fecha_max_expediente: sumarDias(periodoOriginal.fecha_max_expediente, delta),
    },
  });

  // 5. Actualizar SOLO el periodo_registro_id de ESTA solicitud puntual.
  await prisma.solicitud_registro.update({
    where: { id: solicitudId },
    data: { periodo_registro_id: nuevoPeriodo.id },
  });

  // 6. Resumen final.
  const hoy = hoyUTC();
  console.log('✅ Reubicación completa.');
  console.log(`Boleta del alumno: ${solicitud.alumno.boleta}`);
  console.log(`Periodo_registro NUEVO: id=${nuevoPeriodo.id}, evento_calendario id=${nuevoEvento.id}`);
  console.log(`fecha_inicio del periodo nuevo: ${nuevoEvento.fecha_inicio.toISOString().slice(0, 10)} (debe ser AYER)`);
  console.log(`solicitud_registro id=${solicitudId} ahora apunta a periodo_registro_id=${nuevoPeriodo.id}`);
  console.log(`\nFecha_limite MÍNIMA válida para una actividad nueva de este alumno: ${hoy.toISOString().slice(0, 10)} (hoy) — debe ser posterior al inicio de AYER.`);

  console.log('\n-- Para revertir manualmente esta solicitud a su periodo_registro ORIGINAL:');
  console.log(`-- UPDATE solicitud_registro SET periodo_registro_id = ${periodoOriginalId} WHERE id = ${solicitudId};`);
  console.log('-- (el evento_calendario y periodo_registro nuevos creados por este script pueden borrarse aparte si ya no se necesitan)');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al reubicar el periodo del alumno de prueba:', e);
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────────────────
// Para revertir a mano (además del log que imprime el script al correrlo):
//   UPDATE solicitud_registro SET periodo_registro_id = <periodo_original_id> WHERE id = <solicitud_registro_id>;
// ─────────────────────────────────────────────────────────────────────────
