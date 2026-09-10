const cron = require('node-cron');
const prisma = require('../../lib/prisma');

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

  const resultado = await prisma.actividad.updateMany({
    where: {
      fecha_limite: { lt: corte },
      estado: { in: ESTADOS_MARCABLES_VENCIDA },
    },
    data: { estado: 'vencida' },
  });

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
