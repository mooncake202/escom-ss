const prisma = require("../config/prisma");

/**
 * Calcula la capacidad disponible de un profesor y si tiene la
 * característica 'Investigador' aprobada.
 *
 * IMPORTANTE - no confundir estos nombres con columnas reales de la BD:
 *   - profesor.cupos_totales: SÍ es columna real. Es el techo autorizado,
 *     solo cambia cuando se aprueba una solicitud_caracteristica.
 *   - cupos_disponibles_profesor (abajo): NO es columna, es un cálculo
 *     nuestro = cupos_totales menos lo ya comprometido en ofertas activas.
 *   - oferta_servicio.cupos_disponibles: es OTRA columna real, distinta,
 *     pertenece a una oferta específica, no al profesor.
 *
 * "Comprometido" = 1 por cada oferta individual, o cupos_ofertados por
 * cada oferta proyecto — excluyendo rechazadas (RN-PRO-04) y excluyendo
 * las que usaron cupos_investigador (RN-PRO-06: esos no salen de la
 * capacidad normal del profesor).
 */
async function calcularCuposDisponibles(profesorId) {
  const profesor = await prisma.profesor.findUnique({
    where: { id: profesorId },
    include: {
      solicitud_caracteristica: {
        where: { estado: "aprobada" },
        include: { caracteristica: true },
      },
      oferta_servicio: true,
    },
  });

  if (!profesor) {
    return null; // el controller decide qué hacer si no existe
  }

  const cupos_comprometidos_profesor = profesor.oferta_servicio
    .filter((o) => o.estado_oferta !== "rechazada")
    .reduce((sum, o) => {
      if (o.tipo_oferta === "individual") return sum + 1;
      if (o.cupos_investigador) return sum; // RN-PRO-06: no cuenta contra lo normal
      return sum + (o.cupos_ofertados || 0);
    }, 0);

  const cupos_disponibles_profesor = profesor.cupos_totales - cupos_comprometidos_profesor;

  const es_investigador = profesor.solicitud_caracteristica.some(
    (sc) => sc.caracteristica.nombre === "Investigador"
  );

  return { profesor, cupos_disponibles_profesor, es_investigador };
}

module.exports = { calcularCuposDisponibles };