const cron = require('node-cron');
const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');

// RN-AH: solo cambia el estado de la actividad a "vencida" — NO toca
// cumulo_horas_y_faltas, no cuenta faltas, no cierra jornadas de bitácora
// (eso es CU-AH-03, fuera de alcance aquí).
const ESTADOS_MARCABLES_VENCIDA = ['sin_comenzar', 'en_progreso'];

/**
 * Corte a medianoche UTC del día actual, construido explícitamente con
 * Date.UTC(...) — nunca con setHours(), porque eso depende de la zona
 * horaria del proceso Node en vez de usar UTC explícito (mismo motivo por
 * el que GR evita setHours() para su propio corte de medianoche México).
 * 06:00 UTC = medianoche México (UTC-6, sin horario de verano desde 2022),
 * mismo criterio horario que ya usa GR.
 */
function calcularCorteMedianocheUTC() {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
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
      solicitud_registro: { select: { alumno: { select: { usuario_id: true } } } },
    },
  });

  const resultado = await prisma.actividad.updateMany({ where, data: { estado: 'vencida' } });

  const actividadesPorAlumno = new Map();
  for (const a of afectadas) {
    const usuarioId = a.solicitud_registro?.alumno?.usuario_id;
    if (!usuarioId) continue;
    if (!actividadesPorAlumno.has(usuarioId)) actividadesPorAlumno.set(usuarioId, []);
    actividadesPorAlumno.get(usuarioId).push({ id: a.id, titulo: a.titulo });
  }
  for (const [usuarioId, actividades] of actividadesPorAlumno) {
    try {
      emitirAUsuario(usuarioId, 'actividad:vencida', { actividades });
    } catch (err) {
      console.error('[ah.cron] Error al emitir actividad:vencida:', err.message);
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

module.exports = { iniciarCronVencimientoActividades, marcarActividadesVencidas };
