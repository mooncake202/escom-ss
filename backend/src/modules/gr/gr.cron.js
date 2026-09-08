const cron = require('node-cron');
const prisma = require('../../lib/prisma');
const { verificarYAplicarVencimiento, ESTADOS_SIN_RELOJ, ESTADOS_RELOJ_2 } = require('./gr.service');

// Reloj 1 y Reloj 2 (RN-GR-04/RN-GR-63) — este archivo SOLO encuentra
// candidatas y llama a verificarYAplicarVencimiento(id) en batch, igual
// que ah.cron.js hace con marcarActividadesVencidas. El cálculo del
// instante exacto de corte (14:00 México para Reloj 1, medianoche México
// para Reloj 2) ya vive, correcto y verificado, dentro de
// verificarYAplicarVencimiento — no se duplica ni se reescribe aquí.

/**
 * Reloj 1 (RN-GR-04) — fecha_max_expediente, corte real 14:00 México.
 * Candidatas: cualquier solicitud con periodo_registro asignado cuyo
 * estado no esté en ESTADOS_SIN_RELOJ ni en ESTADOS_RELOJ_2 (esos usan
 * Reloj 2 o ningún reloj).
 */
async function ejecutarVencimientoReloj1() {
  const candidatas = await prisma.solicitud_registro.findMany({
    where: {
      periodo_registro_id: { not: null },
      estado_solicitud: { notIn: [...ESTADOS_SIN_RELOJ, ...ESTADOS_RELOJ_2] },
    },
    select: { id: true },
  });

  let vencidas = 0;
  for (const { id } of candidatas) {
    try {
      const resultado = await verificarYAplicarVencimiento(id);
      if (resultado?.estado_solicitud === 'rechazada_definitivamente') vencidas++;
    } catch (err) {
      console.error(`[gr.cron] Error al evaluar Reloj 1 para solicitud id=${id}:`, err);
    }
  }

  console.log(`[gr.cron] Reloj 1 — evaluadas: ${candidatas.length}, vencidas: ${vencidas}`);
  return vencidas;
}

/**
 * Reloj 2 (RN-GR-63) — fecha_inicio del periodo, corte real medianoche
 * México. Candidatas: estado_solicitud dentro de ESTADOS_RELOJ_2.
 */
async function ejecutarVencimientoReloj2() {
  const candidatas = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: { in: ESTADOS_RELOJ_2 } },
    select: { id: true },
  });

  let vencidas = 0;
  for (const { id } of candidatas) {
    try {
      const resultado = await verificarYAplicarVencimiento(id);
      if (resultado?.estado_solicitud === 'rechazada_definitivamente') vencidas++;
    } catch (err) {
      console.error(`[gr.cron] Error al evaluar Reloj 2 para solicitud id=${id}:`, err);
    }
  }

  console.log(`[gr.cron] Reloj 2 — evaluadas: ${candidatas.length}, vencidas: ${vencidas}`);
  return vencidas;
}

function inicializarCronGR() {
  // Reloj 1 — 14:02 México (20:02 UTC), 2 min después del corte real de
  // las 14:00 para dar margen.
  cron.schedule('2 20 * * *', async () => {
    try {
      await ejecutarVencimientoReloj1();
    } catch (err) {
      console.error('[gr.cron] Error al ejecutar Reloj 1:', err);
    }
  }, { timezone: 'UTC' });

  // Reloj 2 — medianoche México (06:00 UTC), mismo horario que ya usa AH.
  cron.schedule('0 6 * * *', async () => {
    try {
      await ejecutarVencimientoReloj2();
    } catch (err) {
      console.error('[gr.cron] Error al ejecutar Reloj 2:', err);
    }
  }, { timezone: 'UTC' });

  console.log('[gr.cron] Crons de vencimiento GR registrados (Reloj 1: 20:02 UTC diario, Reloj 2: 06:00 UTC diario).');
}

module.exports = { inicializarCronGR, ejecutarVencimientoReloj1, ejecutarVencimientoReloj2 };
