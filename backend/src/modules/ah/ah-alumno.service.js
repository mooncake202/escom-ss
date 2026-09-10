const prisma = require('../../lib/prisma');
const { crearError } = require('./validators');

async function resolverAlumnoYSolicitud(alumnoUsuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: alumnoUsuarioId },
    include: {
      solicitud_registro: {
        include: { periodo_registro: { include: { evento_calendario: true } } },
      },
    },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de servicio social.', 404);
  }

  return { alumno, solicitud: alumno.solicitud_registro };
}

function mapearActividad(a) {
  return {
    id: a.id,
    titulo: a.titulo,
    descripcion: a.descripcion,
    entregable_esperado: a.entregable_esperado,
    fecha_limite: a.fecha_limite,
    fecha_asignacion: a.fecha_asignacion,
    estado: a.estado,
    porcentaje_progreso: a.porcentaje_progreso,
  };
}

/**
 * RN-AH-08: campos visibles para el alumno. `servicioIniciado` indica si hoy
 * ya alcanzó/superó la fecha de inicio del periodo — el frontend decide qué
 * hacer visualmente con eso (lectura únicamente antes de esa fecha).
 */
async function listarActividadesAlumno(alumnoUsuarioId) {
  const { solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  const fechaInicio = solicitud.periodo_registro?.evento_calendario?.fecha_inicio ?? null;
  const servicioIniciado = fechaInicio ? new Date() >= new Date(fechaInicio) : false;

  const actividades = await prisma.actividad.findMany({
    where: { solicitud_registro_id: solicitud.id },
    orderBy: { fecha_asignacion: 'asc' },
  });

  return {
    fechaInicio,
    servicioIniciado,
    actividades: actividades.map(mapearActividad),
  };
}

/**
 * Mismo criterio de seguridad que ah-profesor.service.js: si la actividad
 * no existe o no pertenece a la solicitud_registro del alumno autenticado,
 * 404 genérico — nunca 403, para no revelar que el recurso existe pero es
 * ajeno.
 */
async function obtenerDetalleActividad(alumnoUsuarioId, actividadId) {
  const { solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  const actividad = await prisma.actividad.findUnique({ where: { id: Number(actividadId) } });

  if (!actividad || actividad.solicitud_registro_id !== solicitud.id) {
    throw crearError('Actividad no encontrada.', 404);
  }

  return mapearActividad(actividad);
}

module.exports = { listarActividadesAlumno, obtenerDetalleActividad };
