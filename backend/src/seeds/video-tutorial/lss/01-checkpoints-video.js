// 01-checkpoints-video.js
//
// Construye los 3 checkpoints de LSS que Karen necesita para regrabar esas
// escenas del video (cada uno justo ANTES de que coordinación actúe), con
// un respaldo mysqldump en cada punto — mismo patrón ya usado para los 4
// checkpoints de GR (gr_video_1..4_*.sql).
//
// Requiere que Daniela (boleta 2021630001) YA esté en alumno_asignado con
// 480h + 6 reportes mensuales + 1 global, todos aprobado_coordinador
// (construido por lss/00-horas-y-reportes-prueba.js, ya corrido antes de
// este script sobre el respaldo antes_lss_solo_karen.sql).
//
// Checkpoint A — "coordinación firma la evaluación del alumno":
//   el profesor ya evaluó y firmó (registrarEvaluacion), evaluación en
//   pendiente_dictamen, esperando que coordinación dictamine (CU-LSS-04).
// Checkpoint B — "coordinación gestiona la carta de término":
//   coordinación ya aprobó la evaluación, el alumno ya descargó/subió a
//   SISS/solicitó la carta (solicitud_carta_termino), carta en 'solicitada',
//   esperando que coordinación la marque lista_para_recoger (CU-LSS-06).
// Checkpoint C — "coordinación dictamina el expediente":
//   coordinación ya marcó la carta lista, el alumno ya la recogió y ya
//   subió su expediente, documento en 'en_revision', esperando que
//   coordinación dictamine (CU-LSS-09).

const prisma = require('../../../lib/prisma');
const { iniciarEvaluacion, marcarEvaluacionDescargada, confirmarSubidaSiss, solicitarCartaTermino, confirmarRecogida, subirExpedienteLss } = require('../../../modules/lss/lss-alumno.service');
const { registrarEvaluacion } = require('../../../modules/lss/lss-profesor.service');
const { dictaminarAprobado, marcarCartaListaParaRecoger } = require('../../../modules/lss/lss-coordinador.service');

const CORREO_PROFESOR = 'profesornavarro@ipn.mx';
const CORREO_COORDINADOR = 'coordinadorherrera@ipn.mx';
const BOLETA_ALUMNA = '2021630001';

const VALORES_FACTORES = {
  'Calidad del trabajo': 100,
  'Aplicación de conocimientos': 100,
  'Adquisición de conocimientos': 100,
  'Disciplina': 100,
  'Presentación personal': 100,
  'Iniciativa': 100,
  'Relaciones interpersonales': 85,
};

// PDF mínimo válido (RN-LSS-21: carta compromiso y carta término deben ser
// PDFs válidos para que unirPdfs los acepte) — mismo truco ya usado en
// demo-final/06-lss.js.
const PDF_MINIMO = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');

async function obtenerContexto() {
  const profesorUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_PROFESOR }, include: { profesor: true } });
  const coordinadorUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR } });
  const alumnoUsuario = await prisma.usuario.findFirst({
    where: { alumno: { boleta: BOLETA_ALUMNA } },
    include: { alumno: { include: { solicitud_registro: { include: { liberacion_proceso: { include: { evaluacion_desempeno: true, carta_termino: true } } } } } } },
  });
  return {
    profesorUsuarioId: profesorUsuario.id,
    coordinadorUsuarioId: coordinadorUsuario.id,
    alumnoUsuarioId: alumnoUsuario.id,
    solicitud: alumnoUsuario.alumno.solicitud_registro,
  };
}

// ── Checkpoint A: iniciar + profesor evalúa y firma → deja pendiente_dictamen ──
async function pasoA() {
  let ctx = await obtenerContexto();

  if (!ctx.solicitud.liberacion_proceso) {
    await iniciarEvaluacion(ctx.alumnoUsuarioId, true);
    console.log('✅ CU-LSS-01: evaluación iniciada (evaluacion_solicitada).');
    ctx = await obtenerContexto();
  } else {
    console.log('↷ liberacion_proceso ya existía.');
  }

  if (!ctx.solicitud.liberacion_proceso.evaluacion_desempeno) {
    await registrarEvaluacion(
      ctx.profesorUsuarioId,
      BOLETA_ALUMNA,
      { observacionesProfesor: 'Excelente desempeño durante todo el periodo de servicio social.', reportesSissConfirmados: true, valores: VALORES_FACTORES },
      '127.0.0.1',
    );
    console.log('✅ CU-LSS-03: profesor evaluó y firmó (evaluacion_desempeno: pendiente_dictamen).');
  } else {
    console.log('↷ evaluacion_desempeno ya existía.');
  }

  console.log('\n🎬 CHECKPOINT A listo: coordinación va a FIRMAR/DICTAMINAR la evaluación (CU-LSS-04).');
}

// ── Checkpoint B: coordinación aprueba evaluación + alumno descarga/sube SISS/solicita carta → deja carta 'solicitada' ──
async function pasoB() {
  let ctx = await obtenerContexto();
  const evaluacion = ctx.solicitud.liberacion_proceso.evaluacion_desempeno;

  if (evaluacion.estado === 'pendiente_dictamen') {
    await dictaminarAprobado(ctx.coordinadorUsuarioId, evaluacion.id, '127.0.0.1');
    console.log('✅ CU-LSS-04: coordinación aprobó la evaluación (aprobado_coordinador).');
  } else {
    console.log('↷ la evaluación ya estaba dictaminada.');
  }

  ctx = await obtenerContexto();
  const proceso = ctx.solicitud.liberacion_proceso;

  if (!proceso.evaluacion_descargada) {
    await marcarEvaluacionDescargada(ctx.alumnoUsuarioId);
    console.log('✅ CU-LSS-02 (alterno D): evaluación descargada.');
  }
  ctx = await obtenerContexto();
  if (!ctx.solicitud.liberacion_proceso.evaluacion_subida_siss) {
    await confirmarSubidaSiss(ctx.alumnoUsuarioId);
    console.log('✅ confirmada la subida a SISS.');
  }

  ctx = await obtenerContexto();
  if (!ctx.solicitud.liberacion_proceso.carta_termino) {
    await solicitarCartaTermino(ctx.alumnoUsuarioId);
    console.log('✅ CU-LSS-05: carta de término solicitada (carta_termino: solicitada).');
  } else {
    console.log('↷ carta_termino ya existía.');
  }

  console.log('\n🎬 CHECKPOINT B listo: coordinación va a GESTIONAR/MARCAR LISTA la carta de término (CU-LSS-06).');
}

// ── Checkpoint C: coordinación marca carta lista + alumno recoge + sube expediente → deja documento 'en_revision' ──
async function pasoC() {
  let ctx = await obtenerContexto();
  const proceso = ctx.solicitud.liberacion_proceso;

  if (proceso.carta_termino.estado === 'solicitada') {
    await marcarCartaListaParaRecoger(ctx.coordinadorUsuarioId, proceso.id);
    console.log('✅ CU-LSS-06: coordinación marcó la carta lista para recoger.');
  } else {
    console.log('↷ la carta ya estaba lista o recogida.');
  }

  ctx = await obtenerContexto();
  if (ctx.solicitud.liberacion_proceso.carta_termino.estado === 'lista_para_recoger') {
    await confirmarRecogida(ctx.alumnoUsuarioId);
    console.log('✅ CU-LSS-05 (alterno): recogida de la carta confirmada por la alumna.');
  }

  const documentoExistente = await prisma.documento.findFirst({ where: { alumno_id: BOLETA_ALUMNA, tipo_documento: 'expediente_lss' } });
  if (!documentoExistente) {
    await subirExpedienteLss(ctx.alumnoUsuarioId, {
      cartaCompromiso: { buffer: PDF_MINIMO },
      cartaTermino: { buffer: PDF_MINIMO },
      dictamen: ctx.solicitud.dictamen !== null ? { buffer: PDF_MINIMO } : undefined,
    });
    console.log('✅ CU-LSS-07: expediente LSS enviado (documento: en_revision).');
  } else {
    console.log('↷ el expediente LSS ya había sido enviado.');
  }

  console.log('\n🎬 CHECKPOINT C listo: coordinación va a DICTAMINAR el expediente (CU-LSS-09).');
}

async function main() {
  const paso = process.argv[2];
  if (paso === 'A') await pasoA();
  else if (paso === 'B') await pasoB();
  else if (paso === 'C') await pasoC();
  else throw new Error('Uso: node 01-checkpoints-video.js A|B|C');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en lss/01-checkpoints-video.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { pasoA, pasoB, pasoC };
