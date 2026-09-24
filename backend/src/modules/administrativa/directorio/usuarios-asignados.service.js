// CU-ADM-17 — consultar información de usuarios asignados.
//
// Dos navegaciones sobre el MISMO vínculo:
//   profesor    → sus alumnos asignados → detalle
//   coordinador → profesores → alumnos asignados de ese profesor → detalle
//
// SOLO LECTURA: este módulo no escribe nada.
//
// SEGURIDAD
// El profesor sale SIEMPRE del token. `listarMisAlumnos` no recibe profesor alguno, y en el detalle
// el filtro `oferta: { profesor_id }` se añade del lado del servidor cuando el rol es profesor, así
// que un profesor no puede leer a un alumno que no supervisa ni siquiera conociendo su boleta.
// Coordinación sí navega por profesor, porque su CU es precisamente supervisar a todos.
//
// "Asignado" = solicitud_registro.estado_solicitud === 'alumno_asignado'. Sin filtro de periodo ni
// de fecha.
//
// NOTA SOBRE `creditos`
// `alumno.creditos` es el PORCENTAJE de avance académico (100 = 100%), no horas de servicio social.
// Se devuelve tal cual, solo convertido de Decimal a número; ADM-17 no consulta horas.

const prisma = require('../../../lib/prisma');
const { ESTADO_ASIGNADO, crearError, nombreCompleto } = require('./directorio.shared');

const ROL_PROFESOR = 'profesor';

// Prisma entrega Decimal(5,2) como objeto, no como número: sin esto el JSON saldría como string y
// el front no podría compararlo ni formatearlo.
const aNumero = (decimal) => (decimal === null || decimal === undefined ? null : Number(decimal));

async function resolverProfesorDelToken(usuarioId) {
  const profesor = await prisma.profesor.findUnique({
    where: { usuario_id: usuarioId },
    include: { usuario: true },
  });
  if (!profesor) throw crearError('No se encontró tu perfil de profesor.', 404, 'SIN_PERFIL_PROFESOR');
  return profesor;
}

const vistaProfesor = (profesor) => ({
  id: profesor.id,
  nombreCompleto: nombreCompleto(profesor.usuario),
  departamento: profesor.departamento,
  correoInstitucional: profesor.usuario.correo_institucional,
});

// Identificación y avance académico: lo justo para pintar la tarjeta de la lista. El contacto
// personal (celular y correo personal) NO viaja aquí — solo al abrir el detalle.
const vistaResumen = (solicitud) => ({
  boleta: solicitud.alumno.boleta,
  nombre: solicitud.alumno.usuario.nombre,
  apellidos: solicitud.alumno.usuario.apellidos,
  nombreCompleto: nombreCompleto(solicitud.alumno.usuario),
  carrera: solicitud.alumno.carrera,
  correoInstitucional: solicitud.alumno.usuario.correo_institucional,
  creditos: aNumero(solicitud.alumno.creditos),
  semestre: solicitud.alumno.semestre,
  oferta: solicitud.oferta?.nombre_proyecto ?? null,
});

// El detalle añade lo que el CU pide y el resumen deliberadamente omite.
const vistaDetalle = (solicitud) => ({
  ...vistaResumen(solicitud),
  correoPersonal: solicitud.alumno.correo_personal ?? null,
  celular: solicitud.alumno.celular,
});

const INCLUDE_LISTADO = { alumno: { include: { usuario: true } }, oferta: true };

// Un solo criterio de orden para las dos navegaciones: por boleta, estable y predecible.
async function alumnosAsignadosDe(profesorId) {
  const solicitudes = await prisma.solicitud_registro.findMany({
    where: { estado_solicitud: ESTADO_ASIGNADO, oferta: { profesor_id: profesorId } },
    include: INCLUDE_LISTADO,
    orderBy: { alumno_id: 'asc' },
  });
  return solicitudes.map(vistaResumen);
}

// ── Profesor ────────────────────────────────────────────────────────────────

/** Alumnos que ESTE profesor supervisa ahora. No recibe ningún id: el profesor sale del token. */
async function listarMisAlumnos({ usuarioId }) {
  const profesor = await resolverProfesorDelToken(usuarioId);
  return { profesor: vistaProfesor(profesor), alumnos: await alumnosAsignadosDe(profesor.id) };
}

// ── Coordinación ────────────────────────────────────────────────────────────

/**
 * Todos los profesores del sistema, incluidos los que no tienen a nadie asignado: la pantalla
 * necesita poder mostrarlos con "0 alumnos". El conteo se resuelve en DOS consultas (profesores +
 * asignaciones) y se agrupa en memoria, en vez de una consulta por profesor.
 */
async function listarProfesores() {
  const [profesores, asignadas] = await Promise.all([
    prisma.profesor.findMany({ include: { usuario: true }, orderBy: { id: 'asc' } }),
    prisma.solicitud_registro.findMany({
      where: { estado_solicitud: ESTADO_ASIGNADO },
      select: { oferta: { select: { profesor_id: true } } },
    }),
  ]);

  const conteo = new Map();
  for (const s of asignadas) {
    // `oferta` es opcional en el esquema: una solicitud sin oferta no cuenta para nadie.
    if (!s.oferta) continue;
    conteo.set(s.oferta.profesor_id, (conteo.get(s.oferta.profesor_id) ?? 0) + 1);
  }

  return {
    profesores: profesores.map((p) => ({
      ...vistaProfesor(p),
      totalAlumnos: conteo.get(p.id) ?? 0,
    })),
  };
}

/** Alumnos asignados a un profesor concreto. Solo para coordinación. */
async function listarAlumnosDeProfesor({ profesorId }) {
  const id = Number(profesorId);
  if (!Number.isInteger(id) || id <= 0) throw crearError('Profesor inválido.', 400, 'PROFESOR_INVALIDO');

  const profesor = await prisma.profesor.findUnique({ where: { id }, include: { usuario: true } });
  if (!profesor) throw crearError('No se encontró ese profesor.', 404, 'PROFESOR_NO_ENCONTRADO');

  return { profesor: vistaProfesor(profesor), alumnos: await alumnosAsignadosDe(profesor.id) };
}

// ── Detalle (ambos roles) ───────────────────────────────────────────────────

/**
 * Detalle de un alumno asignado. El mismo endpoint sirve a las dos navegaciones porque el dato es
 * el mismo; lo que cambia es el alcance, y ese alcance lo impone el servidor a partir del rol:
 *
 *   profesor    → se exige además que la oferta sea suya
 *   coordinador → cualquier alumno asignado
 *
 * Un alumno que no existe, que no está asignado, o que está asignado a OTRO profesor producen el
 * mismo 404 para un profesor: no se puede distinguir un caso de otro sondeando boletas.
 */
async function obtenerAlumnoAsignado({ usuarioId, rol, boleta }) {
  const boletaLimpia = String(boleta ?? '').trim();
  if (boletaLimpia === '') throw crearError('Boleta inválida.', 400, 'BOLETA_INVALIDA');

  const where = { alumno_id: boletaLimpia, estado_solicitud: ESTADO_ASIGNADO };

  if (rol === ROL_PROFESOR) {
    const profesor = await resolverProfesorDelToken(usuarioId);
    where.oferta = { profesor_id: profesor.id };
  }

  const solicitud = await prisma.solicitud_registro.findFirst({
    where,
    include: {
      alumno: { include: { usuario: true } },
      oferta: { include: { profesor: { include: { usuario: true } } } },
    },
  });

  if (!solicitud) {
    throw crearError('No se encontró un alumno asignado con esa boleta.', 404, 'ALUMNO_NO_ASIGNADO');
  }

  return {
    alumno: vistaDetalle(solicitud),
    oferta: solicitud.oferta
      ? { id: solicitud.oferta.id, nombre: solicitud.oferta.nombre_proyecto, tipo: solicitud.oferta.tipo_oferta }
      : null,
    profesor: solicitud.oferta?.profesor ? vistaProfesor(solicitud.oferta.profesor) : null,
  };
}

module.exports = {
  listarMisAlumnos,
  listarProfesores,
  listarAlumnosDeProfesor,
  obtenerAlumnoAsignado,
};
