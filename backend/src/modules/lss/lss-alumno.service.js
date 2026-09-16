const prisma = require('../../lib/prisma');
const { emitirAUsuario } = require('../../sockets/socket.server');
const { crearError, validarReportesValidadosSiss } = require('./validators');
const { ESTADO_EVALUACION_SOLICITADA } = require('./lss.shared');
const { calcularHorasNetas, LIMITE_HORAS_SERVICIO } = require('../ah/ah.shared');

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
 * - Reportes: al menos 6 reporte_mensual enviados y TODOS con su revisión
 *   más reciente 'aprobado' (no solo 6 de los que haya), más el
 *   reporte_global con su revisión más reciente 'aprobado'.
 * - Oferta 'Concluida': SOLO aplica si tipo_oferta === 'individual'.
 */
async function calcularRequisitos(solicitud, alumnoBoleta) {
  const [cumulo, reportesMensuales, reporteGlobal] = await Promise.all([
    prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: alumnoBoleta } }),
    prisma.reporte_mensual.findMany({
      where: { solicitud_registro_id: solicitud.id },
      include: { revision_reporte_mensual: { orderBy: { fecha: 'desc' } } },
    }),
    prisma.reporte_global.findFirst({
      where: { solicitud_registro_id: solicitud.id },
      include: { revision_reporte_global: { orderBy: { fecha: 'desc' } } },
    }),
  ]);

  const horasNetas = calcularHorasNetas(cumulo);
  const cumpleHoras = horasNetas >= LIMITE_HORAS_SERVICIO;

  const totalReportesMensuales = reportesMensuales.length;
  const todosMensualesAprobados = totalReportesMensuales > 0
    && reportesMensuales.every((r) => r.revision_reporte_mensual[0]?.estado === 'aprobado');
  const cumpleMensuales = totalReportesMensuales >= 6 && todosMensualesAprobados;

  const globalAprobado = reporteGlobal?.revision_reporte_global[0]?.estado === 'aprobado';
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

module.exports = { obtenerEstadoRequisitos, iniciarEvaluacion };
