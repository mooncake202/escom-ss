// Estados de `solicitud_baja` y consultas de SOLO LECTURA sobre ellos (CU-ADM-09/11/12).
//
// Vive aparte de bajas.service.js a propósito: ese servicio importa gr.service.js (para
// `liberarLugarOferta`), que a su vez exige JWT_SECRET al cargarse. El dashboard solo necesita
// consultar el estado de una baja, así que no debe arrastrar toda esa cadena. Aquí la única
// dependencia es prisma.
//
// bajas.service.js reexporta estas constantes: siguen siendo su contrato público.

const prisma = require('../../../lib/prisma');

// La columna es VarChar(12) sin enum: 'en_revision' son 11 caracteres.
const ESTADO_PENDIENTE = 'pendiente';
const ESTADO_EN_REVISION = 'en_revision';
const ESTADO_APROBADA = 'aprobada';
const ESTADO_RECHAZADA = 'rechazada';

// Máquina de estados, en un solo sitio. Cada transición se aplica con un CAS sobre el estado de
// ORIGEN, así que dos peticiones concurrentes no pueden ejecutar la misma dos veces.
//
//   pendiente ──► en_revision ──► aprobada        (la baja definitiva vive AQUÍ y solo aquí)
//       │              └────────► rechazada
//       └────────────────────────► rechazada
//
// 'pendiente → aprobada' NO existe: Coordinación primero turna el expediente a las autoridades.
// Los estados finales son terminales.
const ESTADOS_ACTIVOS = Object.freeze([ESTADO_PENDIENTE, ESTADO_EN_REVISION]);
const ES_RESUELTA = (estado) => !ESTADOS_ACTIVOS.includes(estado);

const ORIGEN_VALIDO = Object.freeze({
  [ESTADO_EN_REVISION]: [ESTADO_PENDIENTE],
  [ESTADO_APROBADA]: [ESTADO_EN_REVISION],
  [ESTADO_RECHAZADA]: [ESTADO_PENDIENTE, ESTADO_EN_REVISION],
});

/**
 * Etapa del trámite: resume el estado + la presencia de expediente en un solo valor, para que ni el
 * dashboard ni la pantalla del profesor tengan que interpretar la máquina de estados.
 */
const ETAPAS_BAJA = Object.freeze({
  PENDIENTE_EXPEDIENTE: 'pendiente_expediente',
  PENDIENTE_COORDINACION: 'pendiente_coordinacion',
  EN_REVISION_AUTORIDADES: 'en_revision_autoridades',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
});

function etapaDeBaja(solicitud) {
  if (solicitud.estado === ESTADO_APROBADA) return ETAPAS_BAJA.APROBADA;
  if (solicitud.estado === ESTADO_RECHAZADA) return ETAPAS_BAJA.RECHAZADA;
  if (solicitud.estado === ESTADO_EN_REVISION) return ETAPAS_BAJA.EN_REVISION_AUTORIDADES;
  return solicitud.documento_id === null
    ? ETAPAS_BAJA.PENDIENTE_EXPEDIENTE
    : ETAPAS_BAJA.PENDIENTE_COORDINACION;
}

// ── Resumen para el dashboard ───────────────────────────────────────────────
//
// El dashboard NO reimplementa las reglas de este módulo: pregunta aquí.
//
// Las alertas de EVENTO (se solicitó, se turnó, se resolvió) ya viajan como notificaciones
// persistentes; el dashboard las sube a su franja superior promoviendo su `ruta_relacionada`. Lo que
// devuelven estas funciones son los ESTADOS que deben seguir visibles aunque la notificación ya se
// haya leído.

/** Baja en curso del alumno autenticado. `null` si no tiene ninguna activa. */
async function resumenBajaDelAlumno({ usuarioId }) {
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    select: { boleta: true, usuario_id: true },
  });
  if (!alumno) return null;

  const solicitud = await prisma.solicitud_baja.findFirst({
    where: { alumno_id: alumno.boleta, estado: { in: ESTADOS_ACTIVOS } },
    orderBy: { id: 'desc' },
  });
  if (!solicitud) return null;

  const origen = solicitud.solicitante_id === alumno.usuario_id ? 'alumno' : 'profesor';
  return {
    estado: solicitud.estado,
    etapa: etapaDeBaja(solicitud),
    origen,
    // Lo único que exige acción SUYA: su profesor la abrió y falta que adjunte el expediente.
    requiereExpediente: solicitud.estado === ESTADO_PENDIENTE
      && solicitud.documento_id === null
      && origen === 'profesor',
  };
}

/** Bajas activas de los alumnos de ESTE profesor, y cuántas abrió él. */
async function resumenBajasDelProfesor({ usuarioId }) {
  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId }, select: { id: true } });
  if (!profesor) return { activas: 0, propias: 0, esperandoExpediente: 0 };

  const solicitudes = await prisma.solicitud_baja.findMany({
    where: {
      estado: { in: ESTADOS_ACTIVOS },
      // Mismo filtro canónico que listarMisAlumnos: asignado + oferta de este profesor.
      alumno: { solicitud_registro: { estado_solicitud: 'alumno_asignado', oferta: { profesor_id: profesor.id } } },
    },
    select: { estado: true, documento_id: true, solicitante_id: true },
  });

  const propias = solicitudes.filter((b) => b.solicitante_id === usuarioId);
  return {
    activas: solicitudes.length,
    propias: propias.length,
    // Las que él abrió y siguen esperando que el alumno adjunte su expediente.
    esperandoExpediente: propias.filter((b) => b.estado === ESTADO_PENDIENTE && b.documento_id === null).length,
  };
}

/**
 * Bajas que requieren atención de Coordinación. Mismo criterio de "activa" que la bandeja de
 * CU-ADM-12: `porTurnar` son las que ya se pueden marcar en revisión (tienen expediente).
 */
async function resumenBajasDeCoordinacion() {
  const solicitudes = await prisma.solicitud_baja.findMany({
    where: { estado: { in: ESTADOS_ACTIVOS } },
    select: { estado: true, documento_id: true },
  });

  return {
    activas: solicitudes.length,
    porTurnar: solicitudes.filter((b) => b.estado === ESTADO_PENDIENTE && b.documento_id !== null).length,
    enRevision: solicitudes.filter((b) => b.estado === ESTADO_EN_REVISION).length,
    sinExpediente: solicitudes.filter((b) => b.estado === ESTADO_PENDIENTE && b.documento_id === null).length,
  };
}

module.exports = {
  ESTADO_PENDIENTE,
  ESTADO_EN_REVISION,
  ESTADO_APROBADA,
  ESTADO_RECHAZADA,
  ESTADOS_ACTIVOS,
  ES_RESUELTA,
  ORIGEN_VALIDO,
  ETAPAS_BAJA,
  etapaDeBaja,
  resumenBajaDelAlumno,
  resumenBajasDelProfesor,
  resumenBajasDeCoordinacion,
};
