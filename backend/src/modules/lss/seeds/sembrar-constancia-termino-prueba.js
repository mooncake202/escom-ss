// sembrar-constancia-termino-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) — simula el paso de
// CU-LSS-11 (coordinación redacta el mensaje de la constancia) cuando se
// necesita dejar a un alumno de prueba en estado 'constancia_disponible'
// sin pasar por la UI real. CORRECCIÓN ARQUITECTÓNICA (reemplaza la
// versión anterior de este seed, basada en archivo/documento): la
// constancia ya NO es un PDF que el sistema suba/cifre — es un mensaje de
// texto libre guardado directo en
// liberacion_proceso.mensaje_constancia_termino. No crea ninguna fila
// `documento` ni ningún archivo en disco.
//
// USO:
//   1. Edita SOLICITUD_REGISTRO_ID abajo.
//   2. docker compose exec backend node backend/src/modules/lss/seeds/sembrar-constancia-termino-prueba.js

const prisma = require('../../../lib/prisma');
const { ESTADO_SOLICITUD_CONSTANCIA_TERMINO, ESTADO_CONSTANCIA_DISPONIBLE } = require('../lss.shared');

const SOLICITUD_REGISTRO_ID = 1; // <-- edita este valor antes de correr

const MENSAJE_DE_PRUEBA = 'Tu constancia de término ya está lista. Descárgala desde https://serviciosocialconstancias.ipn.mx usando tu boleta y CURP.';

async function main() {
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
  if (proceso.estado !== ESTADO_SOLICITUD_CONSTANCIA_TERMINO && proceso.estado !== ESTADO_CONSTANCIA_DISPONIBLE) {
    console.error(`❌ liberacion_proceso.estado es "${proceso.estado}" — debe ser "${ESTADO_SOLICITUD_CONSTANCIA_TERMINO}" o "${ESTADO_CONSTANCIA_DISPONIBLE}" (completa CU-LSS-08, solicitar constancia, primero).`);
    process.exit(1);
  }

  await prisma.liberacion_proceso.update({
    where: { id: proceso.id },
    data: { mensaje_constancia_termino: MENSAJE_DE_PRUEBA, estado: ESTADO_CONSTANCIA_DISPONIBLE },
  });

  console.log(`✅ liberacion_proceso id=${proceso.id} -> mensaje_constancia_termino guardado, estado="${ESTADO_CONSTANCIA_DISPONIBLE}".`);
  console.log('\nPara revertir manualmente lo que hizo este script:');
  console.log(`  UPDATE liberacion_proceso SET mensaje_constancia_termino=NULL, estado='${ESTADO_SOLICITUD_CONSTANCIA_TERMINO}' WHERE id=${proceso.id};`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al sembrar constancia de término de prueba:', e);
  process.exit(1);
});
