// sembrar-carta-termino-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) — necesario porque
// CU-LSS-06 (coordinación marca la carta como lista para recoger) todavía
// no existe. Simula ese paso: dado un solicitud_registro_id con
// liberacion_proceso.estado ya en 'solicitud_carta_termino' (CU-LSS-02,
// solicitarCartaTermino), actualiza la fila carta_termino correspondiente
// a estado='lista_para_recoger' + fecha_disponible=ahora.
//
// En el flujo real, la fila carta_termino ya existe en ese punto (la crea
// solicitarCartaTermino, estado='solicitada') — este script normalmente
// solo la ACTUALIZA. Por robustez también la CREA si por algún motivo
// faltara (defensivo, no debería pasar).
//
// USO:
//   1. Edita SOLICITUD_REGISTRO_ID abajo.
//   2. docker compose exec backend node backend/src/modules/lss/seeds/sembrar-carta-termino-prueba.js

const prisma = require('../../../lib/prisma');
const {
  ESTADO_SOLICITUD_CARTA_TERMINO,
  ESTADO_CARTA_SOLICITADA,
  ESTADO_CARTA_LISTA_PARA_RECOGER,
} = require('../lss.shared');

const SOLICITUD_REGISTRO_ID = 1; // <-- edita este valor antes de correr

async function main() {
  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: SOLICITUD_REGISTRO_ID },
    include: { liberacion_proceso: { include: { carta_termino: true } } },
  });

  if (!solicitud) {
    console.error(`❌ No existe solicitud_registro con id=${SOLICITUD_REGISTRO_ID}.`);
    process.exit(1);
  }
  if (!solicitud.liberacion_proceso) {
    console.error(`❌ La solicitud id=${SOLICITUD_REGISTRO_ID} no tiene liberacion_proceso todavía.`);
    process.exit(1);
  }
  if (solicitud.liberacion_proceso.estado !== ESTADO_SOLICITUD_CARTA_TERMINO) {
    console.error(`❌ liberacion_proceso.estado es "${solicitud.liberacion_proceso.estado}", no "${ESTADO_SOLICITUD_CARTA_TERMINO}" — completa CU-LSS-02 (Alterno D, solicitar carta de término) para esta solicitud primero.`);
    process.exit(1);
  }

  const proceso = solicitud.liberacion_proceso;
  const fechaDisponible = new Date();

  if (proceso.carta_termino) {
    if (proceso.carta_termino.estado !== ESTADO_CARTA_SOLICITADA) {
      console.error(`❌ carta_termino.estado ya es "${proceso.carta_termino.estado}" (no "${ESTADO_CARTA_SOLICITADA}") — este seed asume que todavía no se marcó como lista.`);
      process.exit(1);
    }
    await prisma.carta_termino.update({
      where: { id: proceso.carta_termino.id },
      data: { estado: ESTADO_CARTA_LISTA_PARA_RECOGER, fecha_disponible: fechaDisponible },
    });
    console.log(`✅ Actualizada carta_termino id=${proceso.carta_termino.id} -> estado=${ESTADO_CARTA_LISTA_PARA_RECOGER}, fecha_disponible=${fechaDisponible.toISOString()}.`);
    console.log('\n--- Verificación en BD ---');
    console.log(`SELECT estado, fecha_disponible FROM carta_termino WHERE id=${proceso.carta_termino.id};`);
    console.log('\nPara revertir manualmente lo que hizo este script:');
    console.log(`  UPDATE carta_termino SET estado='${ESTADO_CARTA_SOLICITADA}', fecha_disponible=NULL WHERE id=${proceso.carta_termino.id};`);
  } else {
    // Defensivo — no debería ocurrir en el flujo real (solicitarCartaTermino ya la crea).
    const carta = await prisma.carta_termino.create({
      data: {
        liberacion_proceso_id: proceso.id,
        estado: ESTADO_CARTA_LISTA_PARA_RECOGER,
        carta_recogida: false,
        fecha_solicitud: fechaDisponible,
        fecha_disponible: fechaDisponible,
      },
    });
    console.log(`✅ Creada carta_termino id=${carta.id} (no existía) -> estado=${ESTADO_CARTA_LISTA_PARA_RECOGER}.`);
    console.log('\nPara revertir manualmente lo que hizo este script:');
    console.log(`  DELETE FROM carta_termino WHERE id=${carta.id};`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al sembrar carta de término de prueba:', e);
  process.exit(1);
});
