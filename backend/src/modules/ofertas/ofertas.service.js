const prisma = require('../../lib/prisma');

/**
 * RF-GR-06: solo ofertas activas y con cupos disponibles al momento de la consulta.
 */
async function listarOfertasDisponibles() {
  const ofertas = await prisma.oferta_servicio.findMany({
    where: {
      estado_oferta: 'Aprobada', 
      cupos_disponibles: { gt: 0 },
    },
    include: {
      profesor: { include: { usuario: true } },
      deseo_de_carrera: { include: { carrera: true } },
    },
    orderBy: { fecha_registro: 'desc' },
  });

  return ofertas.map((o) => ({
    id: o.id,
    titulo: o.nombre_proyecto,
    profesor: `${o.profesor.usuario.nombre} ${o.profesor.usuario.apellidos}`,
    // ⚠️ El schema solo tiene UN campo (descripcion_actividades); el frontend
    // original (OfertaCard) esperaba dos campos separados (descripcion +
    // actividades). Se manda el mismo texto en ambos por ahora — si quieres
    // separarlos de verdad, hay que agregar una columna nueva en CU-PRO.
    descripcion: o.descripcion_actividades,
    actividades: o.descripcion_actividades,
    cuposDisponibles: o.cupos_disponibles,
    perfiles: o.deseo_de_carrera.map((d) => d.carrera.nombre).join(','),
  }));
}

/**
 * Catálogo de "perfiles" (carrera deseada) para el filtro de StepSeleccionOferta.
 * Reusa la tabla `carrera` que ya existe — NO se crean tablas perfilDeseado.
 */
async function listarPerfilesDisponibles() {
  const carreras = await prisma.carrera.findMany({ orderBy: { nombre: 'asc' } });
  return carreras.map((c) => ({ id: c.id, nombre: c.nombre }));
}

module.exports = { listarOfertasDisponibles, listarPerfilesDisponibles };
