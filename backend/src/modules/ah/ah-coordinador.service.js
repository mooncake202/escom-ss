const prisma = require('../../lib/prisma');
const { LIMITE_HORAS_SERVICIO, calcularHorasNetas } = require('./ah.shared');

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

module.exports = { listarProfesoresConAcumulado };
