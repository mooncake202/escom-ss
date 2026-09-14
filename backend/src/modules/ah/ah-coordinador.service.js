const prisma = require('../../lib/prisma');
const { LIMITE_HORAS_SERVICIO, calcularHorasNetas } = require('./ah.shared');
const { crearError } = require('./validators');

// ─────────────────────────────────────────────────────────────
// CU-AH-05: consultar acumulado de horas (vista coordinador).
// Primera vez que el módulo ah/ necesita este actor — no existe ningún
// patrón previo aquí. Mismo criterio que gr-coordinador.service.js: no
// comparte código con ah-profesor.service.js (se duplica la query de
// alumnos con acumulado), consistente con que gr-coordinador.service.js
// tampoco comparte código con gr-profesor.service.js hoy.
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

function mapearAlumnoConAcumulado(s, totalBitacoras) {
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
    sinBitacoras: totalBitacoras === 0,
  };
}

/**
 * Primera vez que coordinador entra a datos de AH: lista de TODOS los
 * profesores, SIN NINGÚN FILTRO (aunque no tengan alumnos) — confirmado
 * explícitamente con el usuario. Una sola llamada anidada (profesores con
 * sus alumnos ya adentro): volumen de datos bajo, evita una segunda ida y
 * vuelta al seleccionar un profesor, mismo criterio que
 * resumenCoordinacion/gr-coordinador.service.js (traer todo de golpe sin
 * paginar).
 */
async function listarProfesoresConAcumulado() {
  const profesores = await prisma.profesor.findMany({
    include: { usuario: true },
    orderBy: { id: 'asc' },
  });

  return Promise.all(
    profesores.map(async (p) => {
      const solicitudes = await prisma.solicitud_registro.findMany({
        where: { estado_solicitud: 'alumno_asignado', oferta: { profesor_id: p.id } },
        include: { alumno: { include: { usuario: true, cumulo_horas_y_faltas: true } } },
        orderBy: { fecha_aplicacion: 'asc' },
      });

      const conteos = await contarBitacorasPorSolicitud(solicitudes.map((s) => s.id));

      return {
        id: p.id,
        nombre: `${p.usuario.nombre} ${p.usuario.apellidos}`,
        dept: p.departamento,
        alumnos: solicitudes.map((s) => mapearAlumnoConAcumulado(s, conteos.get(s.id) ?? 0)),
      };
    }),
  );
}

// ─────────────────────────────────────────────────────────────
// CU-AH-06: consultar historial de actividades y bitácoras (vista
// coordinador). Sin restricción de supervisión — coordinador puede ver
// cualquier alumno. RF-AH-49: a diferencia de la vista profesor, SÍ
// incluye profesorNombre además de oferta. Mismo criterio de no compartir
// código con ah-alumno.service.js/ah-profesor.service.js ya establecido.
// ─────────────────────────────────────────────────────────────

function mapearActividadHistorial(a) {
  return {
    id: a.id,
    tipo: 'actividad',
    fecha: a.fecha_asignacion,
    estado: a.estado,
    titulo: a.titulo,
    descripcion: a.descripcion,
    entregable_esperado: a.entregable_esperado,
    fecha_limite: a.fecha_limite,
    fecha_limite_original: a.fecha_limite_original,
    porcentaje_progreso: a.porcentaje_progreso,
    fecha_completada: a.fecha_completada,
  };
}

function mapearBitacoraHistorial(b) {
  return {
    id: b.id,
    tipo: 'bitacora',
    fecha: b.fecha_registro,
    estado: b.estado,
    hora_inicio: b.hora_inicio,
    hora_fin: b.hora_fin,
    horas_contabilizadas: b.horas_contabilizadas,
    motivo_rechazo: b.motivo_rechazo,
    fecha_revision: b.fecha_revision,
    avances: b.registro_bitacora_actividades.map((r) => ({
      actividad_id: r.actividad_id,
      actividad: r.actividad.titulo,
      progreso: r.porcentaje_avance_registrado,
      descripcion: r.descripcion,
      evidencia: r.evidencia,
    })),
  };
}

async function armarHistorial(solicitudId, filtros = {}) {
  const { tipo = 'todos', estado, fechaDesde, fechaHasta } = filtros;

  const rangoFecha = (campo) => {
    const cond = {};
    if (fechaDesde) cond.gte = new Date(fechaDesde);
    if (fechaHasta) cond.lte = new Date(fechaHasta);
    return Object.keys(cond).length ? { [campo]: cond } : {};
  };

  const [todasActividades, todasBitacoras] = await Promise.all([
    prisma.actividad.count({ where: { solicitud_registro_id: solicitudId } }),
    prisma.bitacora.count({ where: { solicitud_registro_id: solicitudId } }),
  ]);

  const [actividades, bitacoras] = await Promise.all([
    tipo === 'bitacora'
      ? []
      : prisma.actividad.findMany({
          where: {
            solicitud_registro_id: solicitudId,
            ...(tipo === 'actividad' && estado ? { estado } : {}),
            ...rangoFecha('fecha_asignacion'),
          },
        }),
    tipo === 'actividad'
      ? []
      : prisma.bitacora.findMany({
          where: {
            solicitud_registro_id: solicitudId,
            ...(tipo === 'bitacora' && estado ? { estado } : {}),
            ...rangoFecha('fecha_registro'),
          },
          include: { registro_bitacora_actividades: { include: { actividad: true } } },
        }),
  ]);

  const registros = [
    ...actividades.map(mapearActividadHistorial),
    ...bitacoras.map(mapearBitacoraHistorial),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return {
    registros,
    totales: { actividades: todasActividades, bitacoras: todasBitacoras },
  };
}

async function obtenerHistorialAlumnoParaCoordinador(alumnoBoleta, filtros) {
  const solicitud = await prisma.solicitud_registro.findFirst({
    where: { alumno_id: alumnoBoleta },
    include: {
      alumno: { include: { usuario: true } },
      oferta: { include: { profesor: { include: { usuario: true } } } },
      periodo_registro: { include: { evento_calendario: true } },
    },
  });
  if (!solicitud) throw crearError('Alumno no encontrado.', 404);

  const { registros, totales } = await armarHistorial(solicitud.id, filtros);

  return {
    alumno: {
      nombre: `${solicitud.alumno.usuario.nombre} ${solicitud.alumno.usuario.apellidos}`,
      boleta: solicitud.alumno.boleta,
      carrera: solicitud.alumno.carrera,
      oferta: solicitud.oferta?.nombre_proyecto ?? null,
      profesorNombre: solicitud.oferta?.profesor?.usuario
        ? `${solicitud.oferta.profesor.usuario.nombre} ${solicitud.oferta.profesor.usuario.apellidos}`
        : null,
      fechaInicioPeriodo: solicitud.periodo_registro?.evento_calendario?.fecha_inicio ?? null,
      fechaFinPeriodo: solicitud.periodo_registro?.evento_calendario?.fecha_fin ?? null,
    },
    registros,
    totales,
  };
}

module.exports = { listarProfesoresConAcumulado, obtenerHistorialAlumnoParaCoordinador };
