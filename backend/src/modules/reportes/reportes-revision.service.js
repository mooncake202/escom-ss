// CU-REP-05 (Profesor): rechazar y aprobar/firmar un reporte propio que espera su revisión.
//
// RECHAZAR: un solo paso atómico — estado → rechazado_profesor + revisión rechazada con el motivo. Sin firma, hash ni TSA.
//
// APROBAR: se parte del PDF EXACTO que firmó el alumno (archivo cifrado en disco, nunca se regenera desde la BD) y se le
// agrega únicamente la rúbrica del profesor. Un solo Buffer de principio a fin:
//   descifrar → comprobar que es el PDF que firmó el alumno → agregar rúbrica → SHA-256 → sello de tiempo (TSA)
//   → cifrar ESE Buffer y comprobarlo en disco → transacción: estado → pendiente_revision_coordinador,
//   documento apuntando al PDF final y revisión aprobada del profesor (hash_documento, ip_firma, token_tsa).
// Si algo falla antes de la transacción no se toca la BD; si falla la transacción se borra el archivo nuevo.
// El PDF firmado solo por el alumno queda en disco (su hash sigue registrado en la revisión del alumno).
//
// El historial de revisiones es append-only: solo se crean filas nuevas, nunca se modifican ni se borran.
// La condición de carrera se resuelve con un UPDATE condicional del estado (y del archivo) dentro de la transacción:
// si otra revisión se adelantó, esta pierde con 409 y no deja nada.

const {
  RUTA_BASE_DOCUMENTOS,
  TIPOS_NOTIFICACION,
  ESTADOS_REPORTE,
  TIPO_REVISOR_ALUMNO,
  TIPO_REVISOR_PROFESOR,
  ESTADO_REVISION_FIRMADA,
  ESTADO_REVISION_RECHAZADA,
  nombreCompleto,
} = require('./reportes.shared');
const { agregarRubricaProfesor } = require('./reportes.pdf');
const { normalizarIp, obtenerRubricaAlumno: obtenerRubricaGuardada } = require('./reportes.rubricas');
const { crearError } = require('./reportes-preparacion');
const {
  CODIGOS_ERROR: CODIGOS_ENVIO, OPCIONES_TRANSACCION, sha256, pedirSello, guardarPdfCifrado, descartarArchivo, avisarUsuario,
} = require('./reportes-envio.service');
const { resolverFuente, dePropiedadDe, errorNoEncontrado, leerPdfAlmacenado } = require('./reportes-profesor.service');

const MAX_CARACTERES_COMENTARIO = 1000;

const CODIGOS_ERROR = Object.freeze({
  COMENTARIO_REQUERIDO: 'COMENTARIO_REQUERIDO',
  COMENTARIO_MUY_LARGO: 'COMENTARIO_MUY_LARGO',
  REPORTE_NO_PENDIENTE: 'REPORTE_NO_PENDIENTE',
  RUBRICA_NO_REGISTRADA: CODIGOS_ENVIO.RUBRICA_NO_REGISTRADA,
  SELLO_TIEMPO_NO_DISPONIBLE: CODIGOS_ENVIO.SELLO_TIEMPO_NO_DISPONIBLE,
  ARCHIVO_INCONSISTENTE: CODIGOS_ENVIO.ARCHIVO_INCONSISTENTE,
});

const MENSAJES_APROBACION = Object.freeze({
  interno: 'No se pudo aprobar el reporte.',
  sello: 'No se pudo obtener el sello de tiempo. El reporte no fue aprobado ni firmado; inténtalo de nuevo en unos minutos.',
});

const yaNoPendiente = (estadoReporte) => crearError(
  'Este reporte ya no está pendiente de tu revisión.',
  409,
  CODIGOS_ERROR.REPORTE_NO_PENDIENTE,
  { estadoReporte },
);

// ── Lectura ──────────────────────────────────────────────────

const seleccionRevisable = (cfg) => ({
  id: true,
  ...cfg.camposPropios,
  estado_reporte: true,
  documento_id: true,
  documento: { select: { ruta_archivo: true } },
  // Firma del alumno vigente: la última (una corrección genera otra).
  [cfg.modeloRevision]: {
    where: { tipo_revisor: TIPO_REVISOR_ALUMNO },
    orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    select: { id: true, tipo_revisor: true, fecha: true, hash_documento: true },
  },
  solicitud_registro: {
    select: { alumno: { select: { boleta: true, usuario_id: true, usuario: { select: { nombre: true, apellidos: true } } } } },
  },
});

/**
 * Reporte propio y pendiente de revisión del profesor (mensual o global). Tipo desconocido, id inválido, inexistente o ajeno:
 * mismo 404; en cualquier otro estado: 409.
 */
async function cargarReporteRevisable(prisma, usuarioId, tipoReporte, reporteId) {
  const { cfg, profesor, id } = await resolverFuente(prisma, usuarioId, tipoReporte, reporteId);

  const fila = await prisma[cfg.modelo].findFirst({ where: { id, ...dePropiedadDe(profesor) }, select: seleccionRevisable(cfg) });
  if (!fila) throw errorNoEncontrado();
  if (fila.estado_reporte !== ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR) throw yaNoPendiente(fila.estado_reporte);
  return { cfg, profesor, fila, id };
}

const alumnoDe = (fila) => fila.solicitud_registro.alumno;

// ── Rechazar ─────────────────────────────────────────────────

function validarComentario(comentario) {
  const texto = typeof comentario === 'string' ? comentario.trim() : '';
  if (!texto) throw crearError('El motivo del rechazo es obligatorio.', 400, CODIGOS_ERROR.COMENTARIO_REQUERIDO);
  if (texto.length > MAX_CARACTERES_COMENTARIO) {
    throw crearError(`El motivo del rechazo no puede pasar de ${MAX_CARACTERES_COMENTARIO} caracteres.`, 400, CODIGOS_ERROR.COMENTARIO_MUY_LARGO);
  }
  return texto;
}

// Cambia el estado solo si el reporte sigue siendo del profesor y sigue pendiente (y, si se indica, con el mismo archivo).
// Sin `profesor` no hay filtro de propiedad (Coordinación tiene una bandeja compartida, CU-REP-06); `donde` agrega otra
// condición (el alumno dueño, en CU-REP-04), `cambios` otras columnas del mismo UPDATE y `alFallar` el error si otra
// operación se adelantó.
async function cambiarEstado(tx, { cfg, id, profesor, donde = {}, desde, hacia, rutaArchivo, cambios = {}, alFallar = yaNoPendiente }) {
  const { count } = await tx[cfg.modelo].updateMany({
    where: {
      id, estado_reporte: desde, ...(rutaArchivo ? { documento: { ruta_archivo: rutaArchivo } } : {}), ...(profesor ? dePropiedadDe(profesor) : {}), ...donde,
    },
    data: { estado_reporte: hacia, ...cambios },
  });
  if (count !== 1) throw alFallar();
}

/**
 * Rechaza un reporte pendiente con un motivo obligatorio. No firma, no calcula hash ni pide TSA.
 * deps (pruebas): { prisma, ahora, crearNotificacion, emitirAUsuario }.
 * Regresa { reporte: { id, numero, estadoReporte }, fechaRevision }.
 */
async function rechazarReporte(usuarioId, tipoReporte, reporteId, comentario, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const { cfg, profesor, fila, id } = await cargarReporteRevisable(prisma, usuarioId, tipoReporte, reporteId);
  const motivo = validarComentario(comentario);
  const ahora = deps.ahora ?? new Date();

  await prisma.$transaction(async (tx) => {
    await cambiarEstado(tx, { cfg, id, profesor, desde: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, hacia: ESTADOS_REPORTE.RECHAZADO_PROFESOR });
    await tx[cfg.modeloRevision].create({
      data: {
        [cfg.fkRevision]: id,
        usuario_id: usuarioId,
        tipo_revisor: TIPO_REVISOR_PROFESOR,
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

  await avisarUsuario(alumnoDe(fila).usuario_id, {
    tipo: TIPOS_NOTIFICACION.RECHAZO,
    mensaje: `Tu profesor rechazó el ${cfg.etiqueta(fila)}. Revisa el motivo y corrígelo.`,
    rutaRelacionada: `/alumno/reportes?${cfg.consultaDestacar(id)}`, // REP-03 abre la tarjeta de ese reporte
    evento: 'reporte:actualizado',
    datos: { reporteId: id },
  }, deps);

  return { reporte: { id, numero: cfg.numero(fila), estadoReporte: ESTADOS_REPORTE.RECHAZADO_PROFESOR }, fechaRevision: ahora.toISOString() };
}

// ── Aprobar y firmar ─────────────────────────────────────────

// El archivo almacenado debe ser exactamente el que firmó la última revisión de ese revisor (y estado, si se indica): su hash
// quedó registrado al firmar. Alumno para la aprobación del profesor; profesor (aprobada) para la de Coordinación.
function exigirPdfVigente(cfg, fila, pdf, { tipoRevisor, estado = null, firmante }) {
  const firmas = fila[cfg.modeloRevision].filter((r) => r.tipo_revisor === tipoRevisor && (!estado || r.estado === estado));
  const vigente = firmas.reduce((a, b) => (a === null || b.fecha > a.fecha || (+b.fecha === +a.fecha && b.id > a.id) ? b : a), null);
  if (!vigente?.hash_documento || vigente.hash_documento !== sha256(pdf)) {
    console.error(`[reportes] El PDF almacenado del reporte ${fila.id} no coincide con la firma registrada de ${firmante}.`);
    throw crearError(`El archivo del reporte no coincide con el que firmó ${firmante}.`, 500, CODIGOS_ERROR.ARCHIVO_INCONSISTENTE);
  }
}

async function registrarAprobacion(tx, { cfg, id, profesor, usuarioId, fila, rutaAnterior, rutaNueva, hash, token, ip, ahora }) {
  await cambiarEstado(tx, {
    cfg, id, profesor, rutaArchivo: rutaAnterior,
    desde: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR, hacia: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR,
  });
  // El documento del reporte pasa a ser el PDF final (alumno + profesor).
  const { count } = await tx.documento.updateMany({
    where: { id: fila.documento_id, ruta_archivo: rutaAnterior },
    data: { ruta_archivo: rutaNueva },
  });
  if (count !== 1) throw yaNoPendiente();

  await tx[cfg.modeloRevision].create({
    data: {
      [cfg.fkRevision]: id,
      usuario_id: usuarioId,
      tipo_revisor: TIPO_REVISOR_PROFESOR,
      estado: ESTADO_REVISION_FIRMADA,
      comentario: null,
      hash_documento: hash,
      ruta_archivo: rutaNueva, // el PDF nuevo que el profesor acaba de firmar
      ip_firma: normalizarIp(ip),
      token_tsa: token,
      fecha: ahora,
    },
  });
}

// Todas las bandejas de Coordinación son compartidas: se avisa a cada coordinador (fail-open, nunca invalida la aprobación).
async function avisarACoordinacion(prisma, { cfg, fila, alumnoNombre, reporteId }, deps) {
  let coordinadores;
  try {
    coordinadores = await prisma.coordinador.findMany({ select: { usuario_id: true } });
  } catch (err) {
    console.error('[reportes] No se pudo listar a los coordinadores para avisarles:', err.message);
    return;
  }
  for (const { usuario_id: coordinadorId } of coordinadores) {
    await avisarUsuario(coordinadorId, {
      tipo: TIPOS_NOTIFICACION.PENDIENTE,
      mensaje: `${alumnoNombre}: el ${cfg.etiqueta(fila)} fue aprobado por su profesor y espera tu validación.`,
      rutaRelacionada: `/coordinacion/reportes?${cfg.consultaDestacar(reporteId)}`,
      evento: 'reporte:nuevo',
      datos: { reporteId },
    }, deps);
  }
}

/**
 * Aprueba y firma un reporte pendiente y lo envía a Coordinación. Requiere que el profesor ya tenga su rúbrica guardada.
 * deps (pruebas): { prisma, ahora, ip, rutaBaseRubricas, rutaBaseDocumentos, solicitarSelloTiempo, agregarRubrica,
 * crearNotificacion, emitirAUsuario }.
 * Regresa { reporte: { id, numero, estadoReporte }, fechaRevision }.
 */
async function aprobarReporte(usuarioId, tipoReporte, reporteId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const base = deps.rutaBaseDocumentos ?? RUTA_BASE_DOCUMENTOS;
  const agregarRubrica = deps.agregarRubrica ?? agregarRubricaProfesor;

  // 1) Validaciones: nada se firma, sella ni guarda si algo no está en orden.
  const { cfg, profesor, fila, id } = await cargarReporteRevisable(prisma, usuarioId, tipoReporte, reporteId);
  const rubrica = await obtenerRubricaGuardada(usuarioId, { prisma, rutaBase: deps.rutaBaseRubricas });
  if (!rubrica) {
    throw crearError('Registra tu firma antes de aprobar el reporte.', 409, CODIGOS_ERROR.RUBRICA_NO_REGISTRADA);
  }

  // 2) El PDF exacto del alumno + solo la rúbrica del profesor = UN Buffer nuevo. Todo lo demás se hace sobre él.
  const rutaAnterior = fila.documento?.ruta_archivo;
  const pdfAlumno = await leerPdfAlmacenado(rutaAnterior, base);
  exigirPdfVigente(cfg, fila, pdfAlumno, { tipoRevisor: TIPO_REVISOR_ALUMNO, firmante: 'el alumno' });
  const pdfFinal = Buffer.from(await agregarRubrica(pdfAlumno, rubrica));
  const hash = sha256(pdfFinal);

  // 3) Sello de tiempo de ese hash. Si falla, no hay nada que deshacer.
  const token = await pedirSello(hash, deps.solicitarSelloTiempo, MENSAJES_APROBACION);

  // 4) Ese mismo Buffer, cifrado y comprobado en disco.
  const alumno = alumnoDe(fila);
  const archivo = await guardarPdfCifrado(pdfFinal, alumno.boleta, hash, base);

  // 5) Registro atómico.
  const ahora = deps.ahora ?? new Date();
  try {
    await prisma.$transaction(
      (tx) => registrarAprobacion(tx, {
        cfg, id, profesor, usuarioId, fila, rutaAnterior, rutaNueva: archivo.rutaRelativa, hash, token, ip: deps.ip, ahora,
      }),
      OPCIONES_TRANSACCION,
    );
  } catch (err) {
    await descartarArchivo(prisma, archivo);
    throw err;
  }

  await avisarACoordinacion(prisma, {
    cfg, fila, alumnoNombre: nombreCompleto(alumno.usuario.nombre, alumno.usuario.apellidos), reporteId: id,
  }, deps);

  return {
    reporte: { id, numero: cfg.numero(fila), estadoReporte: ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR },
    fechaRevision: ahora.toISOString(),
  };
}

module.exports = {
  CODIGOS_ERROR, MAX_CARACTERES_COMENTARIO, rechazarReporte, aprobarReporte,
  // Piezas que reutiliza la validación de Coordinación (CU-REP-06).
  validarComentario, cambiarEstado, yaNoPendiente, exigirPdfVigente,
};
