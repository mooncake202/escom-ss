// CU-REP-01 fase 6: envío definitivo del reporte mensual.
//
// Cadena documental (un solo Buffer de principio a fin):
//   validar → generar el PDF UNA vez → SHA-256 de ese Buffer → sello de tiempo (TSA) de ese hash
//   → cifrar ESE Buffer y guardarlo → comprobar que lo guardado descifra al mismo hash → transacción con bloqueo:
//   documento + reporte_mensual (pendiente_revision_profesor) + revisión/firma del alumno.
//
// Todo o nada: si falla la TSA no se toca disco ni BD; si falla algo después de escribir el archivo se borra
// (salvo que la BD confirme que el documento sí quedó registrado). Nunca queda un reporte avanzado a medias.
//
// Concurrencia: `reporte_mensual` no tiene UNIQUE por (solicitud, número). Toda la creación se serializa con
// SELECT ... FOR UPDATE sobre la fila de la solicitud; ya con el bloqueo se vuelve a leer y validar TODO
// (número, bloqueos y los mismos datos impresos). Quien más adelante cree o reemplace reportes debe tomar el mismo bloqueo.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { isDeepStrictEqual } = require('util');
const { cifrarBuffer, descifrarBuffer, generarNombreSeguro } = require('../../lib/fileEncryption');
const { prepararReporteMensual } = require('./reportes-alumno.service');
const { construirDatosPdf, generarPdfReporteMensual } = require('./reportes.pdf');
const { normalizarIp } = require('./reportes.rubricas');
const { crearError, prepararReporteParaPdf, CODIGOS_ERROR: CODIGOS_PREPARACION } = require('./reportes-preparacion');
const { MENSUAL } = require('./reportes.tipos');
const {
  RUTA_BASE_DOCUMENTOS,
  TIPOS_NOTIFICACION,
  ESTADOS_REPORTE,
  TIPO_DOCUMENTO_REPORTE_MENSUAL,
  ESTADO_DOCUMENTO_VIGENTE,
  TIPO_REVISOR_ALUMNO,
  ESTADO_REVISION_FIRMADA,
} = require('./reportes.shared');

const OPCIONES_TRANSACCION = Object.freeze({ maxWait: 10000, timeout: 20000 });

const CODIGOS_ERROR = Object.freeze({
  ...CODIGOS_PREPARACION,
  REPORTE_YA_EXISTE: 'REPORTE_YA_EXISTE',
  DATOS_DEL_REPORTE_CAMBIARON: 'DATOS_DEL_REPORTE_CAMBIARON',
  SELLO_TIEMPO_NO_DISPONIBLE: 'SELLO_TIEMPO_NO_DISPONIBLE',
  ARCHIVO_INCONSISTENTE: 'ARCHIVO_INCONSISTENTE',
});

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const errorInterno = (mensaje, code) => crearError(mensaje, 500, code);

// ── Sello de tiempo ──────────────────────────────────────────

const MENSAJES_ENVIO = Object.freeze({
  interno: 'No se pudo enviar el reporte.',
  sello: 'No se pudo obtener el sello de tiempo. Tu reporte no fue enviado; inténtalo de nuevo en unos minutos.',
});

// Un fallo de la TSA (o una respuesta inservible) cancela la operación completa, sin dejar nada, y se puede reintentar.
// También la usa la aprobación del profesor (CU-REP-05), con sus propios mensajes.
async function pedirSello(hash, solicitarSello, mensajes = MENSAJES_ENVIO) {
  const solicitar = solicitarSello ?? require('../../lib/timestampTsa').solicitarSelloTiempo;
  const errorSelloNoDisponible = () => crearError(mensajes.sello, 503, CODIGOS_ERROR.SELLO_TIEMPO_NO_DISPONIBLE, { reintentable: true });
  let sello;
  try {
    sello = await solicitar(hash);
  } catch (err) {
    console.error(`[reportes] La TSA no entregó el sello (${err.codigo ?? err.name}): ${err.message}`);
    if (err.codigo === 'HASH_INVALIDO') throw errorInterno(mensajes.interno, CODIGOS_ERROR.SELLO_TIEMPO_NO_DISPONIBLE);
    throw errorSelloNoDisponible();
  }
  if (!sello || typeof sello.token !== 'string' || sello.token.length === 0) {
    console.error('[reportes] La TSA respondió sin token utilizable.');
    throw errorSelloNoDisponible();
  }
  return sello.token;
}

// ── Archivo cifrado ──────────────────────────────────────────

const borrarSilencioso = (ruta) => fs.promises.rm(ruta, { force: true }).catch(() => {});

async function guardarPdfCifrado(pdf, boleta, hash, rutaBase) {
  if (!/^[A-Za-z0-9]{1,10}$/.test(boleta)) throw errorInterno('No se pudo enviar el reporte.', CODIGOS_ERROR.ARCHIVO_INCONSISTENTE);
  const rutaRelativa = path.posix.join(boleta, 'Reportes', generarNombreSeguro('pdf'));
  const rutaAbsoluta = path.join(rutaBase, rutaRelativa);

  await fs.promises.mkdir(path.dirname(rutaAbsoluta), { recursive: true, mode: 0o700 });
  try {
    await fs.promises.writeFile(rutaAbsoluta, cifrarBuffer(pdf), { flag: 'wx', mode: 0o600 });
    // Lo que quedó en disco debe descifrar exactamente al PDF cuyo hash y sello se obtuvieron.
    const guardado = descifrarBuffer(await fs.promises.readFile(rutaAbsoluta));
    if (sha256(guardado) !== hash) {
      throw errorInterno('El archivo guardado no coincide con el PDF firmado.', CODIGOS_ERROR.ARCHIVO_INCONSISTENTE);
    }
  } catch (err) {
    await borrarSilencioso(rutaAbsoluta);
    throw err;
  }
  return { rutaRelativa, rutaAbsoluta };
}

// Tras un fallo de la transacción: borra el archivo salvo que la BD tenga registrado el documento (commit dudoso).
async function descartarArchivo(prisma, { rutaRelativa, rutaAbsoluta }) {
  try {
    const registrado = await prisma.documento.findFirst({ where: { ruta_archivo: rutaRelativa }, select: { id: true } });
    if (registrado) return;
  } catch (err) {
    console.error('[reportes] No se pudo confirmar si el documento quedó registrado; se conserva el archivo:', err.message);
    return;
  }
  await borrarSilencioso(rutaAbsoluta);
}

// ── Transacción ──────────────────────────────────────────────

async function registrarEnvio(tx, { usuarioId, solicitudId, numero, datos, actividadesTexto, boleta, rutaRelativa, hash, token, ip, ahora }) {
  // 1) Bloqueo de la solicitud: serializa a cualquiera que cree reportes de este alumno.
  await tx.$queryRaw`SELECT id FROM solicitud_registro WHERE id = ${solicitudId} FOR UPDATE`;

  // 2) Lectura bloqueante (siempre la más reciente): si ya existe este número o uno posterior, otro envío se adelantó.
  const filas = await tx.$queryRaw`SELECT id, num_reporte, estado_reporte FROM reporte_mensual WHERE solicitud_registro_id = ${solicitudId} FOR UPDATE`;
  const existente = filas.find((f) => Number(f.num_reporte) >= numero);
  if (existente) {
    throw crearError(
      'Ya existe un reporte para este periodo. Tu envío no se registró.',
      409,
      CODIGOS_ERROR.REPORTE_YA_EXISTE,
      { reporteExistente: { numero: Number(existente.num_reporte), estadoReporte: existente.estado_reporte } },
    );
  }

  // 3) Con el bloqueo, se revalida todo y se exige que los datos sigan siendo EXACTAMENTE los del PDF firmado.
  const actual = await prepararReporteMensual(usuarioId, { prisma: tx, ahora });
  if (!actual.puedeGenerar) {
    throw crearError('El reporte ya no se puede enviar.', 409, CODIGOS_ERROR.REPORTE_NO_GENERABLE, { motivosBloqueo: actual.motivosBloqueo });
  }
  if (!isDeepStrictEqual(construirDatosPdf(actual, actividadesTexto), datos)) {
    throw crearError(
      'Los datos de tu reporte cambiaron mientras se enviaba. Tu reporte no fue enviado; revisa la vista previa e inténtalo de nuevo.',
      409,
      CODIGOS_ERROR.DATOS_DEL_REPORTE_CAMBIARON,
    );
  }

  // 4) Registros definitivos.
  const documento = await tx.documento.create({
    data: {
      alumno_id: boleta,
      creador_id: usuarioId,
      tipo_documento: TIPO_DOCUMENTO_REPORTE_MENSUAL,
      fecha_creacion: ahora,
      estado_documento: ESTADO_DOCUMENTO_VIGENTE,
      ruta_archivo: rutaRelativa,
    },
  });
  const reporte = await tx.reporte_mensual.create({
    data: {
      solicitud_registro_id: solicitudId,
      documento_id: documento.id,
      num_reporte: numero,
      actividades_mes: datos.actividades.texto,
      // Snapshot del PRIMER envío, calculado por AH bajo el bloqueo (mismas bitácoras que validó `actual`). No se
      // recalcula nunca; CU-REP-04 debe conservarlo al corregir y reenviar.
      dias_laborados: actual.resumen.diasLaborados,
      horas_reportadas: actual.resumen.horas,
      estado_reporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR,
    },
  });
  await tx.revision_reporte_mensual.create({
    data: {
      reporte_mensual_id: reporte.id,
      usuario_id: usuarioId,
      tipo_revisor: TIPO_REVISOR_ALUMNO,
      estado: ESTADO_REVISION_FIRMADA,
      comentario: null,
      hash_documento: hash,
      ruta_archivo: rutaRelativa, // el PDF que el alumno acaba de generar y firmar
      ip_firma: normalizarIp(ip),
      token_tsa: token,
      fecha: ahora,
    },
  });
  return { reporteId: reporte.id, documentoId: documento.id };
}

// ── Aviso al profesor ────────────────────────────────────────

// Mismo patrón que Ofertas: crearNotificacion (persiste, con ruta destacando el registro) + emitirAUsuario (socket).
// Fail-open: un fallo aquí (incluida la carga de esos módulos) se registra pero nunca invalida una operación ya confirmada.
// Lo usan el envío del alumno y las revisiones del profesor (CU-REP-05).
async function avisarUsuario(usuarioId, { tipo, mensaje, rutaRelacionada, evento, datos }, deps = {}) {
  if (!usuarioId) return;
  try {
    const crear = deps.crearNotificacion ?? require('../notificaciones/notificaciones.service').crearNotificacion;
    await crear({ usuarioId, tipo, mensaje, rutaRelacionada });
  } catch (err) {
    console.error(`[reportes] No se pudo crear la notificación (${evento}):`, err.message);
  }
  try {
    const emitir = deps.emitirAUsuario ?? require('../../sockets/socket.server').emitirAUsuario;
    emitir(usuarioId, evento, datos);
  } catch (err) {
    console.error(`[reportes] No se pudo emitir ${evento}:`, err.message);
  }
}

const notificarEnvioAlProfesor = ({ cfg, profesorUsuarioId, alumnoNombre, numero, reporteId }, deps) => avisarUsuario(profesorUsuarioId, {
  tipo: TIPOS_NOTIFICACION.PENDIENTE,
  mensaje: `${alumnoNombre} envió el ${cfg.etiqueta({ num_reporte: numero })} para tu revisión.`,
  rutaRelacionada: `/profesor/reportes?${cfg.consultaDestacar(reporteId)}`,
  evento: 'reporte:nuevo',
  datos: { reporteId },
}, deps);

// ── Envío ────────────────────────────────────────────────────

/**
 * Orquesta el envío de un reporte (mensual o global): la cadena documental es la MISMA y solo cambian la preparación de datos
 * (`estrategia.preparar`) y el registro en la BD (`estrategia.registrar`).
 * deps (pruebas): { prisma, ahora, ip, rutaBaseRubricas, rutaBaseDocumentos, solicitarSelloTiempo, generarPdf,
 * crearNotificacion, emitirAUsuario }.
 * Regresa { reporte: { id, numero, estadoReporte }, fechaEnvio }.
 */
async function enviarReporte(usuarioId, actividades, deps, estrategia) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const reloj = () => deps.ahora ?? new Date();
  const generarPdf = deps.generarPdf ?? generarPdfReporteMensual;
  const rutaBaseDocumentos = deps.rutaBaseDocumentos ?? RUTA_BASE_DOCUMENTOS;

  // 1) Validaciones completas: nada se genera, firma ni guarda si algo no está en orden.
  const { resultado, datos, rubricaAlumno } = await estrategia.preparar(usuarioId, actividades, {
    prisma, ahora: reloj(), rutaBaseRubricas: deps.rutaBaseRubricas,
  });
  const alumno = await prisma.alumno.findUnique({
    where: { usuario_id: usuarioId },
    select: { boleta: true, solicitud_registro: { select: { id: true } } },
  });
  const boleta = alumno?.boleta;
  const solicitudId = alumno?.solicitud_registro?.id;
  if (!boleta || !solicitudId) throw crearError('No se encontró tu solicitud de servicio social.', 404);

  // 2) UN solo PDF; de aquí en adelante todo se hace sobre este Buffer.
  const pdf = Buffer.from(await generarPdf(datos, { rubricaAlumno }));
  const hash = sha256(pdf);

  // 3) Sello de tiempo de ese hash. Si falla, no hay nada que deshacer.
  const token = await pedirSello(hash, deps.solicitarSelloTiempo);

  // 4) Ese mismo Buffer, cifrado y comprobado en disco.
  const archivo = await guardarPdfCifrado(pdf, boleta, hash, rutaBaseDocumentos);

  // 5) Registro atómico.
  const ahora = reloj();
  let ids;
  try {
    ids = await prisma.$transaction(
      (tx) => estrategia.registrar(tx, {
        usuarioId, solicitudId, numero: datos.numeroReporte, datos, actividadesTexto: actividades, boleta,
        rutaRelativa: archivo.rutaRelativa, hash, token, ip: deps.ip, ahora,
      }),
      OPCIONES_TRANSACCION,
    );
  } catch (err) {
    await descartarArchivo(prisma, archivo);
    throw err;
  }

  await notificarEnvioAlProfesor({
    cfg: estrategia.cfg,
    profesorUsuarioId: resultado.profesor?.usuarioId,
    alumnoNombre: datos.alumno.nombreCompleto,
    numero: datos.numeroReporte,
    reporteId: ids.reporteId,
  }, deps);

  return {
    reporte: { id: ids.reporteId, numero: datos.numeroReporte, estadoReporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR },
    fechaEnvio: ahora.toISOString(),
  };
}

const ESTRATEGIA_MENSUAL = Object.freeze({ cfg: MENSUAL, preparar: prepararReporteParaPdf, registrar: registrarEnvio });

/** Envía el reporte mensual del alumno. `actividades` es el texto que el alumno vio en la vista previa. */
const enviarReporteMensual = (usuarioId, actividades, deps = {}) => enviarReporte(usuarioId, actividades, deps, ESTRATEGIA_MENSUAL);

module.exports = {
  RUTA_BASE_DOCUMENTOS, CODIGOS_ERROR, enviarReporteMensual,
  // Piezas de la cadena documental que reutiliza la aprobación del profesor.
  sha256, pedirSello, guardarPdfCifrado, descartarArchivo, avisarUsuario, OPCIONES_TRANSACCION,
  // La orquestación común del envío (mensual y global).
  enviarReporte,
};
