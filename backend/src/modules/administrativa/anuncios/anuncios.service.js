// CU-ADM-02 (el alumno consulta anuncios) y CU-ADM-07 (profesor y coordinación publican).
//
// QUÉ ES UN ANUNCIO
// Una comunicación MANUAL que alguien redacta para un grupo de alumnos. No es una `notificacion`:
// esa es un aviso PERSONAL que dispara un evento del sistema (tu baja fue aprobada, tu reporte fue
// rechazado). Publicar un anuncio NO crea ninguna fila en `notificacion`.
//
// EL DESTINATARIO NO SE ALMACENA, SE DERIVA
// `anuncio` no tiene columna de destinatario y no la necesita. El alcance sale de la asignación
// VIGENTE en el momento de leer:
//
//   origen 'coordinador' → visible para todo alumno asignado
//   origen 'profesor'    → visible solo para los alumnos asignados a ESE profesor
//
// Consecuencia deliberada: si un alumno cambia de profesor, deja de ver los anuncios del anterior y
// pasa a ver los del nuevo. La visibilidad siempre refleja su profesor ACTUAL.
//
// El vínculo alumno→profesor se resuelve con `resolverAsignacion` de directorio (CU-ADM-01/03), no
// con una regla nueva.

const prisma = require('../../../lib/prisma');
const { resolverAsignacion } = require('../directorio/directorio.service');
const { ESTADO_ASIGNADO, crearError, nombreCompleto } = require('../directorio/directorio.shared');

const ORIGEN_COORDINADOR = 'coordinador';
const ORIGEN_PROFESOR = 'profesor';

// El rol del token decide el origen: nunca se acepta del cuerpo de la petición.
const ORIGEN_POR_ROL = Object.freeze({ profesor: ORIGEN_PROFESOR, coordinador: ORIGEN_COORDINADOR });

const MAX_TITULO = 150; // anuncio.titulo es VarChar(150) en el esquema

const limpiar = (valor) => (typeof valor === 'string' ? valor.trim() : '');

// ── CU-ADM-02 · Alumno ──────────────────────────────────────────────────────

/**
 * Anuncios visibles para el alumno autenticado, del más reciente al más antiguo.
 *
 * `limite` solo recorta el resultado para el resumen del dashboard: la REGLA de visibilidad es la
 * misma en los dos consumidores, así que no se duplica en ninguna parte.
 */
async function listarParaAlumno({ usuarioId, limite = null }) {
  // Reutiliza la resolución de ADM-01/03: si el alumno no tiene asignación vigente, lanza
  // SIN_ASIGNACION y no hay anuncios de profesor que mostrar.
  const { alumno, profesor } = await resolverAsignacion(usuarioId);

  const anuncios = await prisma.anuncio.findMany({
    where: {
      OR: [
        { origen: ORIGEN_COORDINADOR },
        { origen: ORIGEN_PROFESOR, usuario_id: profesor.usuario_id },
      ],
    },
    include: { usuario: true },
    orderBy: [{ fecha_publicacion: 'desc' }, { id: 'desc' }],
    ...(Number.isInteger(limite) && limite > 0 ? { take: limite } : {}),
  });

  // Una sola consulta para los acuses, en vez de una por anuncio.
  const vistos = anuncios.length
    ? await prisma.registro_anuncio_visto.findMany({
        where: { alumno_id: alumno.boleta, anuncio_id: { in: anuncios.map((a) => a.id) } },
        select: { anuncio_id: true },
      })
    : [];
  const yaVistos = new Set(vistos.map((v) => v.anuncio_id));

  return { anuncios: anuncios.map((a) => vistaAnuncio(a, yaVistos.has(a.id))) };
}

const vistaAnuncio = (anuncio, visto) => ({
  id: anuncio.id,
  titulo: anuncio.titulo,
  contenido: anuncio.contenido,
  fechaPublicacion: anuncio.fecha_publicacion.toISOString(),
  origen: anuncio.origen,
  autor: nombreCompleto(anuncio.usuario),
  visto,
});

/**
 * Marca un anuncio como visto. Se llama al abrir el detalle, no desde un botón.
 *
 * SEGURIDAD: vuelve a comprobar la visibilidad con la misma regla del listado. Conocer un id no
 * basta — un alumno no puede marcar como visto el anuncio del profesor de otro.
 *
 * IDEMPOTENTE: el @@unique([alumno_id, anuncio_id]) hace que el segundo intento choque con P2002, y
 * ese choque es exactamente el resultado deseado (ya estaba visto), así que se ignora.
 */
async function marcarVisto({ usuarioId, anuncioId }) {
  const id = Number(anuncioId);
  if (!Number.isInteger(id) || id <= 0) throw crearError('Anuncio inválido.', 400, 'ANUNCIO_INVALIDO');

  const { alumno, profesor } = await resolverAsignacion(usuarioId);

  const anuncio = await prisma.anuncio.findFirst({
    where: {
      id,
      OR: [
        { origen: ORIGEN_COORDINADOR },
        { origen: ORIGEN_PROFESOR, usuario_id: profesor.usuario_id },
      ],
    },
    select: { id: true },
  });
  if (!anuncio) throw crearError('No se encontró ese anuncio.', 404, 'ANUNCIO_NO_VISIBLE');

  try {
    await prisma.registro_anuncio_visto.create({ data: { alumno_id: alumno.boleta, anuncio_id: id } });
  } catch (err) {
    if (err.code !== 'P2002') throw err; // ya estaba visto: no es un error
  }

  return { id, visto: true };
}

// ── CU-ADM-07 · Profesor y Coordinación ─────────────────────────────────────

function resolverOrigen(rol) {
  const origen = ORIGEN_POR_ROL[rol];
  if (!origen) throw crearError('Tu rol no puede publicar anuncios.', 403, 'ROL_NO_AUTORIZADO');
  return origen;
}

/**
 * Alcance del profesor: TODOS sus alumnos asignados ahora mismo. No elige destinatarios, así que
 * esto solo sirve para (a) impedir publicar al vacío y (b) informar el alcance en la respuesta.
 * Mismo filtro canónico que usan AH, bajas y directorio.
 */
async function contarAlumnosDelProfesor(usuarioId) {
  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId }, select: { id: true } });
  if (!profesor) throw crearError('No se encontró tu perfil de profesor.', 404, 'SIN_PERFIL_PROFESOR');

  return prisma.solicitud_registro.count({
    where: { estado_solicitud: ESTADO_ASIGNADO, oferta: { profesor_id: profesor.id } },
  });
}

/**
 * Publica un anuncio. El autor sale de `usuarioId` (token) y el origen del rol: ni uno ni otro se
 * aceptan del cuerpo, así que no se puede publicar en nombre de nadie más.
 *
 * Un profesor sin alumnos asignados no publica: su anuncio no tendría a quién llegar.
 */
async function publicar({ usuarioId, rol, titulo, contenido }) {
  const origen = resolverOrigen(rol);

  const tituloLimpio = limpiar(titulo);
  const contenidoLimpio = limpiar(contenido);
  if (tituloLimpio === '') throw crearError('El título del anuncio es obligatorio.', 400, 'TITULO_VACIO');
  if (contenidoLimpio === '') throw crearError('El contenido del anuncio es obligatorio.', 400, 'CONTENIDO_VACIO');
  if (tituloLimpio.length > MAX_TITULO) {
    throw crearError(`El título no puede pasar de ${MAX_TITULO} caracteres.`, 400, 'TITULO_MUY_LARGO');
  }

  let alcance = null;
  if (origen === ORIGEN_PROFESOR) {
    alcance = await contarAlumnosDelProfesor(usuarioId);
    if (alcance === 0) {
      throw crearError('No tienes alumnos asignados a quienes publicar.', 409, 'SIN_ALUMNOS_ASIGNADOS');
    }
  }

  const anuncio = await prisma.anuncio.create({
    data: {
      usuario_id: usuarioId,
      titulo: tituloLimpio,
      contenido: contenidoLimpio,
      fecha_publicacion: new Date(), // la fecha la pone el servidor, nunca el cliente
      origen,
    },
    include: { usuario: true },
  });

  return { anuncio: vistaAnuncio(anuncio, false), alcance };
}

/**
 * Historial de quien publica: SOLO sus propios anuncios. El filtro es por `usuario_id` del token,
 * así que nadie ve el historial de otro ni aunque lo pida.
 *
 * Los anuncios no se editan ni se borran: una vez publicados son registro histórico.
 */
async function listarMios({ usuarioId, rol }) {
  resolverOrigen(rol); // solo profesor y coordinación tienen historial que consultar

  const anuncios = await prisma.anuncio.findMany({
    where: { usuario_id: usuarioId },
    include: { usuario: true },
    orderBy: [{ fecha_publicacion: 'desc' }, { id: 'desc' }],
  });

  // El alcance solo aplica al profesor: el de coordinación es global por definición.
  const alcance = rol === 'profesor' ? await contarAlumnosDelProfesor(usuarioId) : null;

  return { anuncios: anuncios.map((a) => vistaAnuncio(a, false)), alcance };
}

module.exports = {
  listarParaAlumno,
  marcarVisto,
  publicar,
  listarMios,
  MAX_TITULO,
};
