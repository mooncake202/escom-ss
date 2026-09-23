// CU-REP-06 (Coordinación): validar (aprobar) o rechazar un reporte que aprobó el profesor.
//
// APROBAR: se parte del PDF vigente almacenado (alumno + profesor, cifrado en disco; nunca se regenera desde la BD) y se le
// agrega únicamente el sello de validación del prototipo, en SELLO.zona. Un solo Buffer de principio a fin:
//   descifrar → comprobar que es el PDF que aprobó el profesor → agregar sello → SHA-256 → sello de tiempo (TSA)
//   → cifrar ESE Buffer y comprobarlo en disco → transacción: estado → aprobado_coordinador, documento apuntando al PDF
//   final y revisión aprobada de Coordinación (hash_documento, ip_firma, token_tsa).
// Si algo falla antes de la transacción no se toca la BD; si falla la transacción se borra el archivo nuevo.
// Los PDF anteriores (alumno, alumno + profesor) quedan en disco y sus revisiones, hashes y sellos de tiempo se conservan.
//
// RECHAZAR: un solo paso atómico — estado → rechazado_coordinador + revisión rechazada con el motivo. Sin PDF, sello, hash
// ni TSA.
//
// Misma disciplina que REP-05: historial de revisiones append-only y UPDATE condicional del estado (y del archivo) dentro
// de la transacción, así que dos validaciones simultáneas no se pisan: una gana y la otra recibe 409 sin dejar nada.

const {
  RUTA_BASE_DOCUMENTOS,
  TIPOS_NOTIFICACION,
  ESTADOS_REPORTE,
  ESTADOS_REPORTE_EN_COORDINACION,
  TIPO_REVISOR_PROFESOR,
  TIPO_REVISOR_COORDINADOR,
  ESTADO_REVISION_FIRMADA,
  ESTADO_REVISION_RECHAZADA,
  nombreCompleto,
} = require('./reportes.shared');
const { agregarSelloValidacion } = require('./reportes.pdf');
const { leerSello } = require('./reportes.assets');
const { normalizarIp } = require('./reportes.rubricas');
const {
  CODIGOS_ERROR: CODIGOS_REVISION, validarComentario, cambiarEstado, yaNoPendiente, exigirPdfVigente,
} = require('./reportes-revision.service');
const { OPCIONES_TRANSACCION, sha256, pedirSello, guardarPdfCifrado, descartarArchivo, avisarUsuario } = require('./reportes-envio.service');
const { errorNoEncontrado, leerPdfAlmacenado } = require('./reportes-profesor.service');
const { resolverCoordinador, resolverTipo } = require('./reportes-coordinacion.service');

const CODIGOS_ERROR = CODIGOS_REVISION;

const MENSAJES_VALIDACION = Object.freeze({
  interno: 'No se pudo aprobar el reporte.',
  sello: 'No se pudo obtener el sello de tiempo. El reporte no fue aprobado; inténtalo de nuevo en unos minutos.',
});

// ── Lectura ──────────────────────────────────────────────────

const seleccionValidable = (cfg) => ({
  id: true,
  ...cfg.camposPropios,
  estado_reporte: true,
  documento_id: true,
  documento: { select: { ruta_archivo: true } },
  // Aprobación vigente del profesor: la última (una corrección genera otra).
  [cfg.modeloRevision]: {
    where: { tipo_revisor: TIPO_REVISOR_PROFESOR, estado: ESTADO_REVISION_FIRMADA },
    orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    select: { id: true, tipo_revisor: true, estado: true, fecha: true, hash_documento: true },
  },
  solicitud_registro: {
    select: {
      alumno: { select: { boleta: true, usuario_id: true, usuario: { select: { nombre: true, apellidos: true } } } },
      oferta: { select: { profesor: { select: { usuario_id: true } } } },
    },
  },
});

/**
 * Reporte que llegó a Coordinación y espera su validación. Perfil inexistente, tipo desconocido, id inválido, inexistente o
 * todavía con el profesor: 404; ya resuelto por Coordinación: 409. Sirve para el mensual y el global.
 */
async function cargarReporteValidable(prisma, usuarioId, tipoReporte, reporteId) {
  await resolverCoordinador(prisma, usuarioId);
  const { cfg, id } = resolverTipo(tipoReporte, reporteId);

  const fila = await prisma[cfg.modelo].findFirst({
    where: { id, estado_reporte: { in: ESTADOS_REPORTE_EN_COORDINACION } },
    select: seleccionValidable(cfg),
  });
  if (!fila) throw errorNoEncontrado();
  if (fila.estado_reporte !== ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR) throw yaNoPendiente(fila.estado_reporte);
  return { cfg, fila, id };
}

const alumnoDe = (fila) => fila.solicitud_registro.alumno;
const profesorUsuarioDe = (fila) => fila.solicitud_registro.oferta?.profesor?.usuario_id ?? null;

// ── Avisos ───────────────────────────────────────────────────

// Al alumno y al profesor, con la notificación existente (fail-open: nunca invalida una resolución ya confirmada).
async function avisarResolucion(cfg, fila, id, { exito }, deps) {
  const alumno = alumnoDe(fila);
  const nombre = nombreCompleto(alumno.usuario.nombre, alumno.usuario.apellidos);
  const etiqueta = cfg.etiqueta(fila);
  const evento = 'reporte:actualizado';
  const datos = { reporteId: id };

  await avisarUsuario(alumno.usuario_id, {
    tipo: exito ? TIPOS_NOTIFICACION.APROBACION_FINAL : TIPOS_NOTIFICACION.RECHAZO,
    mensaje: exito
      ? `Coordinación validó tu ${etiqueta}.`
      : `Coordinación rechazó tu ${etiqueta}. Revisa el motivo y corrígelo.`,
    rutaRelacionada: `/alumno/reportes?${cfg.consultaDestacar(id)}`, // REP-03 abre la tarjeta de ese reporte
    evento,
    datos,
  }, deps);
  await avisarUsuario(profesorUsuarioDe(fila), {
    tipo: exito ? TIPOS_NOTIFICACION.APROBACION_FINAL : TIPOS_NOTIFICACION.RECHAZO,
    mensaje: exito
      ? `Coordinación validó el ${etiqueta} de ${nombre}.`
      : `Coordinación rechazó el ${etiqueta} de ${nombre}.`,
    rutaRelacionada: `/profesor/reportes?${cfg.consultaDestacar(id)}`,
    evento,
    datos,
  }, deps);
}

// ── Rechazar ─────────────────────────────────────────────────

/**
 * Rechaza un reporte pendiente de validación con un motivo obligatorio. No genera PDF ni sello, no calcula hash ni pide TSA.
 * deps (pruebas): { prisma, ahora, crearNotificacion, emitirAUsuario }.
 * Regresa { reporte: { id, numero, estadoReporte }, fechaRevision }.
 */
async function rechazarReporte(usuarioId, tipoReporte, reporteId, comentario, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const { cfg, fila, id } = await cargarReporteValidable(prisma, usuarioId, tipoReporte, reporteId);
  const motivo = validarComentario(comentario);
  const ahora = deps.ahora ?? new Date();

  await prisma.$transaction(async (tx) => {
    await cambiarEstado(tx, { cfg, id, desde: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, hacia: ESTADOS_REPORTE.RECHAZADO_COORDINADOR });
    await tx[cfg.modeloRevision].create({
      data: {
        [cfg.fkRevision]: id,
        usuario_id: usuarioId,
        tipo_revisor: TIPO_REVISOR_COORDINADOR,
        estado: ESTADO_REVISION_RECHAZADA,
        comentario: motivo,
        hash_documento: null,
        ruta_archivo: fila.documento.ruta_archivo, // no se genera PDF nuevo: el vigente que se está rechazando
        ip_firma: null,
        token_tsa: null,
        fecha: ahora,
      },
    });
  }, OPCIONES_TRANSACCION);

  await avisarResolucion(cfg, fila, id, { exito: false }, deps);
  return { reporte: { id, numero: cfg.numero(fila), estadoReporte: ESTADOS_REPORTE.RECHAZADO_COORDINADOR }, fechaRevision: ahora.toISOString() };
}

// ── Aprobar ──────────────────────────────────────────────────

async function registrarValidacion(tx, { cfg, id, usuarioId, fila, rutaAnterior, rutaNueva, hash, token, ip, ahora }) {
  await cambiarEstado(tx, {
    cfg, id, rutaArchivo: rutaAnterior,
    desde: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR, hacia: ESTADOS_REPORTE.APROBADO_COORDINADOR,
  });
  // El documento del reporte pasa a ser el PDF final (alumno + profesor + sello de validación).
  const { count } = await tx.documento.updateMany({
    where: { id: fila.documento_id, ruta_archivo: rutaAnterior },
    data: { ruta_archivo: rutaNueva },
  });
  if (count !== 1) throw yaNoPendiente();

  await tx[cfg.modeloRevision].create({
    data: {
      [cfg.fkRevision]: id,
      usuario_id: usuarioId,
      tipo_revisor: TIPO_REVISOR_COORDINADOR,
      estado: ESTADO_REVISION_FIRMADA,
      comentario: null,
      hash_documento: hash,
      ruta_archivo: rutaNueva, // el PDF nuevo que Coordinación acaba de sellar
      ip_firma: normalizarIp(ip),
      token_tsa: token,
      fecha: ahora,
    },
  });
}

/**
 * Valida un reporte pendiente: le agrega el sello de validación del prototipo, lo sella en el tiempo (TSA) y lo deja como
 * aprobado por Coordinación.
 * deps (pruebas): { prisma, ahora, ip, rutaBaseDocumentos, solicitarSelloTiempo, leerSello, agregarSello,
 * crearNotificacion, emitirAUsuario }.
 * Regresa { reporte: { id, numero, estadoReporte }, fechaRevision }.
 */
async function aprobarReporte(usuarioId, tipoReporte, reporteId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const base = deps.rutaBaseDocumentos ?? RUTA_BASE_DOCUMENTOS;
  const agregarSello = deps.agregarSello ?? agregarSelloValidacion;

  // 1) Validaciones: nada se sella ni guarda si algo no está en orden (el sello se verifica antes de tocar el PDF).
  const { cfg, fila, id } = await cargarReporteValidable(prisma, usuarioId, tipoReporte, reporteId);
  const sello = (deps.leerSello ?? leerSello)();

  // 2) El PDF vigente exacto + solo el sello = UN Buffer nuevo. Todo lo demás se hace sobre él.
  const rutaAnterior = fila.documento?.ruta_archivo;
  const pdfVigente = await leerPdfAlmacenado(rutaAnterior, base);
  exigirPdfVigente(cfg, fila, pdfVigente, { tipoRevisor: TIPO_REVISOR_PROFESOR, estado: ESTADO_REVISION_FIRMADA, firmante: 'el profesor' });
  const pdfFinal = Buffer.from(await agregarSello(pdfVigente, sello.data));
  const hash = sha256(pdfFinal);

  // 3) Sello de tiempo de ese hash. Si falla, no hay nada que deshacer.
  const token = await pedirSello(hash, deps.solicitarSelloTiempo, MENSAJES_VALIDACION);

  // 4) Ese mismo Buffer, cifrado y comprobado en disco.
  const archivo = await guardarPdfCifrado(pdfFinal, alumnoDe(fila).boleta, hash, base);

  // 5) Registro atómico.
  const ahora = deps.ahora ?? new Date();
  try {
    await prisma.$transaction(
      (tx) => registrarValidacion(tx, { cfg, id, usuarioId, fila, rutaAnterior, rutaNueva: archivo.rutaRelativa, hash, token, ip: deps.ip, ahora }),
      OPCIONES_TRANSACCION,
    );
  } catch (err) {
    await descartarArchivo(prisma, archivo);
    throw err;
  }

  await avisarResolucion(cfg, fila, id, { exito: true }, deps);
  return {
    reporte: { id, numero: cfg.numero(fila), estadoReporte: ESTADOS_REPORTE.APROBADO_COORDINADOR },
    fechaRevision: ahora.toISOString(),
  };
}

module.exports = { CODIGOS_ERROR, rechazarReporte, aprobarReporte };
