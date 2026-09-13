const prisma = require('../../lib/prisma');
const {
  crearError,
  validarCamposActividad,
  validarFechaLimiteContraInicio,
  validarFechaLimiteNoPasada,
  validarExtensionFecha,
  validarActividadNoCompletada,
  validarMotivoRechazo,
} = require('./validators');
const { HORAS_POR_JORNADA, LIMITE_HORAS_SERVICIO, calcularHorasNetas } = require('./ah.shared');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { crearNotificacion } = require('../notificaciones/notificaciones.service');

/**
 * Genérico (fail-open): avisa al PROPIO profesor que ejecutó la mutación
 * que su resumen del dashboard (actividadesProximasACaducar,
 * alumnoSinActividades) pudo haber cambiado — cualquier mutación de
 * actividad puede alterar ambas condiciones. Mismo criterio ya usado en
 * el resto de la sesión: sin payload significativo, nunca tumba el flujo.
 */
function emitirResumenActualizadoProfesor(profesorUsuarioId) {
  try {
    emitirAUsuario(profesorUsuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado (profesor):', err.message);
  }
}

/**
 * Mismo criterio, pero hacia el alumno dueño de la bitácora — afecta su
 * propio resumen (horas, historial) tras la decisión del profesor.
 */
function emitirResumenActualizadoAlumno(alumnoUsuarioId) {
  try {
    emitirAUsuario(alumnoUsuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado (alumno):', err.message);
  }
}

/**
 * Notificación Tipo B DEDUPLICADA: si el alumno ya tiene una notificación
 * sin leer de "bitácora revisada" (identificada únicamente por
 * ruta_relacionada='/alumno/historial' — ninguna otra notificación del
 * proyecto usa esa ruta), no crea otra. El mensaje es genérico a propósito
 * (no distingue aprobación de rechazo).
 */
async function notificarBitacoraRevisada(alumnoUsuarioId) {
  const yaExiste = await prisma.notificacion.findFirst({
    where: { usuario_id: alumnoUsuarioId, ruta_relacionada: '/alumno/historial', leida: false },
  });
  if (yaExiste) return;

  await crearNotificacion({
    usuarioId: alumnoUsuarioId,
    tipo: 'info',
    mensaje: 'Te han revisado una bitácora.',
    rutaRelacionada: '/alumno/historial',
  });
}

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

  const actividadMapeada = mapearActividad(actividad, false);

  try {
    emitirAUsuario(solicitud.alumno.usuario_id, 'actividad:creada', { actividad: actividadMapeada });
  } catch (err) {
    console.error('Error al emitir actividad:creada:', err.message);
  }
  emitirResumenActualizadoProfesor(profesorUsuarioId);

  return actividadMapeada;
}

async function resolverActividadDeProfesor(profesorUsuarioId, actividadId) {
  const profesor = await resolverProfesor(profesorUsuarioId);

  const actividad = await prisma.actividad.findUnique({
    where: { id: Number(actividadId) },
    include: {
      solicitud_registro: {
        include: { oferta: true, periodo_registro: { include: { evento_calendario: true } }, alumno: true },
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

  validarActividadNoCompletada(actividad.estado);

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

  const actividadMapeada = mapearActividad(actualizada, false);

  try {
    emitirAUsuario(actividad.solicitud_registro.alumno.usuario_id, 'actividad:editada', { actividad: actividadMapeada });
  } catch (err) {
    console.error('Error al emitir actividad:editada:', err.message);
  }
  emitirResumenActualizadoProfesor(profesorUsuarioId);

  return actividadMapeada;
}

/**
 * Independiente y reutilizable a propósito — CU-AH-06 reutilizará esta
 * MISMA función más adelante, no se enreda dentro de editarActividad.
 */
async function extenderFechaLimiteActividad(profesorUsuarioId, actividadId, nuevaFechaLimite) {
  const { actividad } = await resolverActividadDeProfesor(profesorUsuarioId, actividadId);

  validarActividadNoCompletada(actividad.estado);

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

  try {
    emitirAUsuario(actividad.solicitud_registro.alumno.usuario_id, 'actividad:fecha_extendida', {
      actividadId: actualizada.id,
      fecha_limite: actualizada.fecha_limite,
      estado: actualizada.estado,
    });
  } catch (err) {
    console.error('Error al emitir actividad:fecha_extendida:', err.message);
  }
  emitirResumenActualizadoProfesor(profesorUsuarioId);

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

  try {
    emitirAUsuario(actividad.solicitud_registro.alumno.usuario_id, 'actividad:eliminada', { actividadId: actividad.id });
  } catch (err) {
    console.error('Error al emitir actividad:eliminada:', err.message);
  }
  emitirResumenActualizadoProfesor(profesorUsuarioId);
}

// ─────────────────────────────────────────────────────────────
// CU-AH-05: consultar acumulado de horas (vista profesor).
// ─────────────────────────────────────────────────────────────

async function contarBitacorasPorSolicitud(solicitudIds) {
  if (solicitudIds.length === 0) return new Map();
  const filas = await prisma.bitacora.groupBy({
    by: ['solicitud_registro_id'],
    where: { solicitud_registro_id: { in: solicitudIds } },
    _count: { _all: true },
  });
  return new Map(filas.map((f) => [f.solicitud_registro_id, f._count._all]));
}

/**
 * RN-AH-25: mismo filtro exacto de listarAlumnosDeProfesor (alumnos
 * realmente asignados a ESTE profesor) — aquí con horas en vez de
 * actividades. Prisma no puede filtrar/ordenar por la resta calculada
 * (horas_acumuladas - horas_rechazadas), mismo criterio ya documentado en
 * dashboard.service.js::contarAlumnosConHorasCompletas: se trae el cúmulo
 * completo y se invoca calcularHorasNetas en JS.
 */
async function listarAcumuladoAlumnosDeProfesor(profesorUsuarioId) {
  const profesor = await resolverProfesor(profesorUsuarioId);

  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'alumno_asignado', oferta: { profesor_id: profesor.id } },
    include: { alumno: { include: { usuario: true, cumulo_horas_y_faltas: true } } },
    orderBy: { fecha_aplicacion: 'asc' },
  });

  const conteos = await contarBitacorasPorSolicitud(solicitudes.map((s) => s.id));

  return solicitudes.map((s) => {
    const cumulo = s.alumno.cumulo_horas_y_faltas;
    const horasRealizadas = calcularHorasNetas(cumulo);
    return {
      boleta: s.alumno.boleta,
      nombre: `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`,
      carrera: s.alumno.carrera,
      horasTotales: LIMITE_HORAS_SERVICIO,
      horasRealizadas,
      horasRestantes: Math.max(LIMITE_HORAS_SERVICIO - horasRealizadas, 0),
      horasRechazadas: cumulo?.horas_rechazadas ?? 0,
      porcentajeAvance: Math.min(Math.round((horasRealizadas / LIMITE_HORAS_SERVICIO) * 100), 100),
      faltasConsecutivas: cumulo?.faltas_consecutivas ?? 0,
      faltasAcumuladas: cumulo?.faltas_acumuladas ?? 0,
      sinBitacoras: (conteos.get(s.id) ?? 0) === 0,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// CU-AH-04: revisar bitácoras.
// ─────────────────────────────────────────────────────────────

/**
 * RN-AH-19: solo bitácoras de alumnos bajo supervisión de ESTE profesor,
 * y solo las que de verdad están esperando decisión.
 */
async function listarBitacorasPendientes(profesorUsuarioId, filtroNombre = null) {
  const profesor = await resolverProfesor(profesorUsuarioId);

  const bitacoras = await prisma.bitacora.findMany({
    where: {
      estado: 'pendiente_revision',
      solicitud_registro: {
        oferta: { profesor_id: profesor.id },
        ...(filtroNombre
          ? {
              alumno: {
                usuario: {
                  OR: [
                    { nombre: { contains: filtroNombre } },
                    { apellidos: { contains: filtroNombre } },
                  ],
                },
              },
            }
          : {}),
      },
    },
    include: {
      solicitud_registro: {
        include: { alumno: { include: { usuario: true } }, oferta: true },
      },
      registro_bitacora_actividades: { include: { actividad: true } },
    },
    orderBy: { fecha_registro: 'asc' },
  });

  return bitacoras.map((b) => ({
    id: b.id,
    alumno: {
      nombre: `${b.solicitud_registro.alumno.usuario.nombre} ${b.solicitud_registro.alumno.usuario.apellidos}`,
      boleta: b.solicitud_registro.alumno.boleta,
      carrera: b.solicitud_registro.alumno.carrera,
      oferta: b.solicitud_registro.oferta?.nombre_proyecto ?? null,
    },
    fecha: b.fecha_registro,
    horaInicio: b.hora_inicio,
    horaFin: b.hora_fin,
    horasTrabajadas: b.horas_contabilizadas,
    avances: b.registro_bitacora_actividades.map((r) => ({
      actividad_id: r.actividad_id,
      actividad: r.actividad.titulo,
      progreso: r.porcentaje_avance_registrado,
      descripcion: r.descripcion,
      evidencia: r.evidencia,
    })),
  }));
}

async function resolverBitacoraDeProfesor(profesorUsuarioId, bitacoraId) {
  const profesor = await resolverProfesor(profesorUsuarioId);

  const bitacora = await prisma.bitacora.findUnique({
    where: { id: Number(bitacoraId) },
    include: {
      solicitud_registro: {
        include: {
          oferta: true,
          alumno: { include: { usuario: true } },
          periodo_registro: { include: { evento_calendario: true } },
        },
      },
    },
  });

  if (!bitacora || bitacora.solicitud_registro.oferta?.profesor_id !== profesor.id) {
    throw crearError('Bitácora no encontrada.', 404);
  }
  if (bitacora.estado !== 'pendiente_revision') {
    throw crearError('Esta bitácora ya fue revisada.', 409);
  }

  return { profesor, bitacora };
}

/**
 * Aprueba una bitácora — opcionalmente en la MISMA transacción crea una
 * actividad adicional para el mismo alumno (mismas reglas de validación
 * que CU-AH-01). Si la actividad es inválida, TODA la transacción aborta
 * (la bitácora tampoco queda aprobada).
 *
 * horas_acumuladas NO se toca — ya se sumó en confirmarBitacora (AH-03).
 * El progreso/estado de las actividades reportadas tampoco se vuelve a
 * tocar — ya se aplicó ahí, esto es puramente confirmatorio.
 */
async function aprobarBitacora(profesorUsuarioId, bitacoraId, actividadAdicional = null) {
  const { profesor, bitacora } = await resolverBitacoraDeProfesor(profesorUsuarioId, bitacoraId);

  if (actividadAdicional) {
    validarCamposActividad(actividadAdicional);
    const fechaInicioPeriodo = bitacora.solicitud_registro.periodo_registro?.evento_calendario?.fecha_inicio ?? null;
    validarFechaLimiteContraInicio(actividadAdicional.fecha_limite, fechaInicioPeriodo);
    validarFechaLimiteNoPasada(actividadAdicional.fecha_limite);
  }

  const [, actividadCreada] = await prisma.$transaction([
    prisma.bitacora.update({
      where: { id: bitacora.id },
      data: { estado: 'aprobada', fecha_revision: new Date(), revisado_por_id: profesor.id },
    }),
    ...(actividadAdicional
      ? [
          prisma.actividad.create({
            data: {
              solicitud_registro_id: bitacora.solicitud_registro_id,
              titulo: actividadAdicional.titulo.trim(),
              descripcion: actividadAdicional.descripcion.trim(),
              entregable_esperado: actividadAdicional.entregable_esperado.trim(),
              fecha_limite: new Date(actividadAdicional.fecha_limite),
              estado: 'sin_comenzar',
              fecha_asignacion: new Date(),
            },
          }),
        ]
      : []),
  ]);

  const alumnoUsuarioId = bitacora.solicitud_registro.alumno.usuario_id;
  const actividadMapeada = actividadCreada ? mapearActividad(actividadCreada, false) : null;

  if (actividadMapeada) {
    try {
      emitirAUsuario(alumnoUsuarioId, 'actividad:creada', { actividad: actividadMapeada });
    } catch (err) {
      console.error('Error al emitir actividad:creada:', err.message);
    }
  }
  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  emitirResumenActualizadoProfesor(profesorUsuarioId);
  await notificarBitacoraRevisada(alumnoUsuarioId);

  return { estado: 'aprobada', actividadCreada: actividadMapeada };
}

/**
 * Rechaza una bitácora — incrementa horas_rechazadas por las horas que esa
 * jornada había sumado (horas_acumuladas, el bruto histórico, NUNCA se
 * toca). El progreso/estado de las actividades reportadas NO se revierte
 * (decisión de negocio confirmada: solo se rechazan las horas, no el
 * avance ya aplicado).
 */
async function rechazarBitacora(profesorUsuarioId, bitacoraId, motivoRechazo) {
  const { profesor, bitacora } = await resolverBitacoraDeProfesor(profesorUsuarioId, bitacoraId);

  validarMotivoRechazo(motivoRechazo);

  const horasARestar = bitacora.horas_contabilizadas ?? HORAS_POR_JORNADA;
  const alumnoBoleta = bitacora.solicitud_registro.alumno_id;

  await prisma.$transaction([
    prisma.bitacora.update({
      where: { id: bitacora.id },
      data: {
        estado: 'rechazada',
        motivo_rechazo: motivoRechazo.trim(),
        fecha_revision: new Date(),
        revisado_por_id: profesor.id,
      },
    }),
    // horas_acumuladas es el bruto histórico — NUNCA se toca aquí. Lo que
    // se rechaza se registra en horas_rechazadas; las horas NETAS
    // (calcularHorasNetas, ah.shared.js) son siempre acumuladas-rechazadas.
    prisma.cumulo_horas_y_faltas.update({
      where: { alumno_id: alumnoBoleta },
      data: { horas_rechazadas: { increment: horasARestar } },
    }),
  ]);

  const alumnoUsuarioId = bitacora.solicitud_registro.alumno.usuario_id;

  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  emitirResumenActualizadoProfesor(profesorUsuarioId);
  await notificarBitacoraRevisada(alumnoUsuarioId);

  return { estado: 'rechazada' };
}

module.exports = {
  listarAlumnosDeProfesor,
  listarAcumuladoAlumnosDeProfesor,
  obtenerDetalleAlumno,
  crearActividad,
  editarActividad,
  extenderFechaLimiteActividad,
  eliminarActividad,
  listarBitacorasPendientes,
  aprobarBitacora,
  rechazarBitacora,
};
