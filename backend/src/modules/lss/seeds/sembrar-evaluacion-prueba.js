// sembrar-evaluacion-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI), NUEVO — no extiende
// sembrar-requisitos-prueba.js (ese sigue siendo solo para los requisitos
// de CU-LSS-01: reportes/horas/oferta). Este simula los 4 alternos de
// CU-LSS-02 (estado de la evaluación de desempeño) sobre una solicitud que
// YA debe tener liberacion_proceso en 'evaluacion_solicitada' (de
// CU-LSS-01, real o sembrado con sembrar-requisitos-prueba.js).
//
// NO construye ninguna lógica real de LSS-03/04 (evaluación real del
// profesor/coordinación, firma/hash real) — solo inserta filas de prueba
// directamente, con datos plausibles, igual que el seed de reportes.
//
// El PDF de la evaluación es real en disco (mismo mecanismo de cifrado que
// GR — cifrarBuffer/RUTA_BASE_DOCUMENTOS), reutilizando muestra.pdf como
// contenido de prueba — el MECANISMO de descarga debe ser genuino, el
// CONTENIDO no importa (eso es CU-LSS-03).
//
// USO:
//   1. Edita SOLICITUD_REGISTRO_ID y MODO abajo.
//   2. docker compose exec backend node backend/src/modules/lss/seeds/sembrar-evaluacion-prueba.js
//
// MODO (uno de los 4):
//   'sin_evaluar'                              -> Alterno A
//   'rechazado_profesor'                       -> Alterno C (estado real: rechazada_por_siss)
//   'aprobado_profesor_pendiente_coordinador'  -> Alterno B (estado real: pendiente_dictamen)
//   'ambas_firmas'                              -> Alterno D (crea PDF real)

const fs = require('fs');
const path = require('path');

const MUESTRA_PDF_PATH = path.join(__dirname, '../../../../../muestra.pdf');
if (!fs.existsSync(MUESTRA_PDF_PATH)) {
  console.error('❌ No se encontró el PDF de muestra necesario para este seed.');
  console.error(`   Ruta absoluta esperada: ${MUESTRA_PDF_PATH}`);
  process.exit(1);
}
const MUESTRA_PDF = fs.readFileSync(MUESTRA_PDF_PATH);

const prisma = require('../../../lib/prisma');
const { cifrarBuffer, generarNombreSeguro } = require('../../../lib/fileEncryption');
const {
  ESTADO_EVALUACION_SOLICITADA,
  ESTADO_EVALUACION_RECHAZADA_POR_SISS,
  ESTADO_EVALUACION_PENDIENTE_DICTAMEN,
  ESTADO_EVALUACION_APROBADO_COORDINADOR,
} = require('../lss.shared');

const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../../uploads/documentos');

const SOLICITUD_REGISTRO_ID = 1; // <-- edita este valor antes de correr
const MODO = 'sin_evaluar'; // <-- edita: sin_evaluar | rechazado_profesor | aprobado_profesor_pendiente_coordinador | ambas_firmas

const MODOS_VALIDOS = ['sin_evaluar', 'rechazado_profesor', 'aprobado_profesor_pendiente_coordinador', 'ambas_firmas'];

async function crearDocumentoYEvaluacion(solicitud, estado, { observacionesProfesor = null, reportesSissConfirmados = true } = {}) {
  const carpetaAlumno = path.join(RUTA_BASE_DOCUMENTOS, solicitud.alumno_id);
  fs.mkdirSync(carpetaAlumno, { recursive: true });
  const rutaRelativa = path.join(solicitud.alumno_id, generarNombreSeguro());
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(MUESTRA_PDF));

  const documento = await prisma.documento.create({
    data: {
      alumno_id: solicitud.alumno_id,
      creador_id: solicitud.oferta.profesor.usuario_id,
      tipo_documento: 'evaluacion_desempeno',
      fecha_creacion: new Date(),
      estado_documento: 'vigente',
      ruta_archivo: rutaRelativa,
    },
  });

  const evaluacion = await prisma.evaluacion_desempeno.create({
    data: {
      documento_id: documento.id,
      liberacion_proceso_id: solicitud.liberacion_proceso.id,
      estado,
      observaciones_profesor: observacionesProfesor,
      reportes_siss_confirmados: reportesSissConfirmados,
      fecha_evaluacion: new Date(),
    },
  });

  return { documento, evaluacion, rutaRelativa };
}

async function crearFirma(evaluacionId, tipoRevisor, usuarioId, estado) {
  return prisma.revision_desempeno.create({
    data: {
      evaluacion_desempeno_id: evaluacionId,
      usuario_id: usuarioId,
      tipo_revisor: tipoRevisor,
      estado,
      fecha: new Date(),
    },
  });
}

/**
 * Un rechazo por SISS NUNCA tiene documento real detrás (corregido: antes
 * este seed creaba uno con muestra.pdf, imitando por error lo que el
 * propio servicio real hacía mal — reutilizar el flujo pesado de PDF/
 * hash/TSA solo para satisfacer la vieja restricción NOT NULL de
 * documento_id, ya eliminada del schema). documento_id queda NULL.
 */
async function crearRechazoSinDocumento(solicitud, observacionesProfesor) {
  const evaluacion = await prisma.evaluacion_desempeno.create({
    data: {
      documento_id: null,
      liberacion_proceso_id: solicitud.liberacion_proceso.id,
      estado: ESTADO_EVALUACION_RECHAZADA_POR_SISS,
      observaciones_profesor: observacionesProfesor,
      reportes_siss_confirmados: false,
      fecha_evaluacion: new Date(),
    },
  });
  return { evaluacion };
}

async function main() {
  if (!MODOS_VALIDOS.includes(MODO)) {
    throw new Error(`MODO inválido: "${MODO}". Debe ser uno de: ${MODOS_VALIDOS.join(', ')}.`);
  }

  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: SOLICITUD_REGISTRO_ID },
    include: {
      oferta: { include: { profesor: true, coordinador: true } },
      liberacion_proceso: { include: { evaluacion_desempeno: true } },
    },
  });

  if (!solicitud) {
    console.error(`❌ No existe solicitud_registro con id=${SOLICITUD_REGISTRO_ID}.`);
    process.exit(1);
  }
  if (!solicitud.liberacion_proceso) {
    console.error(`❌ La solicitud id=${SOLICITUD_REGISTRO_ID} no tiene liberacion_proceso todavía — corre CU-LSS-01 (o sembrar-requisitos-prueba.js + iniciarEvaluacion) primero.`);
    process.exit(1);
  }
  if (solicitud.liberacion_proceso.estado !== ESTADO_EVALUACION_SOLICITADA) {
    console.error(`❌ liberacion_proceso.estado es "${solicitud.liberacion_proceso.estado}", no "${ESTADO_EVALUACION_SOLICITADA}" — este seed asume que CU-LSS-02 todavía no se completó para esta solicitud.`);
    process.exit(1);
  }
  if (!solicitud.oferta?.profesor) {
    console.error(`❌ La solicitud id=${SOLICITUD_REGISTRO_ID} no tiene oferta/profesor asignado.`);
    process.exit(1);
  }

  if (solicitud.liberacion_proceso.evaluacion_desempeno) {
    console.error(`❌ Ya existe evaluacion_desempeno id=${solicitud.liberacion_proceso.evaluacion_desempeno.id} para esta solicitud (no es compatible con ningún MODO, incluido 'sin_evaluar'). Bórrala primero — ver el DELETE que imprimió la corrida anterior de este script, o:`);
    console.error(`   DELETE FROM documento WHERE id=(SELECT documento_id FROM evaluacion_desempeno WHERE liberacion_proceso_id=${solicitud.liberacion_proceso.id});`);
    process.exit(1);
  }

  console.log(`Usando solicitud_registro id=${solicitud.id} (alumno_id=${solicitud.alumno_id}), MODO="${MODO}".\n`);

  if (MODO === 'sin_evaluar') {
    console.log('✅ Nada que crear — Alterno A es la ausencia de evaluacion_desempeno, y ya se confirmó que no existe.');
    console.log('\n(No hay nada que revertir — este modo no inserta filas.)');
    await prisma.$disconnect();
    return;
  }

  if (MODO === 'rechazado_profesor') {
    const { evaluacion } = await crearRechazoSinDocumento(
      solicitud,
      'Motivo de prueba (sembrar-evaluacion-prueba): tus reportes mensuales no aparecen validados en el sistema SISS. Confirma la validación y reenvía tu solicitud.',
    );
    await crearFirma(evaluacion.id, 'profesor', solicitud.oferta.profesor.usuario_id, 'rechazado');
    console.log(`✅ Creado evaluacion_desempeno id=${evaluacion.id} (estado=${ESTADO_EVALUACION_RECHAZADA_POR_SISS}), SIN documento (un rechazo no tiene PDF real), 1 firma de profesor (rechazado).`);
    console.log('\n--- Verificación en BD ---');
    console.log(`SELECT estado, observaciones_profesor, documento_id FROM evaluacion_desempeno WHERE id=${evaluacion.id};`);
    console.log('\nPara revertir manualmente lo que creó este script:');
    console.log(`  DELETE FROM evaluacion_desempeno WHERE id=${evaluacion.id};`);
    console.log('  (cascada a revision_desempeno — no hace falta borrarla aparte; no hay archivo físico que limpiar)');
  }

  if (MODO === 'aprobado_profesor_pendiente_coordinador') {
    const { documento, evaluacion } = await crearDocumentoYEvaluacion(solicitud, ESTADO_EVALUACION_PENDIENTE_DICTAMEN);
    await crearFirma(evaluacion.id, 'profesor', solicitud.oferta.profesor.usuario_id, 'aprobado');
    console.log(`✅ Creado evaluacion_desempeno id=${evaluacion.id} (estado=${ESTADO_EVALUACION_PENDIENTE_DICTAMEN}), documento id=${documento.id}, 1 firma de profesor (aprobado), sin firma de coordinación.`);
    imprimirReversion(documento.id, solicitud.id);
  }

  if (MODO === 'ambas_firmas') {
    if (!solicitud.oferta.coordinador) {
      console.error('❌ La oferta de esta solicitud no tiene coordinador asignado — necesario para simular la firma de coordinación.');
      process.exit(1);
    }
    const { documento, evaluacion } = await crearDocumentoYEvaluacion(solicitud, ESTADO_EVALUACION_APROBADO_COORDINADOR);
    await crearFirma(evaluacion.id, 'profesor', solicitud.oferta.profesor.usuario_id, 'aprobado');
    await crearFirma(evaluacion.id, 'coordinador', solicitud.oferta.coordinador.usuario_id, 'aprobado');
    console.log(`✅ Creado evaluacion_desempeno id=${evaluacion.id} (estado=${ESTADO_EVALUACION_APROBADO_COORDINADOR}), documento id=${documento.id} (PDF real en disco), 2 firmas (profesor + coordinación, ambas aprobado).`);
    imprimirReversion(documento.id, solicitud.id);
  }

  await prisma.$disconnect();
}

function imprimirReversion(documentoId, solicitudId) {
  console.log('\n--- Verificación en BD ---');
  console.log(`SELECT estado, observaciones_profesor FROM evaluacion_desempeno WHERE liberacion_proceso_id=(SELECT id FROM liberacion_proceso WHERE solicitud_registro_id=${solicitudId});`);
  console.log('\nPara revertir manualmente lo que creó este script (el DELETE de documento ya cascada a');
  console.log('evaluacion_desempeno y de ahí a revision_desempeno, no hace falta borrarlas aparte):');
  console.log(`  DELETE FROM documento WHERE id=${documentoId};`);
  console.log('  (borra también el archivo físico en uploads/documentos/<boleta>/ correspondiente)');
}

main().catch((e) => {
  console.error('❌ Error al sembrar evaluación de prueba:', e);
  process.exit(1);
});
