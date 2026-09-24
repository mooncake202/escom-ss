const fs = require('fs');
const path = require('path');
const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { descifrarBuffer } = require('../../lib/fileEncryption');
const { crearError, validarReportesValidadosSiss } = require('./validators');
const {
  ESTADO_EVALUACION_SOLICITADA,
  ESTADO_REPORTE_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_RECHAZADA_POR_SISS,
  ESTADO_EVALUACION_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION,
  ESTADO_SOLICITUD_CARTA_TERMINO,
  ESTADO_CARTA_SOLICITADA,
  ESTADO_CARTA_LISTA_PARA_RECOGER,
  ESTADO_CARTA_RECOGIDA,
  ESTADO_LIBERACION_CARTA_RECOGIDA,
  exigirEstadoLiberacion,
  exigirEstadoEvaluacion,
  exigirEstadoCarta,
} = require('./lss.shared');
const { calcularHorasNetas, LIMITE_HORAS_SERVICIO } = require('../ah/ah.shared');

// Misma carpeta que usa GR para documentos cifrados — duplicado a propósito
// (RN de separación por módulo, sin compartir código entre gr/ y lss/, mismo
// criterio ya usado en resolverAlumnoYSolicitud).
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../uploads/documentos');

/**
 * Socket genérico (fail-open): mismo criterio ya usado en ah-profesor.service.js
 * — avisa al profesor que su resumen del dashboard pudo haber cambiado (en
 * este caso, el conteo de alumnos con evaluación de desempeño solicitada).
 */
function emitirResumenActualizadoProfesor(profesorUsuarioId) {
  try {
    emitirAUsuario(profesorUsuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado (profesor, lss):', err.message);
  }
}

/**
 * Mismo criterio, pero hacia el propio alumno — su widget de "Proceso de
 * Liberación del Servicio Social" en el dashboard debe desaparecer en vivo
 * al iniciar su evaluación (deja de mostrar el estado 1/2 y pasa a estado 3,
 * sin proceso mostrado todavía porque CU-LSS-02 no existe aún).
 */
function emitirResumenActualizadoAlumno(alumnoUsuarioId) {
  try {
    emitirAUsuario(alumnoUsuarioId, 'resumen:actualizado', {});
  } catch (err) {
    console.error('Error al emitir resumen:actualizado (alumno, lss):', err.message);
  }
}

/**
 * Mismo patrón que resolverAlumnoYSolicitud en ah-alumno.service.js —
 * duplicado a propósito (RN de separación por actor, sin compartir código
 * entre módulos). Incluye `oferta` porque RN-LSS-02 depende de
 * tipo_oferta/estado_oferta.
 */
async function resolverAlumnoYSolicitud(alumnoUsuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: alumnoUsuarioId },
    include: {
      solicitud_registro: {
        include: {
          oferta: { include: { profesor: true } },
          liberacion_proceso: true,
        },
      },
    },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de servicio social.', 404);
  }

  return { alumno, solicitud: alumno.solicitud_registro };
}

/**
 * RN-LSS-02: calcula cada requisito por separado para que el frontend pinte
 * tarjetas verde/rojo. Reglas ya confirmadas con el usuario:
 * - Horas netas >= 480, aplica a AMBOS tipos de oferta sin excepción.
 * - Reportes: al menos 6 reporte_mensual enviados y TODOS con
 *   estado_reporte === 'aprobado_coordinador' (no solo 6 de los que haya),
 *   más el reporte_global también con estado_reporte === 'aprobado_coordinador'.
 *   Corregido: NO se usa revision_reporte_mensual/global para esto — esas
 *   tablas son el historial append-only de cada acción individual (alumno
 *   firma, profesor decide, coordinación decide), no el estado actual del
 *   reporte; usar "la revisión más reciente" daba falsos positivos justo
 *   después de que un alumno corrige y reenvía un reporte rechazado (su
 *   propia firma de reenvío queda como "más reciente" con estado
 *   'aprobado', aunque el reporte en realidad volvió a
 *   pendiente_revision_profesor). El estado real y único que importa vive
 *   directo en reporte_mensual.estado_reporte / reporte_global.estado_reporte.
 * - Oferta 'Concluida': SOLO aplica si tipo_oferta === 'individual'.
 */
async function calcularRequisitos(solicitud, alumnoBoleta) {
  const [cumulo, reportesMensuales, reporteGlobal] = await Promise.all([
    prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: alumnoBoleta } }),
    prisma.reporte_mensual.findMany({
      where: { solicitud_registro_id: solicitud.id },
      select: { estado_reporte: true },
    }),
    prisma.reporte_global.findFirst({
      where: { solicitud_registro_id: solicitud.id },
      select: { estado_reporte: true },
    }),
  ]);

  const horasNetas = calcularHorasNetas(cumulo);
  const cumpleHoras = horasNetas >= LIMITE_HORAS_SERVICIO;

  const totalReportesMensuales = reportesMensuales.length;
  const todosMensualesAprobados = totalReportesMensuales > 0
    && reportesMensuales.every((r) => r.estado_reporte === ESTADO_REPORTE_APROBADO_COORDINADOR);
  const cumpleMensuales = totalReportesMensuales >= 6 && todosMensualesAprobados;

  const globalAprobado = reporteGlobal?.estado_reporte === ESTADO_REPORTE_APROBADO_COORDINADOR;
  const cumpleReportes = cumpleMensuales && globalAprobado;

  const aplicaOferta = solicitud.oferta?.tipo_oferta === 'individual';
  const cumpleOferta = aplicaOferta ? solicitud.oferta.estado_oferta === 'Concluida' : true;

  const cumpleTodos = cumpleHoras && cumpleReportes && cumpleOferta;

  return {
    cumpleTodos,
    requisitos: {
      horas: { cumple: cumpleHoras, horasNetas, requeridas: LIMITE_HORAS_SERVICIO },
      reportes: {
        cumple: cumpleReportes,
        totalMensualesEnviados: totalReportesMensuales,
        todosMensualesAprobados,
        globalEnviado: !!reporteGlobal,
        globalAprobado,
      },
      oferta: { aplica: aplicaOferta, cumple: aplicaOferta ? cumpleOferta : null },
    },
  };
}

async function obtenerEstadoRequisitos(alumnoUsuarioId) {
  const { alumno, solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  if (solicitud.liberacion_proceso) {
    return { yaExiste: true, estado: solicitud.liberacion_proceso.estado };
  }

  const { cumpleTodos, requisitos } = await calcularRequisitos(solicitud, alumno.boleta);
  return { yaExiste: false, cumpleTodos, requisitos };
}

/**
 * RN-LSS-01: nunca crea un segundo proceso. RN-LSS-02: revalida TODO en el
 * backend — nunca confía en lo que el frontend ya mostró.
 */
async function iniciarEvaluacion(alumnoUsuarioId, reportesValidadosSiss) {
  validarReportesValidadosSiss(reportesValidadosSiss);

  const { alumno, solicitud } = await resolverAlumnoYSolicitud(alumnoUsuarioId);

  if (solicitud.liberacion_proceso) {
    throw crearError('Ya tienes un proceso de liberación en curso.', 409);
  }

  const { cumpleTodos } = await calcularRequisitos(solicitud, alumno.boleta);
  if (!cumpleTodos) {
    throw crearError('No cumples los requisitos para iniciar la evaluación de desempeño.', 409);
  }

  const proceso = await prisma.liberacion_proceso.create({
    data: {
      solicitud_registro_id: solicitud.id,
      estado: ESTADO_EVALUACION_SOLICITADA,
      fecha_inicio: new Date(),
      reportes_validados_siss: reportesValidadosSiss,
    },
  });

  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) {
    emitirResumenActualizadoProfesor(profesorUsuarioId);
  }
  emitirResumenActualizadoAlumno(alumnoUsuarioId);

  return {
    id: proceso.id,
    estado: proceso.estado,
    fecha_inicio: proceso.fecha_inicio,
    reportes_validados_siss: proceso.reportes_validados_siss,
  };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-02: consultar y actuar sobre el estado de la evaluación de
// desempeño. NO construye ninguna lógica real de LSS-03/04 (el profesor/
// coordinación evaluando) — solo lee lo que esos CU futuros produzcan, y
// las acciones que le corresponden al alumno sobre eso.
// ─────────────────────────────────────────────────────────────

/**
 * Mismo patrón que resolverAlumnoYSolicitud, pero además exige que ya
 * exista liberacion_proceso (CU-LSS-02 en adelante no tiene sentido sin
 * uno) y trae evaluacion_desempeno + sus revisiones, y carta_termino, si
 * existen. Se reutiliza tal cual para CU-LSS-05 (carta_termino) — sin
 * duplicar un resolver aparte solo por eso, mismo criterio de reuso ya
 * usado en el resto de este archivo.
 */
async function resolverConEvaluacion(alumnoUsuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: alumnoUsuarioId },
    include: {
      solicitud_registro: {
        include: {
          oferta: { include: { profesor: true } },
          liberacion_proceso: {
            include: {
              evaluacion_desempeno: { include: { revision_desempeno: true } },
              carta_termino: true,
            },
          },
        },
      },
    },
  });

  if (!alumno || !alumno.solicitud_registro) {
    throw crearError('No se encontró tu solicitud de servicio social.', 404);
  }
  const solicitud = alumno.solicitud_registro;
  if (!solicitud.liberacion_proceso) {
    throw crearError('No tienes un proceso de liberación iniciado.', 404);
  }

  return { alumno, solicitud, proceso: solicitud.liberacion_proceso };
}

/**
 * RF-LSS — resuelve cuál de los 5 alternos de CU-LSS-02 le toca pintar al
 * frontend, sin que este tenga que reimplementar ninguna regla:
 * A: sin evaluar (evaluacion_desempeno no existe todavía).
 * B: profesor aprobó, coordinación pendiente.
 * C: profesor rechazó (reportes SISS no confirmados).
 * D: ambas firmas completas.
 * E: coordinación devolvió para corrección (CU-LSS-04, Camino A) — el
 *    alumno no hace nada aquí, le toca al profesor corregir y reenviar.
 *    Corregido: antes 'devuelta_para_correccion' caía por default en 'B'
 *    ("coordinación pendiente"), mensaje incorrecto porque coordinación
 *    YA actuó (rechazó) y la pelota está con el profesor, no con ella.
 */
async function obtenerEstadoEvaluacion(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  const evaluacion = proceso.evaluacion_desempeno;

  const base = {
    evaluacionDescargada: !!proceso.evaluacion_descargada,
    evaluacionSubidaSiss: !!proceso.evaluacion_subida_siss,
    reportesValidadosSiss: !!proceso.reportes_validados_siss,
  };

  if (!evaluacion) {
    return { alterno: 'A', firmadoProfesor: false, firmadoCoordinacion: false, motivoRechazo: null, ...base };
  }

  const firmaProfesor = evaluacion.revision_desempeno.find((r) => r.tipo_revisor === 'profesor');
  const firmaCoordinacion = evaluacion.revision_desempeno.find((r) => r.tipo_revisor === 'coordinador');

  const alterno = evaluacion.estado === ESTADO_EVALUACION_RECHAZADA_POR_SISS
    ? 'C'
    : evaluacion.estado === ESTADO_EVALUACION_APROBADO_COORDINADOR
      ? 'D'
      : evaluacion.estado === ESTADO_EVALUACION_DEVUELTA_PARA_CORRECCION
        ? 'E'
        : 'B';

  return {
    alterno,
    firmadoProfesor: firmaProfesor?.estado === 'aprobado',
    firmadoCoordinacion: firmaCoordinacion?.estado === 'aprobado',
    // Único campo de texto libre real asociado al profesor en el schema
    // (no existe motivo_rechazo_profesor — ese nombre solo existe para
    // coordinación, motivo_rechazo_coordinacion, terreno de LSS-04).
    motivoRechazo: alterno === 'C' ? (evaluacion.observaciones_profesor ?? null) : null,
    ...base,
  };
}

/**
 * RN-LSS-06: reenvía la solicitud tras un rechazo del profesor — solo
 * posible si el alumno confirma explícitamente reportesValidadosSiss=true.
 * Un rechazo por SISS (CU-LSS-03, rechazarPorSiss) NUNCA tiene documento
 * real detrás — documento_id es NULL a propósito (corregido: un rechazo no
 * tiene PDF/firma/hash/TSA, nunca debió tenerlos) — así que "revertir a
 * pendiente" es simplemente borrar la fila de evaluacion_desempeno (cascada
 * a revision_desempeno), sin ningún documento ni archivo que limpiar.
 */
async function reenviarSolicitudEvaluacion(alumnoUsuarioId, reportesValidadosSiss) {
  if (reportesValidadosSiss !== true) {
    throw crearError('Debes confirmar que ya subiste tus reportes al SISS antes de reenviar.');
  }

  const { solicitud, proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoLiberacion(proceso, ESTADO_EVALUACION_SOLICITADA, 'Tu proceso de liberación ya no está en el paso de evaluación.');
  exigirEstadoEvaluacion(proceso.evaluacion_desempeno, ESTADO_EVALUACION_RECHAZADA_POR_SISS, 'Tu evaluación no está en estado de rechazo — no hay nada que reenviar.');

  const evaluacion = proceso.evaluacion_desempeno;

  await prisma.$transaction([
    prisma.evaluacion_desempeno.delete({ where: { id: evaluacion.id } }),
    prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { reportes_validados_siss: true } }),
  ]);

  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) emitirResumenActualizadoProfesor(profesorUsuarioId);

  return { mensaje: 'Tu solicitud fue reenviada correctamente.' };
}

/**
 * Alterno D: sirve el PDF real (descifrado) y marca evaluacion_descargada.
 * Exige ambas firmas completas (estado='aprobado_coordinador').
 */
async function marcarEvaluacionDescargada(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoEvaluacion(proceso.evaluacion_desempeno, ESTADO_EVALUACION_APROBADO_COORDINADOR, 'Tu evaluación todavía no está disponible para descargar.');

  const documento = await prisma.documento.findUnique({ where: { id: proceso.evaluacion_desempeno.documento_id } });

  let bufferCifrado;
  try {
    bufferCifrado = fs.readFileSync(path.join(RUTA_BASE_DOCUMENTOS, documento.ruta_archivo));
  } catch (err) {
    throw crearError('El archivo ya no está disponible.', 404);
  }

  if (!proceso.evaluacion_descargada) {
    await prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { evaluacion_descargada: true } });
    emitirResumenActualizadoAlumno(alumnoUsuarioId);
  }

  return descifrarBuffer(bufferCifrado);
}

/**
 * RN-LSS-07 (orden obligatorio): no se puede confirmar la subida a SISS
 * sin haber descargado la evaluación primero — rechazo real en backend,
 * no solo bloqueo visual.
 */
async function confirmarSubidaSiss(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoEvaluacion(proceso.evaluacion_desempeno, ESTADO_EVALUACION_APROBADO_COORDINADOR, 'Tu evaluación todavía no está disponible.');

  if (!proceso.evaluacion_descargada) {
    throw crearError('Debes descargar tu evaluación antes de confirmar que la subiste al SISS.', 409);
  }

  await prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { evaluacion_subida_siss: true } });
  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  return { mensaje: 'Confirmado.' };
}

/**
 * Cierre del Alterno D — exige ambos booleanos en true, avanza
 * liberacion_proceso.estado a 'solicitud_carta_termino' (CU-LSS-05), y
 * crea la fila carta_termino (estado='solicitada', fecha_solicitud=ahora)
 * en la MISMA transacción — es el único punto real donde "se solicita" la
 * carta, así que fecha_solicitud debe nacer aquí (campo obligatorio en el
 * schema, sin default) y no en un paso posterior (CU-LSS-05/06), evitando
 * una ventana de inconsistencia donde liberacion_proceso ya avanzó pero
 * carta_termino todavía no existe.
 */
async function solicitarCartaTermino(alumnoUsuarioId) {
  const { solicitud, proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoLiberacion(proceso, ESTADO_EVALUACION_SOLICITADA, 'Tu proceso de liberación ya no está en el paso de evaluación.');

  if (!proceso.evaluacion_descargada || !proceso.evaluacion_subida_siss) {
    throw crearError('Debes descargar tu evaluación y confirmar que ya la subiste al SISS antes de continuar.', 409);
  }

  await prisma.$transaction([
    prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { estado: ESTADO_SOLICITUD_CARTA_TERMINO } }),
    prisma.carta_termino.create({
      data: {
        liberacion_proceso_id: proceso.id,
        estado: ESTADO_CARTA_SOLICITADA,
        carta_recogida: false,
        fecha_solicitud: new Date(),
      },
    }),
  ]);

  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) emitirResumenActualizadoProfesor(profesorUsuarioId);

  return { mensaje: 'Solicitud de carta de término enviada.', estado: ESTADO_SOLICITUD_CARTA_TERMINO };
}

// ─────────────────────────────────────────────────────────────
// CU-LSS-05: consultar y confirmar la recogida de la carta de término.
// NO construye ninguna lógica real de CU-LSS-06 (coordinación marcando la
// carta como lista) — el seed de prueba simula ese paso mientras ese CU no
// exista.
// ─────────────────────────────────────────────────────────────

/**
 * Flujo Principal — consulta pura, sin cambios en BD. Fail-safe a
 * ESTADO_CARTA_SOLICITADA si por algún motivo la fila no existe todavía
 * (no debería pasar, solicitarCartaTermino ya la crea).
 */
async function obtenerEstadoCarta(alumnoUsuarioId) {
  const { proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  return { estado: proceso.carta_termino?.estado ?? ESTADO_CARTA_SOLICITADA };
}

/**
 * Flujo Alterno — RN-LSS-16: rechazo real en backend (409) si coordinación
 * todavía no marcó la carta como disponible, no solo bloqueo visual.
 * RF-LSS-23: fecha de recogida registrada en carta_termino.fecha_recogida.
 */
async function confirmarRecogida(alumnoUsuarioId) {
  const { solicitud, proceso } = await resolverConEvaluacion(alumnoUsuarioId);
  exigirEstadoCarta(proceso.carta_termino, ESTADO_CARTA_LISTA_PARA_RECOGER, 'Tu carta de término todavía no está lista para recoger.');

  await prisma.$transaction([
    prisma.carta_termino.update({
      where: { id: proceso.carta_termino.id },
      data: { estado: ESTADO_CARTA_RECOGIDA, carta_recogida: true, fecha_recogida: new Date() },
    }),
    prisma.liberacion_proceso.update({
      where: { id: proceso.id },
      data: { estado: ESTADO_LIBERACION_CARTA_RECOGIDA, carta_termino_recogida: true },
    }),
  ]);

  emitirResumenActualizadoAlumno(alumnoUsuarioId);
  const profesorUsuarioId = solicitud.oferta?.profesor?.usuario_id;
  if (profesorUsuarioId) emitirResumenActualizadoProfesor(profesorUsuarioId);

  return { mensaje: 'Recogida confirmada.', estado: ESTADO_LIBERACION_CARTA_RECOGIDA };
}

module.exports = {
  obtenerEstadoRequisitos,
  iniciarEvaluacion,
  obtenerEstadoEvaluacion,
  reenviarSolicitudEvaluacion,
  marcarEvaluacionDescargada,
  confirmarSubidaSiss,
  solicitarCartaTermino,
  obtenerEstadoCarta,
  confirmarRecogida,
};
