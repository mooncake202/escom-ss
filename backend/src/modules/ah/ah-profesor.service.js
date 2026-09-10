const prisma = require('../../lib/prisma');
const {
  crearError,
  validarCamposActividad,
  validarFechaLimiteContraInicio,
  validarFechaLimiteNoPasada,
  validarExtensionFecha,
} = require('./validators');

async function resolverProfesor(profesorUsuarioId) {
  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: profesorUsuarioId } });
  if (!profesor) throw crearError('No se encontró tu perfil de profesor.', 404);
  return profesor;
}

function mapearActividad(a, tieneAvance) {
  return {
    id: a.id,
    titulo: a.titulo,
    descripcion: a.descripcion,
    entregable_esperado: a.entregable_esperado,
    fecha_limite: a.fecha_limite,
    fecha_limite_original: a.fecha_limite_original,
    estado: a.estado,
    fecha_asignacion: a.fecha_asignacion,
    porcentaje_progreso: a.porcentaje_progreso,
    fecha_completada: a.fecha_completada,
    tieneAvance: !!tieneAvance,
  };
}

async function contarAvancesPorActividad(actividadIds) {
  if (actividadIds.length === 0) return new Map();
  const filas = await prisma.registro_bitacora_actividades.groupBy({
    by: ['actividad_id'],
    where: { actividad_id: { in: actividadIds } },
    _count: { _all: true },
  });
  return new Map(filas.map((f) => [f.actividad_id, f._count._all]));
}

/**
 * RF-AH-01/RN-AH-01: solo cuentan alumnos realmente asignados (estado
 * "alumno_asignado") de ofertas de ESTE profesor — los demás estados del
 * pipeline de GR (aún en proceso de registro) no aplican a "asignar
 * actividades".
 */
async function listarAlumnosDeProfesor(profesorUsuarioId) {
  const profesor = await resolverProfesor(profesorUsuarioId);

  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'alumno_asignado', oferta: { profesor_id: profesor.id } },
    include: {
      alumno: { include: { usuario: true } },
      oferta: true,
      periodo_registro: { include: { evento_calendario: true } },
      actividad: true,
    },
    orderBy: { fecha_aplicacion: 'asc' },
  });

  const todasLasActividades = solicitudes.flatMap((s) => s.actividad);
  const conteos = await contarAvancesPorActividad(todasLasActividades.map((a) => a.id));

  return solicitudes.map((s) => ({
    solicitudId: s.id,
    nombre: `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`,
    boleta: s.alumno.boleta,
    carrera: s.alumno.carrera,
    correoInst: s.alumno.usuario.correo_institucional,
    proyecto: s.oferta?.nombre_proyecto ?? null,
    periodoInicio: s.periodo_registro?.evento_calendario?.fecha_inicio ?? null,
    actividades: s.actividad.map((a) => mapearActividad(a, (conteos.get(a.id) ?? 0) > 0)),
  }));
}

async function resolverSolicitudDeProfesor(profesorUsuarioId, solicitudId) {
  const profesor = await resolverProfesor(profesorUsuarioId);

  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: Number(solicitudId) },
    include: {
      alumno: { include: { usuario: true } },
      oferta: true,
      periodo_registro: { include: { evento_calendario: true } },
    },
  });

  // Mismo criterio que gr-profesor.service.js: 404 genérico si no existe O
  // no le pertenece a este profesor — nunca 403, para no revelar que el
  // recurso existe pero es ajeno.
  if (!solicitud || solicitud.oferta?.profesor_id !== profesor.id) {
    throw crearError('Alumno no encontrado.', 404);
  }

  return { profesor, solicitud };
}

async function obtenerDetalleAlumno(profesorUsuarioId, solicitudId) {
  const { solicitud } = await resolverSolicitudDeProfesor(profesorUsuarioId, solicitudId);

  const actividades = await prisma.actividad.findMany({
    where: { solicitud_registro_id: solicitud.id },
    orderBy: { fecha_asignacion: 'asc' },
  });
  const conteos = await contarAvancesPorActividad(actividades.map((a) => a.id));

  return {
    solicitudId: solicitud.id,
    nombre: `${solicitud.alumno.usuario.nombre} ${solicitud.alumno.usuario.apellidos}`,
    boleta: solicitud.alumno.boleta,
    carrera: solicitud.alumno.carrera,
    correoInst: solicitud.alumno.usuario.correo_institucional,
    proyecto: solicitud.oferta?.nombre_proyecto ?? null,
    periodoInicio: solicitud.periodo_registro?.evento_calendario?.fecha_inicio ?? null,
    actividades: actividades.map((a) => mapearActividad(a, (conteos.get(a.id) ?? 0) > 0)),
  };
}

/**
 * RN-AH-01 a RN-AH-06.
 */
async function crearActividad(profesorUsuarioId, solicitudId, datos) {
  const { solicitud } = await resolverSolicitudDeProfesor(profesorUsuarioId, solicitudId);

  validarCamposActividad(datos);
  const fechaInicioPeriodo = solicitud.periodo_registro?.evento_calendario?.fecha_inicio ?? null;
  validarFechaLimiteContraInicio(datos.fecha_limite, fechaInicioPeriodo);
  validarFechaLimiteNoPasada(datos.fecha_limite);

  const actividad = await prisma.actividad.create({
    data: {
      solicitud_registro_id: solicitud.id,
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      entregable_esperado: datos.entregable_esperado.trim(),
      fecha_limite: new Date(datos.fecha_limite),
      estado: 'sin_comenzar',
      fecha_asignacion: new Date(),
    },
  });

  return mapearActividad(actividad, false);
}

async function resolverActividadDeProfesor(profesorUsuarioId, actividadId) {
  const profesor = await resolverProfesor(profesorUsuarioId);

  const actividad = await prisma.actividad.findUnique({
    where: { id: Number(actividadId) },
    include: {
      solicitud_registro: {
        include: { oferta: true, periodo_registro: { include: { evento_calendario: true } } },
      },
    },
  });

  if (!actividad || actividad.solicitud_registro.oferta?.profesor_id !== profesor.id) {
    throw crearError('Actividad no encontrada.', 404);
  }

  const conteo = await prisma.registro_bitacora_actividades.count({ where: { actividad_id: actividad.id } });

  return { profesor, actividad, tieneAvance: conteo > 0 };
}

/**
 * RN-AH-05/RF-AH-07: si NO tiene avance se puede editar TODO (título,
 * descripción, entregable esperado, fecha límite). Si SÍ tiene avance (al
 * menos una fila en registro_bitacora_actividades, sin importar el estado
 * de la bitácora que la contiene), se delega POR COMPLETO a
 * extenderFechaLimiteActividad — solo fecha_limite es editable en ese caso,
 * sin importar qué más mande el cliente en `datos`.
 */
async function editarActividad(profesorUsuarioId, actividadId, datos) {
  const { actividad, tieneAvance } = await resolverActividadDeProfesor(profesorUsuarioId, actividadId);

  if (tieneAvance) {
    return extenderFechaLimiteActividad(profesorUsuarioId, actividadId, datos.fecha_limite);
  }

  validarCamposActividad(datos);
  const fechaInicioPeriodo = actividad.solicitud_registro.periodo_registro?.evento_calendario?.fecha_inicio ?? null;
  validarFechaLimiteContraInicio(datos.fecha_limite, fechaInicioPeriodo);
  validarFechaLimiteNoPasada(datos.fecha_limite);

  const actualizada = await prisma.actividad.update({
    where: { id: actividad.id },
    data: {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      entregable_esperado: datos.entregable_esperado.trim(),
      fecha_limite: new Date(datos.fecha_limite),
    },
  });

  return mapearActividad(actualizada, false);
}

/**
 * Independiente y reutilizable a propósito — CU-AH-06 reutilizará esta
 * MISMA función más adelante, no se enreda dentro de editarActividad.
 */
async function extenderFechaLimiteActividad(profesorUsuarioId, actividadId, nuevaFechaLimite) {
  const { actividad } = await resolverActividadDeProfesor(profesorUsuarioId, actividadId);

  const fechaInicioPeriodo = actividad.solicitud_registro.periodo_registro?.evento_calendario?.fecha_inicio ?? null;
  validarExtensionFecha(nuevaFechaLimite, actividad.fecha_limite, fechaInicioPeriodo);

  const nuevoEstado = actividad.porcentaje_progreso > 0 ? 'en_progreso' : 'sin_comenzar';

  const actualizada = await prisma.actividad.update({
    where: { id: actividad.id },
    data: {
      fecha_limite: new Date(nuevaFechaLimite),
      // Solo se guarda la PRIMERA vez que se extiende — en extensiones
      // sucesivas ya no se pisa el valor original.
      fecha_limite_original: actividad.fecha_limite_original ?? actividad.fecha_limite,
      estado: nuevoEstado,
    },
  });

  return mapearActividad(actualizada, true);
}

/**
 * RN-AH-05/RF-AH-07: solo se puede eliminar si NO existe ninguna fila en
 * registro_bitacora_actividades para esa actividad (sin importar el estado
 * de la bitácora que la contenga).
 */
async function eliminarActividad(profesorUsuarioId, actividadId) {
  const { actividad, tieneAvance } = await resolverActividadDeProfesor(profesorUsuarioId, actividadId);

  if (tieneAvance) {
    throw crearError('No puedes eliminar esta actividad porque ya tiene avance registrado en bitácora.', 409);
  }

  await prisma.actividad.delete({ where: { id: actividad.id } });
}

module.exports = {
  listarAlumnosDeProfesor,
  obtenerDetalleAlumno,
  crearActividad,
  editarActividad,
  extenderFechaLimiteActividad,
  eliminarActividad,
};
