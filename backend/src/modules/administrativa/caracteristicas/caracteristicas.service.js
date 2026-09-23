// CU-ADM-15 (profesor solicita) y CU-ADM-16 (coordinación resuelve) — son el mismo flujo.
//
// MODELO
// Todo profesor parte de CUPOS_BASE (3) y puede tener 0 o 1 característica VIGENTE, guardada en
// profesor.caracteristica_id. NULL = "Profesor base", que NO es una fila del catálogo. La capacidad
// se deriva siempre: cupos_totales = 3 + incremento_cupos de la vigente. Las características nunca
// se acumulan: al ser una sola columna, tener dos es irrepresentable.
//
// solicitud_caracteristica es EXCLUSIVAMENTE historial administrativo: cada solicitud es una fila
// nueva, ninguna se reutiliza ni se sobrescribe, y caracteristica_id NULL significa "quiero volver a
// ser Profesor base". Estados canónicos: pendiente | aprobada | rechazada.
//
// REGLA DE CAPACIDAD
// Una característica cambia SOLO la capacidad global del profesor. Este módulo jamás toca
// oferta_servicio (cupos_ofertados/cupos_disponibles/estado), solicitudes de asignación ni alumnos:
// subir la capacidad global no agranda ninguna oferta existente, y bajarla no expulsa a nadie —
// por eso solo puede aprobarse si los ocupados actuales caben en la nueva capacidad.
//
// Los ocupados se cuentan SIEMPRE con contarCuposOcupados de lib/cupos.js, la misma función que usa
// la aceptación de alumnos en GR. Aquí no se inventa ningún otro criterio.

const prisma = require('../../../lib/prisma');
const { contarCuposOcupados, bloquearProfesor } = require('../../../lib/cupos');
const { crearNotificacion } = require('../../notificaciones/notificaciones.service');
const { emitirAUsuario } = require('../../../sockets/socket.server');

const CUPOS_BASE = 3;

const ESTADO_PENDIENTE = 'pendiente';
const ESTADO_APROBADA = 'aprobada';
const ESTADO_RECHAZADA = 'rechazada';

// Etiqueta de la ausencia de característica. No existe en el catálogo: es solo texto para la UI.
const ETIQUETA_BASE = 'Profesor base';

function crearError(mensaje, status = 400, code, datos) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  if (datos) err.datos = datos;
  return err;
}

const nombreLegible = (caracteristica) => (caracteristica ? caracteristica.nombre.replace(/_/g, ' ') : ETIQUETA_BASE);

// Única fórmula de capacidad del módulo. `null` = Profesor base.
const capacidadCon = (caracteristica) => CUPOS_BASE + (caracteristica?.incremento_cupos ?? 0);

const nombreCompleto = (usuario) => `${usuario.nombre} ${usuario.apellidos}`.trim();

/**
 * El profesor SIEMPRE sale del usuario autenticado: ADM-15 nunca acepta un profesor_id del cliente,
 * así que un profesor no puede operar sobre otro ni un coordinador hacerse pasar por profesor.
 */
async function perfilDelProfesor(usuarioId, tx = prisma) {
  const profesor = await tx.profesor.findUnique({
    where: { usuario_id: usuarioId },
    include: { caracteristica: true, usuario: true },
  });

  if (!profesor) {
    throw crearError('No se encontró tu perfil de profesor.', 404, 'SIN_PERFIL_PROFESOR');
  }
  return profesor;
}

const vistaSolicitud = (solicitud) => ({
  id: solicitud.id,
  estado: solicitud.estado,
  justificacion: solicitud.justificacion,
  comentario: solicitud.comentario,
  fecha: solicitud.fecha,
  fechaRespuesta: solicitud.fecha_respuesta,
  // null = la solicitud pide volver a Profesor base.
  caracteristicaSolicitada: solicitud.caracteristica
    ? { id: solicitud.caracteristica.id, nombre: nombreLegible(solicitud.caracteristica), incrementoCupos: solicitud.caracteristica.incremento_cupos }
    : null,
  capacidadResultante: capacidadCon(solicitud.caracteristica),
});

// ── CU-ADM-15 · Profesor ────────────────────────────────────────────────────

/**
 * Todo lo que la pantalla del profesor necesita para decidir: su característica vigente, su
 * capacidad, sus ocupados REALES y qué puede pedir. Cada opción trae ya calculada su capacidad
 * resultante y si es viable hoy, para que el front pueda avisar antes de enviar — pero la decisión
 * de verdad la vuelve a tomar el backend al crear y al aprobar.
 */
async function obtenerContexto({ usuarioId }) {
  const profesor = await perfilDelProfesor(usuarioId);
  const ocupados = await contarCuposOcupados(profesor.id);

  const [catalogo, pendiente, historial] = await Promise.all([
    prisma.caracteristica.findMany({ orderBy: [{ incremento_cupos: 'asc' }, { nombre: 'asc' }] }),
    prisma.solicitud_caracteristica.findFirst({
      where: { profesor_id: profesor.id, estado: ESTADO_PENDIENTE },
      include: { caracteristica: true },
    }),
    prisma.solicitud_caracteristica.findMany({
      where: { profesor_id: profesor.id },
      include: { caracteristica: true },
      orderBy: { id: 'desc' },
    }),
  ]);

  const opcionDe = (caracteristica) => {
    const capacidadResultante = capacidadCon(caracteristica);
    return {
      caracteristicaId: caracteristica?.id ?? null,
      nombre: nombreLegible(caracteristica),
      incrementoCupos: caracteristica?.incremento_cupos ?? 0,
      capacidadResultante,
      // Con ocupados == capacidad resultante SÍ se permite: el límite es "no dejar a nadie fuera".
      viable: ocupados <= capacidadResultante,
      cuposALiberar: Math.max(0, ocupados - capacidadResultante),
    };
  };

  // La vigente nunca se ofrece (no se puede solicitar lo que ya se tiene), y "volver a Profesor
  // base" solo aparece si hoy tiene alguna característica.
  const opciones = catalogo
    .filter((c) => c.id !== profesor.caracteristica_id)
    .map(opcionDe);
  if (profesor.caracteristica_id !== null) opciones.push(opcionDe(null));

  return {
    profesor: {
      nombre: nombreCompleto(profesor.usuario),
      departamento: profesor.departamento,
      caracteristicaVigente: profesor.caracteristica
        ? { id: profesor.caracteristica.id, nombre: nombreLegible(profesor.caracteristica), incrementoCupos: profesor.caracteristica.incremento_cupos }
        : null,
      cuposTotales: profesor.cupos_totales,
      ocupados,
      cuposBase: CUPOS_BASE,
    },
    opciones,
    solicitudPendiente: pendiente ? vistaSolicitud(pendiente) : null,
    historial: historial.map(vistaSolicitud),
  };
}

/**
 * Crea la solicitud. `caracteristicaId` debe venir explícito: un número del catálogo, o null para
 * pedir volver a Profesor base (por eso no vale con omitirlo).
 *
 * Se valida dentro de una transacción con la fila del profesor bloqueada, igual que la aceptación
 * de alumnos: así dos envíos simultáneos no pueden crear dos pendientes, y el conteo de ocupados
 * no compite con una asignación en curso.
 */
async function crearSolicitud({ usuarioId, caracteristicaId, justificacion }) {
  if (caracteristicaId === undefined) {
    throw crearError('Selecciona la característica que quieres solicitar.', 400);
  }
  if (caracteristicaId !== null && !Number.isInteger(caracteristicaId)) {
    throw crearError('La característica seleccionada no es válida.', 400);
  }

  const justificacionLimpia = typeof justificacion === 'string' ? justificacion.trim() : '';
  if (justificacionLimpia === '') {
    throw crearError('La justificación es obligatoria.', 400);
  }

  const profesor = await perfilDelProfesor(usuarioId);

  const creada = await prisma.$transaction(async (tx) => {
    await bloquearProfesor(profesor.id, tx);

    // Releído BAJO el lock: la vigente pudo cambiar entre la lectura de arriba y este punto.
    const vigenteId = (await tx.profesor.findUnique({ where: { id: profesor.id } })).caracteristica_id;

    const pendiente = await tx.solicitud_caracteristica.findFirst({
      where: { profesor_id: profesor.id, estado: ESTADO_PENDIENTE },
    });
    if (pendiente) {
      throw crearError(
        'Ya tienes una solicitud pendiente de revisión. Espera a que coordinación la resuelva.',
        409,
        'SOLICITUD_PENDIENTE_EXISTENTE',
      );
    }

    let caracteristica = null;
    if (caracteristicaId !== null) {
      caracteristica = await tx.caracteristica.findUnique({ where: { id: caracteristicaId } });
      if (!caracteristica) {
        throw crearError('La característica seleccionada no es válida.', 400);
      }
    }

    if ((caracteristica?.id ?? null) === vigenteId) {
      throw crearError(
        caracteristica
          ? `Ya tienes la característica "${nombreLegible(caracteristica)}" vigente.`
          : 'Ya eres Profesor base: no hay ninguna característica que retirar.',
        400,
        'CARACTERISTICA_YA_VIGENTE',
      );
    }

    const capacidadResultante = capacidadCon(caracteristica);
    const ocupados = await contarCuposOcupados(profesor.id, tx);

    if (ocupados > capacidadResultante) {
      throw crearError(
        `Con ese cambio tu capacidad quedaría en ${capacidadResultante} cupos y hoy tienes ${ocupados} `
        + `ocupados. Necesitas liberar ${ocupados - capacidadResultante} para poder solicitarlo.`,
        409,
        'CAPACIDAD_INSUFICIENTE',
        { capacidadResultante, ocupados, cuposALiberar: ocupados - capacidadResultante },
      );
    }

    return tx.solicitud_caracteristica.create({
      data: {
        profesor_id: profesor.id,
        caracteristica_id: caracteristica?.id ?? null,
        justificacion: justificacionLimpia,
        estado: ESTADO_PENDIENTE,
        fecha: new Date(),
        comentario: null,
        fecha_respuesta: null,
      },
      include: { caracteristica: true },
    });
  });

  await avisarACoordinacion(profesor, creada);
  return vistaSolicitud(creada);
}

async function listarMisSolicitudes({ usuarioId }) {
  const profesor = await perfilDelProfesor(usuarioId);
  const solicitudes = await prisma.solicitud_caracteristica.findMany({
    where: { profesor_id: profesor.id },
    include: { caracteristica: true },
    orderBy: { id: 'desc' },
  });
  return { solicitudes: solicitudes.map(vistaSolicitud) };
}

// ── CU-ADM-16 · Coordinación ────────────────────────────────────────────────

/**
 * Enriquece una solicitud con lo que coordinación necesita para decidir: quién la envía, qué tiene
 * hoy, qué tendría después y cuántos cupos ocupa AHORA MISMO. `puedeAprobarse` se recalcula en cada
 * consulta: una solicitud válida al enviarse puede dejar de serlo si mientras tanto le asignaron
 * alumnos, y una ya resuelta nunca vuelve a serlo.
 */
async function detallarSolicitud(solicitud) {
  const ocupados = await contarCuposOcupados(solicitud.profesor_id);
  const capacidadResultante = capacidadCon(solicitud.caracteristica);
  const cabe = ocupados <= capacidadResultante;

  return {
    ...vistaSolicitud(solicitud),
    profesor: {
      id: solicitud.profesor.id,
      nombre: nombreCompleto(solicitud.profesor.usuario),
      correo: solicitud.profesor.usuario.correo_institucional,
      departamento: solicitud.profesor.departamento,
      caracteristicaVigente: solicitud.profesor.caracteristica
        ? { id: solicitud.profesor.caracteristica.id, nombre: nombreLegible(solicitud.profesor.caracteristica), incrementoCupos: solicitud.profesor.caracteristica.incremento_cupos }
        : null,
      capacidadActual: solicitud.profesor.cupos_totales,
      ocupados,
    },
    capacidadResultante,
    // Una solicitud resuelta es historial: ni se aprueba ni se rechaza otra vez.
    puedeAprobarse: solicitud.estado === ESTADO_PENDIENTE && cabe,
    cuposALiberar: Math.max(0, ocupados - capacidadResultante),
  };
}

const INCLUDE_SOLICITUD_COMPLETA = {
  caracteristica: true,
  profesor: { include: { usuario: true, caracteristica: true } },
};

/**
 * Bandeja COMPARTIDA de Coordinación, con la misma forma que la de Reportes
 * ({ pendientes, procesados }): `pendientes` son las que esperan decisión, de la más antigua a la
 * más reciente, y `resueltas` el historial de aprobadas y rechazadas, de la más reciente hacia atrás.
 *
 * El historial no es un lujo: como la notificación de un coordinador no se retira cuando otro
 * resuelve, quien llegue después debe poder encontrar la solicitud igualmente y ver en qué acabó.
 */
async function listarSolicitudes() {
  const [pendientesFilas, resueltasFilas] = await Promise.all([
    prisma.solicitud_caracteristica.findMany({
      where: { estado: ESTADO_PENDIENTE },
      include: INCLUDE_SOLICITUD_COMPLETA,
      orderBy: { fecha: 'asc' },
    }),
    prisma.solicitud_caracteristica.findMany({
      where: { estado: { in: [ESTADO_APROBADA, ESTADO_RECHAZADA] } },
      include: INCLUDE_SOLICITUD_COMPLETA,
      orderBy: { fecha_respuesta: 'desc' },
    }),
  ]);

  const [pendientes, resueltas] = await Promise.all([
    Promise.all(pendientesFilas.map(detallarSolicitud)),
    Promise.all(resueltasFilas.map(detallarSolicitud)),
  ]);

  return {
    pendientes,
    resueltas,
    totales: { pendientes: pendientes.length, resueltas: resueltas.length },
  };
}

async function obtenerSolicitud({ solicitudId }) {
  const solicitud = await prisma.solicitud_caracteristica.findUnique({
    where: { id: solicitudId },
    include: INCLUDE_SOLICITUD_COMPLETA,
  });
  if (!solicitud) throw crearError('La solicitud no existe.', 404);
  return detallarSolicitud(solicitud);
}

/**
 * Aprobación. La validación que hizo el profesor al enviar NO se da por buena: entre el envío y la
 * revisión pueden haberle asignado alumnos, así que los ocupados y la capacidad resultante se
 * vuelven a calcular en el momento exacto de aprobar.
 *
 * Concurrencia: mismo mecanismo que la aceptación de alumnos en GR (gr-profesor.service.js), no uno
 * paralelo. `bloquearProfesor` toma SELECT ... FOR UPDATE sobre la fila del profesor como PRIMERA
 * sentencia de la transacción — antes de cualquier lectura, para que el COUNT posterior vea lo que
 * una aceptación simultánea ya confirmó. Mientras este lock se retiene, una aceptación de alumno de
 * ese profesor no puede avanzar (y viceversa), así que "contar ocupados" y "bajar la capacidad" no
 * pueden entrelazarse. Profesores distintos no se bloquean entre sí.
 *
 * Si ya no cumple, se lanza CAPACIDAD_INSUFICIENTE: la transacción revierte, la solicitud sigue
 * 'pendiente' y no se tocó ni el profesor ni ninguna oferta. El error lleva los números para que el
 * front explique por qué y coordinación pueda rechazarla con conocimiento.
 */
async function aprobarSolicitud({ solicitudId, comentario }) {
  // Lectura previa fuera de la transacción: solo para saber a qué profesor bloquear.
  const solicitudPrevia = await prisma.solicitud_caracteristica.findUnique({
    where: { id: solicitudId },
    include: INCLUDE_SOLICITUD_COMPLETA,
  });
  if (!solicitudPrevia) throw crearError('La solicitud no existe.', 404);
  if (solicitudPrevia.estado !== ESTADO_PENDIENTE) {
    throw crearError(`Esta solicitud ya fue ${solicitudPrevia.estado}.`, 409, 'SOLICITUD_YA_RESUELTA');
  }

  const comentarioLimpio = typeof comentario === 'string' && comentario.trim() !== '' ? comentario.trim() : null;

  const resultado = await prisma.$transaction(async (tx) => {
    await bloquearProfesor(solicitudPrevia.profesor_id, tx);

    // Releída BAJO el lock: entre la lectura previa y aquí, otro coordinador pudo resolverla.
    const solicitud = await tx.solicitud_caracteristica.findUnique({
      where: { id: solicitudId },
      include: { caracteristica: true },
    });
    if (solicitud.estado !== ESTADO_PENDIENTE) {
      throw crearError(`Esta solicitud ya fue ${solicitud.estado}.`, 409, 'SOLICITUD_YA_RESUELTA');
    }

    const capacidadResultante = capacidadCon(solicitud.caracteristica);
    const ocupados = await contarCuposOcupados(solicitudPrevia.profesor_id, tx);

    if (ocupados > capacidadResultante) {
      throw crearError(
        `No se puede aprobar: el profesor tiene ${ocupados} alumnos ocupando cupo y con este cambio su `
        + `capacidad quedaría en ${capacidadResultante}. Tendría que liberar ${ocupados - capacidadResultante}.`,
        409,
        'CAPACIDAD_INSUFICIENTE',
        { capacidadResultante, ocupados, cuposALiberar: ocupados - capacidadResultante },
      );
    }

    // Solo capacidad GLOBAL del profesor. Nada de ofertas, solicitudes de asignación ni alumnos.
    await tx.profesor.update({
      where: { id: solicitudPrevia.profesor_id },
      data: {
        caracteristica_id: solicitud.caracteristica_id,
        cupos_totales: capacidadResultante,
      },
    });

    const actualizada = await tx.solicitud_caracteristica.update({
      where: { id: solicitudId },
      data: { estado: ESTADO_APROBADA, fecha_respuesta: new Date(), comentario: comentarioLimpio },
      include: { caracteristica: true },
    });

    return { solicitud: actualizada, capacidadResultante };
  });

  await avisarAlProfesor(solicitudPrevia.profesor, resultado.solicitud, {
    tipo: 'success',
    mensaje: `Tu solicitud de característica fue aprobada: ahora eres ${nombreLegible(resultado.solicitud.caracteristica)} `
      + `con ${resultado.capacidadResultante} cupos.`,
  });

  return { ...vistaSolicitud(resultado.solicitud), capacidadResultante: resultado.capacidadResultante };
}

/**
 * Rechazo. El motivo es obligatorio y viaja al profesor en la notificación. No toca la capacidad
 * del profesor ni nada de ofertas: solo cierra la solicitud.
 *
 * El `where` incluye estado 'pendiente', así que un segundo rechazo (o una carrera con una
 * aprobación) no puede sobrescribir una solicitud ya resuelta.
 */
async function rechazarSolicitud({ solicitudId, comentario }) {
  const comentarioLimpio = typeof comentario === 'string' ? comentario.trim() : '';
  if (comentarioLimpio === '') {
    throw crearError('Debes capturar el motivo del rechazo.', 400);
  }

  const solicitud = await prisma.solicitud_caracteristica.findUnique({
    where: { id: solicitudId },
    include: INCLUDE_SOLICITUD_COMPLETA,
  });
  if (!solicitud) throw crearError('La solicitud no existe.', 404);

  const resuelta = await prisma.solicitud_caracteristica.updateMany({
    where: { id: solicitudId, estado: ESTADO_PENDIENTE },
    data: { estado: ESTADO_RECHAZADA, fecha_respuesta: new Date(), comentario: comentarioLimpio },
  });

  if (resuelta.count === 0) {
    throw crearError(`Esta solicitud ya fue ${solicitud.estado}.`, 409, 'SOLICITUD_YA_RESUELTA');
  }

  const actualizada = await prisma.solicitud_caracteristica.findUnique({
    where: { id: solicitudId },
    include: { caracteristica: true },
  });

  await avisarAlProfesor(solicitud.profesor, actualizada, {
    tipo: 'urgente',
    mensaje: `Tu solicitud de característica (${nombreLegible(actualizada.caracteristica)}) fue rechazada. `
      + `Motivo: ${comentarioLimpio}`,
  });

  return vistaSolicitud(actualizada);
}

// ── Notificaciones ──────────────────────────────────────────────────────────
// Mismo mecanismo que Ofertas: crearNotificacion (persiste y la pinta el dashboard) + emitirAUsuario
// (socket, best-effort). Un fallo notificando nunca revierte la decisión ya escrita en BD.

/**
 * La bandeja de Coordinación es COMPARTIDA: el listado no filtra por coordinador, así que se avisa
 * a CADA uno, igual que reportes-revision.service.js y gr.service.js. Un solo `findFirst` dejaría a
 * los demás viendo la solicitud en la lista sin haberse enterado de que llegó.
 *
 * Cada notificación es una fila propia de su destinatario: resolver la solicitud NO retira la de los
 * demás (nada en el sistema escribe notificaciones ajenas). Por eso el historial de abajo importa —
 * quien llegue tarde debe encontrar la solicitud igualmente.
 */
async function avisarACoordinacion(profesor, solicitud) {
  let coordinadores;
  try {
    coordinadores = await prisma.coordinador.findMany({ select: { usuario_id: true } });
  } catch (err) {
    console.error('No se pudo listar a los coordinadores para avisarles de la solicitud:', err.message);
    return;
  }

  const mensaje = `${nombreCompleto(profesor.usuario)} solicitó un cambio de característica: `
    + `${nombreLegible(profesor.caracteristica)} → ${nombreLegible(solicitud.caracteristica)}.`;

  // Fail-open por destinatario: que a uno le falle no deja sin avisar a los demás.
  for (const { usuario_id: coordinadorId } of coordinadores) {
    try {
      await crearNotificacion({
        usuarioId: coordinadorId,
        tipo: 'info',
        mensaje,
        rutaRelacionada: `/coordinacion/solicitudes-caracteristicas?destacar=${solicitud.id}`,
      });

      emitirAUsuario(coordinadorId, 'caracteristica:solicitada', { solicitudId: solicitud.id });
    } catch (err) {
      console.error(`Error al avisar al coordinador ${coordinadorId} de la solicitud:`, err.message);
    }
  }
}

async function avisarAlProfesor(profesor, solicitud, { tipo, mensaje }) {
  try {
    await crearNotificacion({
      usuarioId: profesor.usuario_id,
      tipo,
      mensaje,
      rutaRelacionada: `/profesor/solicitar-modificacion?destacar=${solicitud.id}`,
    });

    emitirAUsuario(profesor.usuario_id, 'caracteristica:resuelta', {
      solicitudId: solicitud.id,
      estado: solicitud.estado,
    });
  } catch (err) {
    console.error('Error al notificar la resolución de la característica al profesor:', err.message);
  }
}

module.exports = {
  obtenerContexto,
  crearSolicitud,
  listarMisSolicitudes,
  listarSolicitudes,
  obtenerSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  CUPOS_BASE,
  ESTADO_PENDIENTE,
  ESTADO_APROBADA,
  ESTADO_RECHAZADA,
};
