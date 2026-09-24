// sembrar-dictamen-expediente-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) — necesario porque
// CU-LSS-09 (coordinación dictamina el expediente) todavía no existe.
// Simula ese paso: dado un solicitud_registro_id con un documento
// expediente_lss real en 'en_revision' (CU-LSS-07, subirExpedienteLss),
// actualiza documento.estado_documento a 'aprobado' o 'rechazado'.
//
// Mismo patrón confirmado contra GR (gr-coordinador.service.js,
// decidirExpediente) al construir CU-LSS-08:
// - Aprobar: documento.estado_documento='aprobado' Y
//   liberacion_proceso.observaciones_rechazo=NULL (se limpia AQUÍ, no al
//   reenviar — mismo criterio que motivo_rechazo en GR, que solo se
//   limpia al aprobar definitivamente).
// - Rechazar: documento.estado_documento='rechazado' Y
//   liberacion_proceso.observaciones_rechazo=<motivo> (RF-LSS-38).
// liberacion_proceso.estado se queda en 'expediente_en_revision' en
// AMBOS casos (mismo criterio ya establecido: la fase no cambia hasta
// que el alumno actúa — solicita constancia o corrige y reenvía).
//
// USO:
//   1. Edita SOLICITUD_REGISTRO_ID y MODO abajo.
//   2. docker compose exec backend node backend/src/modules/lss/seeds/sembrar-dictamen-expediente-prueba.js

const prisma = require('../../../lib/prisma');
const {
  ESTADO_EXPEDIENTE_EN_REVISION,
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION,
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO,
  ESTADO_DOCUMENTO_EXPEDIENTE_LSS_APROBADO,
} = require('../lss.shared');

const SOLICITUD_REGISTRO_ID = 1; // <-- edita este valor antes de correr
const MODO = 'aprobado'; // <-- edita: 'aprobado' | 'rechazado'
const MOTIVO_RECHAZO_PRUEBA = 'Falta la firma del profesor en la carta compromiso escaneada.';

const MODOS_VALIDOS = ['aprobado', 'rechazado'];

async function main() {
  if (!MODOS_VALIDOS.includes(MODO)) {
    throw new Error(`MODO inválido: "${MODO}". Debe ser uno de: ${MODOS_VALIDOS.join(', ')}.`);
  }

  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: SOLICITUD_REGISTRO_ID },
    include: { liberacion_proceso: true },
  });

  if (!solicitud) {
    console.error(`❌ No existe solicitud_registro con id=${SOLICITUD_REGISTRO_ID}.`);
    process.exit(1);
  }
  if (!solicitud.liberacion_proceso) {
    console.error(`❌ La solicitud id=${SOLICITUD_REGISTRO_ID} no tiene liberacion_proceso todavía.`);
    process.exit(1);
  }
  const proceso = solicitud.liberacion_proceso;
  if (proceso.estado !== ESTADO_EXPEDIENTE_EN_REVISION) {
    console.error(`❌ liberacion_proceso.estado es "${proceso.estado}", no "${ESTADO_EXPEDIENTE_EN_REVISION}" — completa CU-LSS-07 (enviar expediente) para esta solicitud primero.`);
    process.exit(1);
  }

  const documento = await prisma.documento.findFirst({ where: { alumno_id: solicitud.alumno_id, tipo_documento: 'expediente_lss' } });
  if (!documento) {
    console.error(`❌ No existe documento expediente_lss para el alumno ${solicitud.alumno_id} — envía un expediente real (CU-LSS-07) primero.`);
    process.exit(1);
  }
  if (documento.estado_documento !== ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION) {
    console.error(`❌ documento.estado_documento ya es "${documento.estado_documento}", no "${ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION}" — este seed asume que todavía no se dictaminó.`);
    process.exit(1);
  }

  if (MODO === 'aprobado') {
    await prisma.$transaction([
      prisma.documento.update({ where: { id: documento.id }, data: { estado_documento: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_APROBADO } }),
      prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { observaciones_rechazo: null } }),
    ]);
    console.log(`✅ documento id=${documento.id} -> estado_documento=${ESTADO_DOCUMENTO_EXPEDIENTE_LSS_APROBADO}. observaciones_rechazo limpiada.`);
    console.log('\nPara revertir manualmente lo que hizo este script:');
    console.log(`  UPDATE documento SET estado_documento='${ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION}' WHERE id=${documento.id};`);
  } else {
    await prisma.$transaction([
      prisma.documento.update({ where: { id: documento.id }, data: { estado_documento: ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO } }),
      prisma.liberacion_proceso.update({ where: { id: proceso.id }, data: { observaciones_rechazo: MOTIVO_RECHAZO_PRUEBA } }),
    ]);
    console.log(`✅ documento id=${documento.id} -> estado_documento=${ESTADO_DOCUMENTO_EXPEDIENTE_LSS_RECHAZADO}. observaciones_rechazo="${MOTIVO_RECHAZO_PRUEBA}".`);
    console.log('\nPara revertir manualmente lo que hizo este script:');
    console.log(`  UPDATE documento SET estado_documento='${ESTADO_DOCUMENTO_EXPEDIENTE_LSS_EN_REVISION}' WHERE id=${documento.id};`);
    console.log(`  UPDATE liberacion_proceso SET observaciones_rechazo=NULL WHERE id=${proceso.id};`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al sembrar dictamen de expediente de prueba:', e);
  process.exit(1);
});
