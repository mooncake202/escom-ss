const prisma = require('../../lib/prisma');
const redis = require('../../lib/redis');

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

  const periodos = await prisma.periodo_registro.findMany({
    where: { evento_calendario: { fecha_inicio: { gte: new Date() } } },
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