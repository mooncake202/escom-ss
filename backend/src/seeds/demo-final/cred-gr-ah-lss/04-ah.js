// 04-ah.js
//
// Siembra los escenarios de AH para la demo del 23 de noviembre de 2026.
// Reutiliza la cadena real de GR (igual que 03-gr.js) para llevar a cada
// alumno nuevo hasta "alumno_asignado", y a partir de ahí usa las
// funciones REALES del módulo AH para las decisiones (aprobarBitacora,
// rechazarBitacora, aprobarBitacoraRechazadaDesdeHistorial, editarActividad,
// extenderFechaLimiteActividad) — solo la ENTRADA de bitácoras/actividades
// con fecha ya pasada se escribe directo por Prisma, replicando exactamente
// lo que confirmarBitacora/crearActividad habrían dejado, porque esas
// funciones reales están atadas al reloj de HOY (RF-AH-02/RN-AH-03) y no
// pueden usarse para reconstruir historia. Mismo criterio ya usado en
// video-tutorial/ah/01-actividades-variadas.js.
//
// Escenarios (ver demo-final/CUENTAS.md para el detalle con actores y pasos):
// 1-2. Sofía (barrera0501, ya alumno_asignado por 03-gr.js) — actividades
//      variadas + 1 sin asignar todavía, para grabar AH-01→04 en vivo.
// 3.   Mónica (quintero0401) — sin actividades, sin tocar (ya existe).
// 4/5/9/10. Alumno nuevo "historia variada" — bitácora rechazada que se
//      queda así, otra rechazada y luego reaprobada desde historial,
//      otra pendiente de revisión hace +5 días hábiles, una actividad
//      editada y otra con fecha límite extendida, y un tramo de faltas
//      (18 acumuladas, con las últimas 6 consecutivas).
// 8.   Alumno nuevo "480 horas" — ya completó su servicio, no puede
//      iniciar jornada nueva (RN-AH-17, el seguro que ya está puesto).
//
// IMPORTANTE sobre el seguro de servicioNoIniciado: todas las fechas de
// bitácora/actividad usadas aquí caen DESPUÉS de la fecha_inicio del
// periodo de cada alumno — nunca se viola la regla que acabamos de poner.

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
const ahProfesorService = require('../../../modules/ah/ah-profesor.service');
const { esDiaLaborable, calcularDiaMexicoUTC } = require('../../../modules/ah/ah.shared');

const PASSWORD = 'JAjaja1818#';
const CORREO_COORDINADOR = 'coordinadorherrera@ipn.mx';

// Periodos oficiales de 00-comun/03-calendario.js, ya usados por 03-gr.js
// para los que siguen vigentes; estos 2 son nuevos para AH.
const PERIODO = {
  HISTORIA_VARIADA: 20, // fecha_inicio 2026-10-01 — suficiente historial para faltas/bitácoras variadas
  // id 15 (fecha_inicio 2026-06-01) se cambió por id 13 (2026-05-04): con
  // 120 días hábiles reales (vacaciones de verano + festivos incluidos) el
  // inicio de junio terminaba generando bitácoras hasta el 10 de diciembre
  // de 2026 — DESPUÉS del 23 de noviembre, lo que en la demo mostraría a
  // Itzel con "ya registraste tu bitácora de hoy" en vez de "ya completaste
  // tus 480 horas". Verificado con el código real (`esDiaLaborable`): desde
  // el 4 de mayo, el día 120 cae el 12 de noviembre — 11 días de margen.
  HORAS_480: 13,         // fecha_inicio 2026-05-04
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

// ── Mismo pipeline de GR que 03-gr.js, autocontenido aquí (no se exporta allá) ──

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

/**
 * Igual que en 03-gr.js: estos periodos ya tienen `fecha_max_expediente` en
 * el pasado (necesario para tener semanas/meses de historial de AH) —
 * subirExpediente real re-revisa esa fecha (RF-GR-90) antes de aceptar el
 * envío, lo que impediría llegar a alumno_asignado. Replica exactamente la
 * misma escritura que subirExpediente, sin ese chequeo puntual — un alumno
 * real lo habría subido a tiempo, aquí solo reconstruimos esa historia.
 */
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
  await grService.adjuntarDocumentacionInicial(usuarioId, {
    cartaCreditos: { buffer: pdf },
    seguroSocial: { buffer: pdf },
  });
  await grCoordinadorService.decidirDocumentacion(solicitudId, 'aceptar', null, coordinadorUsuarioId);
  await grService.continuarACartaCompromiso(usuarioId);
  await grService.confirmarCartaCompromiso(usuarioId);
  await grCoordinadorService.registrarRecepcionCarta(solicitudId, coordinadorUsuarioId);
  await grService.continuarAExpediente(usuarioId);
  await subirExpedienteSinChequeoDeFecha(usuarioId, solicitudId);
  await grCoordinadorService.decidirExpediente(solicitudId, 'aprobar', null, coordinadorUsuarioId);
}

// ── Helpers de bitácora histórica (replican confirmarBitacora, ver ah-alumno.service.js) ──

function utc(iso) {
  return new Date(`${iso}T00:00:00.000Z`);
}

/**
 * Crea una bitácora histórica 'pendiente_revision' con su avance, igual que
 * confirmarBitacora la dejaría — horas_acumuladas incrementa SIEMPRE al
 * confirmar, sin importar el dictamen posterior (RN-AH-20).
 */
async function crearBitacoraHistorica({ solicitudId, boleta, actividadId, fechaISO, horas, porcentajeAvance, descripcion, evidencia }) {
  const fecha = utc(fechaISO);
  const horaInicio = new Date(`${fechaISO}T14:00:00.000Z`);
  const horaFin = new Date(horaInicio.getTime() + horas * 3600 * 1000);

  const bitacora = await prisma.$transaction(async (tx) => {
    const b = await tx.bitacora.create({
      data: {
        solicitud_registro_id: solicitudId,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        horas_contabilizadas: horas,
        fecha_registro: fecha,
        estado: 'pendiente_revision',
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

    await tx.cumulo_horas_y_faltas.upsert({
      where: { alumno_id: boleta },
      update: { horas_acumuladas: { increment: horas } },
      create: { alumno_id: boleta, horas_acumuladas: horas },
    });

    return b;
  });

  return bitacora;
}

// ── Datos de los alumnos ───────────────────────────────────────────────────

const ALUMNO_HV = {
  correoInst: 'rangel1401@alumno.ipn.mx', nombres: 'GERARDO', apellidos: 'RANGEL OSORIO',
  telefono: '5556781401', boleta: '2020631401', correoPersonal: 'gerardo.rangel.personal@gmail.com',
  carrera: 'IA', creditos: '81.00', semestre: 7,
  motivacion: 'Me interesa apoyar en el monitoreo de los laboratorios de cómputo porque ya conozco bien el equipo como usuario frecuente.',
};

const ALUMNO_480 = {
  correoInst: 'fuentes1501@alumno.ipn.mx', nombres: 'ITZEL', apellidos: 'FUENTES MARTINEZ',
  telefono: '5567891501', boleta: '2019631501', correoPersonal: 'itzel.fuentes.personal@gmail.com',
  carrera: 'ISC', creditos: '93.00', semestre: 9,
  motivacion: 'Quiero apoyar en la digitalización del archivo histórico escolar, un proyecto largo donde puedo aportar continuamente.',
};

async function main() {
  const ofertas = await ofertasSeed.main();
  const coordinador = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR } });

  // ── Sofía (barrera0501) — actividades variadas, sin bitácoras (CU-AH-01→03 en vivo) ──
  await sembrarActividadesSofia();

  // ── Alumno "historia variada" ───────────────────────────────────────────
  const hv = await crearYRegistrar(ALUMNO_HV, ofertas.N1.ofertaId, PERIODO.HISTORIA_VARIADA);
  if ((await prisma.solicitud_registro.findUnique({ where: { id: hv.solicitudId } })).estado_solicitud === 'espera_respuesta_de_profesor') {
    await avanzarHastaAsignado(hv.usuarioId, hv.solicitudId, ofertas.N1.profesorUsuarioId, coordinador.id);
  }
  await sembrarHistoriaVariada(hv, ofertas.N1.profesorUsuarioId);

  // ── Alumno "480 horas" ───────────────────────────────────────────────────
  const h480 = await crearYRegistrar(ALUMNO_480, ofertas.O1.ofertaId, PERIODO.HORAS_480);
  if ((await prisma.solicitud_registro.findUnique({ where: { id: h480.solicitudId } })).estado_solicitud === 'espera_respuesta_de_profesor') {
    await avanzarHastaAsignado(h480.usuarioId, h480.solicitudId, ofertas.O1.profesorUsuarioId, coordinador.id);
  }
  await sembrarHoras480(h480);

  console.log('✅ 04-ah.js terminado.');
}

// ── Sofía: actividades variadas, igual que el patrón ya usado en el video ──
async function sembrarActividadesSofia() {
  const barrera = await prisma.alumno.findUnique({ where: { boleta: '2019630501' } });
  if (!barrera) throw new Error('No existe barrera0501 — corre primero 03-gr.js.');
  const solicitud = await prisma.solicitud_registro.findFirst({ where: { alumno_id: barrera.boleta } });

  const existentes = await prisma.actividad.count({ where: { solicitud_registro_id: solicitud.id } });
  if (existentes > 0) {
    console.log('↷ Sofía ya tiene actividades sembradas.');
    return;
  }

  const ACTIVIDADES = [
    // fecha_limite DESPUÉS del 23 nov a propósito (ver README, "Ojo con los
    // crons reales"): sigue sin_comenzar, así que si cayera antes del 23,
    // el cron real marcarActividadesVencidas la volvería 'vencida' sola
    // antes de la demo.
    { titulo: 'Diseñar diagrama entidad-relación del módulo de becas', estado: 'sin_comenzar', fecha_limite: '2026-12-04', porcentaje_progreso: 0 },
    { titulo: 'Configurar entorno de pruebas del sistema', estado: 'completada_a_tiempo', fecha_limite: '2026-10-26', porcentaje_progreso: 100, fecha_completada: '2026-10-24' },
    { titulo: 'Documentar manual de usuario del módulo de consulta', estado: 'vencida', fecha_limite: '2026-10-30', porcentaje_progreso: 20 },
    { titulo: 'Elaborar reporte de pruebas funcionales', estado: 'completada_tarde', fecha_limite: '2026-10-20', porcentaje_progreso: 100, fecha_completada: '2026-10-23' },
  ];

  for (const a of ACTIVIDADES) {
    await prisma.actividad.create({
      data: {
        solicitud_registro_id: solicitud.id,
        titulo: a.titulo,
        descripcion: `${a.titulo}.`,
        entregable_esperado: 'Entregable documentado en el repositorio del proyecto.',
        fecha_limite: utc(a.fecha_limite),
        estado: a.estado,
        porcentaje_progreso: a.porcentaje_progreso,
        fecha_asignacion: utc('2026-10-16'),
        fecha_completada: a.fecha_completada ? utc(a.fecha_completada) : null,
      },
    });
  }
  // Sofía ya es alumno_asignado con periodo ya iniciado (16 oct) pero SIN
  // ninguna bitácora todavía (se graba en vivo el 23) — sin este pin, el
  // cron real contabilizarFaltasDiarias le contaría faltas retroactivas
  // desde el 16 de octubre la próxima vez que corra, ensuciando su estado
  // de "recién asignada, lista para grabar" (mismo caso ya encontrado y
  // corregido para Gerardo/Itzel).
  await prisma.cumulo_horas_y_faltas.upsert({
    where: { alumno_id: barrera.boleta },
    update: { fecha_ultima_evaluacion_faltas: utc('2026-12-01') },
    create: { alumno_id: barrera.boleta, fecha_ultima_evaluacion_faltas: utc('2026-12-01') },
  });

  console.log(`✅ Sofía: ${ACTIVIDADES.length} actividades sembradas (más la que se asigna en vivo el 23).`);
}

// ── Alumno "historia variada" ────────────────────────────────────────────
async function sembrarHistoriaVariada({ usuarioId, solicitudId }, profesorUsuarioId) {
  const yaExiste = await prisma.actividad.count({ where: { solicitud_registro_id: solicitudId } });
  if (yaExiste > 0) {
    console.log('↷ Gerardo (historia variada) ya tiene actividades sembradas.');
    return;
  }

  const boleta = '2020631401';

  const crear = (titulo, fechaLimite) => prisma.actividad.create({
    data: {
      solicitud_registro_id: solicitudId,
      titulo,
      descripcion: `${titulo}.`,
      entregable_esperado: 'Entregable documentado en el repositorio del proyecto.',
      fecha_limite: utc(fechaLimite),
      estado: 'sin_comenzar',
      fecha_asignacion: utc('2026-10-01'),
    },
  });

  // Actividad 1: acumula avances hasta 100% (caso completada_a_tiempo).
  const act1 = await crear('Dar seguimiento al monitoreo diario de equipos', '2026-11-20');
  // Actividad 2: recibe los 2 avances que luego se rechazan/reaprueban — su estado NUNCA se revierte por eso.
  // fecha_limite después del 23 nov a propósito (queda 'en_progreso' — ver
  // README, "Ojo con los crons reales": si cayera antes, el cron real la
  // volvería 'vencida' sola antes de la demo).
  const act2 = await crear('Reportar incidencias de hardware en laboratorios', '2026-12-04');
  // Actividad 3: avance reportado en la bitácora que se deja pendiente de revisión (caso 9). Mismo motivo de fecha.
  const act3 = await crear('Actualizar inventario de equipo de cómputo', '2026-12-04');

  // b1 — aprobada normal (avance parcial de act1).
  const b1 = await crearBitacoraHistorica({
    solicitudId, boleta, actividadId: act1.id, fechaISO: '2026-10-06', horas: 4,
    porcentajeAvance: 40, descripcion: 'Revisión general de equipos del laboratorio 1.', evidencia: 'https://drive.example.com/evidencia-oct06',
  });
  await ahProfesorService.aprobarBitacora(profesorUsuarioId, b1.id);

  // b2 — rechazada, SE QUEDA rechazada (caso 4).
  const b2 = await crearBitacoraHistorica({
    solicitudId, boleta, actividadId: act2.id, fechaISO: '2026-10-08', horas: 4,
    porcentajeAvance: 30, descripcion: 'Reporte de 3 equipos con falla en el laboratorio 2.', evidencia: 'https://drive.example.com/evidencia-oct08',
  });
  await ahProfesorService.rechazarBitacora(profesorUsuarioId, b2.id, 'La evidencia adjunta no corresponde con el avance reportado.');

  // b3 — rechazada y LUEGO reaprobada desde el historial (caso 5).
  const b3 = await crearBitacoraHistorica({
    solicitudId, boleta, actividadId: act2.id, fechaISO: '2026-10-13', horas: 4,
    porcentajeAvance: 50, descripcion: 'Reporte de incidencias adicionales, laboratorio 3.', evidencia: 'https://drive.example.com/evidencia-oct13',
  });
  await ahProfesorService.rechazarBitacora(profesorUsuarioId, b3.id, 'Falta evidencia fotográfica de las incidencias.');
  await ahProfesorService.aprobarBitacoraRechazadaDesdeHistorial(profesorUsuarioId, b3.id);

  // b4 — PENDIENTE de revisión desde hace +5 días hábiles, sin decidir (caso 9).
  await crearBitacoraHistorica({
    solicitudId, boleta, actividadId: act3.id, fechaISO: '2026-10-27', horas: 4,
    porcentajeAvance: 55, descripcion: 'Actualización del inventario de los laboratorios 1 y 2.', evidencia: 'https://drive.example.com/evidencia-oct27',
  });
  // (sin aprobar/rechazar a propósito)

  // b5/b6 — aprobadas, para llevar act1 a 100% (completada_a_tiempo).
  const b5 = await crearBitacoraHistorica({
    solicitudId, boleta, actividadId: act1.id, fechaISO: '2026-10-20', horas: 4,
    porcentajeAvance: 70, descripcion: 'Seguimiento de equipos reparados.', evidencia: 'https://drive.example.com/evidencia-oct20',
  });
  await ahProfesorService.aprobarBitacora(profesorUsuarioId, b5.id);

  const b6 = await crearBitacoraHistorica({
    solicitudId, boleta, actividadId: act1.id, fechaISO: '2026-11-03', horas: 4,
    porcentajeAvance: 100, descripcion: 'Cierre del monitoreo mensual de equipos.', evidencia: 'https://drive.example.com/evidencia-nov03',
  });
  await ahProfesorService.aprobarBitacora(profesorUsuarioId, b6.id);

  // Faltas: 18 acumuladas en total, las últimas 6 consecutivas (caso 6+7 combinados).
  // fecha_ultima_evaluacion_faltas se fija DESPUÉS del 23 nov a propósito: así el cron
  // real (ah.cron.js::contabilizarFaltasDiarias) no vuelve a tocar estos números hasta
  // bastante después de la demo — quedan fijos exactamente como los dejamos aquí.
  await prisma.cumulo_horas_y_faltas.update({
    where: { alumno_id: boleta },
    data: {
      faltas_acumuladas: 18,
      faltas_consecutivas: 6,
      fecha_ultima_evaluacion_faltas: utc('2026-12-01'),
    },
  });

  // Actividad 4: editada (RF-AH-07) — sin ningún avance registrado, como exige la regla real.
  // fecha_limite después del 23 nov, mismo motivo que act2/act3.
  const act4 = await crear('Capacitar a nuevos usuarios del laboratorio', '2026-12-04');
  await ahProfesorService.editarActividad(profesorUsuarioId, act4.id, {
    titulo: 'Capacitar a nuevos usuarios de los laboratorios de cómputo',
    descripcion: 'Impartir una breve capacitación a los alumnos de nuevo ingreso sobre el uso correcto del equipo.',
    entregable_esperado: 'Lista de asistencia firmada y material de apoyo entregado.',
  });

  // Actividad 5: con la fecha límite extendida (CU-AH-06 reutiliza esta misma función real).
  const act5 = await crear('Depurar licencias de software vencidas', '2026-11-12');
  await ahProfesorService.extenderFechaLimiteActividad(profesorUsuarioId, act5.id, '2026-11-25');

  console.log('✅ Gerardo (historia variada): bitácoras, faltas y actividades sembradas.');
}

// ── Alumno "480 horas" ────────────────────────────────────────────────────
async function sembrarHoras480({ solicitudId }) {
  const yaExiste = await prisma.actividad.count({ where: { solicitud_registro_id: solicitudId } });
  if (yaExiste > 0) {
    console.log('↷ Itzel (480 horas) ya tiene actividades sembradas.');
    return;
  }

  const boleta = '2019631501';
  const HORAS_OBJETIVO = 480;
  const HORAS_POR_DIA = 4;

  const actividad = await prisma.actividad.create({
    data: {
      solicitud_registro_id: solicitudId,
      titulo: 'Dar seguimiento continuo a la digitalización del archivo',
      descripcion: 'Digitalizar, catalogar y respaldar los expedientes históricos del archivo escolar.',
      entregable_esperado: 'Avance acumulado del archivo digitalizado, con respaldo verificado.',
      fecha_limite: utc('2027-01-15'),
      estado: 'sin_comenzar',
      fecha_asignacion: utc('2026-05-04'),
    },
  });

  let horasAcumuladas = 0;
  let dia = utc('2026-05-04');
  let diasCreados = 0;

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
            bitacora_id: b.id,
            actividad_id: actividad.id,
            descripcion: 'Digitalización y catalogación de expedientes del día.',
            evidencia: `https://drive.example.com/archivo-${fechaISO}`,
            porcentaje_avance_registrado: esUltimo ? 100 : Math.min(99, Math.round(((horasAcumuladas + horas) / HORAS_OBJETIVO) * 100)),
          },
        });
        if (esUltimo) {
          await tx.actividad.update({
            where: { id: actividad.id },
            data: { porcentaje_progreso: 100, estado: 'completada_a_tiempo', fecha_completada: dia },
          });
        } else {
          await tx.actividad.update({
            where: { id: actividad.id },
            data: { porcentaje_progreso: Math.round(((horasAcumuladas + horas) / HORAS_OBJETIVO) * 100), estado: 'en_progreso' },
          });
        }
      });

      horasAcumuladas += horas;
      diasCreados++;
    }
    dia = new Date(dia.getTime() + 86400000);
  }

  await prisma.cumulo_horas_y_faltas.upsert({
    where: { alumno_id: boleta },
    update: { horas_acumuladas: horasAcumuladas, horas_rechazadas: 0, fecha_ultima_evaluacion_faltas: utc('2026-12-01') },
    create: { alumno_id: boleta, horas_acumuladas: horasAcumuladas, horas_rechazadas: 0, fecha_ultima_evaluacion_faltas: utc('2026-12-01') },
  });

  console.log(`✅ Itzel (480 horas): ${diasCreados} bitácoras aprobadas, ${horasAcumuladas}h netas.`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en cred-gr-ah-lss/04-ah.js:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, ALUMNO_HV, ALUMNO_480, PERIODO };
