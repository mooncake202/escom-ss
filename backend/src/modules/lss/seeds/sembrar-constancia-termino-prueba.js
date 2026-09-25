// sembrar-constancia-termino-prueba.js
//
// Script de prueba MANUAL (no seed automático de CI) — necesario porque
// CU-LSS-11 (coordinación emite/sube la constancia) todavía no existe.
// Simula ese paso: dado un solicitud_registro_id con
// liberacion_proceso.estado='solicitud_constancia_termino' (CU-LSS-08,
// solicitarConstanciaTermino), crea un documento real
// (tipo_documento='constancia_termino') — PDF de prueba simple, cifrado,
// guardado en la ruta correcta, con nombre_expediente='<BOLETA>_
// CONSTANCIA_TERMINO.pdf' (mismo mecanismo de cifrado/carpeta que
// subirExpedienteLss). liberacion_proceso.estado NO cambia (confirmado
// con el usuario: CU-LSS-10 y CU-LSS-11 no tocan esa columna — RN-LSS-30
// se satisface con la sola existencia de la fila documento).
//
// USO:
//   1. Edita SOLICITUD_REGISTRO_ID abajo.
//   2. docker compose exec backend node backend/src/modules/lss/seeds/sembrar-constancia-termino-prueba.js

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { cifrarBuffer, generarNombreSeguro } = require('../../../lib/fileEncryption');
const { ESTADO_SOLICITUD_CONSTANCIA_TERMINO } = require('../lss.shared');

const SOLICITUD_REGISTRO_ID = 1; // <-- edita este valor antes de correr

// Mismo criterio que RUTA_BASE_DOCUMENTOS en lss-alumno.service.js —
// duplicado a propósito (RN de separación por módulo).
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../../uploads/documentos');

// PDF mínimo válido — basta para simular un archivo real de prueba, no
// necesita contenido real (mismo criterio ya usado en pruebas anteriores
// del módulo).
const PDF_DE_PRUEBA = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Size 4/Root 1 0 R>>\n%%EOF',
);

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
  if (solicitud.liberacion_proceso.estado !== ESTADO_SOLICITUD_CONSTANCIA_TERMINO) {
    console.error(`❌ liberacion_proceso.estado es "${solicitud.liberacion_proceso.estado}", no "${ESTADO_SOLICITUD_CONSTANCIA_TERMINO}" — completa CU-LSS-08 (solicitar constancia) para esta solicitud primero.`);
    process.exit(1);
  }

  const boleta = solicitud.alumno_id;

  const yaExiste = await prisma.documento.findFirst({ where: { alumno_id: boleta, tipo_documento: 'constancia_termino' } });
  if (yaExiste) {
    console.error(`❌ Ya existe un documento constancia_termino (id=${yaExiste.id}) para el alumno ${boleta} — este seed no sobreescribe, bórralo manualmente primero si quieres repetir la prueba.`);
    process.exit(1);
  }

  const coordinador = await prisma.coordinador.findFirst();
  if (!coordinador) {
    console.error('❌ No existe ningún coordinador en la BD para usar como creador_id.');
    process.exit(1);
  }

  const nombreConstancia = `${boleta}_CONSTANCIA_TERMINO.pdf`;
  const carpetaAlumno = path.join(RUTA_BASE_DOCUMENTOS, boleta);
  fs.mkdirSync(carpetaAlumno, { recursive: true });
  const rutaRelativa = path.join(boleta, generarNombreSeguro());
  fs.writeFileSync(path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa), cifrarBuffer(PDF_DE_PRUEBA));

  const documento = await prisma.documento.create({
    data: {
      alumno_id: boleta,
      creador_id: coordinador.usuario_id,
      tipo_documento: 'constancia_termino',
      fecha_creacion: new Date(),
      estado_documento: 'aprobado', // mismo valor que otros documentos administrativos sin ciclo de revisión propio (carta_creditos, constancia_seguro_social) — obligatorio en el schema, RN-LSS-30 no depende de este campo.
      ruta_archivo: rutaRelativa,
      nombre_expediente: nombreConstancia,
    },
  });

  console.log(`✅ documento id=${documento.id} creado (constancia_termino) para boleta ${boleta}, nombre_expediente="${nombreConstancia}".`);
  console.log('\nPara revertir manualmente lo que hizo este script:');
  console.log(`  -- primero borra el archivo físico: ${path.join(RUTA_BASE_DOCUMENTOS, rutaRelativa)}`);
  console.log(`  DELETE FROM documento WHERE id=${documento.id};`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al sembrar constancia de término de prueba:', e);
  process.exit(1);
});
