// CU-ADM-01 (el alumno consulta a su profesor asignado) y CU-ADM-03 (consulta a su equipo de
// proyecto). Son dos vistas del MISMO vínculo, así que comparten la resolución y solo cambia la
// proyección.
//
// EL VÍNCULO SIEMPRE SE DERIVA, nunca se recibe:
//   usuario autenticado → alumno → solicitud_registro ('alumno_asignado') → oferta → profesor
// Ningún endpoint acepta un profesor_id ni una boleta del cliente, así que un alumno no puede
// consultar al profesor ni al equipo de otro.
//
// Estado válido de asignación: 'alumno_asignado', el mismo filtro canónico que usan AH y el módulo
// de bajas. No se filtra por periodo ni por fecha.
//
// PRIVACIDAD: los compañeros de equipo exponen únicamente datos de identificación y contacto
// institucional/personal por correo. El CELULAR NO se expone: es un dato personal de un tercero que
// el alumno no necesita para coordinarse.

const prisma = require('../../../lib/prisma');
const { ESTADO_ASIGNADO, crearError, nombreCompleto } = require('./directorio.shared');

const TIPO_OFERTA_PROYECTO = 'proyecto';

/**
 * Resuelve la asignación vigente del alumno autenticado. Es el único punto de entrada de los dos
 * CU: si no existe, ninguno de los dos puede responder nada.
 */
async function resolverAsignacion(usuarioId) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    include: {
      usuario: true,
      solicitud_registro: {
        include: { oferta: { include: { profesor: { include: { usuario: true } } } } },
      },
    },
  });

  if (!alumno) throw crearError('No se encontró tu perfil de alumno.', 404, 'SIN_PERFIL_ALUMNO');

  const solicitud = alumno.solicitud_registro;
  if (!solicitud || solicitud.estado_solicitud !== ESTADO_ASIGNADO || !solicitud.oferta) {
    throw crearError(
      'Todavía no tienes una asignación de servicio social activa.',
      404,
      'SIN_ASIGNACION',
    );
  }

  return { alumno, solicitud, oferta: solicitud.oferta, profesor: solicitud.oferta.profesor };
}

// Datos de identificación y contacto de un alumno. SIN celular, a propósito.
const vistaAlumno = (alumno) => ({
  boleta: alumno.boleta,
  nombre: alumno.usuario.nombre,
  apellidos: alumno.usuario.apellidos,
  nombreCompleto: nombreCompleto(alumno.usuario),
  carrera: alumno.carrera,
  correoInstitucional: alumno.usuario.correo_institucional,
  correoPersonal: alumno.correo_personal ?? null,
});

// ── CU-ADM-01 ───────────────────────────────────────────────────────────────

/**
 * Contacto del profesor que supervisa al alumno. `telefono_personal` y `horario_atencion` son los
 * que el propio profesor mantiene desde CU-ADM-10; `cubiculo` y `departamento` los administra
 * Coordinación.
 */
async function obtenerMiProfesor({ usuarioId }) {
  const { oferta, profesor } = await resolverAsignacion(usuarioId);

  return {
    profesor: {
      nombreCompleto: nombreCompleto(profesor.usuario),
      nombre: profesor.usuario.nombre,
      apellidos: profesor.usuario.apellidos,
      correoInstitucional: profesor.usuario.correo_institucional,
      cubiculo: profesor.cubiculo,
      departamento: profesor.departamento,
      horarioAtencion: profesor.horario_atencion,
      telefonoPersonal: profesor.telefono_personal,
    },
    oferta: {
      id: oferta.id,
      nombre: oferta.nombre_proyecto,
      descripcion: oferta.descripcion_actividades,
      tipo: oferta.tipo_oferta,
      esProyecto: oferta.tipo_oferta === TIPO_OFERTA_PROYECTO,
    },
  };
}

// ── CU-ADM-03 ───────────────────────────────────────────────────────────────

/**
 * Equipo de la MISMA oferta. Solo tiene sentido en ofertas de tipo 'proyecto': una 'individual'
 * devuelve `esProyecto: false` y la lista vacía, para que la pantalla oculte la sección sin tener
 * que deducirlo.
 *
 * El propio alumno queda EXCLUIDO de `companeros` y viaja aparte en `yo`.
 */
async function obtenerMiEquipo({ usuarioId }) {
  const { alumno, oferta } = await resolverAsignacion(usuarioId);
  const esProyecto = oferta.tipo_oferta === TIPO_OFERTA_PROYECTO;

  // Se consulta solo si es proyecto: en una individual no hay compañeros posibles.
  const companeros = esProyecto
    ? await prisma.solicitud_registro.findMany({
        where: {
          oferta_id: oferta.id,
          estado_solicitud: ESTADO_ASIGNADO,
          alumno_id: { not: alumno.boleta }, // nunca se incluye a sí mismo
        },
        include: { alumno: { include: { usuario: true } } },
        orderBy: { alumno_id: 'asc' },
      })
    : [];

  return {
    oferta: {
      id: oferta.id,
      nombre: oferta.nombre_proyecto,
      descripcion: oferta.descripcion_actividades,
      tipo: oferta.tipo_oferta,
      esProyecto,
    },
    yo: vistaAlumno(alumno),
    companeros: companeros.map((s) => vistaAlumno(s.alumno)),
  };
}

// `resolverAsignacion` se exporta para que OTROS CU que dependan del vínculo alumno→profesor no
// vuelvan a escribir la regla (hoy lo usa CU-ADM-02 para saber de qué profesor ve anuncios). Su
// comportamiento no cambia: sigue siendo la misma función que usan ADM-01 y ADM-03.
module.exports = { obtenerMiProfesor, obtenerMiEquipo, resolverAsignacion, ESTADO_ASIGNADO };
