// seed-manual-cupos-crear.js
//
// Seed PERSISTENTE (no se autolimpia, a diferencia de
// seed-prueba-cupos-profesor.js) para que un humano pruebe manualmente en
// el navegador el feature de cupos por profesor. Crea 3 escenarios (A, B,
// D) usando SOLO las funciones de servicio reales (gr-profesor.service.js /
// gr.service.js / gr-coordinador.service.js), deja algunos alumnos ya
// aceptados (para dejar a cada profesor en el estado de partida correcto)
// y otros a propósito PENDIENTES para que el usuario los acepte a mano
// desde la pantalla de CU-GR-02 y observe el resultado en vivo.
//
// Su hermano seed-manual-cupos-borrar.js borra todo esto cuando el usuario
// decida — nunca se autoejecuta desde aquí.
//
// Requisitos antes de correr:
//   - Debe existir ya la característica "Investigador" en el catálogo
//     (correr antes backend/src/lib/seedCaracteristicas.js).
//   - El archivo muestra.pdf debe existir en la raíz del repositorio
//     (necesario para el paso de adjuntarDocumentacionInicial del Escenario D).
//
// Cómo correr (dentro del contenedor del backend):
//   docker compose exec backend node backend/src/modules/gr/seeds/seed-manual-cupos-crear.js

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const MUESTRA_PDF_PATH = path.join(__dirname, '../../../../../muestra.pdf');
if (!fs.existsSync(MUESTRA_PDF_PATH)) {
  console.error('❌ No se encontró el PDF de muestra necesario para el Escenario D.');
  console.error(`   Ruta absoluta esperada: ${MUESTRA_PDF_PATH}`);
  process.exit(1);
}
const MUESTRA_PDF = fs.readFileSync(MUESTRA_PDF_PATH);

const prisma = require('../../../lib/prisma');
const grService = require('../gr.service');
const grCoordinadorService = require('../gr-coordinador.service');
const grProfesorService = require('../gr-profesor.service');

const {
  PASSWORD_PLANO, CARRERA_NOMBRE,
  COORDINADOR, PROFESOR_A, PROFESOR_B, PROFESOR_D,
  NOMBRE_OFERTA_A1, NOMBRE_OFERTA_B1, NOMBRE_OFERTA_D1, NOMBRE_OFERTA_D2, NOMBRE_PERIODO,
  ALUMNOS, boletaDe, correoDe,
} = require('./seed-manual-cupos.shared');

function archivo(buffer) {
  return { buffer };
}

// ─────────────────────────────────────────────────────────────
// 1. Verificación previa de duplicados — mismo criterio que los otros 2 seeds.
// ─────────────────────────────────────────────────────────────
async function verificarSinDuplicados() {
  const correosAlumnos = Object.values(ALUMNOS).map(correoDe);
  const boletasAlumnos = Object.values(ALUMNOS).map(boletaDe);
  const correosTodos = [COORDINADOR.correo_institucional, PROFESOR_A.correo_institucional, PROFESOR_B.correo_institucional, PROFESOR_D.correo_institucional, ...correosAlumnos];

  const usuariosExistentes = await prisma.usuario.findMany({ where: { correo_institucional: { in: correosTodos } }, select: { correo_institucional: true } });
  const alumnosExistentes = await prisma.alumno.findMany({ where: { boleta: { in: boletasAlumnos } }, select: { boleta: true } });
  const ofertasExistentes = await prisma.oferta_servicio.findMany({ where: { nombre_proyecto: { in: [NOMBRE_OFERTA_A1, NOMBRE_OFERTA_B1, NOMBRE_OFERTA_D1, NOMBRE_OFERTA_D2] } }, select: { nombre_proyecto: true } });

  const problemas = [];
  if (usuariosExistentes.length > 0) problemas.push(`  - Correos ya registrados: ${usuariosExistentes.map((u) => u.correo_institucional).join(', ')}`);
  if (alumnosExistentes.length > 0) problemas.push(`  - Boletas ya registradas: ${alumnosExistentes.map((a) => a.boleta).join(', ')}`);
  if (ofertasExistentes.length > 0) problemas.push(`  - Ofertas ya registradas: ${ofertasExistentes.map((o) => o.nombre_proyecto).join(', ')}`);

  if (problemas.length > 0) {
    throw new Error(
      'Ya existen datos de una corrida previa de seed-manual-cupos-crear (o no se ha corrido seed-manual-cupos-borrar todavía). ' +
      'No se insertó nada nuevo. Esto es lo que se encontró:\n' + problemas.join('\n') +
      '\n\nCorre backend/src/modules/gr/seeds/seed-manual-cupos-borrar.js antes de reintentar.'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Creación de entidades dedicadas.
// ─────────────────────────────────────────────────────────────
async function crearEntidadesDedicadas() {
  const caracteristicaInvestigador = await prisma.caracteristica.findFirst({ where: { nombre: 'Investigador' } });
  if (!caracteristicaInvestigador) {
    throw new Error('No existe la característica Investigador en el catálogo. Corre primero backend/src/lib/seedCaracteristicas.js.');
  }

  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  const ctx = await prisma.$transaction(async (tx) => {
    const coordinadorUsuario = await tx.usuario.create({
      data: { correo_institucional: COORDINADOR.correo_institucional, contrasena: hash, nombre: COORDINADOR.nombre, apellidos: COORDINADOR.apellidos, rol: 'coordinador', fecha_creacion: ahora },
    });
    const coordinadorCreado = await tx.coordinador.create({ data: { usuario_id: coordinadorUsuario.id } });

    const profesorAUsuario = await tx.usuario.create({
      data: { correo_institucional: PROFESOR_A.correo_institucional, contrasena: hash, nombre: PROFESOR_A.nombre, apellidos: PROFESOR_A.apellidos, rol: 'profesor', fecha_creacion: ahora },
    });
    const profesorACreado = await tx.profesor.create({
      data: { usuario_id: profesorAUsuario.id, departamento: 'Prueba manual', telefono_personal: '5522220000', horario_atencion: 'N/A', cubiculo: 'N/A', cupos_totales: PROFESOR_A.cupos_totales },
    });

    const profesorBUsuario = await tx.usuario.create({
      data: { correo_institucional: PROFESOR_B.correo_institucional, contrasena: hash, nombre: PROFESOR_B.nombre, apellidos: PROFESOR_B.apellidos, rol: 'profesor', fecha_creacion: ahora },
    });
    const profesorBCreado = await tx.profesor.create({
      data: { usuario_id: profesorBUsuario.id, departamento: 'Prueba manual', telefono_personal: '5522220001', horario_atencion: 'N/A', cubiculo: 'N/A', cupos_totales: PROFESOR_B.cupos_totales },
    });
    await tx.solicitud_caracteristica.create({
      data: { profesor_id: profesorBCreado.id, caracteristica_id: caracteristicaInvestigador.id, justificacion: 'Asignada por seed-manual-cupos-crear (Escenario B).', estado: 'aprobado', fecha: ahora, fecha_respuesta: ahora },
    });

    const profesorDUsuario = await tx.usuario.create({
      data: { correo_institucional: PROFESOR_D.correo_institucional, contrasena: hash, nombre: PROFESOR_D.nombre, apellidos: PROFESOR_D.apellidos, rol: 'profesor', fecha_creacion: ahora },
    });
    const profesorDCreado = await tx.profesor.create({
      data: { usuario_id: profesorDUsuario.id, departamento: 'Prueba manual', telefono_personal: '5522220002', horario_atencion: 'N/A', cubiculo: 'N/A', cupos_totales: PROFESOR_D.cupos_totales },
    });
    // Asignación INDEPENDIENTE de la de Profesor B — nunca se reutiliza la
    // fila de B, para que los conteos de B y D jamás se mezclen.
    await tx.solicitud_caracteristica.create({
      data: { profesor_id: profesorDCreado.id, caracteristica_id: caracteristicaInvestigador.id, justificacion: 'Asignada por seed-manual-cupos-crear (Escenario D).', estado: 'aprobado', fecha: ahora, fecha_respuesta: ahora },
    });

    return {
      coordinadorId: coordinadorCreado.id, coordinadorUsuarioId: coordinadorUsuario.id,
      profesorAId: profesorACreado.id, profesorAUsuarioId: profesorAUsuario.id,
      profesorBId: profesorBCreado.id, profesorBUsuarioId: profesorBUsuario.id,
      profesorDId: profesorDCreado.id, profesorDUsuarioId: profesorDUsuario.id,
    };
  });

  let carrera = await prisma.carrera.findFirst({ where: { nombre: CARRERA_NOMBRE } });
  if (!carrera) carrera = await prisma.carrera.create({ data: { nombre: CARRERA_NOMBRE } });

  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() + 365);
  const fechaMaxExpediente = new Date(fechaInicio);
  fechaMaxExpediente.setDate(fechaMaxExpediente.getDate() - 65);

  const eventoCalendario = await prisma.evento_calendario.create({
    data: { coordinador_id: ctx.coordinadorId, nombre: NOMBRE_PERIODO, tipo: 'Periodo', fecha_inicio: fechaInicio, fecha_fin: null },
  });
  const periodoRegistro = await prisma.periodo_registro.create({
    data: { evento_calendario_id: eventoCalendario.id, anio: String(fechaInicio.getFullYear()), semestre: 's01', fecha_max_expediente: fechaMaxExpediente },
  });

  const ofertaA1 = await prisma.oferta_servicio.create({
    data: {
      profesor_id: ctx.profesorAId, coordinador_id: ctx.coordinadorId,
      nombre_SISS: 'MANUALCUPOS - A1', programa_SISS: 'Programa de pruebas MANUAL-CUPOS',
      nombre_proyecto: NOMBRE_OFERTA_A1, tipo_oferta: 'individual',
      descripcion_actividades: 'Escenario A: profesor sin Investigador, ya lleno.',
      cupos_ofertados: 10, cupos_investigador: null, cupos_disponibles: 10, estado_oferta: 'Aprobada', fecha_registro: new Date(),
    },
  });
  const ofertaB1 = await prisma.oferta_servicio.create({
    data: {
      profesor_id: ctx.profesorBId, coordinador_id: ctx.coordinadorId,
      nombre_SISS: 'MANUALCUPOS - B1', programa_SISS: 'Programa de pruebas MANUAL-CUPOS',
      nombre_proyecto: NOMBRE_OFERTA_B1, tipo_oferta: 'proyecto',
      descripcion_actividades: 'Escenario B: profesor con Investigador, respaldo disponible.',
      cupos_ofertados: 3, cupos_investigador: 3, cupos_disponibles: 3, estado_oferta: 'Aprobada', fecha_registro: new Date(),
    },
  });
  const ofertaD1 = await prisma.oferta_servicio.create({
    data: {
      profesor_id: ctx.profesorDId, coordinador_id: ctx.coordinadorId,
      nombre_SISS: 'MANUALCUPOS - D1', programa_SISS: 'Programa de pruebas MANUAL-CUPOS',
      nombre_proyecto: NOMBRE_OFERTA_D1, tipo_oferta: 'proyecto',
      descripcion_actividades: 'Escenario D: oferta proyecto original del profesor D.',
      cupos_ofertados: 3, cupos_investigador: 3, cupos_disponibles: 3, estado_oferta: 'Aprobada', fecha_registro: new Date(),
    },
  });
  const ofertaD2 = await prisma.oferta_servicio.create({
    data: {
      profesor_id: ctx.profesorDId, coordinador_id: ctx.coordinadorId,
      nombre_SISS: 'MANUALCUPOS - D2', programa_SISS: 'Programa de pruebas MANUAL-CUPOS',
      nombre_proyecto: NOMBRE_OFERTA_D2, tipo_oferta: 'individual',
      descripcion_actividades: 'Escenario D: segunda oferta (individual) del MISMO profesor D, para la competencia.',
      cupos_ofertados: 10, cupos_investigador: null, cupos_disponibles: 10, estado_oferta: 'Aprobada', fecha_registro: new Date(),
    },
  });

  return { ...ctx, carreraId: carrera.id, periodoId: periodoRegistro.id, ofertaA1Id: ofertaA1.id, ofertaB1Id: ofertaB1.id, ofertaD1Id: ofertaD1.id, ofertaD2Id: ofertaD2.id };
}

// ─────────────────────────────────────────────────────────────
// 3. Alta de un alumno — mismo patrón que los otros 2 seeds.
// ─────────────────────────────────────────────────────────────
async function crearAlumnoInicial({ clave, apellido, ofertaId, carreraId, periodoId }) {
  const n = ALUMNOS[clave];
  const boleta = boletaDe(n);
  const correo = correoDe(n);
  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  const { usuarioId, solicitudId } = await prisma.$transaction(async (tx) => {
    const usuarioCreado = await tx.usuario.create({
      data: { rol: 'alumno_sin_asignar', correo_institucional: correo, nombre: `MANUALCUPOS${String(n).padStart(4, '0')}`, apellidos: apellido, contrasena: hash, fecha_creacion: ahora },
    });
    await tx.alumno.create({
      data: { boleta, usuario_id: usuarioCreado.id, celular: `55${String(n).padStart(8, '0')}`, carrera: CARRERA_NOMBRE, creditos: '85.00', semestre: 8, correo_personal: null },
    });
    const solicitudCreada = await tx.solicitud_registro.create({
      data: {
        alumno_id: boleta, carrera_id: carreraId, dictamen: null, periodo_registro_id: periodoId, oferta_id: ofertaId,
        motivacion_oferta: `Motivación de prueba generada por seed-manual-cupos-crear para ${boleta}.`,
        estado_solicitud: 'espera_respuesta_de_profesor', estado_anterior: null, fecha_aplicacion: ahora,
      },
    });
    return { usuarioId: usuarioCreado.id, solicitudId: solicitudCreada.id };
  });

  return { usuarioId, solicitudId, boleta, correo, apellido };
}

async function obtenerSolicitud(solicitudId) {
  return prisma.solicitud_registro.findUnique({ where: { id: solicitudId }, select: { estado_solicitud: true, tipo_cupo: true } });
}

// ─────────────────────────────────────────────────────────────
// 4. Orquestación.
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🔎 Verificando que no haya datos de una corrida previa...');
  await verificarSinDuplicados();

  console.log('🏗️  Creando entidades dedicadas (coordinador, 3 profesores, 4 ofertas, periodo)...');
  const ctx = await crearEntidadesDedicadas();

  const filasReporte = [];

  // ── Escenario A ──────────────────────────────────────────────────────
  const aN1 = await crearAlumnoInicial({ clave: 'A_N1', apellido: 'ESCENARIO A NORMAL UNO', ofertaId: ctx.ofertaA1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(aN1.solicitudId, 'aceptar', ctx.profesorAUsuarioId);
  const aN2 = await crearAlumnoInicial({ clave: 'A_N2', apellido: 'ESCENARIO A NORMAL DOS', ofertaId: ctx.ofertaA1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(aN2.solicitudId, 'aceptar', ctx.profesorAUsuarioId);
  const aPendiente = await crearAlumnoInicial({ clave: 'A_PENDIENTE', apellido: 'ESCENARIO A PENDIENTE', ofertaId: ctx.ofertaA1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });

  const solAN1 = await obtenerSolicitud(aN1.solicitudId);
  const solAN2 = await obtenerSolicitud(aN2.solicitudId);

  // ── Escenario B ──────────────────────────────────────────────────────
  const bN1 = await crearAlumnoInicial({ clave: 'B_N1', apellido: 'ESCENARIO B NORMAL UNO', ofertaId: ctx.ofertaB1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(bN1.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
  const bN2 = await crearAlumnoInicial({ clave: 'B_N2', apellido: 'ESCENARIO B NORMAL DOS', ofertaId: ctx.ofertaB1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(bN2.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
  const bPendiente = await crearAlumnoInicial({ clave: 'B_PENDIENTE', apellido: 'ESCENARIO B PENDIENTE', ofertaId: ctx.ofertaB1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });

  const solBN1 = await obtenerSolicitud(bN1.solicitudId);
  const solBN2 = await obtenerSolicitud(bN2.solicitudId);

  // ── Escenario D ──────────────────────────────────────────────────────
  const dN1 = await crearAlumnoInicial({ clave: 'D_N1', apellido: 'ESCENARIO D NORMAL UNO (SERA LIBERADO)', ofertaId: ctx.ofertaD1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(dN1.solicitudId, 'aceptar', ctx.profesorDUsuarioId);
  const dN2 = await crearAlumnoInicial({ clave: 'D_N2', apellido: 'ESCENARIO D NORMAL DOS', ofertaId: ctx.ofertaD1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(dN2.solicitudId, 'aceptar', ctx.profesorDUsuarioId);
  const dInv1 = await crearAlumnoInicial({ clave: 'D_INV1', apellido: 'ESCENARIO D INVESTIGADOR', ofertaId: ctx.ofertaD1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(dInv1.solicitudId, 'aceptar', ctx.profesorDUsuarioId);

  // Libera de verdad el cupo normal de D-N1 con el flujo real completo.
  await grService.continuarARegistroSISS(dN1.usuarioId);
  await grService.confirmarRegistroSISS(dN1.usuarioId);
  await grService.adjuntarDocumentacionInicial(dN1.usuarioId, { cartaCreditos: archivo(MUESTRA_PDF), seguroSocial: archivo(MUESTRA_PDF) });
  await grCoordinadorService.decidirDocumentacion(dN1.solicitudId, 'rechazar_definitivo', 'Motivo de prueba (seed-manual-cupos-crear): liberar cupo normal de D-N1.', ctx.coordinadorUsuarioId);

  const dCheckY = await crearAlumnoInicial({ clave: 'D_CHECK_Y', apellido: 'ESCENARIO D ACEPTAR PRIMERO (Y)', ofertaId: ctx.ofertaD2Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  const dCheckX = await crearAlumnoInicial({ clave: 'D_CHECK_X', apellido: 'ESCENARIO D ACEPTAR DESPUES (X)', ofertaId: ctx.ofertaD1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });

  const solDN1 = await obtenerSolicitud(dN1.solicitudId);
  const solDN2 = await obtenerSolicitud(dN2.solicitudId);
  const solDInv1 = await obtenerSolicitud(dInv1.solicitudId);

  // ── Reporte ──────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('📋 REPORTE — seed-manual-cupos-crear (datos PERSISTENTES, no se autoborran)');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`\nContraseña de TODOS los usuarios (profesores y alumnos): ${PASSWORD_PLANO}\n`);

  console.log('── ESCENARIO A — Profesor sin Investigador, ya lleno (2/2) ──');
  console.log(`Inicia sesión como: ${PROFESOR_A.correo_institucional}`);
  console.log(`  Ya aceptados (setup, no tocar): ${aN1.boleta} (tipo_cupo=${solAN1.tipo_cupo}), ${aN2.boleta} (tipo_cupo=${solAN2.tipo_cupo})`);
  console.log(`  ➜ ACEPTAR MANUALMENTE: boleta ${aPendiente.boleta} (${aPendiente.apellido}), oferta "${NOMBRE_OFERTA_A1}"`);
  console.log('    Expectativa: debe rechazarse automáticamente por límite de cupos del profesor (estado_solicitud=rechazada_por_cupos, tipo_cupo=NULL).');

  console.log('\n── ESCENARIO B — Profesor con Investigador, respaldo disponible ──');
  console.log(`Inicia sesión como: ${PROFESOR_B.correo_institucional}`);
  console.log(`  Ya aceptados (setup, no tocar): ${bN1.boleta} (tipo_cupo=${solBN1.tipo_cupo}), ${bN2.boleta} (tipo_cupo=${solBN2.tipo_cupo})`);
  console.log(`  ➜ ACEPTAR MANUALMENTE: boleta ${bPendiente.boleta} (${bPendiente.apellido}), oferta "${NOMBRE_OFERTA_B1}"`);
  console.log('    Expectativa: debe aceptarse (la pantalla se ve igual que un rechazo normal) — verificar en BD que tipo_cupo=\'investigador\' (no es visible en la pantalla).');

  console.log('\n── ESCENARIO D — Liberación de normal + competencia entre 2 ofertas del MISMO profesor ──');
  console.log(`Inicia sesión como: ${PROFESOR_D.correo_institucional}`);
  console.log(`  Ya aceptados (setup, no tocar): ${dN2.boleta} (tipo_cupo=${solDN2.tipo_cupo}), ${dInv1.boleta} (tipo_cupo=${solDInv1.tipo_cupo})`);
  console.log(`  Ya rechazado definitivamente (setup, no tocar): ${dN1.boleta} (tipo_cupo=${solDN1.tipo_cupo}, estado=${solDN1.estado_solicitud}) — liberó su cupo normal.`);
  console.log('  ⚠️  ORDEN OBLIGATORIO — acepta EXACTAMENTE en este orden, no lo inviertas: ⚠️');
  console.log(`  ➜ 1º ACEPTAR: boleta ${dCheckY.boleta} (${dCheckY.apellido}), oferta "${NOMBRE_OFERTA_D2}"`);
  console.log('     Expectativa: debe aceptarse como \'normal\' — se lleva el cupo que D-N1 acaba de liberar, aunque sea de una oferta distinta (D2, no D1).');
  console.log(`  ➜ 2º ACEPTAR (SOLO DESPUÉS del anterior): boleta ${dCheckX.boleta} (${dCheckX.apellido}), oferta "${NOMBRE_OFERTA_D1}"`);
  console.log('     Expectativa: debe aceptarse como \'investigador\' — para este momento el único cupo normal libre ya se lo llevó D-CHECK-Y.');
  console.log('  Si los aceptas al revés (X antes que Y), X se quedaría con el normal y Y terminaría como investigador — el experimento seguiría siendo válido pero NO demostraría lo que buscamos (que el normal se comparte entre ofertas del mismo profesor). Respeta el orden.');

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('Cuando termines de probar, corre backend/src/modules/gr/seeds/seed-manual-cupos-borrar.js para limpiar todo.');
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ El seed no se pudo completar.');
    console.error('   Motivo:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
