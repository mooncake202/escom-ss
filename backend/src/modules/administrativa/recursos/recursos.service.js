// CU-ADM-05 — Recursos del proceso de registro.
//
// Coordinación administra una lista de enlaces (formatos, guías, reglamentos) y los alumnos la
// consultan en solo lectura.
//
// NO se suben archivos: solo se administra la URL. El sistema nunca almacena el documento, así que
// tampoco hay cifrado ni carpetas involucradas aquí.
//
// El catálogo es INSTITUCIONAL, no de quien lo capturó: cualquier coordinador puede editar o
// eliminar cualquier recurso. `coordinador_id` queda como autoría de la última escritura.
//
// El modelo no tiene categoría y la interfaz tampoco la usa: no se inventa ninguna.

const prisma = require('../../../lib/prisma');
const { crearError } = require('../directorio/directorio.shared');

const MAX_NOMBRE = 150; // recurso.nombre  VarChar(150)
const MAX_URL = 500;    // recurso.url     VarChar(500)

const limpiar = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/**
 * Solo se aceptan enlaces http/https. Se valida con el parser de URL del runtime en vez de una
 * expresión regular propia: rechaza de paso `javascript:` y demás esquemas peligrosos.
 */
function validarUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw crearError('La URL no tiene un formato válido.', 400, 'URL_INVALIDA');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw crearError('La URL debe comenzar con http:// o https://', 400, 'URL_INVALIDA');
  }
  return url;
}

/** Valida nombre y URL. Los límites se miden DESPUÉS del trim. */
function validarDatos({ nombre, url }) {
  const nombreLimpio = limpiar(nombre);
  const urlLimpia = limpiar(url);

  if (nombreLimpio === '') throw crearError('El título del recurso es obligatorio.', 400, 'NOMBRE_VACIO');
  if (nombreLimpio.length > MAX_NOMBRE) {
    throw crearError(`El título no puede pasar de ${MAX_NOMBRE} caracteres.`, 400, 'NOMBRE_MUY_LARGO');
  }
  if (urlLimpia === '') throw crearError('La URL del recurso es obligatoria.', 400, 'URL_VACIA');
  if (urlLimpia.length > MAX_URL) {
    throw crearError(`La URL no puede pasar de ${MAX_URL} caracteres.`, 400, 'URL_MUY_LARGA');
  }
  validarUrl(urlLimpia);

  return { nombre: nombreLimpio, url: urlLimpia };
}

// `ultimaActualizacion` es lo que muestra la interfaz: la fecha de edición si existe y, si no, la
// de alta. Así un recurso recién creado nunca aparece sin fecha.
const vistaRecurso = (r) => ({
  id: r.id,
  nombre: r.nombre,
  url: r.url,
  fechaRegistro: r.fecha_registro.toISOString(),
  fechaActualizacion: r.fecha_actualizacion ? r.fecha_actualizacion.toISOString() : null,
  ultimaActualizacion: (r.fecha_actualizacion ?? r.fecha_registro).toISOString(),
});

function resolverId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw crearError('Recurso inválido.', 400, 'RECURSO_INVALIDO');
  return n;
}

async function perfilCoordinador(usuarioId) {
  const coordinador = await prisma.coordinador.findUnique({
    where: { usuario_id: usuarioId },
    select: { id: true },
  });
  if (!coordinador) throw crearError('No se encontró tu perfil de coordinador.', 404, 'SIN_PERFIL_COORDINADOR');
  return coordinador;
}

/** Misma lista para todos los que pueden leer: alumnos (ambos estados) y coordinación. */
async function listar() {
  const recursos = await prisma.recurso.findMany({ orderBy: [{ nombre: 'asc' }] });
  return { recursos: recursos.map(vistaRecurso) };
}

async function crear({ usuarioId, nombre, url }) {
  const datos = validarDatos({ nombre, url });
  const coordinador = await perfilCoordinador(usuarioId);

  const recurso = await prisma.recurso.create({
    data: {
      coordinador_id: coordinador.id,
      nombre: datos.nombre,
      url: datos.url,
      fecha_registro: new Date(),
      // Se deja en null a propósito: todavía no ha sido editado.
      fecha_actualizacion: null,
    },
  });

  return { recurso: vistaRecurso(recurso) };
}

async function actualizar({ usuarioId, id, nombre, url }) {
  const recursoId = resolverId(id);
  const datos = validarDatos({ nombre, url });
  const coordinador = await perfilCoordinador(usuarioId);

  const existente = await prisma.recurso.findUnique({ where: { id: recursoId } });
  if (!existente) throw crearError('No se encontró ese recurso.', 404, 'RECURSO_NO_ENCONTRADO');

  const recurso = await prisma.recurso.update({
    where: { id: recursoId },
    data: {
      nombre: datos.nombre,
      url: datos.url,
      fecha_actualizacion: new Date(),
      // Queda como autor de la última edición; fecha_registro nunca se toca.
      coordinador_id: coordinador.id,
    },
  });

  return { recurso: vistaRecurso(recurso) };
}

async function eliminar({ usuarioId, id }) {
  const recursoId = resolverId(id);
  await perfilCoordinador(usuarioId);

  const existente = await prisma.recurso.findUnique({ where: { id: recursoId } });
  if (!existente) throw crearError('No se encontró ese recurso.', 404, 'RECURSO_NO_ENCONTRADO');

  await prisma.recurso.delete({ where: { id: recursoId } });
  return { id: recursoId };
}

module.exports = { listar, crear, actualizar, eliminar, MAX_NOMBRE, MAX_URL };
