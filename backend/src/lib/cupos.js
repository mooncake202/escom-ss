const prisma = require('./prisma');
const { ESTADOS_QUE_OCUPAN_CUPO_PROFESOR } = require('../modules/gr/gr.shared');

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

async function contarCuposNormalesOcupados(profesorId, tx = prisma) {
  return tx.solicitud_registro.count({
    where: {
      tipo_cupo: 'normal',
      estado_solicitud: { in: ESTADOS_QUE_OCUPAN_CUPO_PROFESOR },
      oferta: { profesor_id: profesorId },
    },
  });
}

async function obtenerCuposNormalesDisponibles(profesor, tx = prisma) {
  const ocupados = await contarCuposNormalesOcupados(profesor.id, tx);
  return profesor.cupos_totales - ocupados;
}

async function profesorTieneCaracteristicaAprobada(profesorId, nombreCaracteristica, tx = prisma) {
  const encontrada = await tx.solicitud_caracteristica.findFirst({
    where: {
      profesor_id: profesorId,
      estado: 'aprobado',
      caracteristica: { nombre: nombreCaracteristica },
    },
    select: { id: true },
  });
  return !!encontrada;
}

async function contarCuposInvestigadorOcupados(ofertaId, tx = prisma) {
  return tx.solicitud_registro.count({
    where: {
      tipo_cupo: 'investigador',
      estado_solicitud: { in: ESTADOS_QUE_OCUPAN_CUPO_PROFESOR },
      oferta_id: ofertaId,
    },
  });
}

// Helper de batching (no es una de las 6 funciones de negocio, es
// infraestructura para ellas) — usado por ofertas.service.js (listado
// público de ofertas) para filtrar una LISTA completa en 3 consultas fijas
// en vez de N consultas (una por oferta) al llamar ofertaPuedeRecibirAlumno
// en un loop.
async function construirContextoCupos(ofertas, tx = prisma) {
  const profesorIds = [...new Set(ofertas.map((o) => o.profesor_id))];
  const ofertaIds = ofertas.map((o) => o.id);

  const [caracteristicasInvestigador, filasNormales, gruposInvestigador] = await Promise.all([
    tx.solicitud_caracteristica.findMany({
      where: { profesor_id: { in: profesorIds }, estado: 'aprobado', caracteristica: { nombre: 'Investigador' } },
      select: { profesor_id: true },
    }),
    tx.solicitud_registro.findMany({
      where: {
        tipo_cupo: 'normal',
        estado_solicitud: { in: ESTADOS_QUE_OCUPAN_CUPO_PROFESOR },
        oferta: { profesor_id: { in: profesorIds } },
      },
      select: { oferta: { select: { profesor_id: true } } },
    }),
    tx.solicitud_registro.groupBy({
      by: ['oferta_id'],
      where: {
        tipo_cupo: 'investigador',
        estado_solicitud: { in: ESTADOS_QUE_OCUPAN_CUPO_PROFESOR },
        oferta_id: { in: ofertaIds },
      },
      _count: { _all: true },
    }),
  ]);

  const investigadoresAprobados = new Set(caracteristicasInvestigador.map((c) => c.profesor_id));

  const cuposNormalesOcupadosPorProfesor = new Map();
  for (const fila of filasNormales) {
    const pid = fila.oferta.profesor_id;
    cuposNormalesOcupadosPorProfesor.set(pid, (cuposNormalesOcupadosPorProfesor.get(pid) || 0) + 1);
  }

  const ocupadosInvestigadorPorOferta = new Map(gruposInvestigador.map((g) => [g.oferta_id, g._count._all]));

  return { investigadoresAprobados, cuposNormalesOcupadosPorProfesor, ocupadosInvestigadorPorOferta };
}

/**
 * @param {object} [contexto] - opcional, viene de construirContextoCupos()
 *   cuando se filtra una lista completa. Sin contexto, hace sus propias 3
 *   consultas (uso normal para validar 1 sola oferta).
 */
async function ofertaPuedeRecibirAlumno(oferta, profesor, contexto = null, tx = prisma) {
  let cuposNormalesDisponibles;
  let esInvestigadorAprobado;
  let ocupadosInvestigador;

  if (contexto) {
    const ocupadosNormales = contexto.cuposNormalesOcupadosPorProfesor.get(profesor.id) || 0;
    cuposNormalesDisponibles = profesor.cupos_totales - ocupadosNormales;
    esInvestigadorAprobado = contexto.investigadoresAprobados.has(profesor.id);
    ocupadosInvestigador = contexto.ocupadosInvestigadorPorOferta.get(oferta.id) || 0;
  } else {
    cuposNormalesDisponibles = await obtenerCuposNormalesDisponibles(profesor, tx);
    esInvestigadorAprobado = await profesorTieneCaracteristicaAprobada(profesor.id, 'Investigador', tx);
    ocupadosInvestigador = await contarCuposInvestigadorOcupados(oferta.id, tx);
  }

  if (cuposNormalesDisponibles > 0) return true;
  if (oferta.tipo_oferta !== 'proyecto') return false;
  if (!oferta.cupos_investigador) return false; // null o 0 -> sin respaldo
  if (!esInvestigadorAprobado) return false;

  return ocupadosInvestigador < oferta.cupos_investigador;
}

/**
 * Regla de prioridad: SIEMPRE intenta cupo normal primero. Solo usa
 * investigador si no queda normal Y se cumplen las otras 3 condiciones.
 * Lanza PROFESOR_SIN_CUPOS si ninguno de los 2 tipos aplica — quien llama
 * (decidirSolicitud) decide qué hacer con ese error; err.message es la
 * única fuente del texto de este motivo de rechazo, no se duplica en
 * ningún otro archivo.
 */
async function determinarTipoCupoParaAceptar(oferta, profesor, tx = prisma) {
  const cuposNormalesDisponibles = await obtenerCuposNormalesDisponibles(profesor, tx);
  if (cuposNormalesDisponibles > 0) return 'normal';

  if (oferta.tipo_oferta === 'proyecto' && oferta.cupos_investigador) {
    const esInvestigadorAprobado = await profesorTieneCaracteristicaAprobada(profesor.id, 'Investigador', tx);
    if (esInvestigadorAprobado) {
      const ocupadosInvestigador = await contarCuposInvestigadorOcupados(oferta.id, tx);
      if (ocupadosInvestigador < oferta.cupos_investigador) {
        return 'investigador';
      }
    }
  }

  throw crearError('El profesor alcanzó su límite de cupos disponibles.', 409, 'PROFESOR_SIN_CUPOS');
}

module.exports = {
  contarCuposNormalesOcupados,
  obtenerCuposNormalesDisponibles,
  profesorTieneCaracteristicaAprobada,
  contarCuposInvestigadorOcupados,
  ofertaPuedeRecibirAlumno,
  determinarTipoCupoParaAceptar,
  construirContextoCupos,
};
