const prisma = require('../../lib/prisma');
const { tieneActividadesPendientes, faltaBitacoraHoy, tieneJornadaPendienteDatos, calcularDiaMexicoUTC, contarDiasHabilesTranscurridos, calcularHorasNetas, limiteHorasAlcanzado } = require('../ah/ah.shared');
const { ESTADO_EVALUACION_SOLICITADA: ESTADO_LSS_EVALUACION_SOLICITADA, ESTADO_EXPEDIENTE_EN_REVISION: ESTADO_LSS_EXPEDIENTE_EN_REVISION, ESTADO_TERMINAL: ESTADO_LSS_TERMINAL } = require('../lss/lss.shared');
const { contarAlumnosConEvaluacionSolicitada } = require('../lss/lss-profesor.service');
const { obtenerEstadoRequisitos } = require('../lss/lss-alumno.service');

const ESTADOS_ACTIVOS = ['sin_comenzar', 'en_progreso'];

function formatearPeriodo(periodo) {
  if (!periodo) return null;
  const semestreNum = periodo.semestre.replace('s0', '');
  return `${periodo.anio}-${semestreNum}`;
}

/**
 * Notificaciones calculadas del dashboard de profesor (Tipo A, sin tabla
 * `notificacion`): por cada alumno de este profesor, evalúa sobre sus
 * actividades ACTIVAS (sin_comenzar/en_progreso — nunca vencida ni
 * completadas) dos condiciones independientes:
 * - actividadesProximasACaducar: la fecha_limite MÁS LEJANA entre sus
 *   activas está a menos de 2 días de hoy (México, día calendario) o ya
 *   pasó — "la última actividad que le queda por hacer" está por vencer.
 * - alumnoSinActividades: el alumno tiene CERO actividades activas y su
 *   periodo ya inició o inicia mañana (no tiene sentido avisar de un
 *   alumno cuyo servicio ni siquiera ha comenzado).
 * Basta con que UN alumno cumpla cada condición para activar el aviso
 * correspondiente — el mensaje es fijo, sin conteo.
 */
async function calcularAlertasActividadesProfesor(profesorId) {
  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: 'alumno_asignado', oferta: { profesor_id: profesorId } },
    select: {
      periodo_registro: { select: { evento_calendario: { select: { fecha_inicio: true } } } },
      actividad: { where: { estado: { in: ESTADOS_ACTIVOS } }, select: { fecha_limite: true } },
    },
  });

  const hoy = calcularDiaMexicoUTC();
  let actividadesProximasACaducar = false;
  let alumnoSinActividades = false;

  for (const s of solicitudes) {
    if (s.actividad.length === 0) {
      const fechaInicio = s.periodo_registro?.evento_calendario?.fecha_inicio;
      if (fechaInicio) {
        const diasHastaInicio = Math.round((new Date(fechaInicio) - hoy) / 86400000);
        if (diasHastaInicio <= 1) alumnoSinActividades = true;
      }
      continue;
    }
    const maxFechaLimite = s.actividad.reduce(
      (max, a) => (a.fecha_limite > max ? a.fecha_limite : max),
      s.actividad[0].fecha_limite,
    );
    const diasHastaLimite = Math.round((new Date(maxFechaLimite) - hoy) / 86400000);
    if (diasHastaLimite < 2) actividadesProximasACaducar = true;
  }

  return { actividadesProximasACaducar, alumnoSinActividades };
}

/**
 * RN-AH-24 (AH-04): notificación calculada — basta con que exista UNA
 * bitácora 'pendiente_revision' de este profesor con más de 5 días HÁBILES
 * de antigüedad (no días calendario) respecto a hoy (México).
 */
async function calcularBitacorasRevisionAtrasada(profesorId) {
  const pendientes = await prisma.bitacora.findMany({
    where: { estado: 'pendiente_revision', solicitud_registro: { oferta: { profesor_id: profesorId } } },
    select: { fecha_registro: true },
  });
  if (pendientes.length === 0) return false;

  const hoy = calcularDiaMexicoUTC();
  for (const b of pendientes) {
    const dias = await contarDiasHabilesTranscurridos(new Date(b.fecha_registro), hoy);
    if (dias > 5) return true;
  }
  return false;
}

async function resumenAlumno(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: {
      cumulo_horas_y_faltas: true,
      solicitud_registro: {
        include: { oferta: true, periodo_registro: true },
      },
    },
  });

  if (!alumno || !alumno.solicitud_registro) {
    return {
      horasAcumuladas: 0, horasNetas: 0, faltasAcumuladas: 0, faltasConsecutivas: 0,
      actividadesAsignadas: 0, reportesEnviados: 0,
      ofertaNombre: null, periodoLabel: null,
      bitacoraHoyPendiente: false, jornadaSinTerminar: false,
      cumpleRequisitosLiberacion: false, tieneProcesoLiberacionIniciado: false, estadoLiberacion: null,
    };
  }

  const solicitudId = alumno.solicitud_registro.id;

  const [actividadesAsignadas, reportesEnviados, actividadesPendientes, bitacoraHoyPendiente, jornadaSinTerminar, estadoLiberacion] = await Promise.all([
    // "Actividades activas" — SOLO sin_comenzar/en_progreso; excluye vencida
    // y ambas variantes de completada (antes contaba todo, bug reportado).
    prisma.actividad.count({ where: { solicitud_registro_id: solicitudId, estado: { in: ['sin_comenzar', 'en_progreso'] } } }),
    prisma.reporte_mensual.count({ where: { solicitud_registro_id: solicitudId } }),
    tieneActividadesPendientes(solicitudId),
    faltaBitacoraHoy(solicitudId),
    tieneJornadaPendienteDatos(solicitudId),
    // Widget "Proceso de Liberación del Servicio Social" — reutiliza TAL
    // CUAL la validación de RN-LSS-02 ya construida en CU-LSS-01, no la
    // duplica. LIMITACIÓN CONOCIDA: los requisitos de reportes/oferta
    // dependen de los módulos de Reportes/Ofertas, que todavía no existen y
    // por lo tanto no emiten resumen:actualizado — si esos datos cambian
    // por fuera del flujo actual (ej. ajuste manual en BD para pruebas), el
    // widget no se refresca en vivo hasta recargar. No es un bug: en cuanto
    // esos módulos existan y emitan el evento genérico, este widget ya
    // reacciona solo (ya escucha resumen:actualizado), sin cambios aquí.
    obtenerEstadoRequisitos(usuarioId),
  ]);

  return {
    horasAcumuladas: alumno.cumulo_horas_y_faltas?.horas_acumuladas ?? 0,
    // Horas netas/reales — SIEMPRE acumuladas menos rechazadas. horasAcumuladas
    // se mantiene tal cual (bruto histórico) por si algo más lo necesita crudo.
    horasNetas: calcularHorasNetas(alumno.cumulo_horas_y_faltas),
    faltasAcumuladas: alumno.cumulo_horas_y_faltas?.faltas_acumuladas ?? 0,
    faltasConsecutivas: alumno.cumulo_horas_y_faltas?.faltas_consecutivas ?? 0,
    actividadesAsignadas,
    reportesEnviados,
    actividadesPendientes,
    // No tiene sentido pedirle al alumno su bitácora del día si ya completó
    // sus 480h netas — mismo criterio ya usado en iniciarJornada y en el
    // cron de faltas (limiteHorasAlcanzado sobre el cumulo ya cargado
    // arriba, sin queries nuevas). jornadaSinTerminar NO se toca: sigue
    // siendo un pendiente real sin importar el total acumulado.
    bitacoraHoyPendiente: bitacoraHoyPendiente && !limiteHorasAlcanzado(alumno.cumulo_horas_y_faltas),
    jornadaSinTerminar,
    ofertaNombre: alumno.solicitud_registro.oferta?.nombre_proyecto ?? null,
    periodoLabel: formatearPeriodo(alumno.solicitud_registro.periodo_registro),
    tieneProcesoLiberacionIniciado: estadoLiberacion.yaExiste,
    cumpleRequisitosLiberacion: !estadoLiberacion.yaExiste && !!estadoLiberacion.cumpleTodos,
    // Estado real de liberacion_proceso (null si aún no existe) — lo
    // necesita el botón "Ver proceso de liberación" del dashboard para
    // navegar a la ruta que corresponde al estado actual, no a una fija.
    estadoLiberacion: estadoLiberacion.yaExiste ? estadoLiberacion.estado : null,
  };
}

async function resumenProfesor(usuarioId) {
  const profesor = await prisma.profesor.findUnique({
    where: { usuario_id: usuarioId },
    include: {
      solicitud_caracteristica: {
        where: { estado: 'aprobado' },
        include: { caracteristica: true },
      },
    },
  });

  if (!profesor) {
    return {
      alumnosAsignados: 0, cuposTotales: 0, ofertasActivas: 0,
      reportesPorRevisar: 0, bitacorasPorRevisar: 0, solicitudesPendientes: 0,
      alumnosConFaltasCriticas: 0,
      alumnosConEvaluacionSolicitada: 0,
      actividadesProximasACaducar: false, alumnoSinActividades: false,
      bitacorasRevisionAtrasada: false,
      departamento: null, cubiculo: null, caracteristicas: [],
    };
  }

const [alumnosAsignados, ofertasActivas, solicitudesPendientes, alumnosConFaltasCriticas, alumnosConEvaluacionSolicitada, bitacorasPorRevisar, alertasActividades, bitacorasRevisionAtrasada] = await Promise.all([
    // Antes contaba TODAS las solicitudes de sus ofertas (incluyendo las que
    // apenas se enviaron) — ahora solo cuenta las que de verdad llegaron al
    // final del proceso GR.
    prisma.solicitud_registro.count({
      where: { oferta: { profesor_id: profesor.id }, estado_solicitud: 'alumno_asignado' },
    }),
    prisma.oferta_servicio.count({ where: { profesor_id: profesor.id, estado_oferta: 'Aprobada' } }),
    // Ya resuelto por CU-GR-02: coincide con RN-GR-06 (mismo criterio que usa
    // el propio profesor para ver su lista de solicitudes pendientes).
    prisma.solicitud_registro.count({
      where: { oferta: { profesor_id: profesor.id }, estado_solicitud: 'espera_respuesta_de_profesor' },
    }),
    // Notificación calculada del dashboard: cuántos alumnos de este profesor
    // cumplen CUALQUIERA de las 2 condiciones de "faltas críticas" (unión,
    // sin contar dos veces al que cumple ambas) — decisión de diseño: es UNA
    // sola notificación, no dos separadas. Dirige a "solicitar baja de alumno".
    prisma.cumulo_horas_y_faltas.count({
      where: {
        OR: [
          { faltas_consecutivas: { gte: 5 } },
          { faltas_acumuladas: { gte: 18 } },
        ],
        alumno: { solicitud_registro: { oferta: { profesor_id: profesor.id } } },
      },
    }),
    // RF-LSS-02/RF-LSS-04: notificación calculada — cuántos alumnos de este
    // profesor tienen una evaluación de desempeño solicitada (CU-LSS-01)
    // esperando a que el profesor la revise (CU-LSS-03, no construido
    // todavía). Cálculo real vive en lss/lss-profesor.service.js.
    contarAlumnosConEvaluacionSolicitada(profesor.id),
    // CU-AH-04 no está construido todavía (revisar/aprobar/rechazar sigue
    // mockeado en el frontend) — pero el CONTEO en sí ya es real: cuántas
    // bitácoras de sus alumnos están en 'pendiente_revision'.
    prisma.bitacora.count({
      where: { estado: 'pendiente_revision', solicitud_registro: { oferta: { profesor_id: profesor.id } } },
    }),
    calcularAlertasActividadesProfesor(profesor.id),
    calcularBitacorasRevisionAtrasada(profesor.id),
  ]);

  return {
    alumnosAsignados,
    bitacorasRevisionAtrasada,
    actividadesProximasACaducar: alertasActividades.actividadesProximasACaducar,
    alumnoSinActividades: alertasActividades.alumnoSinActividades,
    cuposTotales: profesor.cupos_totales,
    ofertasActivas,
    solicitudesPendientes,
    alumnosConFaltasCriticas,
    alumnosConEvaluacionSolicitada,
    // TODO: requiere convención de estado de CU-REP — todavía no construido.
    reportesPorRevisar: 0,
    bitacorasPorRevisar,
    departamento: profesor.departamento,
    cubiculo: profesor.cubiculo,
    caracteristicas: profesor.solicitud_caracteristica.map((sc) => sc.caracteristica.nombre.replace(/_/g, ' ')),
  };

}



/**
 * Prisma no puede filtrar por una resta calculada (horas_acumuladas -
 * horas_rechazadas) directamente en un `where` — se trae el mínimo
 * necesario de todos los cúmulos y se cuenta en JS con el mismo criterio
 * de horas netas que el resto del módulo (limiteHorasAlcanzado).
 */
async function contarAlumnosConHorasCompletas() {
  const cumulos = await prisma.cumulo_horas_y_faltas.findMany({
    select: { horas_acumuladas: true, horas_rechazadas: true },
  });
  return cumulos.filter(limiteHorasAlcanzado).length;
}

async function resumenCoordinacion() {
  const [
    alumnosRegistrados,
    expedientesEnRevision,
    evaluacionesPendientes,
    alumnosConHorasCompletas,
    alumnosEnProcesoLiberacion,
    periodoMasReciente,
  ] = await Promise.all([
    prisma.solicitud_registro.count(),
    prisma.liberacion_proceso.count({ where: { estado: ESTADO_LSS_EXPEDIENTE_EN_REVISION } }),
    prisma.liberacion_proceso.count({ where: { estado: ESTADO_LSS_EVALUACION_SOLICITADA } }),
    contarAlumnosConHorasCompletas(),
    prisma.liberacion_proceso.count({ where: { NOT: { estado: ESTADO_LSS_TERMINAL } } }),
    prisma.periodo_registro.findFirst({ orderBy: { id: 'desc' } }),
  ]);

  return {
    alumnosRegistrados,
    expedientesEnRevision,
    evaluacionesPendientes,
    alumnosConHorasCompletas,
    alumnosEnProcesoLiberacion,
    periodoLabel: formatearPeriodo(periodoMasReciente),
    solicitudesRegistroPendientes: await prisma.solicitud_registro.count({ where: { estado_solicitud: 'SISS_y_documentacion_pendiente' } }),
    expedientesPendientes: await prisma.solicitud_registro.count({ where: { estado_solicitud: 'expediente_pendiente_revision' } }),
    reportesPorRevisar: 0,
    reportesAprobadosMes: 0,
    ofertasPorValidar: 0,
  };
}

module.exports = { resumenAlumno, resumenProfesor, resumenCoordinacion };