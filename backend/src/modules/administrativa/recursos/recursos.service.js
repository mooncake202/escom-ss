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
// `tipo` (enum, nullable, @unique en schema.prisma): la mayoría de los recursos son genéricos y no
// llevan tipo. Solo los que el sistema necesita ubicar por código (no por el nombre libre que
// cualquier coordinador puede cambiar) llevan uno — hoy solo `link_constancia_creditos`
// (CU-GR-01). El `@unique` en BD garantiza que nunca pueda haber 2 recursos con el mismo tipo a la
// vez, sin depender de un chequeo de aplicación.

const prisma = require('../../../lib/prisma');
const { crearError } = require('../directorio/directorio.shared');

const MAX_NOMBRE = 150; // recurso.nombre  VarChar(150)
const MAX_URL = 500;    // recurso.url     VarChar(500)

// Catálogo de tipos válidos — mismo valor que el enum TipoRecurso de schema.prisma. Mantenerlos
// sincronizados a mano: Prisma no expone el enum como array en runtime.
const TIPOS_RECURSO = Object.freeze({
  link_constancia_creditos: 'Link de constancia de créditos (CU-GR-01)',
  link_siss: 'Link de la plataforma SISS (CU-GR-04)',
});

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

/** Valida nombre, URL y tipo (opcional). Los límites se miden DESPUÉS del trim. */
function validarDatos({ nombre, url, tipo }) {
  const nombreLimpio = limpiar(nombre);
  const urlLimpia = limpiar(url);
  const tipoLimpio = tipo ? limpiar(tipo) : null;

  if (nombreLimpio === '') throw crearError('El título del recurso es obligatorio.', 400, 'NOMBRE_VACIO');
  if (nombreLimpio.length > MAX_NOMBRE) {
    throw crearError(`El título no puede pasar de ${MAX_NOMBRE} caracteres.`, 400, 'NOMBRE_MUY_LARGO');
  }
  if (urlLimpia === '') throw crearError('La URL del recurso es obligatoria.', 400, 'URL_VACIA');
  if (urlLimpia.length > MAX_URL) {
    throw crearError(`La URL no puede pasar de ${MAX_URL} caracteres.`, 400, 'URL_MUY_LARGA');
  }
  validarUrl(urlLimpia);

  if (tipoLimpio && !(tipoLimpio in TIPOS_RECURSO)) {
    throw crearError('El tipo de recurso seleccionado no es válido.', 400, 'TIPO_INVALIDO');
  }

  return { nombre: nombreLimpio, url: urlLimpia, tipo: tipoLimpio };
}

// `ultimaActualizacion` es lo que muestra la interfaz: la fecha de edición si existe y, si no, la
// de alta. Así un recurso recién creado nunca aparece sin fecha.
const vistaRecurso = (r) => ({
  id: r.id,
  nombre: r.nombre,
  url: r.url,
  tipo: r.tipo,
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

/**
 * Traduce el choque de la constraint única de `tipo` a un mensaje claro, en vez del genérico 500.
 *
 * Con el driver-adapter de Prisma 7, un P2002 de MySQL NO trae `meta.target` (eso es Postgres/
 * SQLite) — el nombre real del índice vive en `meta.driverAdapterError.cause.constraint.index`
 * (confirmado disparando el choque real: `{"index":"recurso_tipo_key"}`).
 */
function relanzarSiTipoDuplicado(err, tipo) {
  const indice = err.meta?.driverAdapterError?.cause?.constraint?.index;
  if (err.code === 'P2002' && indice === 'recurso_tipo_key') {
    throw crearError(
      `Ya existe otro recurso con el tipo "${TIPOS_RECURSO[tipo] || tipo}". Edita ese recurso en vez de crear uno nuevo, o quítale el tipo primero.`,
      409,
      'TIPO_YA_EXISTE',
    );
  }
  throw err;
}

/** Misma lista para todos los que pueden leer: alumnos (ambos estados) y coordinación. */
async function listar() {
  const recursos = await prisma.recurso.findMany({ orderBy: [{ nombre: 'asc' }] });
  return { recursos: recursos.map(vistaRecurso), tiposDisponibles: TIPOS_RECURSO };
}

// CU-GR-01: el alumno_sin_asignar todavía no tiene cuenta, así que esto tiene que ser público. Se
// busca por `tipo` (columna con @unique real en BD), no por `nombre` — un coordinador puede
// renombrar el recurso libremente sin romper esta integración.
async function obtenerUrlConstanciaCreditos() {
  const recurso = await prisma.recurso.findUnique({ where: { tipo: 'link_constancia_creditos' } });
  return { url: recurso?.url ?? null };
}

// CU-GR-04: a diferencia de constancia de créditos, aquí el alumno ya tiene sesión (alumno_sin_asignar
// autenticado) — el endpoint que consume esto exige requireAuth, no es público. Mismo patrón de
// búsqueda por `tipo`, mismo fallback a `url: null` si no está configurado.
async function obtenerUrlSiss() {
  const recurso = await prisma.recurso.findUnique({ where: { tipo: 'link_siss' } });
  return { url: recurso?.url ?? null };
}

async function crear({ usuarioId, nombre, url, tipo }) {
  const datos = validarDatos({ nombre, url, tipo });
  const coordinador = await perfilCoordinador(usuarioId);

  try {
    const recurso = await prisma.recurso.create({
      data: {
        coordinador_id: coordinador.id,
        nombre: datos.nombre,
        url: datos.url,
        tipo: datos.tipo,
        fecha_registro: new Date(),
        // Se deja en null a propósito: todavía no ha sido editado.
        fecha_actualizacion: null,
      },
    });
    return { recurso: vistaRecurso(recurso) };
  } catch (err) {
    relanzarSiTipoDuplicado(err, datos.tipo);
  }
}

async function actualizar({ usuarioId, id, nombre, url, tipo }) {
  const recursoId = resolverId(id);
  const datos = validarDatos({ nombre, url, tipo });
  const coordinador = await perfilCoordinador(usuarioId);

  const existente = await prisma.recurso.findUnique({ where: { id: recursoId } });
  if (!existente) throw crearError('No se encontró ese recurso.', 404, 'RECURSO_NO_ENCONTRADO');

  try {
    const recurso = await prisma.recurso.update({
      where: { id: recursoId },
      data: {
        nombre: datos.nombre,
        url: datos.url,
        tipo: datos.tipo,
        fecha_actualizacion: new Date(),
        // Queda como autor de la última edición; fecha_registro nunca se toca.
        coordinador_id: coordinador.id,
      },
    });
    return { recurso: vistaRecurso(recurso) };
  } catch (err) {
    relanzarSiTipoDuplicado(err, datos.tipo);
  }
}

async function eliminar({ usuarioId, id }) {
  const recursoId = resolverId(id);
  await perfilCoordinador(usuarioId);

  const existente = await prisma.recurso.findUnique({ where: { id: recursoId } });
  if (!existente) throw crearError('No se encontró ese recurso.', 404, 'RECURSO_NO_ENCONTRADO');

  await prisma.recurso.delete({ where: { id: recursoId } });
  return { id: recursoId };
}

module.exports = {
  listar, crear, actualizar, eliminar, MAX_NOMBRE, MAX_URL, TIPOS_RECURSO,
  obtenerUrlConstanciaCreditos, obtenerUrlSiss,
};
