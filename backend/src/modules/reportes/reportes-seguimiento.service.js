// CU-REP-02 / CU-REP-03 (Alumno): listado de sus reportes, seguimiento y PDF almacenado. Solo lectura.
//
// El alumno solo ve SUS reportes (solicitud_registro.alumno.usuario_id = el del token); uno ajeno o inexistente responde
// el mismo 404. El seguimiento se reconstruye únicamente con lo que existe en revision_reporte_mensual, que es append-only:
// cada envío, corrección, aprobación y rechazo es una fila, y los rechazos anteriores se conservan aunque el reporte se
// corrija y termine aprobado. No se inventa ningún evento que no esté guardado; el estado actual se informa aparte.
//
// Mensual y global comparten TODA la lógica (reportes.tipos.js define lo único que cambia): cada tipo tiene su fuente en FUENTES.

const path = require('path');
const {
  RUTA_BASE_DOCUMENTOS,
  ESTADOS_REPORTE_RECHAZADOS,
  TIPO_REVISOR_ALUMNO,
  TIPO_REVISOR_PROFESOR,
  TIPO_REVISOR_COORDINADOR,
  ESTADO_REVISION_FIRMADA,
  ESTADO_REVISION_RECHAZADA,
  nombreCompleto,
} = require('./reportes.shared');
const { CONFIG } = require('./reportes.tipos');
const { errorNoEncontrado, leerPdfAlmacenado, validarIdentificador, fechaEnvioDe } = require('./reportes-profesor.service');

const nombresDe = { select: { nombre: true, apellidos: true } };

// El reporte es del alumno cuando su solicitud es la del alumno del token.
const dePropiedadAlumno = (usuarioId) => ({ solicitud_registro: { alumno: { usuario_id: usuarioId } } });

const incluirDe = (cfg) => ({
  solicitud_registro: {
    include: {
      periodo_registro: { include: { evento_calendario: true } },
      oferta: { include: { profesor: { include: { usuario: nombresDe } } } },
    },
  },
  documento: { select: { fecha_creacion: true } },
  // Todas las revisiones, de la más antigua a la más reciente, con quién las hizo.
  [cfg.modeloRevision]: { orderBy: [{ fecha: 'asc' }, { id: 'asc' }], include: { usuario: nombresDe } },
});

const iso = (fecha) => (fecha ? new Date(fecha).toISOString() : null);
const porOrden = (a, b) => (+new Date(a.fecha) - +new Date(b.fecha)) || (a.id - b.id);

const ETAPA_POR_REVISOR = Object.freeze({
  [TIPO_REVISOR_ALUMNO]: 'alumno',
  [TIPO_REVISOR_PROFESOR]: 'profesor',
  [TIPO_REVISOR_COORDINADOR]: 'coordinacion',
});

// ── Historial ────────────────────────────────────────────────

/**
 * Historial real del reporte: una entrada por revisión guardada, en orden. La primera del alumno es el envío; las
 * siguientes, correcciones reenviadas. Un rechazo conserva su motivo. Nunca se agregan eventos que no existan en la BD.
 */
function construirHistorial(revisiones) {
  let enviosDelAlumno = 0;
  return [...(revisiones ?? [])].sort(porOrden).map((r) => {
    const etapa = ETAPA_POR_REVISOR[r.tipo_revisor] ?? r.tipo_revisor;
    let resultado = r.estado === ESTADO_REVISION_RECHAZADA ? 'rechazado' : 'aprobado';
    if (r.tipo_revisor === TIPO_REVISOR_ALUMNO && r.estado === ESTADO_REVISION_FIRMADA) {
      enviosDelAlumno += 1;
      resultado = enviosDelAlumno === 1 ? 'enviado' : 'reenviado';
    }
    return {
      id: r.id,
      etapa,
      resultado,
      fecha: iso(r.fecha),
      actor: r.usuario ? { nombreCompleto: nombreCompleto(r.usuario.nombre, r.usuario.apellidos) } : null,
      motivo: resultado === 'rechazado' ? r.comentario ?? null : null,
    };
  });
}

// Último rechazo guardado (profesor o Coordinación): lo que el alumno debe atender cuando el estado actual es rechazado.
function ultimoRechazoDe(historial) {
  const rechazo = [...historial].reverse().find((h) => h.resultado === 'rechazado');
  return rechazo ? { etapa: rechazo.etapa, fecha: rechazo.fecha, motivo: rechazo.motivo, actor: rechazo.actor } : null;
}

// ── Fuentes por tipo ─────────────────────────────────────────

function resumirReporte(cfg, fila) {
  const { periodo } = cfg.periodo(fila.solicitud_registro, fila);
  const revisiones = fila[cfg.modeloRevision];
  const historial = construirHistorial(revisiones);
  const puedeCorregir = ESTADOS_REPORTE_RECHAZADOS.includes(fila.estado_reporte);
  const profesor = fila.solicitud_registro.oferta?.profesor;
  return {
    id: fila.id,
    tipoReporte: cfg.tipo,
    numeroReporte: cfg.numero(fila),
    periodo,
    estadoReporte: fila.estado_reporte,
    // Snapshot del primer envío guardado en el propio reporte (solo el mensual): no se recalcula ni se consultan bitácoras.
    ...cfg.snapshot(fila),
    fechaEnvio: fechaEnvioDe(revisiones, fila.documento),
    revisor: profesor ? { nombreCompleto: nombreCompleto(profesor.usuario.nombre, profesor.usuario.apellidos) } : null,
    puedeCorregir,
    // Con el estado actual rechazado: el motivo más reciente (el que hay que corregir).
    ultimoRechazo: puedeCorregir ? ultimoRechazoDe(historial) : null,
    historial,
  };
}

const fuenteDe = (cfg) => ({
  async listar(prisma, usuarioId) {
    const filas = await prisma[cfg.modelo].findMany({ where: dePropiedadAlumno(usuarioId), include: incluirDe(cfg) });
    // En el listado el historial no se manda completo: para eso está el seguimiento.
    return filas.map((f) => {
      const { historial, ...resumen } = resumirReporte(cfg, f);
      return { ...resumen, totalEventos: historial.length };
    });
  },

  async detalle(prisma, usuarioId, id) {
    const fila = await prisma[cfg.modelo].findFirst({ where: { id, ...dePropiedadAlumno(usuarioId) }, include: incluirDe(cfg) });
    if (!fila) return null;
    const resumen = resumirReporte(cfg, fila);
    return {
      ...resumen,
      titulo: cfg.titulo(fila),
      // Solo se manda cuando se puede corregir: es lo que CU-REP-04 precarga.
      actividades: resumen.puedeCorregir ? fila[cfg.columnaActividades] : null,
    };
  },

  async documento(prisma, usuarioId, id) {
    const fila = await prisma[cfg.modelo].findFirst({
      where: { id, ...dePropiedadAlumno(usuarioId) },
      select: { ...cfg.camposPropios, documento: { select: { ruta_archivo: true } }, solicitud_registro: { select: { alumno: { select: { boleta: true } } } } },
    });
    if (!fila) return null;
    return { rutaArchivo: fila.documento?.ruta_archivo ?? null, nombreArchivo: cfg.archivo(fila, fila.solicitud_registro.alumno.boleta) };
  },
});

const FUENTES = Object.freeze(Object.fromEntries(Object.values(CONFIG).map((cfg) => [cfg.tipo, fuenteDe(cfg)])));

// ── API ──────────────────────────────────────────────────────

// Tipo desconocido o id inválido: mismo 404 que un reporte inexistente o ajeno.
function resolverFuente(tipoReporte, reporteId) {
  const { cfg, id } = validarIdentificador(tipoReporte, reporteId);
  return { cfg, fuente: FUENTES[cfg.tipo], id };
}

/** Los reportes del alumno, del más reciente (mayor número) al más antiguo. deps: { prisma } (pruebas). */
async function listarReportes(usuarioId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const reportes = (await Promise.all(Object.values(FUENTES).map((f) => f.listar(prisma, usuarioId)))).flat();
  // El global cierra el servicio: va primero; luego los mensuales del más reciente al más antiguo.
  const esGlobal = (r) => (r.tipoReporte === 'global' ? 1 : 0);
  reportes.sort((a, b) => esGlobal(b) - esGlobal(a) || (b.numeroReporte ?? 0) - (a.numeroReporte ?? 0) || b.id - a.id);
  return { reportes, total: reportes.length };
}

/** Seguimiento de un reporte propio: resumen, historial real, último rechazo y si se puede corregir. */
async function obtenerSeguimiento(usuarioId, tipoReporte, reporteId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const { fuente, id } = resolverFuente(tipoReporte, reporteId);
  const detalle = await fuente.detalle(prisma, usuarioId, id);
  if (!detalle) throw errorNoEncontrado();
  return detalle;
}

/**
 * PDF EXACTO almacenado del reporte propio (la última versión enviada; con todas las firmas si ya se aprobó). Se lee y
 * descifra el archivo de documento.ruta_archivo; no regenera nada ni escribe en BD ni en disco.
 * deps: { prisma, rutaBaseDocumentos }.
 */
async function obtenerPdfReporte(usuarioId, tipoReporte, reporteId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const { fuente, id } = resolverFuente(tipoReporte, reporteId);
  const documento = await fuente.documento(prisma, usuarioId, id);
  if (!documento) throw errorNoEncontrado();
  const pdf = await leerPdfAlmacenado(documento.rutaArchivo, path.resolve(deps.rutaBaseDocumentos ?? RUTA_BASE_DOCUMENTOS));
  return { pdf, nombreArchivo: documento.nombreArchivo };
}

module.exports = {
  listarReportes, obtenerSeguimiento, obtenerPdfReporte,
  // Para CU-REP-04: propiedad del alumno y mismo 404.
  dePropiedadAlumno, construirHistorial, ultimoRechazoDe,
};
