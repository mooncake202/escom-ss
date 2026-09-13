const prisma = require('../../lib/prisma');
const redis = require('../../lib/redis');
const { calcularDiaMexicoUTC } = require('../../lib/fechas');

const CACHE_KEY_PERIODOS = 'cache:periodos';
const CACHE_TTL_PERIODOS = 300; // segundos (5 min) — los periodos casi nunca cambian

/**
 * RF-GR-03: periodos vigentes (fecha de inicio a futuro), con fecha límite de
 * expediente incluida para poder avisarle al alumno desde el registro (RN-GR-04/05).
 */
async function listarPeriodosVigentes() {
  try {
    const cacheado = await redis.get(CACHE_KEY_PERIODOS);
    if (cacheado) return JSON.parse(cacheado);
  } catch (err) {
    console.error('Error al leer caché de periodos (se continúa sin caché):', err.message);
  }

  // Compara día calendario MÉXICO contra día calendario MÉXICO — antes
  // comparaba fecha_inicio (medianoche UTC del día) contra el instante
  // exacto actual, lo que hacía desaparecer un periodo hasta 18h antes de
  // su día real de inicio en México (medianoche UTC ocurre a las 18:00
  // hora México del día anterior).
  const periodos = await prisma.periodo_registro.findMany({
    where: { evento_calendario: { fecha_inicio: { gte: calcularDiaMexicoUTC() } } },
    include: { evento_calendario: true },
    orderBy: { evento_calendario: { fecha_inicio: 'asc' } },
  });

  const resultado = periodos.map((p) => ({
    id: p.id,
    anio: p.anio,
    semestre: p.semestre,
    fechaInicio: p.evento_calendario.fecha_inicio,
    fechaFin: p.evento_calendario.fecha_fin,
    fechaLimiteExpediente: p.fecha_max_expediente,
  }));

  try {
    await redis.set(CACHE_KEY_PERIODOS, JSON.stringify(resultado), 'EX', CACHE_TTL_PERIODOS);
  } catch (err) {
    console.error('Error al guardar caché de periodos (no crítico):', err.message);
  }

  return resultado;
}

module.exports = { listarPeriodosVigentes };