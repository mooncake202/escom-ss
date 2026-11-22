// _helpers.js — amd-pro-rep (Sol: PRO, REP, ADM)
//
// COPIAS de los helpers de Karen (cred-gr-ah-lss/). NO se importan sus
// archivos: si ella los cambia, mi seed no se mueve. Cada bloque indica de qué
// archivo y líneas viene (según la rama integracion-todos-los-modulos al
// 21-nov-2026, commit 4bb4b00).
//
// Además: envoltorios de los servicios REALES de reportes con una sola fecha
// de referencia (REF) y la garantía de que ningún deps.ahora quede en el
// futuro, y la búsqueda de periodos oficiales por fecha_inicio.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { unirPdfs } = require('../../../lib/pdfExpediente');
const { cifrarBuffer, generarNombreSeguro } = require('../../../lib/fileEncryption');

const grService = require('../../../modules/gr/gr.service');
const grProfesorService = require('../../../modules/gr/gr-profesor.service');
const grCoordinadorService = require('../../../modules/gr/gr-coordinador.service');

const { crearUsuario } = require('../../../modules/usuarios/usuarios.service');
const { restablecerContrasena } = require('../../../modules/password/password.service');

const { guardarRubrica } = require('../../../modules/reportes/reportes.rubricas');
const { enviarReporteMensual } = require('../../../modules/reportes/reportes-envio.service');
const { enviarReporteGlobal } = require('../../../modules/reportes/reportes-global.service');
const revision = require('../../../modules/reportes/reportes-revision.service');
const validacion = require('../../../modules/reportes/reportes-validacion.service');

const { PASSWORD } = require('./_datos');

// ── Fecha de referencia única de la corrida ───────────────────────────────
// Se toma UNA vez al cargar el módulo. Todo lo que necesite "hoy" la lee de
// aquí, para que una corrida que cruce medianoche no mezcle dos días.
const REF = new Date();

const RUTA_FIRMAS = path.join(__dirname, '..', 'firmas-referencia');
const FIRMA_PROFESOR = path.join(RUTA_FIRMAS, 'firma_profesor.png');
const FIRMA_ALUMNO = path.join(RUTA_FIRMAS, 'firma_alumno.png');

// Periodos EXCLUSIVOS de Karen (cred-gr-ah-lss/03-gr.js:69 y :106):
// nunca se usan aquí.
const FECHAS_INICIO_EXCLUIDAS = ['2026-11-24', '2026-12-20'];

function utc(iso) {
  // Copia de cred-gr-ah-lss/04-ah.js:172-174
  return new Date(`${iso}T00:00:00.000Z`);
}

function isoDe(fecha) {
  return new Date(fecha).toISOString().slice(0, 10);
}

/** Lanza si `fecha` es posterior a REF: ningún deps.ahora puede quedar en el futuro. */
function ahoraSeguro(fecha) {
  const f = new Date(fecha);
  if (Number.isNaN(f.getTime())) throw new Error(`Fecha simulada inválida: ${fecha}`);
  if (f > REF) {
    throw new Error(`Fecha simulada en el futuro (${f.toISOString()} > REF ${REF.toISOString()}).`);
  }
  return f;
}

// ── Días hábiles (calendario institucional real, ah.shared.esDiaLaborable) ─

const { esDiaLaborable } = require('../../../modules/ah/ah.shared');

function sumarDiasISO(iso, dias) {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return isoDe(d);
}

async function esHabil(iso) {
  return esDiaLaborable(utc(iso));
}

/**
 * Día hábil a `n` días hábiles de `iso` (n > 0 hacia adelante, n < 0 hacia
 * atrás). n = 0 devuelve `iso` si es hábil, o el siguiente hábil si no.
 */
async function diaHabil(iso, n = 0) {
  let actual = iso;
  if (n === 0) {
    while (!(await esHabil(actual))) actual = sumarDiasISO(actual, 1);
    return actual;
  }
  const paso = n > 0 ? 1 : -1;
  let restantes = Math.abs(n);
  while (restantes > 0) {
    actual = sumarDiasISO(actual, paso);
    if (await esHabil(actual)) restantes -= 1;
  }
  return actual;
}

/** Fecha y hora fija en México (CST, UTC-6) para un día ISO: `hora` en formato HH:MM. */
function enHoraMexico(iso, hora) {
  return new Date(`${iso}T${hora}:00.000-06:00`);
}

// ── Periodos oficiales ────────────────────────────────────────────────────

/**
 * Busca uno de los 38 periodos OFICIALES de 00-comun por su fecha_inicio
 * (YYYY-MM-DD). Excluye los periodos exclusivos de Karen. Falla si no hay
 * exactamente uno.
 */
async function buscarPeriodoOficial(fechaInicioISO) {
  if (FECHAS_INICIO_EXCLUIDAS.includes(fechaInicioISO)) {
    throw new Error(`El periodo ${fechaInicioISO} es exclusivo de Karen; no se usa.`);
  }
  const eventos = await prisma.evento_calendario.findMany({
    where: { tipo: 'Periodo', fecha_inicio: utc(fechaInicioISO) },
    include: { periodo_registro: true },
  });
  const oficiales = eventos.filter((e) => e.periodo_registro && !/exclusivo/i.test(e.nombre));
  if (oficiales.length !== 1) {
    throw new Error(`Se esperaba 1 periodo oficial con inicio ${fechaInicioISO} y hay ${oficiales.length}.`);
  }
  const e = oficiales[0];
  return {
    periodoId: e.periodo_registro.id,
    inicio: isoDe(e.fecha_inicio),
    fin: e.fecha_fin ? isoDe(e.fecha_fin) : null,
    maxExpediente: isoDe(e.periodo_registro.fecha_max_expediente),
  };
}

// ── Usuarios base ─────────────────────────────────────────────────────────

async function buscarUsuarioPorCorreo(correo) {
  return prisma.usuario.findUnique({ where: { correo_institucional: correo } });
}

async function obtenerTokenVigente(usuarioId) {
  // Copia de cred-gr-ah-lss/01-cred.js:79-84
  return prisma.token_contrasena.findFirst({
    where: { usuario_id: usuarioId, usado: false },
    orderBy: { id: 'desc' },
  });
}

/**
 * Patrón de cred-gr-ah-lss/01-cred.js:86-114 (sembrarProfesor): crearUsuario
 * real (CU-CRED-03) + restablecerContrasena real (CU-CRED-02) para fijar la
 * contraseña del seed. Idempotente por correo.
 * @returns {{ usuarioId: number, creado: boolean }}
 */
async function crearProfesor(datos, creadoPorId) {
  const existente = await buscarUsuarioPorCorreo(datos.correo);
  if (existente) {
    console.log(`  ↷ profesor ya existía: ${datos.correo}`);
    return { usuarioId: existente.id, creado: false };
  }

  const resultado = await crearUsuario({
    nombre: datos.nombre,
    apellidos: datos.apellidos,
    correo_institucional: datos.correo,
    rol: 'profesor',
    departamento: datos.departamento,
    telefono_personal: datos.telefono,
    horario_atencion: datos.horario,
    cubiculo: datos.cubiculo,
    caracteristicas: datos.caracteristica ? [datos.caracteristica] : [],
  }, creadoPorId);

  const tokenRow = await obtenerTokenVigente(resultado.usuario.id);
  await restablecerContrasena(tokenRow.token, PASSWORD);

  console.log(`  ✅ profesor creado: ${datos.correo} (${datos.caracteristica ?? 'base'})`);
  return { usuarioId: resultado.usuario.id, creado: true };
}

// ── GR: copias de cred-gr-ah-lss/03-gr.js ─────────────────────────────────

// Copia de 03-gr.js:138-144
async function marcarBienvenidaLeida(usuarioId) {
  await prisma.notificacion.updateMany({
    where: { usuario_id: usuarioId, ruta_relacionada: 'MODAL_BIENVENIDA_ALUMNO_ASIGNADO', leida: false },
    data: { leida: true, fecha_leida: new Date() },
  });
}

// ── PDFs de ejemplo legibles (sustituyen al pdfDummy de 03-gr.js:145-154) ─
// pdfDummy creaba una página en blanco: en ADM-13 los documentos abrían vacíos.
// Aquí cada documento de MIS alumnos es un PDF sencillo de 1 página con texto:
// tipo de documento, nombre, boleta, carrera y la leyenda de ejemplo. Formato
// limpio, sin logos ni nada que imite un documento oficial. Cumple lo que valida
// la subida real: empieza con %PDF- (gr.service.js:26-28), pdf-lib lo puede
// abrir y unir (pdfExpediente.js) y pesa ~2 KB (límites de 1 a 5 MB).

const LEYENDA_EJEMPLO = 'Documento de ejemplo para la demostración del prototipo';
const TITULOS_PDF = {
  carta_creditos: 'Carta de créditos',
  constancia_seguro_social: 'Constancia de vigencia del seguro social',
  carta_compromiso: 'Carta compromiso',
  curp: 'CURP',
  constancia_creditos: 'Constancia de créditos',
  expediente_baja: 'Expediente de solicitud de baja',
  carta_compromiso_firmada: 'Carta compromiso firmada',
};
const NOMBRES_CARRERA = {
  ISC: 'Ingeniería en Sistemas Computacionales',
  IA: 'Ingeniería en Inteligencia Artificial',
  LCD: 'Licenciatura en Ciencia de Datos',
};

async function datosAlumnoParaPdf(usuarioId) {
  const alumno = await prisma.alumno.findUnique({ where: { usuario_id: usuarioId }, include: { usuario: true } });
  if (!alumno) throw new Error(`No existe el alumno con usuario ${usuarioId}.`);
  return {
    nombre: `${alumno.usuario.nombre} ${alumno.usuario.apellidos}`,
    boleta: alumno.boleta,
    carrera: NOMBRES_CARRERA[alumno.carrera] ?? alumno.carrera,
  };
}

/** PDF de 1 página con texto legible para el documento `tipo` del alumno `usuarioId`. */
async function pdfEjemplo(tipo, usuarioId) {
  const titulo = TITULOS_PDF[tipo];
  if (!titulo) throw new Error(`Tipo de documento de ejemplo desconocido: ${tipo}`);
  const a = await datosAlumnoParaPdf(usuarioId);

  const doc = await PDFDocument.create();
  doc.setTitle(`${titulo} — ${a.boleta} (ejemplo)`);
  doc.setSubject(LEYENDA_EJEMPLO);
  doc.setProducer('Seed de demostración amd-pro-rep');
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const cursiva = await doc.embedFont(StandardFonts.HelveticaOblique);
  const gris = rgb(0.35, 0.35, 0.35);
  const page = doc.addPage([612, 792]);

  page.drawRectangle({ x: 48, y: 48, width: 516, height: 696, borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 1 });
  page.drawText(titulo, { x: 72, y: 690, size: 20, font: negrita });
  page.drawText(LEYENDA_EJEMPLO, { x: 72, y: 664, size: 11, font: cursiva, color: gris });
  page.drawLine({ start: { x: 72, y: 648 }, end: { x: 540, y: 648 }, thickness: 0.8, color: rgb(0.75, 0.75, 0.75) });

  const filas = [['Documento', titulo], ['Alumno', a.nombre], ['Boleta', a.boleta], ['Carrera', a.carrera]];
  let y = 612;
  for (const [etiqueta, valor] of filas) {
    page.drawText(`${etiqueta}:`, { x: 72, y, size: 12, font: negrita });
    page.drawText(valor, { x: 160, y, size: 12, font: normal });
    y -= 26;
  }
  page.drawText('Este archivo no tiene validez oficial: solo ilustra el flujo del sistema durante la demostración.',
    { x: 72, y: y - 14, size: 10, font: normal, color: gris });
  page.drawText('Sistema de Servicio Social · prototipo', { x: 72, y: 64, size: 9, font: normal, color: gris });

  return Buffer.from(await doc.save());
}

// Copia de 03-gr.js:157-187
async function crearYRegistrar(alumno, ofertaId, periodoId) {
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: alumno.correoInst } });
  if (existente) {
    const sol = await prisma.solicitud_registro.findFirst({ where: { alumno_id: alumno.boleta } });
    console.log(`  ↷ alumno ya existía: ${alumno.correoInst} (solicitud ${sol?.id}, estado ${sol?.estado_solicitud})`);
    return { usuarioId: existente.id, solicitudId: sol?.id ?? null, creado: false };
  }

  await grService.enviarSolicitudRegistro({
    correoInst: alumno.correoInst,
    nombres: alumno.nombres,
    apellidos: alumno.apellidos,
    telefono: alumno.telefono,
    boleta: alumno.boleta,
    correoPersonal: alumno.correoPersonal,
    carrera: alumno.carrera,
    creditos: alumno.creditos,
    semestre: alumno.semestre,
    tipoLiberacion: null,
    periodo: periodoId,
    oferta: ofertaId,
    motivacion: alumno.motivacion,
    password: PASSWORD,
    confirmarPassword: PASSWORD,
  });

  const usuario = await prisma.usuario.findUnique({ where: { correo_institucional: alumno.correoInst } });
  const solicitud = await prisma.solicitud_registro.findFirst({ where: { alumno_id: alumno.boleta } });
  console.log(`  ✅ alumno registrado: ${alumno.correoInst} (solicitud ${solicitud.id})`);
  return { usuarioId: usuario.id, solicitudId: solicitud.id, creado: true };
}

// Copia de 03-gr.js:189-191
async function aceptar(solicitudId, profesorUsuarioId) {
  await grProfesorService.decidirSolicitud(solicitudId, 'aceptar', profesorUsuarioId);
}

// Copia de 03-gr.js:193-196
async function pasarPorSISS(usuarioId) {
  await grService.continuarARegistroSISS(usuarioId);
  await grService.confirmarRegistroSISS(usuarioId);
}

// Copia de 03-gr.js:198-204
async function enviarDocsIniciales(usuarioId) {
  await grService.adjuntarDocumentacionInicial(usuarioId, {
    cartaCreditos: { buffer: await pdfEjemplo('carta_creditos', usuarioId) },
    seguroSocial: { buffer: await pdfEjemplo('constancia_seguro_social', usuarioId) },
  });
}

// Copia de 03-gr.js:206-208
async function aprobarDocsIniciales(solicitudId, coordinadorUsuarioId) {
  await grCoordinadorService.decidirDocumentacion(solicitudId, 'aceptar', null, coordinadorUsuarioId);
}

// Copia de 03-gr.js:210-214
async function pasarPorCartaCompromiso(usuarioId, solicitudId, coordinadorUsuarioId) {
  await grService.continuarACartaCompromiso(usuarioId);
  await grService.confirmarCartaCompromiso(usuarioId);
  await grCoordinadorService.registrarRecepcionCarta(solicitudId, coordinadorUsuarioId);
}

// Copia de 03-gr.js:216-224
async function enviarExpediente(usuarioId) {
  await grService.continuarAExpediente(usuarioId);
  await grService.subirExpediente(usuarioId, {
    cartaCompromiso: { buffer: await pdfEjemplo('carta_compromiso', usuarioId) },
    curp: { buffer: await pdfEjemplo('curp', usuarioId) },
    constanciaCreditos: { buffer: await pdfEjemplo('constancia_creditos', usuarioId) },
  });
}

// Copia de 03-gr.js:241-264. Replica la escritura de subirExpediente sin el
// chequeo de fecha_max_expediente, para reconstruir historia de periodos que
// ya iniciaron (el alumno real lo habría subido a tiempo).
async function enviarExpedienteSinChequeoDeFecha(usuarioId, solicitudId) {
  const alumno = await prisma.alumno.findUnique({ where: { usuario_id: usuarioId }, include: { usuario: true } });
  // Mismo orden que subirExpediente: carta compromiso, CURP, constancia de créditos.
  const pdfUnido = await unirPdfs([
    await pdfEjemplo('carta_compromiso', usuarioId),
    await pdfEjemplo('curp', usuarioId),
    await pdfEjemplo('constancia_creditos', usuarioId),
  ]);

  const [apellidoPaterno, apellidoMaterno = ''] = alumno.usuario.apellidos.trim().split(/\s+/);
  const nombreLimpio = alumno.usuario.nombre.trim().replace(/\s+/g, '_');
  const nombreExpediente = `${apellidoPaterno}_${apellidoMaterno}_${nombreLimpio}_${alumno.boleta}.pdf`;

  const carpetaAlumno = path.join(grService.RUTA_BASE_DOCUMENTOS, alumno.boleta);
  fs.mkdirSync(carpetaAlumno, { recursive: true });
  const rutaRelativa = path.join(alumno.boleta, generarNombreSeguro());
  fs.writeFileSync(path.join(grService.RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(pdfUnido));

  await prisma.$transaction(async (tx) => {
    await tx.documento.create({
      data: { alumno_id: alumno.boleta, creador_id: usuarioId, tipo_documento: 'expediente', fecha_creacion: new Date(), estado_documento: 'en_revision', ruta_archivo: rutaRelativa, nombre_expediente: nombreExpediente },
    });
    await tx.solicitud_registro.update({
      where: { id: solicitudId },
      data: { estado_solicitud: 'expediente_pendiente_revision', estado_anterior: 'adjuntar_expediente', expediente: true },
    });
  });
}

// Copia de 03-gr.js:266-269
async function aprobarExpediente(solicitudId, coordinadorUsuarioId) {
  await grCoordinadorService.decidirExpediente(solicitudId, 'aprobar', null, coordinadorUsuarioId);
}

// Copia de 03-gr.js:271-280
async function avanzarHastaAsignado(usuarioId, solicitudId, profesorUsuarioId, coordinadorUsuarioId) {
  await aceptar(solicitudId, profesorUsuarioId);
  await pasarPorSISS(usuarioId);
  await enviarDocsIniciales(usuarioId);
  await aprobarDocsIniciales(solicitudId, coordinadorUsuarioId);
  await pasarPorCartaCompromiso(usuarioId, solicitudId, coordinadorUsuarioId);
  await enviarExpediente(usuarioId);
  await aprobarExpediente(solicitudId, coordinadorUsuarioId);
}

// Copia de 03-gr.js:285-295 (periodo cuya fecha_max_expediente ya pasó)
async function avanzarHastaAsignadoHistorico(usuarioId, solicitudId, profesorUsuarioId, coordinadorUsuarioId) {
  await aceptar(solicitudId, profesorUsuarioId);
  await pasarPorSISS(usuarioId);
  await enviarDocsIniciales(usuarioId);
  await aprobarDocsIniciales(solicitudId, coordinadorUsuarioId);
  await pasarPorCartaCompromiso(usuarioId, solicitudId, coordinadorUsuarioId);
  await grService.continuarAExpediente(usuarioId);
  await enviarExpedienteSinChequeoDeFecha(usuarioId, solicitudId);
  await aprobarExpediente(solicitudId, coordinadorUsuarioId);
}

// ── AH: bitácora histórica ────────────────────────────────────────────────

/**
 * Variante de cred-gr-ah-lss/04-ah.js:181-249 (crearBitacoraHistorica).
 * Igual que la de Karen (replica confirmarBitacora: bitácora + registro de
 * actividades + avance de la actividad + horas_acumuladas), con un parámetro
 * extra:
 *   aprobada = true → estado 'aprobada' con fecha_revision = fecha 23:00 UTC
 *   aprobada = false → 'pendiente_revision' (igual que la de Karen)
 */
async function crearBitacoraHistorica({ solicitudId, boleta, actividadId, fechaISO, horas, porcentajeAvance, descripcion, evidencia, aprobada = false }) {
  const fecha = utc(fechaISO);
  ahoraSeguro(fecha);
  const horaInicio = new Date(`${fechaISO}T14:00:00.000Z`);
  const horaFin = new Date(horaInicio.getTime() + horas * 3600 * 1000);
  const fechaRevision = aprobada ? new Date(`${fechaISO}T23:00:00.000Z`) : null;
  if (fechaRevision) ahoraSeguro(fechaRevision);

  return prisma.$transaction(async (tx) => {
    const b = await tx.bitacora.create({
      data: {
        solicitud_registro_id: solicitudId,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        horas_contabilizadas: horas,
        fecha_registro: fecha,
        estado: aprobada ? 'aprobada' : 'pendiente_revision',
        ...(fechaRevision ? { fecha_revision: fechaRevision } : {}),
      },
    });

    await tx.registro_bitacora_actividades.create({
      data: {
        bitacora_id: b.id,
        actividad_id: actividadId,
        descripcion,
        evidencia,
        porcentaje_avance_registrado: porcentajeAvance,
      },
    });

    const actividad = await tx.actividad.findUnique({ where: { id: actividadId } });
    const tarde = actividad.estado === 'vencida' || fecha > new Date(actividad.fecha_limite);
    const nuevoEstado = porcentajeAvance >= 100
      ? (tarde ? 'completada_tarde' : 'completada_a_tiempo')
      : (actividad.estado === 'vencida' ? 'vencida' : 'en_progreso');

    await tx.actividad.update({
      where: { id: actividadId },
      data: {
        porcentaje_progreso: porcentajeAvance,
        estado: nuevoEstado,
        fecha_completada: porcentajeAvance >= 100 ? fecha : null,
      },
    });

    // fecha_ultima_evaluacion_faltas = 2026-12-01: el cron de faltas no
    // cuenta nada antes de la demo (mismo criterio que 04-ah.js / 06-lss.js).
    await tx.cumulo_horas_y_faltas.upsert({
      where: { alumno_id: boleta },
      update: { horas_acumuladas: { increment: horas } },
      create: { alumno_id: boleta, horas_acumuladas: horas, fecha_ultima_evaluacion_faltas: utc('2026-12-01') },
    });

    return b;
  });
}

// ── REP: rúbricas y reportes con servicios reales ─────────────────────────

/**
 * Copia de cred-gr-ah-lss/05-reportes-minimos.js:68-105. guardarRubrica real;
 * si el archivo ya existe en disco (RUBRICA_YA_REGISTRADA), sincroniza la BD
 * con esa ruta en vez de sobrescribir. Con _limpieza.js esto no debería pasar
 * con mis usuarios, pero se conserva como red de seguridad.
 */
async function sembrarRubricaSiFalta(usuarioId, rutaImagen, ahora = new Date()) {
  ahoraSeguro(ahora);
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (usuario.rubrica_imagen) {
    console.log(`  ↷ usuario ${usuarioId} ya tenía rúbrica guardada.`);
    return;
  }
  try {
    const buffer = fs.readFileSync(rutaImagen);
    await guardarRubrica(usuarioId, { buffer }, { prisma, ip: '127.0.0.1', ahora });
    console.log(`  ✅ rúbrica guardada para usuario ${usuarioId} (${path.basename(rutaImagen)}).`);
  } catch (err) {
    if (err.code === 'RUBRICA_YA_REGISTRADA') {
      const esProfesor = usuario.rol === 'profesor';
      const clave = esProfesor ? usuario.correo_institucional : (await prisma.alumno.findUnique({ where: { usuario_id: usuarioId } })).boleta;
      const rutaRelativa = path.posix.join(clave, 'Rubrica', 'rubrica.enc');
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { rubrica_imagen: rutaRelativa, rubrica_ip: '127.0.0.1', rubrica_fecha_registro: ahora },
      });
      console.log(`  ↷ usuario ${usuarioId}: rúbrica física previa, BD sincronizada.`);
      return;
    }
    throw err;
  }
}

// Envoltorios: mismos servicios que 05-reportes-minimos.js:107-157, pero
// TODA fecha simulada pasa por ahoraSeguro().

async function enviarMensual(alumnoUsuarioId, textoActividades, fecha) {
  const r = await enviarReporteMensual(alumnoUsuarioId, textoActividades, { ahora: ahoraSeguro(fecha) });
  return r.reporte;
}

async function enviarGlobal(alumnoUsuarioId, textoActividades, fecha) {
  const r = await enviarReporteGlobal(alumnoUsuarioId, textoActividades, { ahora: ahoraSeguro(fecha) });
  return r.reporte;
}

async function profesorAprueba(profesorUsuarioId, tipo, reporteId, fecha) {
  return revision.aprobarReporte(profesorUsuarioId, tipo, reporteId, { ahora: ahoraSeguro(fecha) });
}

async function profesorRechaza(profesorUsuarioId, tipo, reporteId, comentario, fecha) {
  return revision.rechazarReporte(profesorUsuarioId, tipo, reporteId, comentario, { ahora: ahoraSeguro(fecha) });
}

async function coordinacionAprueba(coordinadorUsuarioId, tipo, reporteId, fecha) {
  return validacion.aprobarReporte(coordinadorUsuarioId, tipo, reporteId, { ahora: ahoraSeguro(fecha) });
}

async function coordinacionRechaza(coordinadorUsuarioId, tipo, reporteId, comentario, fecha) {
  return validacion.rechazarReporte(coordinadorUsuarioId, tipo, reporteId, comentario, { ahora: ahoraSeguro(fecha) });
}

module.exports = {
  REF,
  FIRMA_PROFESOR,
  FIRMA_ALUMNO,
  utc,
  isoDe,
  sumarDiasISO,
  esHabil,
  diaHabil,
  enHoraMexico,
  ahoraSeguro,
  buscarPeriodoOficial,
  buscarUsuarioPorCorreo,
  crearProfesor,
  marcarBienvenidaLeida,
  pdfEjemplo,
  crearYRegistrar,
  aceptar,
  pasarPorSISS,
  enviarDocsIniciales,
  aprobarDocsIniciales,
  pasarPorCartaCompromiso,
  enviarExpediente,
  enviarExpedienteSinChequeoDeFecha,
  aprobarExpediente,
  avanzarHastaAsignado,
  avanzarHastaAsignadoHistorico,
  crearBitacoraHistorica,
  sembrarRubricaSiFalta,
  enviarMensual,
  enviarGlobal,
  profesorAprueba,
  profesorRechaza,
  coordinacionAprueba,
  coordinacionRechaza,
};
