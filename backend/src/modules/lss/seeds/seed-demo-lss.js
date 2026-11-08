// seed-demo-lss.js
//
// Crea cuentas de demo para el módulo de Liberación del Servicio Social,
// reutilizando el profesor/oferta dedicados de seed-maestro-gr.js y
// encadenando funciones REALES de los servicios (lss-alumno.service.js,
// lss-profesor.service.js vía inserción directa de la firma — sin pasar
// por registrarEvaluacion para no depender de rúbrica ni de la autoridad
// de sellado de tiempo externa, FreeTSA — y lss-coordinador.service.js)
// para avanzar cada alumno hasta el punto exacto donde se necesita para
// la demo.
//
// Requiere que seed-maestro-gr.js ya se haya corrido antes.

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const prisma = require('../../../lib/prisma');
const { cifrarBuffer, generarNombreSeguro } = require('../../../lib/fileEncryption');
const lssAlumnoService = require('../lss-alumno.service');
const lssCoordinadorService = require('../lss-coordinador.service');
const {
  ESTADO_EVALUACION_PENDIENTE_DICTAMEN,
  ESTADO_EVALUACION_APROBADO_COORDINADOR,
  sha256,
} = require('../lss.shared');

const MUESTRA_PDF_PATH = path.join(__dirname, '../../../../../muestra.pdf');
const MUESTRA_PDF = fs.readFileSync(MUESTRA_PDF_PATH);
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../../uploads/documentos');

const PASSWORD_PLANO = '12345678';
const CARRERA_NOMBRE = 'ISC';
const PROFESOR_CORREO = 'profesor.seedmaestrogr@ipn.mx';
const COORDINADOR_CORREO = 'coordinador.seedmaestrogr@ipn.mx';
const OFERTA_B_NOMBRE = '[SEED-MAESTRO-GR] Oferta general';

function boletaDe(n) { return `2099` + `65` + String(n).padStart(4, '0'); }
function correoDe(n) { return `seedlss${String(n).padStart(4, '0')}@alumno.ipn.mx`; }
function archivo(buffer) { return { buffer }; }

const NOMBRES = { 1: 'DANIELA', 2: 'JAVIER', 3: 'SOFIA', 4: 'MARCOS', 5: 'VALERIA', 6: 'HUGO', 7: 'RICARDO', 8: 'PAOLA', 9: 'FERNANDO', 10: 'MONICA', 11: 'SERGIO', 12: 'ALEJANDRA', 13: 'RODRIGO', 14: 'CAMILA', 15: 'TOMAS', 16: 'NATALIA', 17: 'GUSTAVO' };

async function crearAlumnoBase({ n, apellido, ofertaId, carreraId, periodoId }) {
  const boleta = boletaDe(n);
  const correo = correoDe(n);
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: correo } });
  if (existente) {
    console.log(`↷ ${correo} ya existe — se omite creación base.`);
    const alumno = await prisma.alumno.findUnique({ where: { usuario_id: existente.id }, include: { solicitud_registro: true } });
    return { usuarioId: existente.id, solicitudId: alumno.solicitud_registro.id, boleta: alumno.boleta, correo };
  }
  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();
  const { usuarioId, solicitudId } = await prisma.$transaction(async (tx) => {
    const usuarioCreado = await tx.usuario.create({
      data: { rol: 'alumno_asignado', correo_institucional: correo, nombre: NOMBRES[n], apellidos: apellido, contrasena: hash, fecha_creacion: ahora },
    });
    await tx.alumno.create({
      data: { boleta, usuario_id: usuarioCreado.id, celular: `57${String(n).padStart(8, '0')}`, carrera: CARRERA_NOMBRE, creditos: '85.00', semestre: 8, correo_personal: `${correo.split('@')[0]}.personal@gmail.com` },
    });
    const solicitudCreada = await tx.solicitud_registro.create({
      data: { alumno_id: boleta, carrera_id: carreraId, dictamen: null, periodo_registro_id: periodoId, oferta_id: ofertaId, motivacion_oferta: `Motivación de prueba (seed-demo-lss) para ${boleta}.`, estado_solicitud: 'alumno_asignado', estado_anterior: 'expediente_pendiente_revision', fecha_aplicacion: ahora },
    });
    await tx.cumulo_horas_y_faltas.create({ data: { alumno_id: boleta, horas_acumuladas: 480, horas_rechazadas: 0, faltas_acumuladas: 0, faltas_consecutivas: 0 } });
    return { usuarioId: usuarioCreado.id, solicitudId: solicitudCreada.id };
  });
  console.log(`✅ Creado alumno_asignado + 480h: ${boleta} / ${correo}`);
  return { usuarioId, solicitudId, boleta, correo };
}

async function crearReportesAprobados(solicitudId, alumnoBoleta, alumnoUsuarioId) {
  const existentes = await prisma.reporte_mensual.count({ where: { solicitud_registro_id: solicitudId } });
  if (existentes >= 6) { console.log('  ↷ Ya tiene 6+ reportes mensuales — se omite.'); } else {
    for (let n = 1; n <= 6; n++) {
      const documento = await prisma.documento.create({ data: { alumno_id: alumnoBoleta, creador_id: alumnoUsuarioId, tipo_documento: 'reporte_mensual', fecha_creacion: new Date(), estado_documento: 'aprobado', ruta_archivo: `/seed/reporte-mensual-${solicitudId}-${n}.pdf` } });
      await prisma.reporte_mensual.create({ data: { solicitud_registro_id: solicitudId, documento_id: documento.id, num_reporte: n, actividades_mes: `[DEMO] Actividades del mes ${n}.`, dias_laborados: 20, horas_reportadas: 80, estado_reporte: 'aprobado_coordinador' } });
    }
    console.log('  ✅ 6 reportes mensuales aprobados creados.');
  }
  const globalExistente = await prisma.reporte_global.findFirst({ where: { solicitud_registro_id: solicitudId } });
  if (!globalExistente) {
    const documento = await prisma.documento.create({ data: { alumno_id: alumnoBoleta, creador_id: alumnoUsuarioId, tipo_documento: 'reporte_global', fecha_creacion: new Date(), estado_documento: 'aprobado', ruta_archivo: `/seed/reporte-global-${solicitudId}.pdf` } });
    await prisma.reporte_global.create({ data: { solicitud_registro_id: solicitudId, documento_id: documento.id, actividades_resumen: '[DEMO] Resumen global.', estado_reporte: 'aprobado_coordinador' } });
    console.log('  ✅ Reporte global aprobado creado.');
  } else { console.log('  ↷ Ya tiene reporte global — se omite.'); }
}

async function crearFirmaProfesorPendienteDictamen(alumnoBoleta, solicitudId, profesorUsuarioId) {
  const proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: solicitudId } });
  const carpetaAlumno = path.join(RUTA_BASE_DOCUMENTOS, alumnoBoleta);
  fs.mkdirSync(carpetaAlumno, { recursive: true });
  const rutaRelativa = path.join(alumnoBoleta, generarNombreSeguro());
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(MUESTRA_PDF));
  const documento = await prisma.documento.create({ data: { alumno_id: alumnoBoleta, creador_id: profesorUsuarioId, tipo_documento: 'evaluacion_desempeno', fecha_creacion: new Date(), estado_documento: 'vigente', ruta_archivo: rutaRelativa } });
  const evaluacion = await prisma.evaluacion_desempeno.create({ data: { documento_id: documento.id, liberacion_proceso_id: proceso.id, estado: ESTADO_EVALUACION_PENDIENTE_DICTAMEN, observaciones_profesor: null, reportes_siss_confirmados: true, fecha_evaluacion: new Date() } });
  // hash_documento debe coincidir con sha256(MUESTRA_PDF) — es lo que lee
  // coordinador.dictaminarAprobado/Rechazado del disco (exigirPdfVigente)
  // para validar que el archivo no fue alterado desde que el profesor firmó.
  await prisma.revision_desempeno.create({ data: { evaluacion_desempeno_id: evaluacion.id, usuario_id: profesorUsuarioId, tipo_revisor: 'profesor', estado: 'aprobado', hash_documento: sha256(MUESTRA_PDF), fecha: new Date() } });
  return evaluacion;
}

async function crearEvaluacionAmbasFirmas(alumnoBoleta, solicitudId, profesorUsuarioId, coordinadorUsuarioId) {
  const proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: solicitudId } });
  const carpetaAlumno = path.join(RUTA_BASE_DOCUMENTOS, alumnoBoleta);
  fs.mkdirSync(carpetaAlumno, { recursive: true });
  const rutaRelativa = path.join(alumnoBoleta, generarNombreSeguro());
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(MUESTRA_PDF));
  const documento = await prisma.documento.create({ data: { alumno_id: alumnoBoleta, creador_id: profesorUsuarioId, tipo_documento: 'evaluacion_desempeno', fecha_creacion: new Date(), estado_documento: 'vigente', ruta_archivo: rutaRelativa } });
  const evaluacion = await prisma.evaluacion_desempeno.create({ data: { documento_id: documento.id, liberacion_proceso_id: proceso.id, estado: ESTADO_EVALUACION_APROBADO_COORDINADOR, observaciones_profesor: null, reportes_siss_confirmados: true, fecha_evaluacion: new Date() } });
  await prisma.revision_desempeno.create({ data: { evaluacion_desempeno_id: evaluacion.id, usuario_id: profesorUsuarioId, tipo_revisor: 'profesor', estado: 'aprobado', fecha: new Date() } });
  await prisma.revision_desempeno.create({ data: { evaluacion_desempeno_id: evaluacion.id, usuario_id: coordinadorUsuarioId, tipo_revisor: 'coordinador', estado: 'aprobado', fecha: new Date() } });
}

async function main() {
  const profesorUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESOR_CORREO } });
  const coordinadorUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: COORDINADOR_CORREO } });
  if (!profesorUsuario || !coordinadorUsuario) { console.error('❌ Corre primero seed-maestro-gr.js.'); process.exit(1); }
  const oferta = await prisma.oferta_servicio.findFirst({ where: { nombre_proyecto: OFERTA_B_NOMBRE } });
  const carrera = await prisma.carrera.findFirst({ where: { nombre: CARRERA_NOMBRE } });
  const periodoId = (await prisma.solicitud_registro.findFirst({ where: { oferta_id: oferta.id }, select: { periodo_registro_id: true } })).periodo_registro_id;

  const resultados = [];

  // 1. Inicio limpio — cumple requisitos, listo para "Iniciar evaluación" en vivo.
  {
    const a = await crearAlumnoBase({ n: 1, apellido: 'LSS INICIO', ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    resultados.push({ ...a, nota: 'Listo para iniciar evaluación de desempeño (botón en el sistema)' });
  }

  // 2 y 3. Par de evaluación pendiente de dictamen (coordinación aprueba/rechaza en vivo).
  for (const [n, apellido] of [[2, 'LSS EVAL APRUEBA'], [3, 'LSS EVAL RECHAZA']]) {
    const a = await crearAlumnoBase({ n, apellido, ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    const yaInicio = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!yaInicio) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
      await crearFirmaProfesorPendienteDictamen(a.boleta, a.solicitudId, profesorUsuario.id);
      console.log(`  ✅ Evaluación pendiente de dictamen de coordinación para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso — se omite.'); }
    resultados.push({ ...a, nota: 'Evaluación con firma del profesor, pendiente de dictamen de coordinación' });
  }

  // 4 y 5. Par de expediente pendiente de revisión (coordinación aprueba/rechaza en vivo).
  for (const [n, apellido] of [[4, 'LSS EXP APRUEBA'], [5, 'LSS EXP RECHAZA']]) {
    const a = await crearAlumnoBase({ n, apellido, ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    let proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!proceso) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
      await crearEvaluacionAmbasFirmas(a.boleta, a.solicitudId, profesorUsuario.id, coordinadorUsuario.id);
      await lssAlumnoService.marcarEvaluacionDescargada(a.usuarioId);
      await lssAlumnoService.confirmarSubidaSiss(a.usuarioId);
      await lssAlumnoService.solicitarCartaTermino(a.usuarioId);
      proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
      await lssCoordinadorService.marcarCartaListaParaRecoger(coordinadorUsuario.id, proceso.id);
      await lssAlumnoService.confirmarRecogida(a.usuarioId);
      await lssAlumnoService.subirExpedienteLss(a.usuarioId, { cartaCompromiso: archivo(MUESTRA_PDF), cartaTermino: archivo(MUESTRA_PDF) });
      console.log(`  ✅ Expediente en revisión, pendiente de dictamen de coordinación para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso avanzado — se omite.'); }
    resultados.push({ ...a, nota: 'Expediente enviado, pendiente de dictamen de coordinación' });
  }

  // 6. Cadena completa hasta constancia disponible.
  {
    const a = await crearAlumnoBase({ n: 6, apellido: 'LSS CONSTANCIA DISPONIBLE', ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    let proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!proceso || proceso.estado !== 'constancia_disponible') {
      if (!proceso) {
        await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
        await crearEvaluacionAmbasFirmas(a.boleta, a.solicitudId, profesorUsuario.id, coordinadorUsuario.id);
        await lssAlumnoService.marcarEvaluacionDescargada(a.usuarioId);
        await lssAlumnoService.confirmarSubidaSiss(a.usuarioId);
        await lssAlumnoService.solicitarCartaTermino(a.usuarioId);
        proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
        await lssCoordinadorService.marcarCartaListaParaRecoger(coordinadorUsuario.id, proceso.id);
        await lssAlumnoService.confirmarRecogida(a.usuarioId);
        await lssAlumnoService.subirExpedienteLss(a.usuarioId, { cartaCompromiso: archivo(MUESTRA_PDF), cartaTermino: archivo(MUESTRA_PDF) });
      }
      const documentoExpediente = await prisma.documento.findFirst({ where: { alumno_id: a.boleta, tipo_documento: 'expediente_lss' } });
      await lssCoordinadorService.dictaminarExpedienteAprobado(coordinadorUsuario.id, documentoExpediente.id);
      await lssAlumnoService.solicitarConstanciaTermino(a.usuarioId);
      proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
      await lssCoordinadorService.enviarMensajeConstancia(coordinadorUsuario.id, proceso.id, 'Tu constancia de término ya está lista. Descárgala desde https://serviciosocialconstancias.ipn.mx usando tu boleta y CURP.');
      console.log(`  ✅ Constancia de término disponible para ${a.boleta}`);
    } else { console.log('  ↷ Ya está en constancia_disponible — se omite.'); }
    resultados.push({ ...a, nota: 'Proceso completo — constancia de término disponible' });
  }

  // 7. Evaluación solicitada por el alumno, lista para que el profesor la
  // evalúe en vivo (Flujo Principal de CU-LSS-03), confirmando que subió
  // sus reportes al SISS.
  {
    const a = await crearAlumnoBase({ n: 7, apellido: 'LSS PROF EVALUA', ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    const yaInicio = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!yaInicio) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
      console.log(`  ✅ Evaluación solicitada (reportes confirmados en SISS) para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso — se omite.'); }
    resultados.push({ ...a, nota: 'Evaluación solicitada — lista para que el profesor la evalúe (reportes SISS confirmados)' });
  }

  // 8. Evaluación solicitada pidiendo al profesor validar reportes en SISS,
  // lista para que el profesor la rechace en vivo (Flujo Alterno 3.1).
  {
    const a = await crearAlumnoBase({ n: 8, apellido: 'LSS PROF RECHAZA SISS', ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    const yaInicio = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!yaInicio) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, false);
      console.log(`  ✅ Evaluación solicitada (pide validar reportes en SISS) para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso — se omite.'); }
    resultados.push({ ...a, nota: 'Evaluación solicitada — el alumno pide que el profesor valide sus reportes en SISS' });
  }

  // 9. Evaluación devuelta para corrección por coordinación, lista para que
  // el profesor la corrija y reenvíe en vivo (Flujo Alterno 1.1-1.3).
  {
    const a = await crearAlumnoBase({ n: 9, apellido: 'LSS PROF CORRIGE', ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    let proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!proceso) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
      const evaluacion = await crearFirmaProfesorPendienteDictamen(a.boleta, a.solicitudId, profesorUsuario.id);
      await prisma.evaluacion_desempeno.update({
        where: { id: evaluacion.id },
        data: {
          estado: 'devuelta_para_correccion',
          motivo_rechazo_coordinacion: '[DEMO] Faltó detallar las observaciones de disciplina; corrige y reenvía la evaluación.',
        },
      });
      console.log(`  ✅ Evaluación devuelta para corrección por coordinación para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso — se omite.'); }
    resultados.push({ ...a, nota: 'Evaluación devuelta para corrección — lista para que el profesor corrija y reenvíe' });
  }

  // 10 y 11. Par de expediente pendiente de revisión, exclusivo para la
  // demo en vivo de CU-LSS-09 en el manual de Coordinador (los pares 4/5
  // ya fueron consumidos por demos anteriores de Alumno/Profesor).
  for (const [n, apellido] of [[10, 'LSS COORD EXP APRUEBA'], [11, 'LSS COORD EXP RECHAZA']]) {
    const a = await crearAlumnoBase({ n, apellido, ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    let proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!proceso) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
      await crearEvaluacionAmbasFirmas(a.boleta, a.solicitudId, profesorUsuario.id, coordinadorUsuario.id);
      await lssAlumnoService.marcarEvaluacionDescargada(a.usuarioId);
      await lssAlumnoService.confirmarSubidaSiss(a.usuarioId);
      await lssAlumnoService.solicitarCartaTermino(a.usuarioId);
      proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
      await lssCoordinadorService.marcarCartaListaParaRecoger(coordinadorUsuario.id, proceso.id);
      await lssAlumnoService.confirmarRecogida(a.usuarioId);
      await lssAlumnoService.subirExpedienteLss(a.usuarioId, { cartaCompromiso: archivo(MUESTRA_PDF), cartaTermino: archivo(MUESTRA_PDF) });
      console.log(`  ✅ Expediente en revisión, pendiente de dictamen de coordinación para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso avanzado — se omite.'); }
    resultados.push({ ...a, nota: 'Expediente enviado, pendiente de dictamen de coordinación (demo manual Coordinador)' });
  }

  // 12 y 13. Par de evaluación pendiente de dictamen, exclusivo para la
  // demo en vivo de CU-LSS-04 en el manual de Coordinador (los pares 2/3
  // ya fueron consumidos por demos anteriores).
  for (const [n, apellido] of [[12, 'LSS COORD EVAL APRUEBA'], [13, 'LSS COORD EVAL RECHAZA']]) {
    const a = await crearAlumnoBase({ n, apellido, ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    const yaInicio = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!yaInicio) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
      await crearFirmaProfesorPendienteDictamen(a.boleta, a.solicitudId, profesorUsuario.id);
      console.log(`  ✅ Evaluación pendiente de dictamen de coordinación para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso — se omite.'); }
    resultados.push({ ...a, nota: 'Evaluación con firma del profesor, pendiente de dictamen de coordinación (demo manual Coordinador)' });
  }

  // 14 y 15. Par de expediente pendiente de revisión, exclusivo para la
  // demo en vivo de CU-LSS-09 en el manual de Coordinador (los pares
  // 4/5/10/11 ya fueron consumidos por demos anteriores).
  for (const [n, apellido] of [[14, 'LSS COORD EXP APRUEBA DOS'], [15, 'LSS COORD EXP RECHAZA DOS']]) {
    const a = await crearAlumnoBase({ n, apellido, ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    let proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!proceso) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
      await crearEvaluacionAmbasFirmas(a.boleta, a.solicitudId, profesorUsuario.id, coordinadorUsuario.id);
      await lssAlumnoService.marcarEvaluacionDescargada(a.usuarioId);
      await lssAlumnoService.confirmarSubidaSiss(a.usuarioId);
      await lssAlumnoService.solicitarCartaTermino(a.usuarioId);
      proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
      await lssCoordinadorService.marcarCartaListaParaRecoger(coordinadorUsuario.id, proceso.id);
      await lssAlumnoService.confirmarRecogida(a.usuarioId);
      await lssAlumnoService.subirExpedienteLss(a.usuarioId, { cartaCompromiso: archivo(MUESTRA_PDF), cartaTermino: archivo(MUESTRA_PDF) });
      console.log(`  ✅ Expediente en revisión, pendiente de dictamen de coordinación para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso avanzado — se omite.'); }
    resultados.push({ ...a, nota: 'Expediente enviado, pendiente de dictamen de coordinación (demo manual Coordinador)' });
  }

  // 16. Carta de término solicitada por el alumno, pendiente de elaboración
  // por Coordinación — exclusivo para la demo en vivo de CU-LSS-06.
  {
    const a = await crearAlumnoBase({ n: 16, apellido: 'LSS COORD CARTA SOLICITADA', ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    let proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!proceso) {
      await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
      await crearEvaluacionAmbasFirmas(a.boleta, a.solicitudId, profesorUsuario.id, coordinadorUsuario.id);
      await lssAlumnoService.marcarEvaluacionDescargada(a.usuarioId);
      await lssAlumnoService.confirmarSubidaSiss(a.usuarioId);
      await lssAlumnoService.solicitarCartaTermino(a.usuarioId);
      console.log(`  ✅ Carta de término solicitada, pendiente de elaboración para ${a.boleta}`);
    } else { console.log('  ↷ Ya tiene liberacion_proceso avanzado — se omite.'); }
    resultados.push({ ...a, nota: 'Carta de término solicitada — pendiente de elaboración (demo manual Coordinador)' });
  }

  // 17. Constancia de término solicitada por el alumno, pendiente de envío
  // por Coordinación — exclusivo para la demo en vivo de CU-LSS-11.
  {
    const a = await crearAlumnoBase({ n: 17, apellido: 'LSS COORD CONSTANCIA SOLICITADA', ofertaId: oferta.id, carreraId: carrera.id, periodoId });
    await crearReportesAprobados(a.solicitudId, a.boleta, a.usuarioId);
    let proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
    if (!proceso || proceso.estado !== 'solicitud_constancia_termino') {
      if (!proceso) {
        await lssAlumnoService.iniciarEvaluacion(a.usuarioId, true);
        await crearEvaluacionAmbasFirmas(a.boleta, a.solicitudId, profesorUsuario.id, coordinadorUsuario.id);
        await lssAlumnoService.marcarEvaluacionDescargada(a.usuarioId);
        await lssAlumnoService.confirmarSubidaSiss(a.usuarioId);
        await lssAlumnoService.solicitarCartaTermino(a.usuarioId);
        proceso = await prisma.liberacion_proceso.findUnique({ where: { solicitud_registro_id: a.solicitudId } });
        await lssCoordinadorService.marcarCartaListaParaRecoger(coordinadorUsuario.id, proceso.id);
        await lssAlumnoService.confirmarRecogida(a.usuarioId);
        await lssAlumnoService.subirExpedienteLss(a.usuarioId, { cartaCompromiso: archivo(MUESTRA_PDF), cartaTermino: archivo(MUESTRA_PDF) });
      }
      const documentoExpediente = await prisma.documento.findFirst({ where: { alumno_id: a.boleta, tipo_documento: 'expediente_lss' } });
      if (documentoExpediente && documentoExpediente.estado_documento !== 'aprobado') {
        await lssCoordinadorService.dictaminarExpedienteAprobado(coordinadorUsuario.id, documentoExpediente.id);
      }
      await lssAlumnoService.solicitarConstanciaTermino(a.usuarioId);
      console.log(`  ✅ Constancia de término solicitada, pendiente de envío para ${a.boleta}`);
    } else { console.log('  ↷ Ya está en solicitud_constancia_termino — se omite.'); }
    resultados.push({ ...a, nota: 'Constancia de término solicitada — pendiente de envío (demo manual Coordinador)' });
  }

  console.log('\n📋 Reporte final — seed-demo-lss');
  console.log(`   Contraseña de todos: ${PASSWORD_PLANO}\n`);
  resultados.forEach((r) => console.log(`${r.boleta} | ${r.correo} | ${r.nota}`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error en seed-demo-lss:', e);
  process.exit(1);
});
