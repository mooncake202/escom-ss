// CU-REP-06 (Coordinación): listado, detalle y PDF almacenado de los reportes que llegaron a Coordinación. Solo lectura
// (aprobar y rechazar viven en reportes-validacion.service.js).
//
// La bandeja de Coordinación es compartida: cualquier coordinador ve todos los reportes que ya aprobó el profesor
// (pendientes de validación) y los que Coordinación ya resolvió. Un reporte que todavía está con el profesor (o que este
// rechazó) no existe para Coordinación: mismo 404 que un reporte inexistente.

const path = require('path');
const {
  RUTA_BASE_DOCUMENTOS,
  ESTADOS_REPORTE,
  ESTADOS_REPORTE_EN_COORDINACION,
  TIPO_REVISOR_PROFESOR,
  TIPO_REVISOR_COORDINADOR,
  ESTADO_REVISION_FIRMADA,
  nombreCompleto,
  nombreInstitucionalCarrera,
} = require('./reportes.shared');
const { CONFIG } = require('./reportes.tipos');
const { errorNoEncontrado, leerPdfAlmacenado, resumirReporte, validarIdentificador } = require('./reportes-profesor.service');

async function resolverCoordinador(prisma, usuarioId) {
  const coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: usuarioId } });
  if (!coordinador) throw Object.assign(new Error('No se encontró tu perfil de coordinador.'), { status: 404 });
  return coordinador;
}

const nombresDe = { select: { nombre: true, apellidos: true } };

// Todas las revisiones (alumno, profesor y Coordinación): de ellas salen las fechas de cada etapa.
const incluirDe = (cfg) => ({
  solicitud_registro: {
    include: {
      alumno: { include: { usuario: nombresDe } },
      oferta: { include: { profesor: { include: { usuario: nombresDe } } } },
      periodo_registro: { include: { evento_calendario: true } },
    },
  },
  documento: { select: { fecha_creacion: true } },
  [cfg.modeloRevision]: { orderBy: [{ fecha: 'desc' }, { id: 'desc' }] },
});

// La más reciente (las revisiones ya vienen de la más nueva a la más vieja, pero no se depende de eso).
const ultimaRevision = (revisiones, tipoRevisor, estado = null) => (revisiones ?? [])
  .filter((r) => r.tipo_revisor === tipoRevisor && (!estado || r.estado === estado))
  .reduce((a, b) => (a === null || b.fecha > a.fecha || (+b.fecha === +a.fecha && b.id > a.id) ? b : a), null);

const iso = (fecha) => (fecha ? new Date(fecha).toISOString() : null);

function resumirParaCoordinacion(cfg, fila) {
  const base = resumirReporte(cfg, fila);
  const { alumno, oferta } = fila.solicitud_registro;
  const profesor = oferta?.profesor;
  const deProfesor = ultimaRevision(fila[cfg.modeloRevision], TIPO_REVISOR_PROFESOR, ESTADO_REVISION_FIRMADA);
  const deCoordinacion = ultimaRevision(fila[cfg.modeloRevision], TIPO_REVISOR_COORDINADOR);
  return {
    ...base,
    alumno: { ...base.alumno, carrera: nombreInstitucionalCarrera(alumno.carrera) ?? alumno.carrera ?? null },
    profesor: profesor ? { nombreCompleto: nombreCompleto(profesor.usuario.nombre, profesor.usuario.apellidos) } : null,
    fechaAprobacionProfesor: iso(deProfesor?.fecha),
    fechaRevisionCoordinacion: iso(deCoordinacion?.fecha),
    // La única regla de "pendiente": Coordinación solo puede validar lo que espera su validación.
    puedeRevisar: fila.estado_reporte === ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR,
  };
}

// Tipo desconocido o id inválido: mismo 404 que un reporte inexistente. Sirve para el mensual y el global.
const resolverTipo = (tipoReporte, reporteId) => {
  const { cfg, id } = validarIdentificador(tipoReporte, reporteId);
  return { cfg, id };
};

const porFecha = (campo, sentido) => (a, b) => {
  const x = a[campo] ?? a.fechaEnvio ?? '';
  const y = b[campo] ?? b.fechaEnvio ?? '';
  if (x === y) return a.id - b.id;
  return sentido * (x < y ? -1 : 1);
};

/**
 * `pendientes` (esperan la validación de Coordinación, del más antiguo al más reciente) y `procesados` (ya validados o
 * rechazados por Coordinación, del más reciente al más antiguo). deps: { prisma } (pruebas).
 */
async function listarReportes(usuarioId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  await resolverCoordinador(prisma, usuarioId);

  const porTipo = await Promise.all(Object.values(CONFIG).map(async (cfg) => {
    const filas = await prisma[cfg.modelo].findMany({ where: { estado_reporte: { in: ESTADOS_REPORTE_EN_COORDINACION } }, include: incluirDe(cfg) });
    return filas.map((f) => resumirParaCoordinacion(cfg, f));
  }));
  const reportes = porTipo.flat();
  const pendientes = reportes.filter((r) => r.puedeRevisar).sort(porFecha('fechaAprobacionProfesor', 1));
  const procesados = reportes.filter((r) => !r.puedeRevisar).sort(porFecha('fechaRevisionCoordinacion', -1));
  return { pendientes, procesados, totales: { pendientes: pendientes.length, procesados: procesados.length } };
}

/** Detalle de un reporte que llegó a Coordinación. Inexistente, de otro tipo, id inválido o aún con el profesor: mismo 404. */
async function obtenerDetalleReporte(usuarioId, tipoReporte, reporteId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  await resolverCoordinador(prisma, usuarioId);
  const { cfg, id } = resolverTipo(tipoReporte, reporteId);

  const fila = await prisma[cfg.modelo].findFirst({ where: { id, estado_reporte: { in: ESTADOS_REPORTE_EN_COORDINACION } }, include: incluirDe(cfg) });
  if (!fila) throw errorNoEncontrado();

  const revision = ultimaRevision(fila[cfg.modeloRevision], TIPO_REVISOR_COORDINADOR);
  // Días y horas (solo el mensual) son el snapshot del primer envío guardado en el propio reporte: no se consultan bitácoras.
  return {
    ...resumirParaCoordinacion(cfg, fila),
    titulo: cfg.titulo(fila),
    ...cfg.snapshot(fila),
    actividades: fila[cfg.columnaActividades],
    revisionCoordinacion: revision ? { estado: revision.estado, comentario: revision.comentario ?? null, fecha: iso(revision.fecha) } : null,
  };
}

/**
 * PDF EXACTO almacenado (el vigente: alumno + profesor, y además el sello si Coordinación ya lo validó). Se lee y descifra
 * el archivo de documento.ruta_archivo; no regenera nada ni escribe en BD ni en disco. deps: { prisma, rutaBaseDocumentos }.
 */
async function obtenerPdfReporte(usuarioId, tipoReporte, reporteId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  await resolverCoordinador(prisma, usuarioId);
  const { cfg, id } = resolverTipo(tipoReporte, reporteId);

  const fila = await prisma[cfg.modelo].findFirst({
    where: { id, estado_reporte: { in: ESTADOS_REPORTE_EN_COORDINACION } },
    select: { ...cfg.camposPropios, documento: { select: { ruta_archivo: true } }, solicitud_registro: { select: { alumno: { select: { boleta: true } } } } },
  });
  if (!fila) throw errorNoEncontrado();

  const pdf = await leerPdfAlmacenado(fila.documento?.ruta_archivo ?? null, path.resolve(deps.rutaBaseDocumentos ?? RUTA_BASE_DOCUMENTOS));
  return { pdf, nombreArchivo: cfg.archivo(fila, fila.solicitud_registro.alumno.boleta) };
}

module.exports = { listarReportes, obtenerDetalleReporte, obtenerPdfReporte, resolverCoordinador, resolverTipo, ultimaRevision };
