const prisma = require('./prisma');
const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../modules/gr/gr.shared');

// HAY UN SOLO HITO DE LIBERACIÓN: `liberacion_proceso.estado = 'solicitud_constancia_termino'`.
//
// Ese es el momento —y el único— en que el alumno deja de ocupar capacidad del profesor: para
// llegar ahí, Coordinación ya aprobó su expediente de liberación (CU-LSS-09) y él ya pidió su
// constancia. Lo que queda después es trámite, no servicio.
//
// Liberar NO reabre `cupos_disponibles` de la oferta: solo libera el límite global del profesor.
// Una baja aprobada sí devuelve el lugar de la oferta, y eso vive en el módulo de Bajas.
//
// `constancia_disponible` NO es un segundo hito: es el estado al que LSS avanza DESPUÉS (CU-LSS-11,
// cuando Coordinación emite la constancia). Aparece en esta lista con un único propósito técnico —
// CONSERVAR la condición de "ya liberado" cuando el proceso sigue adelante. Si no estuviera, el
// alumno liberaría su lugar al pedir la constancia y volvería a contarse como ocupante al
// recibirla. Por eso el filtro usa `notIn` y no `not`.
//
// Es decir: un disparador de negocio ('solicitud_constancia_termino') y un estado posterior que
// hereda la condición ('constancia_disponible').
//
// ADM/Ofertas solo CONSULTA estos valores; no los escribe nadie fuera de LSS.
const HITO_LSS_LIBERA_CUPO = 'solicitud_constancia_termino';
const ESTADOS_LSS_LIBERAN_CUPO = [HITO_LSS_LIBERA_CUPO, 'constancia_disponible'];

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

// Fragmento `where` de "esta solicitud ocupa capacidad del profesor": está en
// un estado que ocupa, Y todavía no alcanzó el hito de liberación. `is: null`
// cubre las solicitudes sin liberacion_proceso (la relación es 1:1 opcional).
const WHERE_SOLICITUD_OCUPA_CUPO = {
  estado_solicitud: { in: ESTADOS_QUE_OCUPAN_CUPO_PROFESOR },
  OR: [
    { liberacion_proceso: { is: null } },
    { liberacion_proceso: { is: { estado: { notIn: ESTADOS_LSS_LIBERAN_CUPO } } } },
  ],
};

async function contarCuposOcupados(profesorId, tx = prisma) {
  return tx.solicitud_registro.count({
    where: { ...WHERE_SOLICITUD_OCUPA_CUPO, oferta: { profesor_id: profesorId } },
  });
}

// Obtiene las solicitudes que ocupan cupo en varias ofertas
async function obtenerSolicitudesOcupandoOfertas(ofertaIds, tx = prisma) {
  if (ofertaIds.length === 0) return [];

  return tx.solicitud_registro.findMany({
    where: {
      ...WHERE_SOLICITUD_OCUPA_CUPO,
      oferta_id: { in: ofertaIds },
    },
    include: {
      alumno: {
        include: { usuario: true },
      },
    },
  });
}

async function obtenerCuposDisponiblesProfesor(profesor, tx = prisma) {
  const ocupados = await contarCuposOcupados(profesor.id, tx);
  return profesor.cupos_totales - ocupados;
}

// Helper de batching (infraestructura, no regla de negocio) — usado por
// ofertas.service.js (listado público) para filtrar una LISTA con 1 consulta
// fija en vez de N (una por oferta).
async function construirContextoCupos(ofertas, tx = prisma) {
  const profesorIds = [...new Set(ofertas.map((o) => o.profesor_id))];

  const filas = await tx.solicitud_registro.findMany({
    where: { ...WHERE_SOLICITUD_OCUPA_CUPO, oferta: { profesor_id: { in: profesorIds } } },
    select: { oferta: { select: { profesor_id: true } } },
  });

  const cuposOcupadosPorProfesor = new Map();
  for (const fila of filas) {
    const pid = fila.oferta.profesor_id;
    cuposOcupadosPorProfesor.set(pid, (cuposOcupadosPorProfesor.get(pid) || 0) + 1);
  }

  return { cuposOcupadosPorProfesor };
}

/**
 * Los 2 límites independientes de la regla de aceptación:
 *   A) la oferta tiene lugar estructural (cupos_disponibles > 0)
 *   B) el profesor tiene capacidad global (ocupados < cupos_totales)
 * @param {object} [contexto] - opcional, de construirContextoCupos() al
 *   filtrar una lista completa. Sin contexto hace su propia consulta.
 */
async function ofertaPuedeRecibirAlumno(oferta, profesor, contexto = null, tx = prisma) {
  if (oferta.cupos_disponibles === 0) return false;
  const ocupados = contexto
    ? (contexto.cuposOcupadosPorProfesor.get(profesor.id) || 0)
    : await contarCuposOcupados(profesor.id, tx);
  return ocupados < profesor.cupos_totales;
}

/**
 * Serializa las aceptaciones del MISMO profesor: toma un lock exclusivo sobre su
 * fila y lo retiene hasta el COMMIT/ROLLBACK de `tx`, y devuelve `cupos_totales`
 * FRESCO de esa misma fila (mismo SELECT, sin consulta extra).
 *
 * DEBE ser la PRIMERA sentencia de la transacción, ANTES de cualquier lectura
 * normal (como el COUNT de asegurarCapacidadProfesor): en REPEATABLE READ el
 * snapshot se fija en la primera lectura no bloqueante, y ese conteo debe ver lo
 * ya confirmado por la aceptación anterior del mismo profesor. `tx` es
 * obligatorio a propósito: fuera de una transacción el lock se liberaría al
 * instante y no protegería nada.
 *
 * @returns {{ id: number, cupos_totales: number }} justo lo que necesita
 *   asegurarCapacidadProfesor — la regla de capacidad sigue viviendo allí.
 */
async function bloquearProfesor(profesorId, tx) {
  const filas = await tx.$queryRaw`SELECT id, cupos_totales FROM profesor WHERE id = ${profesorId} FOR UPDATE`;
  if (filas.length === 0) throw crearError('No se encontró tu perfil de profesor.', 404);
  return { id: Number(filas[0].id), cupos_totales: Number(filas[0].cupos_totales) };
}

/**
 * Lanza PROFESOR_SIN_CUPOS si el profesor ya no tiene capacidad global.
 * err.message es la única fuente del texto de este motivo de rechazo.
 */
async function asegurarCapacidadProfesor(profesor, tx = prisma) {
  if ((await obtenerCuposDisponiblesProfesor(profesor, tx)) <= 0) {
    throw crearError('El profesor alcanzó su límite de cupos disponibles.', 409, 'PROFESOR_SIN_CUPOS');
  }
}

module.exports = {
  // Se exportan para que ofertas.service.js (cierre manual y conclusión automática) use EXACTAMENTE
  // el mismo criterio que el conteo de cupos, en vez de repetir los literales.
  HITO_LSS_LIBERA_CUPO,
  ESTADOS_LSS_LIBERAN_CUPO,
  contarCuposOcupados,
  obtenerSolicitudesOcupandoOfertas,
  obtenerCuposDisponiblesProfesor,
  ofertaPuedeRecibirAlumno,
  bloquearProfesor,
  asegurarCapacidadProfesor,
  construirContextoCupos,
};
