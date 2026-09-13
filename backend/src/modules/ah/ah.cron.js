const cron = require('node-cron');
const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');
const { formatearFecha } = require('./validators');
const {
  HORAS_POR_JORNADA,
  LIMITE_HORAS_SERVICIO,
  calcularDiaMexicoUTC,
  restarDias,
  esDiaLaborable,
  obtenerBitacoraDelDia,
  obtenerOCrearCumulo,
} = require('./ah.shared');

// RN-AH: solo cambia el estado de la actividad a "vencida" — NO toca
// cumulo_horas_y_faltas, no cuenta faltas, no cierra jornadas de bitácora
// (eso es CU-AH-03, fuera de alcance aquí).
const ESTADOS_MARCABLES_VENCIDA = ['sin_comenzar', 'en_progreso'];

/**
 * Corte a medianoche del día calendario MÉXICO actual, expresado en UTC
 * (00:00 UTC de ese día — mismo formato/base de comparación que ya usan
 * los `fecha_limite` @db.Date almacenados).
 *
 * Antes esto se calculaba con `ahora.getUTCFullYear/Month/Date()` — daba
 * el resultado correcto SOLO porque el cron real siempre se dispara
 * exactamente a las 06:00 UTC (momento en el que el día calendario UTC y
 * el día calendario México coinciden). Si esta función se invoca a otra
 * hora (ej. manualmente desde test-cron-vencimiento.js), entre las
 * 00:00-05:59 UTC el día calendario UTC ya es "mañana" mientras que en
 * México todavía es "hoy" — el corte quedaba hasta 6 horas adelantado.
 *
 * Ahora se resuelve el día calendario México real con Intl.DateTimeFormat
 * (timeZone explícito, sin hardcodear el offset -6) — mismo patrón ya
 * validado en reubicar-periodo-alumno-prueba.js y
 * reubicar-fecha-reloj-prueba.js. A las 06:00 UTC exactas (el schedule
 * real de producción) da EXACTAMENTE el mismo resultado que antes.
 *
 * `ahora` es parametrizable (default `new Date()`) solo para poder
 * probar el cálculo en un instante fijo sin esperar la hora real ni
 * mockear el reloj global — el comportamiento por defecto no cambia.
 */
function calcularCorteMedianocheUTC(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(ahora);
  const obtener = (tipo) => Number(partes.find(p => p.type === tipo).value);

  const anioMx = obtener('year');
  const mesMx = obtener('month') - 1; // 0-indexado para Date.UTC
  const diaMx = obtener('day');

  return new Date(Date.UTC(anioMx, mesMx, diaMx));
}

async function marcarActividadesVencidas() {
  const corte = calcularCorteMedianocheUTC();
  const where = {
    fecha_limite: { lt: corte },
    estado: { in: ESTADOS_MARCABLES_VENCIDA },
  };

  // Socket (Parte 2): un updateMany por sí solo pierde de vista A QUÉ
  // alumnos afectó — se resuelve ANTES del updateMany, con el mismo
  // `where`, para poder emitirles después (agrupado por alumno, una sola
  // vez cada uno aunque tengan varias actividades vencidas el mismo día).
  const afectadas = await prisma.actividad.findMany({
    where,
    select: {
      id: true,
      titulo: true,
      solicitud_registro: {
        select: {
          alumno: { select: { usuario_id: true } },
          oferta: { select: { profesor: { select: { usuario_id: true } } } },
        },
      },
    },
  });

  const resultado = await prisma.actividad.updateMany({ where, data: { estado: 'vencida' } });

  const actividadesPorAlumno = new Map();
  const profesoresAfectados = new Set();
  for (const a of afectadas) {
    const usuarioId = a.solicitud_registro?.alumno?.usuario_id;
    if (usuarioId) {
      if (!actividadesPorAlumno.has(usuarioId)) actividadesPorAlumno.set(usuarioId, []);
      actividadesPorAlumno.get(usuarioId).push({ id: a.id, titulo: a.titulo });
    }
    const profesorUsuarioId = a.solicitud_registro?.oferta?.profesor?.usuario_id;
    if (profesorUsuarioId) profesoresAfectados.add(profesorUsuarioId);
  }
  for (const [usuarioId, actividades] of actividadesPorAlumno) {
    try {
      emitirAUsuario(usuarioId, 'actividad:vencida', { actividades });
    } catch (err) {
      console.error('[ah.cron] Error al emitir actividad:vencida:', err.message);
    }
  }
  // Genérico (fail-open): una actividad que vence puede cambiar
  // actividadesProximasACaducar/alumnoSinActividades del profesor dueño.
  for (const profesorUsuarioId of profesoresAfectados) {
    try {
      emitirAUsuario(profesorUsuarioId, 'resumen:actualizado', {});
    } catch (err) {
      console.error('[ah.cron] Error al emitir resumen:actualizado (profesor):', err.message);
    }
  }

  console.log(`[ah.cron] Actividades marcadas como vencidas: ${resultado.count}`);
  return resultado.count;
}

function iniciarCronVencimientoActividades() {
  cron.schedule('0 6 * * *', async () => {
    try {
      await marcarActividadesVencidas();
    } catch (err) {
      console.error('[ah.cron] Error al marcar actividades vencidas:', err);
    }
  }, { timezone: 'UTC' });

  console.log('[ah.cron] Cron de vencimiento de actividades registrado (06:00 UTC diario).');
}

// ─────────────────────────────────────────────────────────────
// CU-AH-03: jornadas abandonadas (auto-cierre) y faltas nocturnas.
// No toca nada de lo de arriba (vencimiento de actividades, AH-01/AH-02).
// ─────────────────────────────────────────────────────────────

/**
 * Cada 15 min: cualquier bitácora 'en_curso' cuya hora_inicio ya pasó las 4
 * horas se auto-cierra a 'pendiente_datos' (hora_fin=hora_inicio+4h,
 * horas_contabilizadas=4), SIN crear registro_bitacora_actividades todavía
 * — eso se crea hasta que el alumno complete el formulario después. Mismo
 * patrón de batch (candidatas + try/catch individual, nunca aborta el
 * lote) que ya usa gr.cron.js.
 */
async function cerrarJornadasAbandonadas() {
  const corte = new Date(Date.now() - HORAS_POR_JORNADA * 3600 * 1000);

  const candidatas = await prisma.bitacora.findMany({
    where: { estado: 'en_curso', hora_inicio: { lte: corte } },
    select: {
      id: true,
      hora_inicio: true,
      solicitud_registro: { select: { alumno: { select: { usuario_id: true } } } },
    },
  });

  let cerradas = 0;
  for (const b of candidatas) {
    try {
      await prisma.bitacora.update({
        where: { id: b.id },
        data: {
          estado: 'pendiente_datos',
          hora_fin: new Date(b.hora_inicio.getTime() + HORAS_POR_JORNADA * 3600 * 1000),
          horas_contabilizadas: HORAS_POR_JORNADA,
        },
      });
      cerradas++;

      const usuarioAlumno = b.solicitud_registro?.alumno?.usuario_id;
      if (usuarioAlumno) {
        try {
          emitirAUsuario(usuarioAlumno, 'resumen:actualizado', {});
        } catch (err) {
          console.error('[ah.cron] Error al emitir resumen:actualizado (auto-cierre):', err.message);
        }
      }
    } catch (err) {
      console.error(`[ah.cron] Error al auto-cerrar bitacora id=${b.id}:`, err);
    }
  }

  console.log(`[ah.cron] Jornadas auto-cerradas por abandono: ${cerradas}`);
  return cerradas;
}

// Cota de seguridad para el recorrido de días pendientes por alumno — si
// el cron no corrió por mucho tiempo (bug, migración de datos, etc.), no
// tiene sentido de negocio "cobrar" faltas de hace meses en una sola
// corrida. 60 días cubre con margen amplio cualquier apagón realista
// (días/semanas) sin permitir un recorrido descontrolado.
const LIMITE_DIAS_RECORRIDO_FALTAS = 60;

/**
 * RN-AH-13, cada noche a las 06:00 UTC (medianoche México): por cada
 * solicitud_registro 'alumno_asignado' que NO haya completado ya las 480
 * horas (RN-AH-17 — un alumno que ya terminó su servicio no debe seguir
 * acumulando faltas por no registrar bitácora), recorre TODOS los días
 * pendientes
 * de evaluar (desde el día siguiente a fecha_ultima_evaluacion_faltas, o
 * desde el propio fecha_inicio si nunca se evaluó — el día de inicio ya
 * es una jornada laboral válida, cuenta como cualquier otra — hasta AYER
 * inclusive) — no solo "ayer" — para que un cron que no corrió uno o
 * varios días (servidor apagado) no pierda esos días para siempre.
 *
 * Por cada día del recorrido, en orden cronológico:
 * - No laborable (fin de semana/Inhabil/Vacacional): transparente — no
 *   cuenta como falta NI rompe la racha en curso.
 * - Laborable con bitácora ese día (cualquier estado): resetea la racha
 *   hacia ADELANTE (no reescribe faltas ya contadas antes en el mismo
 *   recorrido).
 * - Laborable sin bitácora: +1 a faltas_acumuladas y a faltas_consecutivas,
 *   y se notifica al alumno por ESE día específico.
 *
 * Al terminar el recorrido de un alumno (si evaluó al menos un día),
 * fecha_ultima_evaluacion_faltas, faltas_acumuladas y faltas_consecutivas
 * se escriben juntos en una sola transacción — así nunca queda uno
 * actualizado sin el otro si algo falla a mitad del recorrido. Las
 * notificaciones (best-effort, fail-open) se crean DESPUÉS de que esa
 * transacción ya confirmó.
 *
 * `ahora` parametrizable para poder probarla en un instante fijo, mismo
 * criterio ya usado en calcularCorteMedianocheUTC.
 *
 * La notificación al PROFESOR sobre faltas críticas no vive aquí — es un
 * slot Tipo A calculado en dashboard.service.js (resumenProfesor,
 * alumnosConFaltasCriticas: faltas_consecutivas>=5 O faltas_acumuladas>=18).
 */
async function contabilizarFaltasDiarias(ahora = new Date()) {
  const hoy = calcularDiaMexicoUTC(ahora);
  const ayerLimite = restarDias(hoy, 1); // último día evaluable, inclusive

  const candidatas = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'alumno_asignado' },
    select: {
      id: true,
      alumno: { select: { boleta: true, usuario_id: true } },
      oferta: { select: { profesor: { select: { usuario_id: true } } } },
      periodo_registro: { select: { evento_calendario: { select: { fecha_inicio: true } } } },
    },
  });

  let faltas = 0;
  let alumnosEvaluados = 0;

  for (const s of candidatas) {
    try {
      const fechaInicio = s.periodo_registro?.evento_calendario?.fecha_inicio ?? null;
      if (!fechaInicio) continue; // sin periodo, no puede faltar

      const boleta = s.alumno.boleta;
      const cumulo = await obtenerOCrearCumulo(boleta);

      // RN-AH-17: un alumno que ya completó las 480 horas no debe seguir
      // acumulando faltas por no registrar bitácora — ya terminó su
      // servicio social, aunque su estado_solicitud siga en
      // 'alumno_asignado' (el cierre formal de la solicitud es otro CU).
      // No se toca iniciarJornada — esa validación es independiente.
      if (cumulo.horas_acumuladas >= LIMITE_HORAS_SERVICIO) continue;

      const puntoPartidaPorFechaInicio = new Date(fechaInicio); // el propio día de inicio ya es evaluable
      const puntoPartidaPorUltimaEvaluacion = cumulo.fecha_ultima_evaluacion_faltas
        ? restarDias(new Date(cumulo.fecha_ultima_evaluacion_faltas), -1) // día siguiente
        : null;

      // Resguardo defensivo: nunca evaluar días anteriores al inicio real
      // del servicio del alumno, sin importar qué diga
      // fecha_ultima_evaluacion_faltas — en operación normal el cron nunca
      // deja ese campo antes de fecha_inicio, pero si algún desalineamiento
      // de datos (reubicación manual, migración, etc.) lo dejara así, no
      // debe "cobrar" faltas de antes de que el alumno siquiera empezara.
      let puntoPartida = puntoPartidaPorUltimaEvaluacion && puntoPartidaPorUltimaEvaluacion > puntoPartidaPorFechaInicio
        ? puntoPartidaPorUltimaEvaluacion
        : puntoPartidaPorFechaInicio;

      if (puntoPartida > ayerLimite) continue; // nada pendiente por evaluar todavía

      const diasTotales = Math.round((ayerLimite - puntoPartida) / 86400000) + 1;
      if (diasTotales > LIMITE_DIAS_RECORRIDO_FALTAS) {
        console.warn(`[ah.cron] Recorrido de faltas truncado para boleta ${boleta}: ${diasTotales} días pendientes, se evalúan solo los últimos ${LIMITE_DIAS_RECORRIDO_FALTAS}.`);
        puntoPartida = restarDias(ayerLimite, LIMITE_DIAS_RECORRIDO_FALTAS - 1);
      }

      let consecutivas = cumulo.faltas_consecutivas;
      let deltaAcumuladas = 0;
      const diasConFalta = [];

      for (let d = puntoPartida; d <= ayerLimite; d = restarDias(d, -1)) {
        if (!(await esDiaLaborable(d))) continue; // transparente para la racha

        const bitacoraDelDia = await obtenerBitacoraDelDia(s.id, d);
        if (bitacoraDelDia) {
          consecutivas = 0; // rompe hacia adelante, no hacia atrás
        } else {
          deltaAcumuladas++;
          consecutivas++;
          diasConFalta.push(d);
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.cumulo_horas_y_faltas.update({
          where: { alumno_id: boleta },
          data: {
            faltas_acumuladas: { increment: deltaAcumuladas },
            faltas_consecutivas: consecutivas,
            fecha_ultima_evaluacion_faltas: ayerLimite,
          },
        });
      });

      faltas += diasConFalta.length;
      alumnosEvaluados++;

      for (const dia of diasConFalta) {
        await crearNotificacion({
          usuarioId: s.alumno.usuario_id,
          tipo: 'warning',
          mensaje: `Faltaste el ${formatearFecha(dia)}. Registra tu bitácora cada día laborable.`,
          rutaRelacionada: '/alumno/horas',
        });
      }

      // Socket genérico (fail-open): si se contabilizó al menos 1 falta o se
      // actualizó el cúmulo de este alumno, avisa a su propio dashboard Y al
      // del profesor correspondiente (afecta alumnosConFaltasCriticas) — no
      // se verifica si cruzó algún umbral exacto, sobre-emitir aquí es
      // inofensivo (el frontend solo recalcula al recargar su resumen).
      if (diasConFalta.length > 0) {
        try {
          emitirAUsuario(s.alumno.usuario_id, 'resumen:actualizado', {});
        } catch (err) {
          console.error('[ah.cron] Error al emitir resumen:actualizado (alumno, faltas):', err.message);
        }
        const usuarioProfesor = s.oferta?.profesor?.usuario_id;
        if (usuarioProfesor) {
          try {
            emitirAUsuario(usuarioProfesor, 'resumen:actualizado', {});
          } catch (err) {
            console.error('[ah.cron] Error al emitir resumen:actualizado (profesor, faltas):', err.message);
          }
        }
      }
    } catch (err) {
      console.error(`[ah.cron] Error al contabilizar faltas de solicitud id=${s.id}:`, err);
    }
  }

  console.log(`[ah.cron] Faltas contabilizadas: ${faltas}, alumnos evaluados: ${alumnosEvaluados}.`);
  return { faltas, alumnosEvaluados };
}

function iniciarCronsBitacora() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await cerrarJornadasAbandonadas();
    } catch (err) {
      console.error('[ah.cron] Error al cerrar jornadas abandonadas:', err);
    }
  }, { timezone: 'UTC' });

  cron.schedule('0 6 * * *', async () => {
    try {
      await contabilizarFaltasDiarias();
    } catch (err) {
      console.error('[ah.cron] Error al contabilizar faltas diarias:', err);
    }
  }, { timezone: 'UTC' });

  console.log('[ah.cron] Crons de bitácora registrados (auto-cierre: cada 15 min, faltas: 06:00 UTC diario).');
}

module.exports = {
  iniciarCronVencimientoActividades,
  marcarActividadesVencidas,
  calcularCorteMedianocheUTC,
  iniciarCronsBitacora,
  cerrarJornadasAbandonadas,
  contabilizarFaltasDiarias,
};
