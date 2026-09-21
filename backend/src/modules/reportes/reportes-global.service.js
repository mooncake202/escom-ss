// CU-REP-07 (Alumno): reporte GLOBAL de actividades. Mismo flujo seguro que el mensual (envío en reportes-envio.service.js);
// aquí solo está lo propio del global: cuándo se habilita, su periodo y cómo se registra.
//
// Reglas:
//  - Se habilita solo con >= 480 h de bitácoras aprobadas (suma de horas_contabilizadas). El backend lo valida al preparar, al
//    generar la vista previa y otra vez, bajo bloqueo, al enviar.
//  - Solo puede existir UN reporte global por solicitud (la tabla no tiene UNIQUE: se garantiza con el bloqueo de la solicitud).
//  - Periodo = fecha de inicio → fecha de fin del periodo de prestación elegido en el registro (no hasta la fecha de generación).
//  - El PDF usa la plantilla del mensual con el título "REPORTE GLOBAL DE ACTIVIDADES", ese periodo y el resumen de actividades.
//    Las horas acumuladas se muestran en la interfaz, NUNCA en el PDF.
//  - No guarda snapshot de días ni horas (su tabla no tiene esas columnas): esos datos solo existen al generarlo.

const { isDeepStrictEqual } = require('util');
const {
  ESTADOS_REPORTE,
  ESTADOS_REPORTE_RECHAZADOS,
  TIPO_REVISOR_ALUMNO,
  ESTADO_REVISION_FIRMADA,
  ESTADO_BITACORA_APROBADA,
  ESTADO_DOCUMENTO_VIGENTE,
  HORAS_MINIMAS_REPORTE_GLOBAL,
  MOTIVOS_BLOQUEO,
  MENSAJES_BLOQUEO,
  tituloReporteGlobal,
} = require('./reportes.shared');
const { GLOBAL, periodoGlobalDe } = require('./reportes.tipos');
const { construirDatosPdf, generarPdfReporteMensual } = require('./reportes.pdf');
const { normalizarIp } = require('./reportes.rubricas');
const { resolverAlumnoYSolicitud, datosDeImpresion } = require('./reportes-alumno.service');
const { crearError, prepararReporteParaPdf, CODIGOS_ERROR: CODIGOS_PREPARACION } = require('./reportes-preparacion');
const { CODIGOS_ERROR: CODIGOS_ENVIO, enviarReporte } = require('./reportes-envio.service');

const CODIGOS_ERROR = Object.freeze({ ...CODIGOS_ENVIO });

// ── Preparación (solo lectura) ───────────────────────────────

/** Horas de bitácoras aprobadas del alumno (suma de horas_contabilizadas, de todo el servicio). */
async function consultarHorasAprobadas(prisma, solicitudId) {
  const { _sum: suma } = await prisma.bitacora.aggregate({
    where: { solicitud_registro_id: solicitudId, estado: ESTADO_BITACORA_APROBADA },
    _sum: { horas_contabilizadas: true },
  });
  return Number(suma?.horas_contabilizadas ?? 0);
}

/**
 * Datos para generar el reporte global: horas acumuladas y si alcanzan, periodo completo, si ya existe uno, datos del PDF y si
 * falta la rúbrica. Solo lectura. deps (pruebas): { prisma, ahora }.
 */
async function prepararReporteGlobal(usuarioId, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const { alumno, solicitud } = await resolverAlumnoYSolicitud(prisma, usuarioId);

  const [acumuladas, existentes] = await Promise.all([
    consultarHorasAprobadas(prisma, solicitud.id),
    prisma.reporte_global.findMany({ where: { solicitud_registro_id: solicitud.id }, select: { id: true, estado_reporte: true } }),
  ]);
  const { periodo } = periodoGlobalDe(solicitud);
  const evento = solicitud.periodo_registro?.evento_calendario ?? null;
  const impresion = datosDeImpresion(alumno, solicitud);

  const existente = existentes[0] ?? null;
  const reporteExistente = existente
    ? { id: existente.id, estadoReporte: existente.estado_reporte, puedeModificar: ESTADOS_REPORTE_RECHAZADOS.includes(existente.estado_reporte) }
    : null;

  const codigos = [];
  if (!evento?.fecha_inicio) codigos.push(MOTIVOS_BLOQUEO.SIN_PERIODO_OFICIAL);
  else if (!evento.fecha_fin) codigos.push(MOTIVOS_BLOQUEO.FECHA_FIN_NO_DISPONIBLE);
  if (acumuladas < HORAS_MINIMAS_REPORTE_GLOBAL) codigos.push(MOTIVOS_BLOQUEO.HORAS_INSUFICIENTES);
  if (reporteExistente) codigos.push(MOTIVOS_BLOQUEO.REPORTE_GLOBAL_YA_EXISTE);
  codigos.push(...impresion.motivosDatos);
  const motivosBloqueo = codigos.map((codigo) => ({ codigo, mensaje: MENSAJES_BLOQUEO[codigo] }));

  return {
    alumno: impresion.alumno,
    profesor: impresion.profesor,
    servicio: {
      fechaInicio: periodo?.inicio ?? null,
      fechaFin: periodo?.fin ?? null,
      programa: impresion.programa,
    },
    firma: {
      tieneRubrica: Boolean(alumno.usuario.rubrica_imagen),
      requiereSubirRubrica: !alumno.usuario.rubrica_imagen,
    },
    reporte: { tipo: GLOBAL.tipo, titulo: tituloReporteGlobal(), periodo },
    // Se muestran en la interfaz; el PDF no las imprime.
    horas: { acumuladas, requeridas: HORAS_MINIMAS_REPORTE_GLOBAL, suficientes: acumuladas >= HORAS_MINIMAS_REPORTE_GLOBAL },
    reporteExistente,
    puedeGenerar: motivosBloqueo.length === 0,
    motivosBloqueo,
  };
}

/**
 * Vista previa del global: el PDF que se enviaría, en memoria. No firma ni guarda nada, no calcula hash ni pide TSA.
 * deps (pruebas): { prisma, ahora, rutaBase (carpeta de rúbricas) }. Regresa { pdf }.
 */
async function generarVistaPreviaReporteGlobal(usuarioId, actividades, deps = {}) {
  const { datos, rubricaAlumno } = await prepararReporteParaPdf(
    usuarioId, actividades, { prisma: deps.prisma, ahora: deps.ahora, rutaBaseRubricas: deps.rutaBase }, prepararReporteGlobal,
  );
  return { pdf: await generarPdfReporteMensual(datos, { rubricaAlumno }) };
}

// ── Registro atómico ─────────────────────────────────────────

async function registrarEnvioGlobal(tx, { usuarioId, solicitudId, datos, actividadesTexto, boleta, rutaRelativa, hash, token, ip, ahora }) {
  // 1) Bloqueo de la solicitud: serializa a cualquiera que cree reportes de este alumno.
  await tx.$queryRaw`SELECT id FROM solicitud_registro WHERE id = ${solicitudId} FOR UPDATE`;

  // 2) Solo un global por solicitud: con el bloqueo tomado, si ya hay uno otro envío se adelantó.
  const existentes = await tx.$queryRaw`SELECT id, estado_reporte FROM reporte_global WHERE solicitud_registro_id = ${solicitudId} FOR UPDATE`;
  if (existentes.length > 0) {
    throw crearError(
      'Ya existe un reporte global para tu servicio social. Tu envío no se registró.',
      409,
      CODIGOS_ERROR.REPORTE_YA_EXISTE,
      { reporteExistente: { estadoReporte: existentes[0].estado_reporte } },
    );
  }

  // 3) Con el bloqueo, se revalida todo (incluidas las 480 h) y se exige que los datos sigan siendo EXACTAMENTE los del PDF firmado.
  const actual = await prepararReporteGlobal(usuarioId, { prisma: tx, ahora });
  if (!actual.puedeGenerar) {
    throw crearError('El reporte global ya no se puede enviar.', 409, CODIGOS_PREPARACION.REPORTE_NO_GENERABLE, { motivosBloqueo: actual.motivosBloqueo });
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
      tipo_documento: GLOBAL.tipoDocumento,
      fecha_creacion: ahora,
      estado_documento: ESTADO_DOCUMENTO_VIGENTE,
      ruta_archivo: rutaRelativa,
    },
  });
  const reporte = await tx.reporte_global.create({
    data: {
      solicitud_registro_id: solicitudId,
      documento_id: documento.id,
      actividades_resumen: datos.actividades.texto,
      estado_reporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR,
    },
  });
  await tx.revision_reporte_global.create({
    data: {
      reporte_global_id: reporte.id,
      usuario_id: usuarioId,
      tipo_revisor: TIPO_REVISOR_ALUMNO,
      estado: ESTADO_REVISION_FIRMADA,
      comentario: null,
      hash_documento: hash,
      ip_firma: normalizarIp(ip),
      token_tsa: token,
      fecha: ahora,
    },
  });
  return { reporteId: reporte.id, documentoId: documento.id };
}

const ESTRATEGIA_GLOBAL = Object.freeze({
  cfg: GLOBAL,
  preparar: (usuarioId, actividades, deps) => prepararReporteParaPdf(usuarioId, actividades, deps, prepararReporteGlobal),
  registrar: registrarEnvioGlobal,
});

/**
 * Envía el reporte global del alumno: misma cadena que el mensual (rúbrica → UN Buffer → SHA-256 → TSA → AES → transacción con
 * bloqueo → revisión del alumno → pendiente_revision_profesor → aviso al profesor). `actividades` es el texto de la vista previa.
 * Regresa { reporte: { id, numero: null, estadoReporte }, fechaEnvio }.
 */
const enviarReporteGlobal = (usuarioId, actividades, deps = {}) => enviarReporte(usuarioId, actividades, deps, ESTRATEGIA_GLOBAL);

module.exports = {
  CODIGOS_ERROR, prepararReporteGlobal, generarVistaPreviaReporteGlobal, enviarReporteGlobal, consultarHorasAprobadas,
};
