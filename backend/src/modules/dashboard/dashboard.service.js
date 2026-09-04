const prisma = require('../../lib/prisma');

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
    };
  }

  const solicitudId = alumno.solicitud_registro.id;

  const [actividadesAsignadas, reportesEnviados] = await Promise.all([
    prisma.actividad.count({ where: { solicitud_registro_id: solicitudId } }),
    prisma.reporte_mensual.count({ where: { solicitud_registro_id: solicitudId } }),
  ]);

  return {
    horasAcumuladas: alumno.cumulo_horas_y_faltas?.horas_acumuladas ?? 0,
    faltasAcumuladas: alumno.cumulo_horas_y_faltas?.faltas_acumuladas ?? 0,
    faltasConsecutivas: alumno.cumulo_horas_y_faltas?.faltas_consecutivas ?? 0,
    actividadesAsignadas,
    reportesEnviados,
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
      departamento: null, cubiculo: null, caracteristicas: [],
    };
  }

  const [alumnosAsignados, ofertasActivas] = await Promise.all([
    prisma.solicitud_registro.count({ where: { oferta: { profesor_id: profesor.id } } }),
    prisma.oferta_servicio.count({ where: { profesor_id: profesor.id, cupos_disponibles: { gt: 0 } } }),
  ]);

  return {
    alumnosAsignados,
    cuposTotales: profesor.cupos_totales,
    ofertasActivas,
    // TODO: requieren convención de estado de CU-REP / CU-AH-04 / CU-GR-02.
    reportesPorRevisar: 0,
    bitacorasPorRevisar: 0,
    solicitudesPendientes: 0,
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
    // TODO: requieren convención de estado de CU-GR-02 / CU-REP / CU-PRO.
    solicitudesRegistroPendientes: 0,
    reportesPorRevisar: 0,
    reportesAprobadosMes: 0,
    ofertasPorValidar: 0,
  };
}

module.exports = { resumenAlumno, resumenProfesor, resumenCoordinacion };