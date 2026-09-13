const prisma = require('../../lib/prisma');
const { tieneActividadesPendientes, faltaBitacoraHoy, tieneJornadaPendienteDatos } = require('../ah/ah.shared');

const ESTADO_LSS_EXPEDIENTE_EN_REVISION = 'expediente_en_revision';
const ESTADO_LSS_EVALUACION_SOLICITADA = 'evaluacion_solicitada';
const ESTADO_LSS_TERMINAL = 'constancia_disponible'; // último estado del flujo LSS

function formatearPeriodo(periodo) {
  if (!periodo) return null;
  const semestreNum = periodo.semestre.replace('s0', '');
  return `${periodo.anio}-${semestreNum}`;
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
      horasAcumuladas: 0, faltasAcumuladas: 0, faltasConsecutivas: 0,
      actividadesAsignadas: 0, reportesEnviados: 0,
      ofertaNombre: null, periodoLabel: null,
      bitacoraHoyPendiente: false, jornadaSinTerminar: false,
    };
  }

  const solicitudId = alumno.solicitud_registro.id;

  const [actividadesAsignadas, reportesEnviados, actividadesPendientes, bitacoraHoyPendiente, jornadaSinTerminar] = await Promise.all([
    prisma.actividad.count({ where: { solicitud_registro_id: solicitudId } }),
    prisma.reporte_mensual.count({ where: { solicitud_registro_id: solicitudId } }),
    tieneActividadesPendientes(solicitudId),
    faltaBitacoraHoy(solicitudId),
    tieneJornadaPendienteDatos(solicitudId),
  ]);

  return {
    horasAcumuladas: alumno.cumulo_horas_y_faltas?.horas_acumuladas ?? 0,
    faltasAcumuladas: alumno.cumulo_horas_y_faltas?.faltas_acumuladas ?? 0,
    faltasConsecutivas: alumno.cumulo_horas_y_faltas?.faltas_consecutivas ?? 0,
    actividadesAsignadas,
    reportesEnviados,
    actividadesPendientes,
    bitacoraHoyPendiente,
    jornadaSinTerminar,
    ofertaNombre: alumno.solicitud_registro.oferta?.nombre_proyecto ?? null,
    periodoLabel: formatearPeriodo(alumno.solicitud_registro.periodo_registro),
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
      departamento: null, cubiculo: null, caracteristicas: [],
    };
  }

const [alumnosAsignados, ofertasActivas, solicitudesPendientes, alumnosConFaltasCriticas, bitacorasPorRevisar] = await Promise.all([
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
    // CU-AH-04 no está construido todavía (revisar/aprobar/rechazar sigue
    // mockeado en el frontend) — pero el CONTEO en sí ya es real: cuántas
    // bitácoras de sus alumnos están en 'pendiente_revision'.
    prisma.bitacora.count({
      where: { estado: 'pendiente_revision', solicitud_registro: { oferta: { profesor_id: profesor.id } } },
    }),
  ]);

  return {
    alumnosAsignados,
    cuposTotales: profesor.cupos_totales,
    ofertasActivas,
    solicitudesPendientes,
    alumnosConFaltasCriticas,
    // TODO: requiere convención de estado de CU-REP — todavía no construido.
    reportesPorRevisar: 0,
    bitacorasPorRevisar,
    departamento: profesor.departamento,
    cubiculo: profesor.cubiculo,
    caracteristicas: profesor.solicitud_caracteristica.map((sc) => sc.caracteristica.nombre.replace(/_/g, ' ')),
  };

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
    prisma.cumulo_horas_y_faltas.count({ where: { horas_acumuladas: { gte: 480 } } }),
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