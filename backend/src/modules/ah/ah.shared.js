const prisma = require('../../lib/prisma');

// RF-AH-06: estados que cuentan como "ya terminada" — todo lo demás cuenta
// como pendiente para efectos de la notificación tipo A.
const ESTADOS_COMPLETADA = ['completada_a_tiempo', 'completada_tarde'];

/**
 * RF-AH-06 — Notificación tipo A, conteo en vivo (NO tabla `notificacion`).
 * Consumida por dashboard.service.js (resumenAlumno) para la notificación
 * calculada del dashboard del alumno.
 */
async function tieneActividadesPendientes(solicitudRegistroId) {
  const conteo = await prisma.actividad.count({
    where: {
      solicitud_registro_id: Number(solicitudRegistroId),
      estado: { notIn: ESTADOS_COMPLETADA },
    },
  });
  return conteo > 0;
}

module.exports = { tieneActividadesPendientes, ESTADOS_COMPLETADA };
