const prisma = require('../../lib/prisma');
const { ESTADO_EVALUACION_SOLICITADA } = require('./lss.shared');

/**
 * RF-LSS-02/RF-LSS-04: notificación Tipo A calculada del dashboard de
 * profesor — cuántos alumnos de ESTE profesor tienen liberacion_proceso en
 * 'evaluacion_solicitada' (esperando que el profesor haga su evaluación,
 * CU-LSS-03, todavía no construido). Mismo patrón de query "mis alumnos"
 * ya usado en ah-profesor.service.js/dashboard.service.js (recorre
 * solicitud_registro -> oferta -> profesor_id, aquí a través de
 * liberacion_proceso -> solicitud_registro).
 */
async function contarAlumnosConEvaluacionSolicitada(profesorId) {
  return prisma.liberacion_proceso.count({
    where: {
      estado: ESTADO_EVALUACION_SOLICITADA,
      solicitud_registro: { oferta: { profesor_id: profesorId } },
    },
  });
}

module.exports = { contarAlumnosConEvaluacionSolicitada };
