const cron = require('node-cron');
const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');

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

module.exports = { iniciarCronVencimientoActividades, marcarActividadesVencidas, calcularCorteMedianocheUTC };
