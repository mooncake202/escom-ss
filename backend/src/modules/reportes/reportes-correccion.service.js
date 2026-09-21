// CU-REP-04 (Alumno): corregir y reenviar un reporte (mensual o global) que el profesor o Coordinación rechazaron.
//
// Solo el alumno dueño y solo en rechazado_profesor / rechazado_coordinador. Únicamente las actividades cambian
// (actividades_mes o actividades_resumen): el número, el periodo, los días laborados y las horas reportadas son el snapshot del
// primer envío y NUNCA se recalculan (no se consultan bitácoras). El periodo no se guarda: se vuelve a derivar del periodo oficial del alumno, igual que en el resto
// de Reportes. Se exige un cambio real en las actividades.
//
// Cadena documental (un solo Buffer, como en el envío de CU-REP-01):
//   validar → generar el PDF con la MISMA plantilla y la rúbrica ya registrada del alumno → SHA-256 de ese Buffer
//   → sello de tiempo (TSA) de ese hash → cifrar ESE Buffer y comprobarlo en disco → transacción con UPDATE condicional:
//   estado → pendiente_revision_profesor (SIEMPRE: aunque haya rechazado Coordinación, vuelve a pasar por el profesor y
//   su firma anterior no se reutiliza), actividades_mes, documento apuntando al PDF nuevo y una revisión NUEVA del alumno.
//
// Historial append-only: no se borra ni se modifica ninguna revisión, hash, sello de tiempo, PDF ni rúbrica anteriores; los
// PDF viejos quedan en disco. "Invalidar firmas" es solo lógico: el reporte vuelve al inicio del flujo de revisión.
// Si falla la TSA o la persistencia no se avanza el estado; el archivo nuevo se borra (salvo que la BD lo haya registrado).

const {
  RUTA_BASE_DOCUMENTOS,
  TIPOS_NOTIFICACION,
  ESTADOS_REPORTE,
  ESTADOS_REPORTE_RECHAZADOS,
  TIPO_REVISOR_ALUMNO,
  ESTADO_REVISION_FIRMADA,
  MOTIVOS_BLOQUEO,
  MENSAJES_BLOQUEO,
} = require('./reportes.shared');
const { construirDatosPdf, generarPdfReporteMensual } = require('./reportes.pdf');
const { normalizarTexto } = require('./reportes.texto');
const { normalizarIp, obtenerRubricaAlumno } = require('./reportes.rubricas');
const { crearError, CODIGOS_ERROR: CODIGOS_PREPARACION } = require('./reportes-preparacion');
const { resolverAlumnoYSolicitud, datosDeImpresion } = require('./reportes-alumno.service');
const { cambiarEstado } = require('./reportes-revision.service');
const {
  OPCIONES_TRANSACCION, sha256, pedirSello, guardarPdfCifrado, descartarArchivo, avisarUsuario,
} = require('./reportes-envio.service');
const { errorNoEncontrado, validarIdentificador } = require('./reportes-profesor.service');
const { dePropiedadAlumno } = require('./reportes-seguimiento.service');

const CODIGOS_ERROR = Object.freeze({
  REPORTE_NO_CORREGIBLE: 'REPORTE_NO_CORREGIBLE',
  SIN_CAMBIOS_EN_ACTIVIDADES: 'SIN_CAMBIOS_EN_ACTIVIDADES',
  REPORTE_NO_GENERABLE: CODIGOS_PREPARACION.REPORTE_NO_GENERABLE,
  RUBRICA_NO_REGISTRADA: CODIGOS_PREPARACION.RUBRICA_NO_REGISTRADA,
});

const noCorregible = (estadoReporte) => crearError(
  'Este reporte ya no se puede corregir: solo se corrigen los rechazados por tu profesor o por coordinación.',
  409,
  CODIGOS_ERROR.REPORTE_NO_CORREGIBLE,
  { estadoReporte },
);

const sinCambios = () => crearError(
  'Modifica las actividades antes de reenviar el reporte.',
  422,
  CODIGOS_ERROR.SIN_CAMBIOS_EN_ACTIVIDADES,
);

const sinRubrica = () => crearError(
  'Registra tu rúbrica antes de continuar con el reporte.',
  409,
  CODIGOS_ERROR.RUBRICA_NO_REGISTRADA,
);

// Mismo criterio que validarActividades: sin distinguir saltos de línea ni líneas vacías. Un cambio de espacios o de
// formato sin cambiar el contenido no cuenta como corrección.
const normalizarActividades = (texto) => normalizarTexto(String(texto ?? '')).split('\n').filter((l) => l !== '').join('\n');

// ── Preparación (solo lectura) ───────────────────────────────

async function cargarReporteCorregible(prisma, usuarioId, tipoReporte, reporteId) {
  const { cfg, id } = validarIdentificador(tipoReporte, reporteId);

  const fila = await prisma[cfg.modelo].findFirst({
    where: { id, ...dePropiedadAlumno(usuarioId) },
    select: { id: true, ...cfg.camposPropios, estado_reporte: true, [cfg.columnaActividades]: true, documento_id: true, documento: { select: { ruta_archivo: true } } },
  });
  if (!fila) throw errorNoEncontrado();
  if (!ESTADOS_REPORTE_RECHAZADOS.includes(fila.estado_reporte)) throw noCorregible(fila.estado_reporte);
  // Foto de lo leído: el UPDATE condicional de la transacción compara contra el estado y el archivo de ESTE momento.
  return { cfg, fila: { ...fila, documento: fila.documento ? { ...fila.documento } : null }, id };
}

// Lo que el PDF necesita, con los datos actuales del alumno y el número/periodo del reporte (sin bitácoras).
function construirResultado({ alumno, solicitud }, cfg, fila) {
  const impresion = datosDeImpresion(alumno, solicitud);
  const { periodo } = cfg.periodo(solicitud, fila);

  const codigos = [...(periodo ? [] : [MOTIVOS_BLOQUEO.SIN_PERIODO_OFICIAL]), ...impresion.motivosDatos];
  const motivosBloqueo = codigos.map((codigo) => ({ codigo, mensaje: MENSAJES_BLOQUEO[codigo] }));
  return {
    alumno: impresion.alumno,
    profesor: impresion.profesor,
    servicio: { programa: impresion.programa },
    reporte: { tipo: cfg.tipo, numero: cfg.numero(fila), periodo },
    puedeGenerar: motivosBloqueo.length === 0,
    motivosBloqueo,
  };
}

/**
 * Valida todo y arma lo necesario para generar el PDF corregido: { cfg, fila, id, datos, rubricaAlumno, alumno, profesor }.
 * Repite todas las validaciones (el backend es la autoridad). Usa las mismas reglas para la vista previa y para el reenvío.
 */
async function prepararCorreccion(prisma, usuarioId, tipoReporte, reporteId, actividades, deps) {
  const { cfg, fila, id } = await cargarReporteCorregible(prisma, usuarioId, tipoReporte, reporteId);
  const contexto = await resolverAlumnoYSolicitud(prisma, usuarioId);

  const resultado = construirResultado(contexto, cfg, fila);
  if (!resultado.puedeGenerar) {
    throw crearError('El reporte todavía no se puede generar.', 409, CODIGOS_ERROR.REPORTE_NO_GENERABLE, { motivosBloqueo: resultado.motivosBloqueo });
  }
  const datos = construirDatosPdf(resultado, actividades);
  if (datos.actividades.texto === normalizarActividades(fila[cfg.columnaActividades])) throw sinCambios();

  const rubricaAlumno = await obtenerRubricaAlumno(usuarioId, { prisma, rutaBase: deps.rutaBaseRubricas });
  if (!rubricaAlumno) throw sinRubrica();

  return { cfg, fila, id, datos, rubricaAlumno, alumno: contexto.alumno, profesor: resultado.profesor };
}

/**
 * Vista previa del reporte corregido: mismo PDF que se enviaría, en memoria. No firma ni guarda nada, no calcula hash ni pide
 * TSA. deps (pruebas): { prisma, rutaBaseRubricas, generarPdf }. Regresa { pdf, numeroReporte }.
 */
async function generarVistaPreviaCorreccion(usuarioId, tipoReporte, reporteId, actividades, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const { datos, rubricaAlumno } = await prepararCorreccion(prisma, usuarioId, tipoReporte, reporteId, actividades, deps);
  const pdf = await (deps.generarPdf ?? generarPdfReporteMensual)(datos, { rubricaAlumno });
  return { pdf, numeroReporte: datos.numeroReporte };
}

// ── Transacción ──────────────────────────────────────────────

async function registrarReenvio(tx, { cfg, id, usuarioId, fila, rutaAnterior, rutaNueva, actividades, hash, token, ip, ahora }) {
  // Solo cambian el estado y las actividades; num_reporte, dias_laborados y horas_reportadas no se tocan.
  await cambiarEstado(tx, {
    cfg,
    id,
    donde: dePropiedadAlumno(usuarioId),
    desde: fila.estado_reporte,
    hacia: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR,
    rutaArchivo: rutaAnterior,
    cambios: { [cfg.columnaActividades]: actividades },
    alFallar: () => noCorregible(),
  });
  // El documento del reporte pasa a ser el PDF corregido; el anterior queda en disco.
  const { count } = await tx.documento.updateMany({
    where: { id: fila.documento_id, ruta_archivo: rutaAnterior },
    data: { ruta_archivo: rutaNueva },
  });
  if (count !== 1) throw noCorregible();

  // Revisión NUEVA del alumno (append-only): las firmas y sellos anteriores se conservan como historia.
  await tx[cfg.modeloRevision].create({
    data: {
      [cfg.fkRevision]: id,
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
}

/**
 * Corrige y reenvía el reporte rechazado. `actividades` es el texto que el alumno vio en la vista previa.
 * deps (pruebas): { prisma, ahora, ip, rutaBaseRubricas, rutaBaseDocumentos, solicitarSelloTiempo, generarPdf,
 * crearNotificacion, emitirAUsuario }.
 * Regresa { reporte: { id, numero, estadoReporte }, fechaEnvio }.
 */
async function reenviarReporteCorregido(usuarioId, tipoReporte, reporteId, actividades, deps = {}) {
  const prisma = deps.prisma ?? require('../../lib/prisma');
  const base = deps.rutaBaseDocumentos ?? RUTA_BASE_DOCUMENTOS;

  // 1) Validaciones completas: nada se genera, sella ni guarda si algo no está en orden.
  const { cfg, fila, id, datos, rubricaAlumno, alumno, profesor } = await prepararCorreccion(prisma, usuarioId, tipoReporte, reporteId, actividades, deps);

  // 2) UN solo PDF; de aquí en adelante todo se hace sobre este Buffer.
  const pdf = Buffer.from(await (deps.generarPdf ?? generarPdfReporteMensual)(datos, { rubricaAlumno }));
  const hash = sha256(pdf);

  // 3) Sello de tiempo de ese hash. Si falla, no hay nada que deshacer.
  const token = await pedirSello(hash, deps.solicitarSelloTiempo);

  // 4) Ese mismo Buffer, cifrado y comprobado en disco.
  const archivo = await guardarPdfCifrado(pdf, alumno.boleta, hash, base);

  // 5) Registro atómico.
  const ahora = deps.ahora ?? new Date();
  try {
    await prisma.$transaction(
      (tx) => registrarReenvio(tx, {
        cfg, id, usuarioId, fila, rutaAnterior: fila.documento?.ruta_archivo, rutaNueva: archivo.rutaRelativa,
        actividades: datos.actividades.texto, hash, token, ip: deps.ip, ahora,
      }),
      OPCIONES_TRANSACCION,
    );
  } catch (err) {
    await descartarArchivo(prisma, archivo);
    throw err;
  }

  // Aviso al profesor (fail-open): siempre vuelve a él, también si rechazó Coordinación.
  await avisarUsuario(profesor?.usuarioId, {
    tipo: TIPOS_NOTIFICACION.PENDIENTE,
    mensaje: `${datos.alumno.nombreCompleto} corrigió y reenvió el ${cfg.etiqueta(fila)} para tu revisión.`,
    rutaRelacionada: `/profesor/reportes?${cfg.consultaDestacar(id)}`,
    evento: 'reporte:nuevo',
    datos: { reporteId: id },
  }, deps);

  return {
    reporte: { id, numero: datos.numeroReporte, estadoReporte: ESTADOS_REPORTE.PENDIENTE_REVISION_PROFESOR },
    fechaEnvio: ahora.toISOString(),
  };
}

module.exports = { CODIGOS_ERROR, normalizarActividades, generarVistaPreviaCorreccion, reenviarReporteCorregido };
