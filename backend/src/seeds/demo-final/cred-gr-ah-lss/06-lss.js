// 06-lss.js
//
// Escenarios de LSS para la demo del 23 de noviembre de 2026. A diferencia
// de GR/AH, LSS es una TUBERÍA LINEAL (un alumno solo puede estar en un
// punto a la vez) — por eso aquí no se colapsan casos en menos alumnos:
// cada checkpoint que se quiere dejar listo para decidir EN VIVO necesita
// su propio alumno, ya congelado justo antes de esa decisión.
//
// Reutiliza Itzel (fuentes1501, ya con 480h + 7 reportes de 05-reportes-minimos.js)
// y construye 3 alumnos nuevos — cada uno recorre el MISMO camino base
// (GR -> 480h reales de AH -> reportes reales de REP) antes de poder
// siquiera llamar a CU-LSS-01, y luego avanza por la cadena REAL de LSS
// hasta su checkpoint:
//
//   Itzel   -> evaluacion_solicitada (CU-LSS-01 ya hecho)
//              EN VIVO: profesor evalúa y firma (LSS-03) -> coordinador dictamina (LSS-04)
//   Nuevo B -> evaluación ya aprobada, carta_termino "solicitada"
//              EN VIVO: coordinador la marca lista para recoger (LSS-06) -> alumno confirma recogida (LSS-05)
//   Nuevo C -> carta recogida, expediente enviado ("expediente_en_revision")
//              EN VIVO: coordinador dictamina el expediente (LSS-09)
//   Nuevo D -> expediente aprobado, "solicitud_constancia_termino"
//              EN VIVO: coordinador redacta el mensaje de constancia (LSS-11)
//
// Firmas: usa los PNG ya commiteados en firmas-referencia/ vía guardarRubrica
// real — el profesor de cada alumno nuevo y el propio alumno quedan con su
// rúbrica real guardada, sin ningún canvas en vivo. El sello de coordinación
// ya estaba sembrado de antes (ver video-tutorial), se reutiliza tal cual.

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
const { esDiaLaborable } = require('../../../modules/ah/ah.shared');

const { guardarRubrica } = require('../../../modules/reportes/reportes.rubricas');
const { enviarReporteMensual } = require('../../../modules/reportes/reportes-envio.service');
const { enviarReporteGlobal } = require('../../../modules/reportes/reportes-global.service');
const { aprobarReporte: aprobarComoProfesorRep } = require('../../../modules/reportes/reportes-revision.service');
const { aprobarReporte: aprobarComoCoordinadorRep } = require('../../../modules/reportes/reportes-validacion.service');
const { calcularPeriodoReporte, numeroPeriodoDeFecha, normalizarFechaISO } = require('../../../modules/reportes/reportes.periodos');

const lssAlumnoService = require('../../../modules/lss/lss-alumno.service');
const lssProfesorService = require('../../../modules/lss/lss-profesor.service');
const lssCoordinadorService = require('../../../modules/lss/lss-coordinador.service');

const PASSWORD = 'JAjaja1818#';
const CORREO_COORDINADOR = 'coordinadorherrera@ipn.mx';
const PERIODO_480H = 15; // mismo periodo ya usado por Itzel — fecha_inicio 2026-06-01

const RUTA_FIRMA_PROFESOR = path.join(__dirname, '../firmas-referencia/firma_profesor.png');
const RUTA_FIRMA_ALUMNO = path.join(__dirname, '../firmas-referencia/firma_alumno.png');

const VALORES_EVALUACION = {
  'Calidad del trabajo': 100,
  'Aplicación de conocimientos': 100,
  'Adquisición de conocimientos': 100,
  'Disciplina': 100,
  'Presentación personal': 100,
  'Iniciativa': 100,
  'Relaciones interpersonales': 100,
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

function utc(iso) { return new Date(`${iso}T00:00:00.000Z`); }

// ── GR hasta alumno_asignado (mismo patrón de 03-gr.js/04-ah.js) ──────────

async function crearYRegistrar(alumno, ofertaId, periodoId) {
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: alumno.correoInst } });
  if (existente) {
    const sol = await prisma.solicitud_registro.findFirst({ where: { alumno_id: alumno.boleta } });
    console.log(`↷ alumno ya existía: ${alumno.correoInst} (solicitud ${sol?.id}, estado ${sol?.estado_solicitud})`);
    return { usuarioId: existente.id, solicitudId: sol.id };
  }

  await grService.enviarSolicitudRegistro({
    correoInst: alumno.correoInst, nombres: alumno.nombres, apellidos: alumno.apellidos,
    telefono: alumno.telefono, boleta: alumno.boleta, correoPersonal: alumno.correoPersonal,
    carrera: alumno.carrera, creditos: alumno.creditos, semestre: alumno.semestre,
    tipoLiberacion: null, periodo: periodoId, oferta: ofertaId, motivacion: alumno.motivacion,
    password: PASSWORD, confirmarPassword: PASSWORD,
  });

  const usuario = await prisma.usuario.findUnique({ where: { correo_institucional: alumno.correoInst } });
  const solicitud = await prisma.solicitud_registro.findFirst({ where: { alumno_id: alumno.boleta } });
  console.log(`✅ alumno registrado: ${alumno.correoInst} (solicitud ${solicitud.id})`);
  return { usuarioId: usuario.id, solicitudId: solicitud.id };
}

// Igual que en 03-gr.js/04-ah.js: el periodo 15 ya tiene fecha_max_expediente
// en el pasado (necesario para tener meses de historial de AH/REP) —
// subirExpediente real re-revisa esa fecha antes de aceptar el envío.
async function subirExpedienteSinChequeoDeFecha(usuarioId, solicitudId) {
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

async function avanzarHastaAsignado(usuarioId, solicitudId, profesorUsuarioId, coordinadorUsuarioId) {
  const pdf = await pdfDummy();
  await grProfesorService.decidirSolicitud(solicitudId, 'aceptar', profesorUsuarioId);
  await grService.continuarARegistroSISS(usuarioId);
  await grService.confirmarRegistroSISS(usuarioId);
  await grService.adjuntarDocumentacionInicial(usuarioId, { cartaCreditos: { buffer: pdf }, seguroSocial: { buffer: pdf } });
  await grCoordinadorService.decidirDocumentacion(solicitudId, 'aceptar', null, coordinadorUsuarioId);
  await grService.continuarACartaCompromiso(usuarioId);
  await grService.confirmarCartaCompromiso(usuarioId);
  await grCoordinadorService.registrarRecepcionCarta(solicitudId, coordinadorUsuarioId);
  await grService.continuarAExpediente(usuarioId);
  await subirExpedienteSinChequeoDeFecha(usuarioId, solicitudId);
  await grCoordinadorService.decidirExpediente(solicitudId, 'aprobar', null, coordinadorUsuarioId);
}

// ── AH: 480h reales (mismo patrón de 04-ah.js::sembrarHoras480) ──────────

async function generarHoras480(solicitudId, boleta, tituloActividad) {
  const yaTiene = await prisma.actividad.count({ where: { solicitud_registro_id: solicitudId } });
  if (yaTiene > 0) {
    console.log(`↷ ${boleta} ya tenía actividades/horas sembradas.`);
    return;
  }

  const HORAS_OBJETIVO = 480;
  const HORAS_POR_DIA = 4;

  const actividad = await prisma.actividad.create({
    data: {
      solicitud_registro_id: solicitudId,
      titulo: tituloActividad,
      descripcion: `${tituloActividad}.`,
      entregable_esperado: 'Avance acumulado documentado y verificado.',
      fecha_limite: utc('2027-01-15'),
      estado: 'sin_comenzar',
      fecha_asignacion: utc('2026-06-01'),
    },
  });

  let horasAcumuladas = 0;
  let dia = utc('2026-06-01');

  while (horasAcumuladas < HORAS_OBJETIVO) {
    if (await esDiaLaborable(dia)) {
      const horas = Math.min(HORAS_POR_DIA, HORAS_OBJETIVO - horasAcumuladas);
      const esUltimo = horasAcumuladas + horas >= HORAS_OBJETIVO;
      const fechaISO = dia.toISOString().slice(0, 10);

      await prisma.$transaction(async (tx) => {
        const b = await tx.bitacora.create({
          data: {
            solicitud_registro_id: solicitudId,
            hora_inicio: new Date(`${fechaISO}T14:00:00.000Z`),
            hora_fin: new Date(`${fechaISO}T${String(14 + horas).padStart(2, '0')}:00:00.000Z`),
            horas_contabilizadas: horas,
            fecha_registro: dia,
            estado: 'aprobada',
            fecha_revision: dia,
          },
        });
        await tx.registro_bitacora_actividades.create({
          data: {
            bitacora_id: b.id, actividad_id: actividad.id,
            descripcion: 'Avance diario documentado.', evidencia: `https://drive.example.com/evidencia-${fechaISO}`,
            porcentaje_avance_registrado: esUltimo ? 100 : Math.min(99, Math.round(((horasAcumuladas + horas) / HORAS_OBJETIVO) * 100)),
          },
        });
        await tx.actividad.update({
          where: { id: actividad.id },
          data: esUltimo
            ? { porcentaje_progreso: 100, estado: 'completada_a_tiempo', fecha_completada: dia }
            : { porcentaje_progreso: Math.round(((horasAcumuladas + horas) / HORAS_OBJETIVO) * 100), estado: 'en_progreso' },
        });
      });
      horasAcumuladas += horas;
    }
    dia = new Date(dia.getTime() + 86400000);
  }

  await prisma.cumulo_horas_y_faltas.upsert({
    where: { alumno_id: boleta },
    update: { horas_acumuladas: horasAcumuladas, horas_rechazadas: 0, fecha_ultima_evaluacion_faltas: utc('2026-12-01') },
    create: { alumno_id: boleta, horas_acumuladas: horasAcumuladas, horas_rechazadas: 0, fecha_ultima_evaluacion_faltas: utc('2026-12-01') },
  });

  console.log(`✅ ${boleta}: ${horasAcumuladas}h netas sembradas.`);
}

// ── REP: reportes reales (mismo patrón de 05-reportes-minimos.js) ────────

async function sembrarRubricaSiFalta(usuarioId, rutaImagen) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (usuario.rubrica_imagen) return;
  try {
    const buffer = fs.readFileSync(rutaImagen);
    await guardarRubrica(usuarioId, { buffer }, { prisma, ip: '127.0.0.1', ahora: new Date() });
    console.log(`✅ rúbrica guardada para usuario ${usuarioId} (${path.basename(rutaImagen)}).`);
  } catch (err) {
    // Mismo caso que 05-reportes-minimos.js: el archivo físico ya existe
    // (corrida anterior, mismo volumen de uploads/), pero la BD se quedó en
    // null porque guardarRubrica abortó antes de escribirla — se sincroniza
    // aquí para que tieneRubrica/requiereSubirRubrica no bloqueen nada.
    if (err.code === 'RUBRICA_YA_REGISTRADA') {
      const esProfesor = usuario.rol === 'profesor';
      const clave = esProfesor ? usuario.correo_institucional : (await prisma.alumno.findUnique({ where: { usuario_id: usuarioId } })).boleta;
      const rutaRelativa = path.posix.join(clave, 'Rubrica', 'rubrica.enc');
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { rubrica_imagen: rutaRelativa, rubrica_ip: '127.0.0.1', rubrica_fecha_registro: new Date() },
      });
      console.log(`↷ usuario ${usuarioId} ya tenía un archivo de rúbrica físico de una corrida anterior — BD sincronizada con esa ruta.`);
      return;
    }
    throw err;
  }
}

async function generarReportesAprobados(ctx) {
  const yaTiene = await prisma.reporte_mensual.count({ where: { solicitud_registro_id: ctx.solicitudId } });
  if (yaTiene > 0) {
    console.log(`↷ solicitud ${ctx.solicitudId} ya tenía reportes sembrados.`);
    return;
  }

  await sembrarRubricaSiFalta(ctx.profesorUsuarioId, RUTA_FIRMA_PROFESOR);
  await sembrarRubricaSiFalta(ctx.alumnoUsuarioId, RUTA_FIRMA_ALUMNO);

  const ultimaBitacora = await prisma.bitacora.findFirst({ where: { solicitud_registro_id: ctx.solicitudId }, orderBy: { fecha_registro: 'desc' } });
  const ultimoNumeroConDatos = numeroPeriodoDeFecha({
    fechaInicio: ctx.fechaInicioPeriodo,
    fecha: normalizarFechaISO(ultimaBitacora.fecha_registro),
  });

  for (let numero = 1; numero <= ultimoNumeroConDatos; numero++) {
    const periodo = calcularPeriodoReporte({ fechaInicio: ctx.fechaInicioPeriodo, numero });
    const fechaSimulada = new Date(new Date(periodo.fin).getTime() + 40 * 86400000);

    const resultado = await enviarReporteMensual(ctx.alumnoUsuarioId, 'Avance documentado conforme a lo registrado en bitácora.', { ahora: fechaSimulada });
    await aprobarComoProfesorRep(ctx.profesorUsuarioId, 'mensual', resultado.reporte.id, { ahora: fechaSimulada });
    await aprobarComoCoordinadorRep(ctx.coordinadorUsuarioId, 'mensual', resultado.reporte.id, { ahora: fechaSimulada });
  }

  const resultadoGlobal = await enviarReporteGlobal(ctx.alumnoUsuarioId, 'Avance documentado conforme a lo registrado en bitácora.', { ahora: new Date() });
  await aprobarComoProfesorRep(ctx.profesorUsuarioId, 'global', resultadoGlobal.reporte.id, { ahora: new Date() });
  await aprobarComoCoordinadorRep(ctx.coordinadorUsuarioId, 'global', resultadoGlobal.reporte.id, { ahora: new Date() });

  console.log(`✅ ${ultimoNumeroConDatos} reportes mensuales + global, todos aprobados (solicitud ${ctx.solicitudId}).`);
}

// ── Construye un alumno hasta "cumple todos los requisitos de LSS" ──────

async function construirAlumnoBase(datosAlumno, ofertaId, profesorUsuarioId, coordinadorUsuarioId, tituloActividad) {
  const { usuarioId, solicitudId } = await crearYRegistrar(datosAlumno, ofertaId, PERIODO_480H);

  const sol = await prisma.solicitud_registro.findUnique({ where: { id: solicitudId } });
  if (sol.estado_solicitud === 'espera_respuesta_de_profesor') {
    await avanzarHastaAsignado(usuarioId, solicitudId, profesorUsuarioId, coordinadorUsuarioId);
  }

  await generarHoras480(solicitudId, datosAlumno.boleta, tituloActividad);

  const periodo = await prisma.periodo_registro.findUnique({ where: { id: PERIODO_480H }, include: { evento_calendario: true } });
  await generarReportesAprobados({
    alumnoUsuarioId: usuarioId, profesorUsuarioId, coordinadorUsuarioId, solicitudId,
    fechaInicioPeriodo: normalizarFechaISO(periodo.evento_calendario.fecha_inicio),
  });

  return { usuarioId, solicitudId };
}

// ── Pasos reales de LSS, uno por uno (mismos nombres que las funciones reales) ──

async function pasoIniciarEvaluacion(usuarioId) {
  const estado = await lssAlumnoService.obtenerEstadoRequisitos(usuarioId);
  if (estado.yaExiste) {
    console.log('↷ ya tenía liberacion_proceso iniciado.');
    return;
  }
  await lssAlumnoService.iniciarEvaluacion(usuarioId, true);
  console.log('✅ CU-LSS-01: evaluación solicitada.');
}

async function pasoProfesorEvaluaYCoordinadorAprueba(profesorUsuarioId, coordinadorUsuarioId, boleta) {
  await lssProfesorService.registrarEvaluacion(profesorUsuarioId, boleta, {
    observacionesProfesor: 'Buen desempeño general, cumple con las expectativas del proyecto.',
    reportesSissConfirmados: true,
    valores: VALORES_EVALUACION,
  }, '127.0.0.1');
  console.log('✅ CU-LSS-03: profesor evaluó y firmó.');

  const proceso = await prisma.liberacion_proceso.findFirst({
    where: { solicitud_registro: { alumno_id: boleta } },
    include: { evaluacion_desempeno: true },
  });
  await lssCoordinadorService.dictaminarAprobado(coordinadorUsuarioId, proceso.evaluacion_desempeno.id, '127.0.0.1');
  console.log('✅ CU-LSS-04: coordinación aprobó la evaluación.');
}

async function pasoAlumnoAvanzaHastaCarta(usuarioId) {
  await lssAlumnoService.marcarEvaluacionDescargada(usuarioId);
  await lssAlumnoService.confirmarSubidaSiss(usuarioId);
  await lssAlumnoService.solicitarCartaTermino(usuarioId);
  console.log('✅ CU-LSS-02: evaluación descargada/confirmada; carta de término solicitada.');
}

async function pasoCoordinadorCartaListaYAlumnoRecoge(coordinadorUsuarioId, usuarioId, boleta) {
  const proceso = await prisma.liberacion_proceso.findFirst({ where: { solicitud_registro: { alumno_id: boleta } } });
  await lssCoordinadorService.marcarCartaListaParaRecoger(coordinadorUsuarioId, proceso.id);
  console.log('✅ CU-LSS-06: carta marcada como lista para recoger.');
  await lssAlumnoService.confirmarRecogida(usuarioId);
  console.log('✅ CU-LSS-05: alumno confirmó la recogida de la carta.');
}

async function pasoAlumnoSubeExpediente(usuarioId) {
  const pdf = await pdfDummy();
  await lssAlumnoService.subirExpedienteLss(usuarioId, {
    cartaCompromiso: { buffer: pdf },
    cartaTermino: { buffer: pdf },
  });
  console.log('✅ CU-LSS-07: expediente de liberación enviado.');
}

async function pasoCoordinadorApruebaExpedienteYAlumnoPideConstancia(coordinadorUsuarioId, usuarioId, boleta) {
  const documento = await prisma.documento.findFirst({ where: { alumno_id: boleta, tipo_documento: 'expediente_lss' } });
  await lssCoordinadorService.dictaminarExpedienteAprobado(coordinadorUsuarioId, documento.id);
  console.log('✅ CU-LSS-09: expediente de liberación aprobado.');
  await lssAlumnoService.solicitarConstanciaTermino(usuarioId);
  console.log('✅ CU-LSS-08: constancia de término solicitada.');
}

// ── Datos de los 3 alumnos nuevos ─────────────────────────────────────────

const ALUMNO_B = {
  correoInst: 'rosado1601@alumno.ipn.mx', nombres: 'MARIANA', apellidos: 'ROSADO NAVA',
  telefono: '5578901601', boleta: '2020631601', correoPersonal: 'mariana.rosado.personal@gmail.com',
  carrera: 'ISC', creditos: '88.00', semestre: 9,
  motivacion: 'Me interesa apoyar en el rediseño de la plataforma de becas, un proyecto donde ya conozco el sistema como alumna.',
};

const ALUMNO_C = {
  correoInst: 'duarte1701@alumno.ipn.mx', nombres: 'FRANCISCO', apellidos: 'DUARTE LEON',
  telefono: '5589012701', boleta: '2019631701', correoPersonal: 'francisco.duarte.personal@gmail.com',
  carrera: 'LCD', creditos: '91.00', semestre: 9,
  motivacion: 'Quiero apoyar en la visualización de indicadores institucionales, aplicando lo que he visto en mis materias de análisis de datos.',
};

const ALUMNO_D = {
  correoInst: 'bravo1801@alumno.ipn.mx', nombres: 'CAROLINA', apellidos: 'BRAVO SANTOS',
  telefono: '5501235801', boleta: '2020631801', correoPersonal: 'carolina.bravo.personal@gmail.com',
  carrera: 'ISC', creditos: '84.00', semestre: 9,
  motivacion: 'Me gustaría apoyar en el monitoreo de los laboratorios, dando continuidad a un proyecto que ya conozco bien.',
};

async function main() {
  const ofertas = await ofertasSeed.main();
  const coordinador = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR } });

  // ── Itzel (reusada): CU-LSS-01 ya hecho, el resto se demuestra en vivo ──
  const itzel = await prisma.usuario.findUnique({ where: { correo_institucional: 'fuentes1501@alumno.ipn.mx' } });
  await pasoIniciarEvaluacion(itzel.id);

  // ── B: evaluación ya aprobada, carta de término "solicitada" ────────────
  const b = await construirAlumnoBase(ALUMNO_B, ofertas.P1.ofertaId, ofertas.P1.profesorUsuarioId, coordinador.id, 'Dar seguimiento al rediseño de la plataforma de becas');
  const procesoB = await prisma.liberacion_proceso.findFirst({ where: { solicitud_registro: { alumno_id: ALUMNO_B.boleta } } });
  if (!procesoB) {
    await pasoIniciarEvaluacion(b.usuarioId);
    await pasoProfesorEvaluaYCoordinadorAprueba(ofertas.P1.profesorUsuarioId, coordinador.id, ALUMNO_B.boleta);
    await pasoAlumnoAvanzaHastaCarta(b.usuarioId);
  } else {
    console.log('↷ B ya tenía su proceso de liberación avanzado.');
  }

  // ── C: carta recogida, expediente enviado ("expediente_en_revision") ───
  const c = await construirAlumnoBase(ALUMNO_C, ofertas.Q1.ofertaId, ofertas.Q1.profesorUsuarioId, coordinador.id, 'Dar seguimiento a la visualización de indicadores institucionales');
  const procesoC = await prisma.liberacion_proceso.findFirst({ where: { solicitud_registro: { alumno_id: ALUMNO_C.boleta } } });
  if (!procesoC) {
    await pasoIniciarEvaluacion(c.usuarioId);
    await pasoProfesorEvaluaYCoordinadorAprueba(ofertas.Q1.profesorUsuarioId, coordinador.id, ALUMNO_C.boleta);
    await pasoAlumnoAvanzaHastaCarta(c.usuarioId);
    await pasoCoordinadorCartaListaYAlumnoRecoge(coordinador.id, c.usuarioId, ALUMNO_C.boleta);
    await pasoAlumnoSubeExpediente(c.usuarioId);
  } else {
    console.log('↷ C ya tenía su proceso de liberación avanzado.');
  }

  // ── D: expediente aprobado, "solicitud_constancia_termino" ──────────────
  const d = await construirAlumnoBase(ALUMNO_D, ofertas.R1.ofertaId, ofertas.R1.profesorUsuarioId, coordinador.id, 'Dar seguimiento al monitoreo de laboratorios de cómputo');
  const procesoD = await prisma.liberacion_proceso.findFirst({ where: { solicitud_registro: { alumno_id: ALUMNO_D.boleta } } });
  if (!procesoD) {
    await pasoIniciarEvaluacion(d.usuarioId);
    await pasoProfesorEvaluaYCoordinadorAprueba(ofertas.R1.profesorUsuarioId, coordinador.id, ALUMNO_D.boleta);
    await pasoAlumnoAvanzaHastaCarta(d.usuarioId);
    await pasoCoordinadorCartaListaYAlumnoRecoge(coordinador.id, d.usuarioId, ALUMNO_D.boleta);
    await pasoAlumnoSubeExpediente(d.usuarioId);
    await pasoCoordinadorApruebaExpedienteYAlumnoPideConstancia(coordinador.id, d.usuarioId, ALUMNO_D.boleta);
  } else {
    console.log('↷ D ya tenía su proceso de liberación avanzado.');
  }

  console.log('✅ 06-lss.js terminado.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en cred-gr-ah-lss/06-lss.js:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, ALUMNO_B, ALUMNO_C, ALUMNO_D, PERIODO_480H };
