// sembrar-requisitos-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) para poder probar
// CU-LSS-01 sin depender de los módulos reales de Reportes ni Ofertas
// (ninguno de los dos existe todavía — las tablas sí, pero ningún
// service/lógica real las usa hoy). NO construye ninguna lógica de
// negocio de reportes ni de cambio de estado de oferta — solo inserta
// filas de prueba directamente, con datos plausibles.
//
// Qué hace, para la solicitud_registro indicada en SOLICITUD_REGISTRO_ID:
//   1. Crea reporte_mensual (num_reporte 1..6) con su documento y su
//      revision_reporte_mensual en estado 'aprobado' — idempotente, si ya
//      existen 6 o más reportes aprobados para esa solicitud, los omite.
//   2. Crea (si no existe) 1 reporte_global con su documento y su
//      revision_reporte_global en estado 'aprobado'.
//   3. Si MARCAR_OFERTA_CONCLUIDA=true, actualiza
//      oferta_servicio.estado_oferta = 'Concluida' para la oferta de esa
//      solicitud (solo aplica de verdad a ofertas tipo_oferta='individual'
//      — RN-LSS-02).
//
// NO toca cumulo_horas_y_faltas (las 480h se ajustan aparte, con datos
// reales de AH o con un UPDATE manual — ver nota al final del archivo).
//
// USO:
//   1. Edita SOLICITUD_REGISTRO_ID (y opcionalmente MARCAR_OFERTA_CONCLUIDA)
//      abajo con los valores reales que quieras probar.
//   2. node backend/src/modules/lss/seeds/sembrar-requisitos-prueba.js
//      (o `docker compose exec backend node src/modules/lss/seeds/sembrar-requisitos-prueba.js`
//      si corres el stack en Docker, ejecutando desde dentro del contenedor backend).

const prisma = require('../../../lib/prisma');

const SOLICITUD_REGISTRO_ID = 1; // <-- edita este valor antes de correr
const MARCAR_OFERTA_CONCLUIDA = false; // <-- true solo si quieres probar el requisito de oferta concluida

async function crearReporteMensualAprobado(solicitud, numReporte) {
  const documento = await prisma.documento.create({
    data: {
      alumno_id: solicitud.alumno_id,
      creador_id: solicitud.alumno.usuario_id,
      tipo_documento: 'reporte_mensual',
      fecha_creacion: new Date(),
      estado_documento: 'aprobado',
      ruta_archivo: `/seed/reporte-mensual-${solicitud.id}-${numReporte}.pdf`,
    },
  });

  const reporte = await prisma.reporte_mensual.create({
    data: {
      solicitud_registro_id: solicitud.id,
      documento_id: documento.id,
      num_reporte: numReporte,
      actividades_mes: `[PRUEBA] Actividades del mes ${numReporte}.`,
      estado_reporte: 'aprobado',
    },
  });

  await prisma.revision_reporte_mensual.create({
    data: {
      reporte_mensual_id: reporte.id,
      usuario_id: solicitud.oferta.profesor.usuario_id,
      tipo_revisor: 'profesor',
      estado: 'aprobado',
      fecha: new Date(),
    },
  });

  return reporte;
}

async function crearReporteGlobalAprobado(solicitud) {
  const documento = await prisma.documento.create({
    data: {
      alumno_id: solicitud.alumno_id,
      creador_id: solicitud.alumno.usuario_id,
      tipo_documento: 'reporte_global',
      fecha_creacion: new Date(),
      estado_documento: 'aprobado',
      ruta_archivo: `/seed/reporte-global-${solicitud.id}.pdf`,
    },
  });

  const reporte = await prisma.reporte_global.create({
    data: {
      solicitud_registro_id: solicitud.id,
      documento_id: documento.id,
      actividades_resumen: '[PRUEBA] Resumen global de actividades del servicio social.',
      estado_reporte: 'aprobado',
    },
  });

  await prisma.revision_reporte_global.create({
    data: {
      reporte_global_id: reporte.id,
      usuario_id: solicitud.oferta.profesor.usuario_id,
      tipo_revisor: 'profesor',
      estado: 'aprobado',
      fecha: new Date(),
    },
  });

  return reporte;
}

async function main() {
  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { id: SOLICITUD_REGISTRO_ID },
    include: {
      alumno: true,
      oferta: { include: { profesor: true } },
    },
  });

  if (!solicitud) {
    console.error(`❌ No existe solicitud_registro con id=${SOLICITUD_REGISTRO_ID}.`);
    process.exit(1);
  }
  if (!solicitud.oferta?.profesor) {
    console.error(`❌ La solicitud id=${SOLICITUD_REGISTRO_ID} no tiene oferta/profesor asignado — necesario para firmar las revisiones de prueba.`);
    process.exit(1);
  }

  console.log(`Usando solicitud_registro id=${solicitud.id} (alumno_id=${solicitud.alumno_id}).\n`);

  // 1. Reportes mensuales (6, idempotente por num_reporte).
  const existentes = await prisma.reporte_mensual.findMany({
    where: { solicitud_registro_id: solicitud.id },
    include: { revision_reporte_mensual: { orderBy: { fecha: 'desc' } } },
  });
  const numsExistentesAprobados = new Set(
    existentes.filter((r) => r.revision_reporte_mensual[0]?.estado === 'aprobado').map((r) => r.num_reporte),
  );

  const creados = [];
  for (let n = 1; n <= 6; n++) {
    if (numsExistentesAprobados.has(n)) {
      console.log(`↷ Ya existe reporte_mensual num_reporte=${n} aprobado — se omite.`);
      continue;
    }
    const reporte = await crearReporteMensualAprobado(solicitud, n);
    creados.push(reporte.id);
    console.log(`✅ Creado reporte_mensual id=${reporte.id} (num_reporte=${n}), aprobado.`);
  }

  // 2. Reporte global (1, idempotente).
  const globalExistente = await prisma.reporte_global.findFirst({
    where: { solicitud_registro_id: solicitud.id },
    include: { revision_reporte_global: { orderBy: { fecha: 'desc' } } },
  });
  if (globalExistente?.revision_reporte_global[0]?.estado === 'aprobado') {
    console.log(`↷ Ya existe reporte_global id=${globalExistente.id} aprobado — se omite.`);
  } else {
    const global = await crearReporteGlobalAprobado(solicitud);
    console.log(`✅ Creado reporte_global id=${global.id}, aprobado.`);
  }

  // 3. Oferta concluida (opcional).
  if (MARCAR_OFERTA_CONCLUIDA) {
    await prisma.oferta_servicio.update({
      where: { id: solicitud.oferta.id },
      data: { estado_oferta: 'Concluida' },
    });
    console.log(`✅ oferta_servicio id=${solicitud.oferta.id} (tipo_oferta=${solicitud.oferta.tipo_oferta}) marcada como 'Concluida'.`);
    if (solicitud.oferta.tipo_oferta !== 'individual') {
      console.log(`  (nota: RN-LSS-02 dice que este requisito NO aplica a tipo_oferta='proyecto' — se marcó igual porque lo pediste, pero no debería bloquear/afectar la validación.)`);
    }
  }

  console.log('\n--- Resumen ---');
  console.log(`Reportes mensuales aprobados creados en esta corrida: ${creados.length}.`);

  console.log('\n--- Verificación en BD ---');
  const totalMensualesAprobados = await prisma.reporte_mensual.count({
    where: { solicitud_registro_id: solicitud.id, revision_reporte_mensual: { some: { estado: 'aprobado' } } },
  });
  console.log(`reporte_mensual aprobados para esta solicitud: ${totalMensualesAprobados}`);
  const ofertaActual = await prisma.oferta_servicio.findUnique({ where: { id: solicitud.oferta.id } });
  console.log(`oferta_servicio.estado_oferta actual: ${ofertaActual.estado_oferta} (tipo_oferta: ${ofertaActual.tipo_oferta})`);

  console.log('\nRecuerda: este script NO toca cumulo_horas_y_faltas. Para simular las 480h netas, ajusta');
  console.log('manualmente esa fila (horas_acumuladas - horas_rechazadas >= 480) o regístralas con datos');
  console.log('reales de AH-03. Para revertir manualmente lo que creó este script:');
  console.log(`  DELETE FROM revision_reporte_mensual WHERE reporte_mensual_id IN (SELECT id FROM reporte_mensual WHERE solicitud_registro_id=${solicitud.id});`);
  console.log(`  DELETE FROM reporte_mensual WHERE solicitud_registro_id=${solicitud.id};`);
  console.log(`  DELETE FROM revision_reporte_global WHERE reporte_global_id IN (SELECT id FROM reporte_global WHERE solicitud_registro_id=${solicitud.id});`);
  console.log(`  DELETE FROM reporte_global WHERE solicitud_registro_id=${solicitud.id};`);
  console.log(`  DELETE FROM documento WHERE ruta_archivo LIKE '/seed/reporte-%-${solicitud.id}%';`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al sembrar requisitos de prueba:', e);
  process.exit(1);
});
