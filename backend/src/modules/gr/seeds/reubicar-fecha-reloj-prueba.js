// reubicar-fecha-reloj-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) para probar Reloj 1
// y Reloj 2 (verificarYAplicarVencimiento, gr.service.js) sobre una
// solicitud_registro ORGÁNICA real ya existente en la BD, sin esperar a
// que lleguen las fechas reales del seed (muchas están en 2027).
//
// Qué hace: crea un evento_calendario + periodo_registro NUEVOS (nunca
// toca los originales — otras solicitudes podrían compartirlos) moviendo
// SOLO el campo relevante al reloj elegido al pasado, y apunta el
// periodo_registro_id de UNA solicitud_registro puntual a ese periodo
// nuevo. No reimplementa la lógica de vencimiento — con --disparar llama
// directo a la función real ya exportada de gr.service.js.
//
// USO:
//   docker compose exec backend node backend/src/modules/gr/seeds/reubicar-fecha-reloj-prueba.js <solicitud_registro_id> <reloj1|reloj2> [--disparar]
//
// Sin --disparar: solo mueve la fecha al pasado — el reloj se disparará
// orgánicamente en el próximo login/polling real de ese alumno.
// Con --disparar: además invoca verificarYAplicarVencimiento(solicitudId)
// de inmediato y muestra el resultado.

const prisma = require('../../../lib/prisma');
const { verificarYAplicarVencimiento } = require('../gr.service');

// Copiadas literalmente de gr.service.js (NO exportadas desde ahí) —
// mantener sincronizadas si cambian:
//   ESTADOS_SIN_RELOJ  -> gr.service.js líneas 300-305
//   ESTADOS_RELOJ_2    -> gr.service.js línea 312
const ESTADOS_SIN_RELOJ = [
  'rechazada_definitivamente',
  'modificar_reenviar',
  'alumno_asignado',
  'expediente_aprobado',
];
const ESTADOS_RELOJ_2 = ['expediente_pendiente_revision', 'expediente_con_correcciones'];

/**
 * "Ayer" en día calendario de México (America/Mexico_City) — mismo cálculo
 * ya validado en reubicar-periodo-alumno-prueba.js (AH). Devuelve la
 * medianoche México de ese día expresada en UTC (06:00 UTC).
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

  const ayerCalendarioMx = new Date(Date.UTC(anioMx, mesMx, diaMx - 1));

  return new Date(Date.UTC(
    ayerCalendarioMx.getUTCFullYear(),
    ayerCalendarioMx.getUTCMonth(),
    ayerCalendarioMx.getUTCDate(),
    6, 0, 0, 0,
  ));
}

function sumarDias(fecha, dias) {
  const base = new Date(fecha);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + dias));
}

const USO = 'Uso: node backend/src/modules/gr/seeds/reubicar-fecha-reloj-prueba.js <solicitud_registro_id> <reloj1|reloj2> [--disparar]';

async function main() {
  const [, , solicitudIdArg, modoArg, ...resto] = process.argv;

  if (!solicitudIdArg || isNaN(Number(solicitudIdArg))) {
    console.error('❌ Falta o es inválido <solicitud_registro_id>.\n' + USO);
    process.exit(1);
  }
  if (modoArg !== 'reloj1' && modoArg !== 'reloj2') {
    console.error(`❌ Modo inválido: "${modoArg}". Debe ser exactamente "reloj1" o "reloj2".\n${USO}`);
    process.exit(1);
  }
  const solicitudId = Number(solicitudIdArg);
  const disparar = resto.includes('--disparar');

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
  if (solicitud.estado_solicitud === 'rechazada_definitivamente') {
    console.error(`❌ La solicitud id=${solicitudId} ya está en 'rechazada_definitivamente' — no tiene sentido probar el vencimiento sobre una solicitud ya vencida/rechazada.`);
    process.exit(1);
  }

  if (modoArg === 'reloj1') {
    if (ESTADOS_SIN_RELOJ.includes(solicitud.estado_solicitud) || ESTADOS_RELOJ_2.includes(solicitud.estado_solicitud)) {
      console.error(
        `❌ El estado actual "${solicitud.estado_solicitud}" no aplica a Reloj 1.\n` +
        `   ESTADOS_SIN_RELOJ (ningún reloj aplica): ${ESTADOS_SIN_RELOJ.join(', ')}\n` +
        `   ESTADOS_RELOJ_2 (usa Reloj 2, no Reloj 1): ${ESTADOS_RELOJ_2.join(', ')}\n` +
        `   Reloj 1 aplica a cualquier OTRO estado con periodo_registro asignado.`
      );
      process.exit(1);
    }
  } else {
    if (!ESTADOS_RELOJ_2.includes(solicitud.estado_solicitud)) {
      console.error(
        `❌ El estado actual "${solicitud.estado_solicitud}" no aplica a Reloj 2.\n` +
        `   Reloj 2 solo aplica a: ${ESTADOS_RELOJ_2.join(', ')}`
      );
      process.exit(1);
    }
  }

  const periodoOriginal = solicitud.periodo_registro;
  const eventoOriginal = periodoOriginal.evento_calendario;
  const periodoOriginalId = periodoOriginal.id;
  const ayer = ayerUTC();

  console.log(`Solicitud id=${solicitudId} — alumno boleta ${solicitud.alumno.boleta} — estado actual: ${solicitud.estado_solicitud}`);
  console.log(`Modo: ${modoArg}`);
  console.log(`Ayer (México, en UTC): ${ayer.toISOString().slice(0, 10)}\n`);

  let nuevaFechaInicio;
  let nuevaFechaFin;
  let nuevaFechaMaxExpediente;

  if (modoArg === 'reloj1') {
    // Reloj 1 mira fecha_max_expediente — fecha_inicio/fecha_fin del
    // evento se quedan iguales al original, no se tocan.
    nuevaFechaInicio = eventoOriginal.fecha_inicio;
    nuevaFechaFin = eventoOriginal.fecha_fin;
    nuevaFechaMaxExpediente = ayer;
    console.log(`fecha_max_expediente original: ${new Date(periodoOriginal.fecha_max_expediente).toISOString().slice(0, 10)} -> nueva (ayer): ${ayer.toISOString().slice(0, 10)}`);
  } else {
    // Reloj 2 mira fecha_inicio — fecha_max_expediente se queda igual al
    // original, no se toca.
    nuevaFechaInicio = ayer;
    nuevaFechaFin = eventoOriginal.fecha_fin;
    if (nuevaFechaFin && new Date(nuevaFechaFin) < ayer) {
      console.log('⚠️  fecha_fin original cae antes de "ayer" — se ajusta a ayer + 1 para mantener coherencia básica.');
      nuevaFechaFin = sumarDias(ayer, 1);
    }
    nuevaFechaMaxExpediente = periodoOriginal.fecha_max_expediente;
    console.log(`fecha_inicio original: ${new Date(eventoOriginal.fecha_inicio).toISOString().slice(0, 10)} -> nueva (ayer): ${ayer.toISOString().slice(0, 10)}`);
  }

  // Evento_calendario nuevo — el original NUNCA se toca (otras
  // solicitudes podrían compartirlo).
  const nuevoEvento = await prisma.evento_calendario.create({
    data: {
      coordinador_id: eventoOriginal.coordinador_id,
      nombre: `${eventoOriginal.nombre} [PRUEBA ${modoArg} solicitud ${solicitudId}]`,
      tipo: 'Periodo',
      fecha_inicio: nuevaFechaInicio,
      fecha_fin: nuevaFechaFin,
      hora: eventoOriginal.hora ?? null,
    },
  });

  // Periodo_registro nuevo asociado al evento nuevo.
  const nuevoPeriodo = await prisma.periodo_registro.create({
    data: {
      evento_calendario_id: nuevoEvento.id,
      anio: periodoOriginal.anio,
      semestre: periodoOriginal.semestre,
      fecha_max_expediente: nuevaFechaMaxExpediente,
    },
  });

  // Actualizar SOLO el periodo_registro_id de ESTA solicitud puntual.
  await prisma.solicitud_registro.update({
    where: { id: solicitudId },
    data: { periodo_registro_id: nuevoPeriodo.id },
  });

  console.log('\n✅ Reubicación completa.');
  console.log(`Boleta del alumno: ${solicitud.alumno.boleta}`);
  console.log(`Periodo_registro NUEVO: id=${nuevoPeriodo.id}, evento_calendario id=${nuevoEvento.id}`);

  if (!disparar) {
    console.log('\n(Sin --disparar: el reloj se aplicará orgánicamente en el próximo login/polling real de este alumno.)');
  } else {
    console.log('\n--disparar activado — llamando a verificarYAplicarVencimiento(solicitudId)...\n');

    const antes = await prisma.solicitud_registro.findUnique({
      where: { id: solicitudId },
      select: { estado_solicitud: true, tipo_rechazo: true, motivo_rechazo: true },
    });
    console.log('ANTES:', antes);

    await verificarYAplicarVencimiento(solicitudId);

    const despues = await prisma.solicitud_registro.findUnique({
      where: { id: solicitudId },
      select: { estado_solicitud: true, tipo_rechazo: true, motivo_rechazo: true },
    });
    console.log('DESPUÉS:', despues);
    console.log(despues.estado_solicitud === 'rechazada_definitivamente'
      ? '✅ El reloj se disparó — solicitud pasó a rechazada_definitivamente.'
      : '⚠️  La solicitud NO cambió de estado — revisa la fecha movida contra "ahora".');
  }

  console.log('\n-- Para revertir manualmente esta solicitud a su periodo_registro ORIGINAL:');
  console.log(`-- UPDATE solicitud_registro SET periodo_registro_id = ${periodoOriginalId} WHERE id = ${solicitudId};`);
  console.log('-- (el evento_calendario y periodo_registro nuevos creados por este script pueden borrarse aparte si ya no se necesitan)');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al reubicar la fecha del reloj de prueba:', e);
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────────────────
// Para revertir a mano (además del log que imprime el script al correrlo):
//   UPDATE solicitud_registro SET periodo_registro_id = <periodo_original_id> WHERE id = <solicitud_registro_id>;
// ─────────────────────────────────────────────────────────────────────────
