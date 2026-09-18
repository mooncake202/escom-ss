const prisma = require('../../lib/prisma');
const { dictamenLabel } = require('./gr.service');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { asegurarCapacidadProfesor, bloquearProfesor } = require('../../lib/cupos');

const MOTIVO_RECHAZO_PROFESOR = 'Rechazado por profesor';
const MOTIVO_RECHAZO_CUPOS = 'Cupos de la oferta cubiertos';

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

/**
 * RF-GR-16 / RF-GR-17 — lista + detalle en una sola consulta (el frontend
 * no hace un segundo fetch al abrir el panel de detalle, ya viene todo).
 */
async function listarSolicitudesPendientes(profesorUsuarioId) {
  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: profesorUsuarioId } });
  if (!profesor) {
    throw crearError('No se encontró tu perfil de profesor.', 404);
  }

  const solicitudes = await prisma.solicitud_registro.findMany({
    where: {
      estado_solicitud: 'espera_respuesta_de_profesor',
      oferta: { profesor_id: profesor.id },
    },
    include: {
      alumno: { include: { usuario: true } },
      oferta: true,
      periodo_registro: { include: { evento_calendario: true } },
    },
    orderBy: { fecha_aplicacion: 'asc' },
  });

  return solicitudes.map((s) => ({
    id: s.id,
    nombre: `${s.alumno.usuario.nombre} ${s.alumno.usuario.apellidos}`,
    boleta: s.alumno.boleta,
    correoInst: s.alumno.usuario.correo_institucional,
    correoPersonal: s.alumno.correo_personal,
    telefono: s.alumno.celular,
    carrera: s.alumno.carrera,
    creditos: s.alumno.creditos,
    dictamen: dictamenLabel(s.dictamen),
    periodoInicio: s.periodo_registro?.evento_calendario?.fecha_inicio ?? null,
    periodoFin: s.periodo_registro?.evento_calendario?.fecha_fin ?? null,
    fechaCreacion: s.fecha_aplicacion,
    tituloOferta: s.oferta?.nombre_proyecto ?? null,
    motivacion: s.motivacion_oferta,
  }));
}

/**
 * CU-GR-02 — Aceptar / Rechazar alumno
 */
async function decidirSolicitud(solicitudId, decision, profesorUsuarioId) {
  if (!['aceptar', 'rechazar'].includes(decision)) {
    throw crearError('Decisión inválida.');
  }

  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: profesorUsuarioId } });
  if (!profesor) {
    throw crearError('No se encontró tu perfil de profesor.', 404);
  }

  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: Number(solicitudId) },
    include: { oferta: true, alumno: true },
  });

  // La solicitud debe existir Y pertenecer a una oferta de ESTE profesor —
  // sin este chequeo, cualquier profesor podría decidir sobre solicitudes
  // ajenas adivinando ids.
  if (!solicitud || solicitud.oferta?.profesor_id !== profesor.id) {
    throw crearError('Solicitud no encontrada.', 404);
  }

  // RN-GR-06: solo se puede decidir sobre solicitudes todavía pendientes.
  if (solicitud.estado_solicitud !== 'espera_respuesta_de_profesor') {
    throw crearError('Esta solicitud ya fue procesada.', 409);
  }

  if (decision === 'rechazar') {
    await prisma.solicitud_registro.update({
      where: { id: solicitud.id },
      data: {
        estado_solicitud: 'rechazada_por_profesor',
        estado_anterior: 'espera_respuesta_de_profesor',
        tipo_rechazo: 'corregible',
        motivo_rechazo: MOTIVO_RECHAZO_PROFESOR,
      },
    });

    try {
      emitirAUsuario(solicitud.alumno.usuario_id, 'solicitud:rechazada', {
        solicitudId: solicitud.id,
        estado_solicitud: 'rechazada_por_profesor',
        motivo: MOTIVO_RECHAZO_PROFESOR,
      });
    } catch (err) {
      console.error('Error al emitir solicitud:rechazada:', err.message);
    }

    return { estado_solicitud: 'rechazada_por_profesor' };
  }

  // ── decision === 'aceptar' ────────────────────────────────────────────
  // ANTES de tocar cupos_disponibles de la oferta, se verifica que el
  // PROFESOR todavía tenga capacidad global (ocupados < cupos_totales) —
  // dentro de la misma transacción (mismo tx).
  //
  // Concurrencia: a diferencia de cupos_disponibles de la oferta (decremento
  // atómico de una sola fila), el límite del profesor se deriva de un COUNT,
  // así que 2 aceptaciones simultáneas del MISMO profesor (en ofertas
  // distintas, o en la misma con 2+ lugares) podrían leer el mismo conteo
  // viejo. Se serializa bloqueando su fila (SELECT ... FOR UPDATE) como
  // PRIMERA sentencia de la transacción — antes de cualquier lectura, para
  // que el COUNT posterior vea lo que la aceptación anterior ya confirmó — y
  // la decisión usa el cupos_totales FRESCO de esa misma fila bloqueada, no
  // el leído antes de abrir la transacción. Profesores distintos no se
  // bloquean entre sí.
  const resultadoTransaccion = await prisma.$transaction(async (tx) => {
    const profesorBloqueado = await bloquearProfesor(profesor.id, tx);

    let motivoRechazoPorCupos = null;
    await asegurarCapacidadProfesor(profesorBloqueado, tx).catch((err) => {
      if (err.code === 'PROFESOR_SIN_CUPOS') {
        motivoRechazoPorCupos = err.message; // única fuente del texto — no se duplica
        return;
      }
      throw err;
    });

    if (motivoRechazoPorCupos !== null) {
      // El profesor ya no tiene capacidad global para aceptar — la
      // solicitud se rechaza automáticamente (no es un error del backend,
      // es un resultado válido: la BD sí cambió).
      await tx.solicitud_registro.update({
        where: { id: solicitud.id },
        data: {
          estado_solicitud: 'rechazada_por_cupos',
          estado_anterior: 'espera_respuesta_de_profesor',
          tipo_rechazo: 'corregible',
          motivo_rechazo: motivoRechazoPorCupos,
        },
      });
      return { estado_solicitud: 'rechazada_por_cupos', motivo: motivoRechazoPorCupos };
    }

    // RN-GR-08: decremento atómico — si ya no hay cupo DE LA OFERTA, count=0
    // y abortamos sin tocar nada (mismo patrón de update condicional que
    // ya usamos en GR-01). Esta guarda es independiente de la del profesor.
    const cupoDecrementado = await tx.oferta_servicio.updateMany({
      where: { id: solicitud.oferta_id, cupos_disponibles: { gt: 0 } },
      data: { cupos_disponibles: { decrement: 1 } },
    });

    if (cupoDecrementado.count === 0) {
      throw crearError('Ya no hay cupo disponible en esta oferta.', 409, 'OFERTA_SIN_CUPOS');
    }

    await tx.solicitud_registro.update({
      where: { id: solicitud.id },
      data: {
        estado_solicitud: 'aceptada_por_profesor',
        estado_anterior: 'espera_respuesta_de_profesor',
      },
    });

    return { estado_solicitud: 'aceptada_por_profesor' };
  });

  if (resultadoTransaccion.estado_solicitud === 'rechazada_por_cupos') {
    try {
      emitirAUsuario(solicitud.alumno.usuario_id, 'solicitud:rechazada_por_cupos', {
        solicitudId: solicitud.id,
        estado_solicitud: 'rechazada_por_cupos',
        motivo: resultadoTransaccion.motivo,
      });
    } catch (err) {
      console.error('Error al emitir solicitud:rechazada_por_cupos:', err.message);
    }
    return { estado_solicitud: 'rechazada_por_cupos' };
  }

  try {
    emitirAUsuario(solicitud.alumno.usuario_id, 'solicitud:aceptada', {
      solicitudId: solicitud.id,
      estado_solicitud: 'aceptada_por_profesor',
    });
  } catch (err) {
    console.error('Error al emitir solicitud:aceptada:', err.message);
  }

  // RN-GR-11 / Excepción E3: el rechazo automático de las demás solicitudes
  // va FUERA de la transacción de aceptación, a propósito — si esto falla,
  // la aceptación YA quedó guardada y no debe revertirse (así lo pide E3:
  // "mantiene la aceptación ya procesada... genera una alerta interna").
  try {
    const ofertaActualizada = await prisma.oferta_servicio.findUnique({ where: { id: solicitud.oferta_id } });

    if (ofertaActualizada.cupos_disponibles === 0) {
      // Socket (Parte 2): un updateMany por sí solo pierde de vista A QUIÉN
      // afectó — se resuelve la lista de alumnos afectados ANTES del
      // updateMany, con el mismo `where`, para poder emitirles después.
      const solicitudesAfectadas = await prisma.solicitud_registro.findMany({
        where: { oferta_id: solicitud.oferta_id, estado_solicitud: 'espera_respuesta_de_profesor' },
        select: { id: true, alumno: { select: { usuario_id: true } } },
      });

      await prisma.solicitud_registro.updateMany({
        where: { oferta_id: solicitud.oferta_id, estado_solicitud: 'espera_respuesta_de_profesor' },
        data: {
          estado_solicitud: 'rechazada_por_cupos',
          estado_anterior: 'espera_respuesta_de_profesor',
          tipo_rechazo: 'corregible',
          motivo_rechazo: MOTIVO_RECHAZO_CUPOS,
        },
      });

      for (const s of solicitudesAfectadas) {
        try {
          emitirAUsuario(s.alumno.usuario_id, 'solicitud:rechazada_por_cupos', {
            solicitudId: s.id,
            estado_solicitud: 'rechazada_por_cupos',
            motivo: MOTIVO_RECHAZO_CUPOS,
          });
        } catch (err) {
          console.error('Error al emitir solicitud:rechazada_por_cupos:', err.message);
        }
      }
    }
  } catch (err) {
    // Excepción E3: alerta interna para revisión manual.
    console.error('🚨 ALERTA (E3): falló el rechazo automático por cupos cubiertos. Requiere revisión manual. Oferta id:', solicitud.oferta_id, err);
  }

  return { estado_solicitud: 'aceptada_por_profesor' };
}

module.exports = { listarSolicitudesPendientes, decidirSolicitud };
