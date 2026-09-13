const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { crearError, validarAvancesBitacora, validarActividadesReportables } = require('./validators');
const {
  ESTADOS_ACTIVIDAD_REPORTABLE,
  HORAS_POR_JORNADA,
  LIMITE_HORAS_SERVICIO,
  SEGUNDOS_MINIMOS_JORNADA,
  calcularDiaMexicoUTC,
  esDiaLaborable,
  obtenerBitacoraDelDia,
  obtenerOCrearCumulo,
} = require('./ah.shared');

/**
 * Socket genérico (fail-open): avisa al propio alumno que su resumen del
 * dashboard pudo haber cambiado (bitacoraHoyPendiente, jornadaSinTerminar,
 * horasAcumuladas, etc.) — sin payload significativo, el frontend solo lo
 * usa como disparador para volver a pedir su resumen completo. Mismo
 * criterio ya usado en todos los emits existentes: nunca tumba el flujo
 * principal si el socket falla.
 */
function emitirResumenActualizado(usuarioId) {
  try {
    emitirAUsuario(usuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado:', err.message);
  }
}

async function resolverAlumnoYSolicitud(alumnoUsuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: alumnoUsuarioId },
    include: {
      solicitud_registro: {
        include: {
          periodo_registro: { include: { evento_calendario: true } },
          oferta: { include: { profesor: true } },
        },
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
  // Día calendario MÉXICO de hoy contra el día calendario de fechaInicio —
  // antes comparaba el instante exacto actual contra la medianoche UTC de
  // fechaInicio, activando servicioIniciado hasta 18h antes de lo real.
  const servicioIniciado = fechaInicio ? calcularDiaMexicoUTC() >= new Date(fechaInicio) : false;

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

// ─────────────────────────────────────────────────────────────
// CU-AH-03: registrar bitácora del día.
// ─────────────────────────────────────────────────────────────

function listarActividadesReportables(solicitudId) {
  return prisma.actividad.findMany({
    where: { solicitud_registro_id: solicitudId, estado: { in: ESTADOS_ACTIVIDAD_REPORTABLE } },
    orderBy: { fecha_limite: 'asc' },
  });
}

/**
 * Recalcula estado/fecha_completada de una actividad tras reportar avance.
 * - >=100%: completada_a_tiempo (hoy <= fecha_limite) o completada_tarde
 *   (hoy > fecha_limite, o si YA estaba 'vencida' antes de este avance —
 *   llegó tarde sin importar qué diga la comparación de fechas).
 * - <100% y no estaba 'vencida': en_progreso.
 * - <100% y ya estaba 'vencida': se queda 'vencida' (el alumno SÍ puede
 *   seguir avanzando ahí — "extender fecha" es solo gestión visual del
 *   profesor, RN-AH-11, no un requisito para trabajar).
 */
function calcularEstadoActividad(actividad, porcentajeNuevo, hoyUTC) {
  if (porcentajeNuevo >= 100) {
    const tarde = actividad.estado === 'vencida' || hoyUTC > new Date(actividad.fecha_limite);
    return { estado: tarde ? 'completada_tarde' : 'completada_a_tiempo', fecha_completada: new Date() };
  }
  if (actividad.estado === 'vencida') return { estado: 'vencida', fecha_completada: null };
  return { estado: 'en_progreso', fecha_completada: null };
}

/**
 * Único endpoint que el frontend llama al montar AH-03: le dice en qué fase
 * debe arrancar la pantalla (inicio/activa/formulario/enviado/bloqueado) y
 * por qué, sin que el frontend tenga que replicar ninguna regla de negocio.
 */
async function obtenerEstadoJornadaActual(alumnoUsuarioId) {
  const { alumno, solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);
  const hoy = calcularDiaMexicoUTC();

  const [esLaborable, pendiente, bitacoraHoy, actividades, cumulo] = await Promise.all([
    esDiaLaborable(hoy),
    prisma.bitacora.findFirst({
      where: { solicitud_registro_id: solicitud.id, estado: 'pendiente_datos' },
      orderBy: { fecha_registro: 'asc' },
    }),
    obtenerBitacoraDelDia(solicitud.id, hoy),
    listarActividadesReportables(solicitud.id),
    prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: alumno.boleta } }),
  ]);

  const horasAcumuladas = cumulo?.horas_acumuladas ?? 0;

  const bloqueos = {
    noEsDiaLaborable: !esLaborable,
    limiteHorasAlcanzado: horasAcumuladas >= LIMITE_HORAS_SERVICIO,
    sinActividades: actividades.length === 0,
    yaRegistroHoy: !!bitacoraHoy && bitacoraHoy.estado !== 'pendiente_datos' && bitacoraHoy.estado !== 'en_curso',
  };

  let fase;
  let bitacoraActiva = null;
  if (pendiente) {
    // Jornada abandonada y auto-cerrada: salta directo a formulario aunque
    // hoy no sea laborable — el trabajo ya se hizo, solo falta capturarlo.
    // Solo la falta de actividades reportables sigue bloqueando.
    fase = bloqueos.sinActividades ? 'bloqueado' : 'formulario';
    bitacoraActiva = pendiente;
  } else if (bitacoraHoy?.estado === 'en_curso') {
    fase = bitacoraHoy.hora_fin ? 'formulario' : 'activa';
    bitacoraActiva = bitacoraHoy;
  } else if (bloqueos.yaRegistroHoy) {
    fase = 'enviado';
  } else if (bloqueos.noEsDiaLaborable || bloqueos.limiteHorasAlcanzado || bloqueos.sinActividades) {
    fase = 'bloqueado';
  } else {
    fase = 'inicio';
  }

  return {
    fase,
    bitacoraId: bitacoraActiva?.id ?? null,
    horaInicio: bitacoraActiva?.hora_inicio ?? null,
    horasContabilizadas: bitacoraActiva?.horas_contabilizadas ?? HORAS_POR_JORNADA,
    pendienteDatos: !!pendiente,
    limiteHoras: HORAS_POR_JORNADA,
    horasAcumuladas,
    limiteHorasServicio: LIMITE_HORAS_SERVICIO,
    bloqueos,
    actividades: actividades.map(mapearActividad),
  };
}

async function iniciarJornada(alumnoUsuarioId) {
  const { alumno, solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);
  const hoy = calcularDiaMexicoUTC();

  if (!(await esDiaLaborable(hoy))) {
    throw crearError('Hoy no es un día laborable; no puedes registrar jornada.');
  }

  const pendiente = await prisma.bitacora.findFirst({
    where: { solicitud_registro_id: solicitud.id, estado: 'pendiente_datos' },
  });
  if (pendiente) {
    throw crearError('Tienes una jornada sin terminar. Complétala antes de iniciar una nueva.', 409);
  }

  const bitacoraHoy = await obtenerBitacoraDelDia(solicitud.id, hoy);
  if (bitacoraHoy) {
    throw crearError('Ya registraste una jornada hoy.', 409);
  }

  const cumulo = await prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: alumno.boleta } });
  if ((cumulo?.horas_acumuladas ?? 0) >= LIMITE_HORAS_SERVICIO) {
    throw crearError('Ya alcanzaste las 480 horas del servicio social.');
  }

  const actividades = await listarActividadesReportables(solicitud.id);
  if (actividades.length === 0) {
    throw crearError('No tienes actividades asignadas; pide a tu profesor que te asigne una antes de registrar bitácora.');
  }

  let bitacora;
  try {
    bitacora = await prisma.bitacora.create({
      data: {
        solicitud_registro_id: solicitud.id,
        hora_inicio: new Date(),
        fecha_registro: hoy,
        estado: 'en_curso',
      },
    });
  } catch (err) {
    // Respaldo final contra doble click / condición de carrera — la
    // validación de arriba ya cubre el caso normal.
    if (err.code === 'P2002') throw crearError('Ya registraste una jornada hoy.', 409);
    throw err;
  }

  emitirResumenActualizado(alumnoUsuarioId);
  return { bitacoraId: bitacora.id, horaInicio: bitacora.hora_inicio, limiteHoras: HORAS_POR_JORNADA, fase: 'activa' };
}

async function finalizarJornada(alumnoUsuarioId) {
  const { solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  const bitacora = await prisma.bitacora.findFirst({
    where: { solicitud_registro_id: solicitud.id, estado: 'en_curso' },
  });
  if (!bitacora) throw crearError('No tienes una jornada en curso.', 409);

  if (bitacora.hora_fin) {
    // Idempotente: el alumno ya finalizó y volvió a llamar (doble click,
    // reintento de red) — no se re-escribe.
    return {
      bitacoraId: bitacora.id,
      horaInicio: bitacora.hora_inicio,
      horaFin: bitacora.hora_fin,
      horasContabilizadas: bitacora.horas_contabilizadas,
      fase: 'formulario',
    };
  }

  const transcurridoMs = Date.now() - bitacora.hora_inicio.getTime();
  if (transcurridoMs < SEGUNDOS_MINIMOS_JORNADA * 1000) {
    throw crearError(
      'La jornada mínima es de 1 hora. Puedes seguir trabajando o descartar esta jornada e intentarlo de nuevo. Recuerda: solo se permite una bitácora por día laboral.',
      409,
    );
  }

  const actualizada = await prisma.bitacora.update({
    where: { id: bitacora.id },
    data: { hora_fin: new Date(), horas_contabilizadas: HORAS_POR_JORNADA },
  });

  emitirResumenActualizado(alumnoUsuarioId);
  return {
    bitacoraId: actualizada.id,
    horaInicio: actualizada.hora_inicio,
    horaFin: actualizada.hora_fin,
    horasContabilizadas: actualizada.horas_contabilizadas,
    fase: 'formulario',
  };
}

/**
 * Excepción explícita a RN-AH-12: descarta por completo una jornada
 * 'en_curso' que todavía no cumple la 1 hora mínima (borra la fila, no la
 * deja en ningún estado intermedio) — así el alumno puede iniciar una
 * jornada nueva el mismo día sin chocar con "ya registraste hoy". Pasada
 * la hora mínima, ya no se puede descartar: ese es su registro del día.
 */
async function cancelarJornada(alumnoUsuarioId) {
  const { solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  const bitacora = await prisma.bitacora.findFirst({
    where: { solicitud_registro_id: solicitud.id, estado: 'en_curso' },
  });
  if (!bitacora) throw crearError('No tienes una jornada en curso.', 409);

  const transcurridoMs = Date.now() - bitacora.hora_inicio.getTime();
  if (transcurridoMs >= SEGUNDOS_MINIMOS_JORNADA * 1000) {
    throw crearError('Ya no puedes descartar esta jornada, éste será tu registro del día.', 409);
  }

  await prisma.bitacora.delete({ where: { id: bitacora.id } });

  emitirResumenActualizado(alumnoUsuarioId);
  return { cancelada: true, fase: 'inicio' };
}

async function confirmarBitacora(alumnoUsuarioId, { avances }) {
  const { alumno, solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  validarAvancesBitacora(avances);

  const hoy = calcularDiaMexicoUTC();

  const bitacora = await prisma.bitacora.findFirst({
    where: { solicitud_registro_id: solicitud.id, estado: { in: ['en_curso', 'pendiente_datos'] } },
    orderBy: { fecha_registro: 'asc' },
  });
  if (!bitacora) throw crearError('No tienes una jornada por confirmar.', 409);
  if (bitacora.estado === 'en_curso' && !bitacora.hora_fin) {
    throw crearError('Primero debes finalizar tu jornada.', 409);
  }

  const actividades = await listarActividadesReportables(solicitud.id);
  validarActividadesReportables(avances, actividades);

  const horas = bitacora.horas_contabilizadas ?? HORAS_POR_JORNADA;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.bitacora.update({
        where: { id: bitacora.id },
        data: {
          estado: 'pendiente_revision',
          hora_fin: bitacora.hora_fin ?? new Date(),
          horas_contabilizadas: horas,
        },
      });

      await tx.registro_bitacora_actividades.createMany({
        data: avances.map((av) => ({
          bitacora_id: bitacora.id,
          actividad_id: Number(av.actividad_id),
          descripcion: String(av.descripcion).trim(),
          evidencia: String(av.evidencia).trim(),
          porcentaje_avance_registrado: Number(av.porcentaje_avance),
        })),
      });

      for (const av of avances) {
        const actual = actividades.find((a) => a.id === Number(av.actividad_id));
        const pct = Number(av.porcentaje_avance);
        const { estado, fecha_completada } = calcularEstadoActividad(actual, pct, hoy);
        await tx.actividad.update({
          where: { id: actual.id },
          data: { porcentaje_progreso: pct, estado, fecha_completada },
        });
      }

      await obtenerOCrearCumulo(alumno.boleta, tx);
      // Puede superar el límite de 480 en la última jornada trabajada —
      // correcto y deliberado: RN-AH-17 bloquea INICIAR una jornada nueva,
      // nunca recorta una ya trabajada.
      await tx.cumulo_horas_y_faltas.update({
        where: { alumno_id: alumno.boleta },
        data: { horas_acumuladas: { increment: horas } },
      });
    });
  } catch (err) {
    if (err.code === 'P2002') throw crearError('Esta bitácora ya fue registrada.', 409);
    throw err;
  }

  emitirResumenActualizado(alumnoUsuarioId);

  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) {
    emitirResumenActualizado(profesorUsuarioId);
  }

  return { bitacoraId: bitacora.id, horasContabilizadas: horas, estado: 'pendiente_revision', actividadesActualizadas: avances.length };
}

module.exports = {
  listarActividadesAlumno,
  obtenerDetalleActividad,
  obtenerEstadoJornadaActual,
  iniciarJornada,
  finalizarJornada,
  cancelarJornada,
  confirmarBitacora,
};
