// CU-REP-05 (Profesor): listado, detalle y PDF almacenado de los reportes. Solo lectura (aprobar y rechazar viven en reportes-revision.service.js).
// El profesor sale siempre del token (usuario_id) y solo ve reportes de alumnos asignados a SUS ofertas
// (solicitud_registro.oferta.profesor_id). Un reporte ajeno o inexistente responde el mismo 404.
//
// Los tipos de reporte (mensual y global) comparten TODA la lógica: lo que cambia por tipo está en reportes.tipos.js y aquí se
// arma una fuente (listar, detalle, documento) por cada uno. El global no tiene número ni snapshot de días y horas (null).

const fs = require('fs');
const path = require('path');
const { descifrarBuffer } = require('../../lib/fileEncryption');
const { RUTA_BASE_DOCUMENTOS, ESTADOS_REPORTE, TIPO_REVISOR_ALUMNO, nombreCompleto } = require('./reportes.shared');
const { TIPOS_REPORTE, CONFIG, configDe } = require('./reportes.tipos');

function crearError(mensaje, status = 400, code) {
  const err = new Error(mensaje);
  err.status = status;
  if (code) err.code = code;
  return err;
}

const errorNoEncontrado = () => crearError('Reporte no encontrado.', 404);
const errorArchivoNoDisponible = () => crearError('El archivo del reporte no está disponible.', 404, 'ARCHIVO_NO_DISPONIBLE');

// Única regla de "pendiente": el profesor solo puede revisar lo que espera su revisión.
const esPendienteDeRevision = (estadoReporte) => estadoReporte === ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR;

async function resolverProfesor(prisma, usuarioId) {
  const profesor = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId } });
  if (!profesor) throw crearError('No se encontró tu perfil de profesor.', 404);
  return profesor;
}

// Relación que define la propiedad: el alumno del reporte está asignado a una oferta de este profesor.
const dePropiedadDe = (profesor) => ({ solicitud_registro: { oferta: { profesor_id: profesor.id } } });

// ── Piezas comunes ───────────────────────────────────────────

function alumnoDe(solicitud) {
  const { alumno } = solicitud;
  return { nombreCompleto: nombreCompleto(alumno.usuario.nombre, alumno.usuario.apellidos), boleta: alumno.boleta };
}

/** Fecha del último envío del alumno (una corrección genera otro); respaldo: creación del documento. */
function fechaEnvioDe(revisiones, documento) {
  const delAlumno = (revisiones ?? []).filter((r) => r.tipo_revisor === TIPO_REVISOR_ALUMNO && r.fecha);
  const ultima = delAlumno.reduce((max, r) => (max === null || r.fecha > max ? r.fecha : max), null);
  const fecha = ultima ?? documento?.fecha_creacion ?? null;
  return fecha ? new Date(fecha).toISOString() : null;
}

// ── Fuentes por tipo ─────────────────────────────────────────

const incluirDe = (cfg) => ({
  solicitud_registro: {
    include: {
      alumno: { include: { usuario: { select: { nombre: true, apellidos: true } } } },
      periodo_registro: { include: { evento_calendario: true } },
    },
  },
  documento: { select: { fecha_creacion: true } },
  [cfg.modeloRevision]: { where: { tipo_revisor: TIPO_REVISOR_ALUMNO }, orderBy: { fecha: 'desc' } },
});

function resumirReporte(cfg, fila) {
  const { periodo, mesMostrado } = cfg.periodo(fila.solicitud_registro, fila);
  return {
    id: fila.id,
    tipoReporte: cfg.tipo,
    numeroReporte: cfg.numero(fila),
    alumno: alumnoDe(fila.solicitud_registro),
    periodo,
    mesMostrado,
    fechaEnvio: fechaEnvioDe(fila[cfg.modeloRevision], fila.documento),
    estadoReporte: fila.estado_reporte,
    puedeRevisar: esPendienteDeRevision(fila.estado_reporte),
  };
}

const fuenteDe = (cfg) => ({
  async listar(prisma, profesor) {
    const filas = await prisma[cfg.modelo].findMany({ where: dePropiedadDe(profesor), include: incluirDe(cfg) });
    return filas.map((f) => resumirReporte(cfg, f));
  },

  async detalle(prisma, profesor, id) {
    const fila = await prisma[cfg.modelo].findFirst({ where: { id, ...dePropiedadDe(profesor) }, include: incluirDe(cfg) });
    if (!fila) return null;
    // Días y horas (solo el mensual) son el snapshot del primer envío guardado en el propio reporte: no se consultan bitácoras.
    return { ...resumirReporte(cfg, fila), titulo: cfg.titulo(fila), ...cfg.snapshot(fila), actividades: fila[cfg.columnaActividades] };
  },

  // PDF almacenado: solo la ruta del documento (y lo necesario para nombrar la descarga).
  async documento(prisma, profesor, id) {
    const fila = await prisma[cfg.modelo].findFirst({
      where: { id, ...dePropiedadDe(profesor) },
      select: { ...cfg.camposPropios, documento: { select: { ruta_archivo: true } }, solicitud_registro: { select: { alumno: { select: { boleta: true } } } } },
    });
    if (!fila) return null;
    return { rutaArchivo: fila.documento?.ruta_archivo ?? null, nombreArchivo: cfg.archivo(fila, fila.solicitud_registro.alumno.boleta) };
  },
});

const FUENTES = Object.freeze(Object.fromEntries(Object.values(CONFIG).map((cfg) => [cfg.tipo, fuenteDe(cfg)])));

// ── API ──────────────────────────────────────────────────────

const porFecha = (a, b, sentido) => {
  if (a.fechaEnvio === b.fechaEnvio) return a.id - b.id;
  if (a.fechaEnvio === null) return 1;
  if (b.fechaEnvio === null) return -1;
  return sentido * (a.fechaEnvio < b.fechaEnvio ? -1 : 1);
};

/**
 * Reportes de los alumnos del profesor: `pendientes` (esperan su revisión, del más antiguo al más reciente) y
 * `procesados` (cualquier otro estado, del más reciente al más antiguo). deps: { prisma } (pruebas).
 */
async function listarReportes(usuarioId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const profesor = await resolverProfesor(prisma, usuarioId);

  const reportes = (await Promise.all(Object.values(FUENTES).map((fuente) => fuente.listar(prisma, profesor)))).flat();
  const pendientes = reportes.filter((r) => r.puedeRevisar).sort((a, b) => porFecha(a, b, 1));
  const procesados = reportes.filter((r) => !r.puedeRevisar).sort((a, b) => porFecha(a, b, -1));
  return { pendientes, procesados, totales: { pendientes: pendientes.length, procesados: procesados.length } };
}

// Tipo desconocido o id inválido: mismo 404 que un reporte inexistente o ajeno. También lo usa Coordinación (CU-REP-06).
function validarIdentificador(tipoReporte, reporteId) {
  const cfg = configDe(tipoReporte);
  const idTexto = typeof reporteId === 'string' || typeof reporteId === 'number' ? String(reporteId) : '';
  if (!cfg || !/^[1-9]\d{0,9}$/.test(idTexto) || Number(idTexto) > 2147483647) throw errorNoEncontrado();
  return { cfg, fuente: FUENTES[cfg.tipo], id: Number(idTexto) };
}

async function resolverFuente(prisma, usuarioId, tipoReporte, reporteId) {
  const profesor = await resolverProfesor(prisma, usuarioId);
  return { ...validarIdentificador(tipoReporte, reporteId), profesor };
}

/** Detalle de un reporte propio. Tipo desconocido, id inválido, inexistente o ajeno: mismo 404. */
async function obtenerDetalleReporte(usuarioId, tipoReporte, reporteId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const { fuente, profesor, id } = await resolverFuente(prisma, usuarioId, tipoReporte, reporteId);

  const detalle = await fuente.detalle(prisma, profesor, id);
  if (!detalle) throw errorNoEncontrado();
  return detalle;
}

/**
 * PDF EXACTO almacenado del reporte (el enviado y firmado por el alumno): se lee el archivo cifrado de
 * documento.ruta_archivo y se descifra. No regenera nada ni escribe en BD ni en disco. Mismo 404 para ajeno/inexistente.
 * deps (pruebas): { prisma, rutaBaseDocumentos }.
 */
async function obtenerPdfReporte(usuarioId, tipoReporte, reporteId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const base = path.resolve(deps.rutaBaseDocumentos ?? RUTA_BASE_DOCUMENTOS);
  const { fuente, profesor, id } = await resolverFuente(prisma, usuarioId, tipoReporte, reporteId);

  const documento = await fuente.documento(prisma, profesor, id);
  if (!documento) throw errorNoEncontrado();

  return { pdf: await leerPdfAlmacenado(documento.rutaArchivo, base), nombreArchivo: documento.nombreArchivo };
}

/** Lee y descifra un PDF almacenado (ruta relativa a la carpeta de documentos). Nunca sigue rutas fuera de ella. */
async function leerPdfAlmacenado(rutaArchivo, rutaBase) {
  const base = path.resolve(rutaBase);
  if (!rutaArchivo) throw errorArchivoNoDisponible();

  // La ruta sale de la BD, pero nunca se sigue fuera de la carpeta de documentos.
  const ruta = path.resolve(base, rutaArchivo);
  if (!ruta.startsWith(base + path.sep)) throw errorArchivoNoDisponible();

  let cifrado;
  try {
    cifrado = await fs.promises.readFile(ruta);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR' || err.code === 'EISDIR') throw errorArchivoNoDisponible();
    throw err;
  }

  try {
    return descifrarBuffer(cifrado);
  } catch (err) {
    // Llave distinta o archivo alterado: es un problema del servidor, no del profesor.
    console.error('[reportes] No se pudo descifrar el PDF almacenado:', err.message);
    throw Object.assign(new Error('El archivo del reporte no se pudo leer.'), { status: 500, code: 'ARCHIVO_ILEGIBLE' });
  }
}

module.exports = {
  TIPOS_REPORTE, listarReportes, obtenerDetalleReporte, obtenerPdfReporte,
  // Piezas que reutiliza la revisión (aprobar/rechazar): propiedad, validación de identificadores y lectura del PDF almacenado.
  resolverFuente, dePropiedadDe, errorNoEncontrado, leerPdfAlmacenado,
  // Y las de Coordinación (CU-REP-06): mismo resumen de reporte, mismo 404 y misma validación de identificadores.
  resumirReporte, validarIdentificador,
  // Y las del alumno (CU-REP-02/03/04): fecha del último envío de un reporte.
  fechaEnvioDe,
};
