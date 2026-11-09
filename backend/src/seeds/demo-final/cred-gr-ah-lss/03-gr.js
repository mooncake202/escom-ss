// 03-gr.js
//
// Siembra los escenarios de GR para la demo del 23 de noviembre de 2026,
// recorriendo la CADENA REAL de funciones del módulo (enviarSolicitudRegistro
// -> decidirSolicitud -> confirmarRegistroSISS -> adjuntarDocumentacionInicial
// -> decidirDocumentacion -> confirmarCartaCompromiso -> registrarRecepcionCarta
// -> subirExpediente -> decidirExpediente), nunca insertando filas sueltas que
// imiten un estado. Cada alumno se detiene exactamente en el paso que su
// escenario necesita. Ver demo-final/CUENTAS.md, sección GR, para el
// detalle de cada escenario y los pasos para reproducirlo en vivo.
//
// IMPORTANTE sobre fechas: todas las fechas usadas (periodos ya elegidos en
// 00-comun/03-calendario.js) ya están fijas en el pasado o en el futuro
// respecto al 23 de noviembre de 2026 — nada se calcula "relativo a hoy".
// Los 2 escenarios de vencimiento (C y D) se fuerzan AQUÍ MISMO llamando a
// la función real verificarYAplicarVencimiento, en vez de esperar al cron
// real (que corre a las 14:02/00:00 México) — así se comprueba que la
// lógica real funciona hoy mismo, y como las fechas ya pasaron, el
// resultado queda fijo para siempre (no se puede "des-vencer").

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { PDFDocument } = require('pdf-lib');
const { unirPdfs } = require('../../../lib/pdfExpediente');
const { cifrarBuffer, generarNombreSeguro } = require('../../../lib/fileEncryption');

const ofertasSeed = require('./02-ofertas-minimas');
const grService = require('../../../modules/gr/gr.service');
const grProfesorService = require('../../../modules/gr/gr-profesor.service');
const grCoordinadorService = require('../../../modules/gr/gr-coordinador.service');

const PASSWORD = 'JAjaja1818#';
const CORREO_COORDINADOR = 'coordinadorherrera@ipn.mx';

// Periodos oficiales de 00-comun/03-calendario.js (ver CUENTAS.md para el porqué de cada uno).
const PERIODO = {
  VIGENTE_LARGO: 25,  // fecha_inicio 2026-12-16, fecha_max_expediente 2026-12-01 — no vence antes del 23 nov
  FUTURO: 24,         // fecha_inicio 2026-12-01 — no ha iniciado el 23 nov
  VENCIDO_RELOJ1: 23, // fecha_max_expediente 2026-11-03 — ya vencido hoy
  VENCIDO_RELOJ2: 22, // fecha_inicio 2026-11-03 — ya inició hoy
  YA_INICIO: 21,       // fecha_inicio 2026-10-16 — ya inició, con semanas de margen para AH
};

let PDF_BASE = null;
async function pdfDummy() {
  if (!PDF_BASE) {
    const doc = await PDFDocument.create();
    doc.addPage();
    PDF_BASE = Buffer.from(await doc.save());
  }
  return PDF_BASE;
}

// ── Helpers que recorren la cadena real de gr.service.js ──────────────────

async function crearYRegistrar(alumno, ofertaId, periodoId) {
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: alumno.correoInst } });
  if (existente) {
    const sol = await prisma.solicitud_registro.findFirst({ where: { alumno_id: alumno.boleta } });
    console.log(`↷ alumno ya existía: ${alumno.correoInst} (solicitud ${sol?.id}, estado ${sol?.estado_solicitud})`);
    return { usuarioId: existente.id, solicitudId: sol.id };
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
  console.log(`✅ alumno registrado: ${alumno.correoInst} (solicitud ${solicitud.id})`);
  return { usuarioId: usuario.id, solicitudId: solicitud.id };
}

async function aceptar(solicitudId, profesorUsuarioId) {
  await grProfesorService.decidirSolicitud(solicitudId, 'aceptar', profesorUsuarioId);
}

async function pasarPorSISS(usuarioId) {
  await grService.continuarARegistroSISS(usuarioId);
  await grService.confirmarRegistroSISS(usuarioId);
}

async function enviarDocsIniciales(usuarioId) {
  const pdf = await pdfDummy();
  await grService.adjuntarDocumentacionInicial(usuarioId, {
    cartaCreditos: { buffer: pdf },
    seguroSocial: { buffer: pdf },
  });
}

async function aprobarDocsIniciales(solicitudId, coordinadorUsuarioId) {
  await grCoordinadorService.decidirDocumentacion(solicitudId, 'aceptar', null, coordinadorUsuarioId);
}

async function pasarPorCartaCompromiso(usuarioId, solicitudId, coordinadorUsuarioId) {
  await grService.continuarACartaCompromiso(usuarioId);
  await grService.confirmarCartaCompromiso(usuarioId);
  await grCoordinadorService.registrarRecepcionCarta(solicitudId, coordinadorUsuarioId);
}

async function enviarExpediente(usuarioId) {
  await grService.continuarAExpediente(usuarioId);
  const pdf = await pdfDummy();
  await grService.subirExpediente(usuarioId, {
    cartaCompromiso: { buffer: pdf },
    curp: { buffer: pdf },
    constanciaCreditos: { buffer: pdf },
  });
}

/**
 * SOLO para el escenario D: subirExpediente real (gr.service.js) vuelve a
 * llamar verificarYAplicarVencimiento ANTES de aceptar el envío (RF-GR-90)
 * — correcto para un alumno real, pero aquí es justo lo que nos impide
 * reconstruir la historia: para el 23 nov necesitamos un periodo cuya
 * fecha_inicio YA pasó (para que Reloj 2 lo venza), lo que SIEMPRE implica
 * que su fecha_max_expediente (~15 días antes) igual ya pasó — Reloj 1
 * vencería la solicitud antes de llegar siquiera a subir el expediente, cosa
 * que a un alumno real nunca le pasaría (él sí lo habría subido A TIEMPO,
 * cuando esa fecha todavía no pasaba). Replica exactamente la misma
 * escritura que hace subirExpediente (mismo archivo real cifrado, mismo
 * documento, mismo estado_solicitud) pero sin ese chequeo de fecha —
 * después SÍ se llama a verificarYAplicarVencimiento (Reloj 2) para que
 * la venza con el motivo real.
 */
async function enviarExpedienteSinChequeoDeFecha(usuarioId, solicitudId) {
  const alumno = await prisma.alumno.findUnique({ where: { usuario_id: usuarioId }, include: { usuario: true } });
  const pdf = await pdfDummy();
  const pdfUnido = await unirPdfs([pdf, pdf, pdf]);

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

async function aprobarExpediente(solicitudId, coordinadorUsuarioId) {
  await grCoordinadorService.decidirExpediente(solicitudId, 'aprobar', null, coordinadorUsuarioId);
}

// Cadena completa hasta "alumno_asignado".
async function avanzarHastaAsignado(usuarioId, solicitudId, profesorUsuarioId, coordinadorUsuarioId) {
  await aceptar(solicitudId, profesorUsuarioId);
  await pasarPorSISS(usuarioId);
  await enviarDocsIniciales(usuarioId);
  await aprobarDocsIniciales(solicitudId, coordinadorUsuarioId);
  await pasarPorCartaCompromiso(usuarioId, solicitudId, coordinadorUsuarioId);
  await enviarExpediente(usuarioId);
  await aprobarExpediente(solicitudId, coordinadorUsuarioId);
}

// Igual que avanzarHastaAsignado, pero para un periodo cuya fecha_max_expediente
// YA pasó hoy (necesario para "ya inició" en escenarios tipo F) — mismo
// motivo que enviarExpedienteSinChequeoDeFecha: un alumno real lo habría
// subido a tiempo, aquí solo reconstruimos esa historia.
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

// Cadena hasta justo antes del expediente: deja en SISS_y_documentacion_pendiente.
async function avanzarHastaDocsPendientes(usuarioId, solicitudId, profesorUsuarioId) {
  await aceptar(solicitudId, profesorUsuarioId);
  await pasarPorSISS(usuarioId);
  await enviarDocsIniciales(usuarioId);
}

// Cadena hasta justo antes de que coordinación decida el expediente: deja en expediente_pendiente_revision.
async function avanzarHastaExpedientePendiente(usuarioId, solicitudId, profesorUsuarioId, coordinadorUsuarioId) {
  await aceptar(solicitudId, profesorUsuarioId);
  await pasarPorSISS(usuarioId);
  await enviarDocsIniciales(usuarioId);
  await aprobarDocsIniciales(solicitudId, coordinadorUsuarioId);
  await pasarPorCartaCompromiso(usuarioId, solicitudId, coordinadorUsuarioId);
  await enviarExpediente(usuarioId);
}

// ── Datos de los 13 alumnos ────────────────────────────────────────────────

const ALUMNOS = {
  // B/5 — espera_respuesta_de_profesor, para que el profesor la rechace EN VIVO (rechazo por perfil).
  B: { correoInst: 'rosales0101@alumno.ipn.mx', nombres: 'DIEGO', apellidos: 'ROSALES PEÑA', telefono: '5523456701', boleta: '2020630101', correoPersonal: 'diego.rosales.personal@gmail.com', carrera: 'IA', creditos: '82.00', semestre: 7, motivacion: 'Me interesa aplicar lo que he aprendido de modelos de recomendación en un proyecto real de la escuela.' },

  // C — Reloj 1 (nunca llegó a enviar expediente, periodo ya vencido).
  C: { correoInst: 'camacho0201@alumno.ipn.mx', nombres: 'FERNANDA', apellidos: 'CAMACHO RUIZ', telefono: '5534567802', boleta: '2019630201', correoPersonal: 'fernanda.camacho.personal@gmail.com', carrera: 'ISC', creditos: '88.00', semestre: 8, motivacion: 'Quiero aportar en el seguimiento de prácticas profesionales ya que me gustaría dedicarme a la gestión de proyectos.' },

  // D — Reloj 2 (expediente enviado pero nunca aprobado, periodo ya inició).
  D: { correoInst: 'briones0301@alumno.ipn.mx', nombres: 'ANDRES', apellidos: 'BRIONES SALAS', telefono: '5545678903', boleta: '2020630301', correoPersonal: 'andres.briones.personal@gmail.com', carrera: 'LCD', creditos: '91.00', semestre: 9, motivacion: 'El análisis de datos de deserción escolar me parece una forma concreta de ayudar a la escuela con mis estudios.' },

  // E — alumno_asignado, periodo aún no inicia.
  E: { correoInst: 'quintero0401@alumno.ipn.mx', nombres: 'MONICA', apellidos: 'QUINTERO VEGA', telefono: '5556789004', boleta: '2021630401', correoPersonal: 'monica.quintero.personal@gmail.com', carrera: 'ISC', creditos: '95.00', semestre: 8, motivacion: 'Participar en la modernización del sistema de control escolar es justo la experiencia que busco para mi servicio.' },

  // F — alumno_asignado, ya inició, sin actividades (eso lo hace 04-ah.js).
  F: { correoInst: 'barrera0501@alumno.ipn.mx', nombres: 'SOFIA', apellidos: 'BARRERA LEON', telefono: '5567890105', boleta: '2019630501', correoPersonal: 'sofia.barrera.personal@gmail.com', carrera: 'ISC', creditos: '80.00', semestre: 8, motivacion: 'Me gustaría dar seguimiento al sistema de seguimiento académico que ya usamos como alumnos todos los días.' },

  // G1/G2 — cupos dinámicos: 2 en espera por el mismo cupo.
  G1: { correoInst: 'estrada0601@alumno.ipn.mx', nombres: 'RICARDO', apellidos: 'ESTRADA MORA', telefono: '5578901206', boleta: '2020630601', correoPersonal: 'ricardo.estrada.personal@gmail.com', carrera: 'ISC', creditos: '77.00', semestre: 7, motivacion: 'Participé en el club de robótica como alumno y me gustaría apoyar ahora desde el otro lado.' },
  G2: { correoInst: 'nava0701@alumno.ipn.mx', nombres: 'PAULINA', apellidos: 'NAVA CORTES', telefono: '5589012307', boleta: '2021630701', correoPersonal: 'paulina.nava.personal@gmail.com', carrera: 'ISC', creditos: '79.00', semestre: 7, motivacion: 'El club de robótica me parece una forma muy concreta de aplicar lo que he visto en mis materias.' },

  // H — SISS_y_documentacion_pendiente, para "corregir SISS" en vivo.
  H: { correoInst: 'guerrero0801@alumno.ipn.mx', nombres: 'LUIS', apellidos: 'GUERRERO PACHECO', telefono: '5590123408', boleta: '2019630801', correoPersonal: 'luis.guerrero.personal@gmail.com', carrera: 'ISC', creditos: '84.00', semestre: 8, motivacion: 'Me gustaría apoyar en la automatización de reportes de la biblioteca de la escuela.' },

  // I — SISS_y_documentacion_pendiente, para "corregir documentos" en vivo.
  I: { correoInst: 'maldonado0901@alumno.ipn.mx', nombres: 'DANIELA', apellidos: 'MALDONADO RIOS', telefono: '5501234509', boleta: '2020630901', correoPersonal: 'daniela.maldonado.personal@gmail.com', carrera: 'ISC', creditos: '86.00', semestre: 9, motivacion: 'El rediseño del catálogo de servicios estudiantiles me interesa porque lo usamos todos a diario.' },

  // J — SISS_y_documentacion_pendiente, para "rechazar definitivamente" a mano (sin cron).
  J: { correoInst: 'cervantes1001@alumno.ipn.mx', nombres: 'OSCAR', apellidos: 'CERVANTES DUARTE', telefono: '5512345610', boleta: '2021631001', correoPersonal: 'oscar.cervantes.personal@gmail.com', carrera: 'LCD', creditos: '90.00', semestre: 8, motivacion: 'Me gustaría trabajar en la visualización de indicadores institucionales para apoyar la toma de decisiones.' },

  // K — expediente_con_correcciones (vigente), para "corregir y reenviar" en vivo.
  K: { correoInst: 'ibarra1101@alumno.ipn.mx', nombres: 'VALERIA', apellidos: 'IBARRA SOTO', telefono: '5523456711', boleta: '2019631101', correoPersonal: 'valeria.ibarra.personal@gmail.com', carrera: 'ISC', creditos: '87.00', semestre: 8, motivacion: 'La integración de firma electrónica en trámites internos me parece un proyecto muy aplicable hoy en día.' },

  // L — expediente_pendiente_revision, para que coordinación decida en vivo.
  L: { correoInst: 'pacheco1201@alumno.ipn.mx', nombres: 'EMILIANO', apellidos: 'PACHECO VERA', telefono: '5534567812', boleta: '2020631201', correoPersonal: 'emiliano.pacheco.personal@gmail.com', carrera: 'ISC', creditos: '83.00', semestre: 9, motivacion: 'Quiero apoyar en el rediseño de la plataforma de becas porque yo mismo la he usado como alumno.' },

  // M — espera_confirmacion_carta_compromiso, para "registrar recepción" en vivo.
  M: { correoInst: 'olvera1301@alumno.ipn.mx', nombres: 'ALEJANDRA', apellidos: 'OLVERA FRANCO', telefono: '5545678913', boleta: '2021631301', correoPersonal: 'alejandra.olvera.personal@gmail.com', carrera: 'ISC', creditos: '85.00', semestre: 8, motivacion: 'Me gustaría apoyar en la difusión de actividades deportivas y culturales de la escuela.' },
};

async function main() {
  const ofertas = await ofertasSeed.main();
  const coordinador = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR } });
  const coordinadorUsuarioId = coordinador.id;

  // ── B/5 — espera_respuesta_de_profesor (sin tocar más) ──────────────────
  await crearYRegistrar(ALUMNOS.B, ofertas.B1.ofertaId, PERIODO.VIGENTE_LARGO);

  // ── C — Reloj 1: nunca envía expediente, forzamos el vencimiento ya ──────
  {
    const { solicitudId } = await crearYRegistrar(ALUMNOS.C, ofertas.C1.ofertaId, PERIODO.VENCIDO_RELOJ1);
    const resultado = await grService.verificarYAplicarVencimiento(solicitudId);
    console.log(`   -> C forzado a: ${resultado.estado_solicitud} (${resultado.motivo_rechazo})`);
  }

  // ── D — Reloj 2: expediente enviado pero nunca aprobado, periodo ya inició ─
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.D, ofertas.D1.ofertaId, PERIODO.VENCIDO_RELOJ2);
    await aceptar(solicitudId, ofertas.D1.profesorUsuarioId);
    await pasarPorSISS(usuarioId);
    await enviarDocsIniciales(usuarioId);
    await aprobarDocsIniciales(solicitudId, coordinadorUsuarioId);
    await pasarPorCartaCompromiso(usuarioId, solicitudId, coordinadorUsuarioId);
    await grService.continuarAExpediente(usuarioId);
    await enviarExpedienteSinChequeoDeFecha(usuarioId, solicitudId);
    const resultado = await grService.verificarYAplicarVencimiento(solicitudId);
    console.log(`   -> D forzado a: ${resultado.estado_solicitud} (${resultado.motivo_rechazo})`);
  }

  // ── E — alumno_asignado, periodo aún no inicia ───────────────────────────
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.E, ofertas.E1.ofertaId, PERIODO.FUTURO);
    await avanzarHastaAsignado(usuarioId, solicitudId, ofertas.E1.profesorUsuarioId, coordinadorUsuarioId);
  }

  // ── F — alumno_asignado, ya inició, sin actividades (para 04-ah.js) ─────
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.F, ofertas.F1.ofertaId, PERIODO.YA_INICIO);
    await avanzarHastaAsignadoHistorico(usuarioId, solicitudId, ofertas.F1.profesorUsuarioId, coordinadorUsuarioId);
  }

  // ── G1/G2 — 2 alumnos esperando el mismo cupo (sin tocar más) ────────────
  await crearYRegistrar(ALUMNOS.G1, ofertas.G1.ofertaId, PERIODO.VIGENTE_LARGO);
  await crearYRegistrar(ALUMNOS.G2, ofertas.G1.ofertaId, PERIODO.VIGENTE_LARGO);

  // ── H — SISS_y_documentacion_pendiente, para "corregir SISS" en vivo ────
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.H, ofertas.H1.ofertaId, PERIODO.VIGENTE_LARGO);
    await avanzarHastaDocsPendientes(usuarioId, solicitudId, ofertas.H1.profesorUsuarioId);
  }

  // ── I — SISS_y_documentacion_pendiente, para "corregir documentos" ──────
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.I, ofertas.I1.ofertaId, PERIODO.VIGENTE_LARGO);
    await avanzarHastaDocsPendientes(usuarioId, solicitudId, ofertas.I1.profesorUsuarioId);
  }

  // ── J — SISS_y_documentacion_pendiente, para "rechazar definitivamente" a mano ─
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.J, ofertas.J1.ofertaId, PERIODO.VIGENTE_LARGO);
    await avanzarHastaDocsPendientes(usuarioId, solicitudId, ofertas.J1.profesorUsuarioId);
  }

  // ── K — expediente_con_correcciones (vigente) ───────────────────────────
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.K, ofertas.K1.ofertaId, PERIODO.FUTURO);
    await avanzarHastaExpedientePendiente(usuarioId, solicitudId, ofertas.K1.profesorUsuarioId, coordinadorUsuarioId);
    const existente = await prisma.solicitud_registro.findUnique({ where: { id: solicitudId } });
    if (existente.estado_solicitud === 'expediente_pendiente_revision') {
      await grCoordinadorService.decidirExpediente(solicitudId, 'rechazar', 'Falta la firma del alumno en la carta compromiso escaneada.', coordinadorUsuarioId);
    }
  }

  // ── L — expediente_pendiente_revision, sin decidir (para coordinación en vivo) ─
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.L, ofertas.L1.ofertaId, PERIODO.FUTURO);
    await avanzarHastaExpedientePendiente(usuarioId, solicitudId, ofertas.L1.profesorUsuarioId, coordinadorUsuarioId);
  }

  // ── M — espera_confirmacion_carta_compromiso, sin decidir ───────────────
  {
    const { usuarioId, solicitudId } = await crearYRegistrar(ALUMNOS.M, ofertas.M1.ofertaId, PERIODO.VIGENTE_LARGO);
    await aceptar(solicitudId, ofertas.M1.profesorUsuarioId);
    await pasarPorSISS(usuarioId);
    await enviarDocsIniciales(usuarioId);
    await aprobarDocsIniciales(solicitudId, coordinadorUsuarioId);
    await grService.continuarACartaCompromiso(usuarioId);
    await grService.confirmarCartaCompromiso(usuarioId);
  }

  console.log('✅ 03-gr.js terminado.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en cred-gr-ah-lss/03-gr.js:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, ALUMNOS, PERIODO };
