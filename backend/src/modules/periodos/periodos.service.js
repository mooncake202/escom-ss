const prisma = require('../../lib/prisma');
const redis = require('../../lib/redis');
const { calcularDiaMexicoUTC } = require('../../lib/fechas');

const CACHE_KEY_PERIODOS = 'cache:periodos';
const CACHE_TTL_PERIODOS = 300; // segundos (5 min) — los periodos casi nunca cambian

// Periodo EXCLUSIVO de la demo (ver backend/src/seeds/demo-final/cred-gr-ah-lss/03-gr.js,
// obtenerOCrearPeriodoMonica): fecha_inicio=2026-11-24 y fecha_max_expediente=2026-12-01
// a propósito INVERTIDAS (fecha_max_expediente queda DESPUÉS de fecha_inicio, al revés
// de cualquier periodo real) solo para que el seed pudiera construir el escenario de
// Mónica Quintero sin que subirExpediente lo rechazara por vencimiento a medio camino.
// Nunca debe aparecer como opción real de registro. Se excluye por la combinación
// exacta de sus 2 fechas, no por id — el id depende del orden de autoincremento al
// correr 00-comun/cred-gr-ah-lss y no está garantizado que coincida siempre.
const FECHA_INICIO_PERIODO_EXCLUSIVO_DEMO = new Date('2026-11-24');
const FECHA_MAX_EXPEDIENTE_PERIODO_EXCLUSIVO_DEMO = new Date('2026-12-01');

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
  //
  // El campo correcto contra el que comparar es fecha_max_expediente, no
  // fecha_inicio: fecha_max_expediente es el plazo real para completar el
  // trámite y siempre es ANTERIOR a fecha_inicio — un periodo deja de estar
  // disponible para elegir en cuanto pasa esa fecha límite, aunque
  // fecha_inicio todavía no llegue.
  const periodos = await prisma.periodo_registro.findMany({
    where: {
      fecha_max_expediente: { gte: calcularDiaMexicoUTC() },
      NOT: {
        fecha_max_expediente: FECHA_MAX_EXPEDIENTE_PERIODO_EXCLUSIVO_DEMO,
        evento_calendario: { fecha_inicio: FECHA_INICIO_PERIODO_EXCLUSIVO_DEMO },
      },
    },
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

module.exports = { listarPeriodosVigentes, CACHE_KEY_PERIODOS };