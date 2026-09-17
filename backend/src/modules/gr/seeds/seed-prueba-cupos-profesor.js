// seed-prueba-cupos-profesor.js
//
// Script de prueba MANUAL, AUTOLIMPIABLE (a diferencia de seed-maestro-gr.js,
// que es persistente) para el feature de cupos por profesor
// (profesor.cupos_totales / solicitud_registro.tipo_cupo). Crea sus propias
// entidades dedicadas, ejecuta los 7 casos SOLO llamando a las funciones de
// servicio reales (gr-profesor.service.js / gr.service.js /
// gr-coordinador.service.js / lib/cupos.js — nunca se reimplementa esa
// lógica a mano ni se escribe el resultado final directo a la BD), verifica
// cada caso con una consulta independiente, reporta aciertos/fallos, y
// SIEMPRE borra todo lo que creó al final (en un finally), sin tocar ningún
// dato preexistente.
//
// AISLAMIENTO: prefijo "[SEED-CUPOS]" / "SEEDCUPOS" / correos
// "seedcupos####@alumno.ipn.mx" / boletas con año ficticio 2098 (distinto
// del 2099 que usa seed-maestro-gr.js) — nunca toca las entidades de ese
// otro seed ni ninguna otra ya existente.
//
// Requisitos antes de correr:
//   - Debe existir ya la característica "Investigador" en el catálogo
//     (correr antes backend/src/lib/seedCaracteristicas.js).
//   - El archivo muestra.pdf debe existir en la raíz del repositorio
//     (mismo requisito que seed-maestro-gr.js, para adjuntarDocumentacionInicial).
//
// Cómo correr (dentro del contenedor del backend):
//   docker compose exec backend node backend/src/modules/gr/seeds/seed-prueba-cupos-profesor.js

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const MUESTRA_PDF_PATH = path.join(__dirname, '../../../../../muestra.pdf');
if (!fs.existsSync(MUESTRA_PDF_PATH)) {
  console.error('❌ No se encontró el PDF de muestra necesario para los casos 6 y 7.');
  console.error(`   Ruta absoluta esperada: ${MUESTRA_PDF_PATH}`);
  process.exit(1);
}
const MUESTRA_PDF = fs.readFileSync(MUESTRA_PDF_PATH);

const prisma = require('../../../lib/prisma');
const grService = require('../gr.service');
const grCoordinadorService = require('../gr-coordinador.service');
const grProfesorService = require('../gr-profesor.service');
const { contarCuposNormalesOcupados } = require('../../../lib/cupos');

const PASSWORD_PLANO = '12345678';
const CARRERA_NOMBRE = 'ISC';
const ANIO_BOLETA = '2098'; // distinto del 2099 de seed-maestro-gr.js

const COORDINADOR = {
  correo_institucional: 'coordinador.seedcupos@ipn.mx',
  nombre: 'SEEDCUPOS',
  apellidos: 'COORDINADOR DEDICADO',
};

const PROFESOR_A = {
  correo_institucional: 'profesor.seedcuposA@ipn.mx',
  nombre: 'SEEDCUPOS',
  apellidos: 'PROFESOR SIN INVESTIGADOR',
  cupos_totales: 2,
};

const PROFESOR_B = {
  correo_institucional: 'profesor.seedcuposB@ipn.mx',
  nombre: 'SEEDCUPOS',
  apellidos: 'PROFESOR CON INVESTIGADOR',
  cupos_totales: 2,
};

const NOMBRE_OFERTA_A1 = '[SEED-CUPOS] Oferta individual A';
const NOMBRE_OFERTA_B1 = '[SEED-CUPOS] Oferta proyecto con respaldo';
const NOMBRE_OFERTA_B2 = '[SEED-CUPOS] Oferta individual B';
const NOMBRE_PERIODO = '[SEED-CUPOS] Periodo de pruebas';

function boletaDe(n) {
  return `${ANIO_BOLETA}63${String(n).padStart(4, '0')}`;
}
function correoDe(n) {
  return `seedcupos${String(n).padStart(4, '0')}@alumno.ipn.mx`;
}
function archivo(buffer) {
  return { buffer };
}

// Índice -> caso al que pertenece cada alumno (para el reporte final y para
// que boletaDe/correoDe generen datos únicos por alumno).
const ALUMNOS = {
  A_N1: 1,
  A_N2: 2,
  A_N3: 3,
  A_N4: 4,
  B_N1: 5,
  B_N2: 6,
  B_INV1: 7,
  B_IND1: 8,
  B_INV2: 9,
  B_CHECK1: 10,
  B_CHECK2: 11,
};

// ─────────────────────────────────────────────────────────────
// 1. Verificación previa de duplicados — mismo criterio que seed-maestro-gr.js.
// ─────────────────────────────────────────────────────────────
async function verificarSinDuplicados() {
  const correosAlumnos = Object.values(ALUMNOS).map(correoDe);
  const boletasAlumnos = Object.values(ALUMNOS).map(boletaDe);
  const correosTodos = [COORDINADOR.correo_institucional, PROFESOR_A.correo_institucional, PROFESOR_B.correo_institucional, ...correosAlumnos];

  const usuariosExistentes = await prisma.usuario.findMany({
    where: { correo_institucional: { in: correosTodos } },
    select: { correo_institucional: true },
  });
  const alumnosExistentes = await prisma.alumno.findMany({
    where: { boleta: { in: boletasAlumnos } },
    select: { boleta: true },
  });
  const ofertasExistentes = await prisma.oferta_servicio.findMany({
    where: { nombre_proyecto: { in: [NOMBRE_OFERTA_A1, NOMBRE_OFERTA_B1, NOMBRE_OFERTA_B2] } },
    select: { nombre_proyecto: true },
  });

  const problemas = [];
  if (usuariosExistentes.length > 0) problemas.push(`  - Correos ya registrados: ${usuariosExistentes.map((u) => u.correo_institucional).join(', ')}`);
  if (alumnosExistentes.length > 0) problemas.push(`  - Boletas ya registradas: ${alumnosExistentes.map((a) => a.boleta).join(', ')}`);
  if (ofertasExistentes.length > 0) problemas.push(`  - Ofertas ya registradas: ${ofertasExistentes.map((o) => o.nombre_proyecto).join(', ')}`);

  if (problemas.length > 0) {
    throw new Error(
      'Quedó basura de una corrida previa de seed-prueba-cupos-profesor (probablemente la limpieza final falló). ' +
      'No se insertó nada nuevo. Esto es lo que se encontró:\n' + problemas.join('\n') +
      '\n\nBorra manualmente esas filas antes de reintentar.'
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
      data: { usuario_id: profesorAUsuario.id, departamento: 'Prueba', telefono_personal: '5511110000', horario_atencion: 'N/A', cubiculo: 'N/A', cupos_totales: PROFESOR_A.cupos_totales },
    });

    const profesorBUsuario = await tx.usuario.create({
      data: { correo_institucional: PROFESOR_B.correo_institucional, contrasena: hash, nombre: PROFESOR_B.nombre, apellidos: PROFESOR_B.apellidos, rol: 'profesor', fecha_creacion: ahora },
    });
    const profesorBCreado = await tx.profesor.create({
      data: { usuario_id: profesorBUsuario.id, departamento: 'Prueba', telefono_personal: '5511110001', horario_atencion: 'N/A', cubiculo: 'N/A', cupos_totales: PROFESOR_B.cupos_totales },
    });
    // Profesor B SÍ tiene la característica Investigador aprobada — mismo
    // 'estado' exacto (minúsculas, masculino) que usa usuarios.service.js,
    // NO 'aprobada' (ese es un typo de un seed distinto y roto).
    await tx.solicitud_caracteristica.create({
      data: {
        profesor_id: profesorBCreado.id,
        caracteristica_id: caracteristicaInvestigador.id,
        justificacion: 'Asignada por seed-prueba-cupos-profesor.',
        estado: 'aprobado',
        fecha: ahora,
        fecha_respuesta: ahora,
      },
    });

    return { coordinadorId: coordinadorCreado.id, coordinadorUsuarioId: coordinadorUsuario.id, profesorAId: profesorACreado.id, profesorAUsuarioId: profesorAUsuario.id, profesorBId: profesorBCreado.id, profesorBUsuarioId: profesorBUsuario.id };
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
      nombre_SISS: 'SEEDCUPOS - Individual A', programa_SISS: 'Programa de pruebas SEED-CUPOS',
      nombre_proyecto: NOMBRE_OFERTA_A1, tipo_oferta: 'individual',
      descripcion_actividades: 'Oferta dedicada a seed-prueba-cupos-profesor (profesor sin Investigador).',
      cupos_ofertados: 10, cupos_investigador: null, cupos_disponibles: 10, estado_oferta: 'Aprobada', fecha_registro: new Date(),
    },
  });
  const ofertaB1 = await prisma.oferta_servicio.create({
    data: {
      profesor_id: ctx.profesorBId, coordinador_id: ctx.coordinadorId,
      nombre_SISS: 'SEEDCUPOS - Proyecto con respaldo', programa_SISS: 'Programa de pruebas SEED-CUPOS',
      nombre_proyecto: NOMBRE_OFERTA_B1, tipo_oferta: 'proyecto',
      descripcion_actividades: 'Oferta dedicada a seed-prueba-cupos-profesor (respaldo investigador=1).',
      cupos_ofertados: 10, cupos_investigador: 1, cupos_disponibles: 10, estado_oferta: 'Aprobada', fecha_registro: new Date(),
    },
  });
  const ofertaB2 = await prisma.oferta_servicio.create({
    data: {
      profesor_id: ctx.profesorBId, coordinador_id: ctx.coordinadorId,
      nombre_SISS: 'SEEDCUPOS - Individual B', programa_SISS: 'Programa de pruebas SEED-CUPOS',
      nombre_proyecto: NOMBRE_OFERTA_B2, tipo_oferta: 'individual',
      descripcion_actividades: 'Oferta dedicada a seed-prueba-cupos-profesor (individual, nunca usa investigador).',
      cupos_ofertados: 10, cupos_investigador: null, cupos_disponibles: 10, estado_oferta: 'Aprobada', fecha_registro: new Date(),
    },
  });

  return { ...ctx, carreraId: carrera.id, periodoId: periodoRegistro.id, ofertaA1Id: ofertaA1.id, ofertaB1Id: ofertaB1.id, ofertaB2Id: ofertaB2.id };
}

// ─────────────────────────────────────────────────────────────
// 3. Alta de un alumno (mismo patrón que seed-maestro-gr.js: usuario+alumno
//    +solicitud_registro por Prisma directo, contraseña hasheada a mano
//    porque "12345678" no pasa la regla de complejidad de enviarSolicitudRegistro).
// ─────────────────────────────────────────────────────────────
async function crearAlumnoInicial({ clave, apellido, ofertaId, carreraId, periodoId }) {
  const n = ALUMNOS[clave];
  const boleta = boletaDe(n);
  const correo = correoDe(n);
  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  const { usuarioId, solicitudId } = await prisma.$transaction(async (tx) => {
    const usuarioCreado = await tx.usuario.create({
      data: { rol: 'alumno_sin_asignar', correo_institucional: correo, nombre: `SEEDCUPOS${String(n).padStart(4, '0')}`, apellidos: apellido, contrasena: hash, fecha_creacion: ahora },
    });
    await tx.alumno.create({
      data: { boleta, usuario_id: usuarioCreado.id, celular: `55${String(n).padStart(8, '0')}`, carrera: CARRERA_NOMBRE, creditos: '85.00', semestre: 8, correo_personal: null },
    });
    const solicitudCreada = await tx.solicitud_registro.create({
      data: {
        alumno_id: boleta, carrera_id: carreraId, dictamen: null, periodo_registro_id: periodoId, oferta_id: ofertaId,
        motivacion_oferta: `Motivación de prueba generada por seed-prueba-cupos-profesor para ${boleta}.`,
        estado_solicitud: 'espera_respuesta_de_profesor', estado_anterior: null, fecha_aplicacion: ahora,
      },
    });
    return { usuarioId: usuarioCreado.id, solicitudId: solicitudCreada.id };
  });

  return { usuarioId, solicitudId, boleta, correo };
}

async function avanzarHastaDocumentacionPendiente(usuarioId) {
  await grService.continuarARegistroSISS(usuarioId);
  await grService.confirmarRegistroSISS(usuarioId);
  await grService.adjuntarDocumentacionInicial(usuarioId, { cartaCreditos: archivo(MUESTRA_PDF), seguroSocial: archivo(MUESTRA_PDF) });
}

async function obtenerSolicitud(solicitudId) {
  return prisma.solicitud_registro.findUnique({
    where: { id: solicitudId },
    select: { estado_solicitud: true, tipo_cupo: true, motivo_rechazo: true },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. Orquestación de los 7 casos.
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🔎 Verificando que no haya basura de una corrida previa...');
  await verificarSinDuplicados();

  console.log('🏗️  Creando entidades dedicadas (coordinador, 2 profesores, 3 ofertas, periodo)...');
  const ctx = await crearEntidadesDedicadas();
  console.log(`   Profesor A (sin Investigador, cupos_totales=${PROFESOR_A.cupos_totales}): id ${ctx.profesorAId}`);
  console.log(`   Profesor B (con Investigador, cupos_totales=${PROFESOR_B.cupos_totales}): id ${ctx.profesorBId}`);
  console.log(`   Oferta A1 (individual): id ${ctx.ofertaA1Id}`);
  console.log(`   Oferta B1 (proyecto, cupos_investigador=1): id ${ctx.ofertaB1Id}`);
  console.log(`   Oferta B2 (individual): id ${ctx.ofertaB2Id}`);

  const resultados = [];
  function verificar(caso, descripcion, condicion, detalle) {
    resultados.push({ caso, descripcion, ok: !!condicion, detalle });
  }

  try {
    // ── Caso 1 ──────────────────────────────────────────────────────────
    const aN1 = await crearAlumnoInicial({ clave: 'A_N1', apellido: 'CASO1 NORMAL UNO', ofertaId: ctx.ofertaA1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(aN1.solicitudId, 'aceptar', ctx.profesorAUsuarioId);
    const solAN1 = await obtenerSolicitud(aN1.solicitudId);
    verificar(1, 'A-N1 aceptado como cupo normal', solAN1.estado_solicitud === 'aceptada_por_profesor' && solAN1.tipo_cupo === 'normal', solAN1);

    const aN2 = await crearAlumnoInicial({ clave: 'A_N2', apellido: 'CASO1 NORMAL DOS', ofertaId: ctx.ofertaA1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(aN2.solicitudId, 'aceptar', ctx.profesorAUsuarioId);
    const solAN2 = await obtenerSolicitud(aN2.solicitudId);
    verificar(1, 'A-N2 aceptado como cupo normal (profesor A queda lleno 2/2)', solAN2.estado_solicitud === 'aceptada_por_profesor' && solAN2.tipo_cupo === 'normal', solAN2);

    // ── Caso 2 ──────────────────────────────────────────────────────────
    const aN3 = await crearAlumnoInicial({ clave: 'A_N3', apellido: 'CASO2 RECHAZADO CUPOS', ofertaId: ctx.ofertaA1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(aN3.solicitudId, 'aceptar', ctx.profesorAUsuarioId);
    const solAN3 = await obtenerSolicitud(aN3.solicitudId);
    verificar(2, 'A-N3 rechazado automáticamente por límite del profesor',
      solAN3.estado_solicitud === 'rechazada_por_cupos' && solAN3.tipo_cupo === null && solAN3.motivo_rechazo === 'El profesor alcanzó su límite de cupos disponibles.',
      solAN3);

    // ── Caso 3 ──────────────────────────────────────────────────────────
    const bN1 = await crearAlumnoInicial({ clave: 'B_N1', apellido: 'CASO3 NORMAL UNO', ofertaId: ctx.ofertaB1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(bN1.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
    const solBN1 = await obtenerSolicitud(bN1.solicitudId);
    verificar(3, 'B-N1 aceptado como cupo normal', solBN1.estado_solicitud === 'aceptada_por_profesor' && solBN1.tipo_cupo === 'normal', solBN1);

    const bN2 = await crearAlumnoInicial({ clave: 'B_N2', apellido: 'CASO3 NORMAL DOS', ofertaId: ctx.ofertaB1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(bN2.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
    const solBN2 = await obtenerSolicitud(bN2.solicitudId);
    verificar(3, 'B-N2 aceptado como cupo normal (profesor B queda lleno de normales 2/2)', solBN2.estado_solicitud === 'aceptada_por_profesor' && solBN2.tipo_cupo === 'normal', solBN2);

    const bInv1 = await crearAlumnoInicial({ clave: 'B_INV1', apellido: 'CASO3 INVESTIGADOR', ofertaId: ctx.ofertaB1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(bInv1.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
    const solBInv1 = await obtenerSolicitud(bInv1.solicitudId);
    verificar(3, 'B-INV1 aceptado como cupo investigador (normales agotados, respaldo de B1 disponible)', solBInv1.estado_solicitud === 'aceptada_por_profesor' && solBInv1.tipo_cupo === 'investigador', solBInv1);

    // ── Caso 4 ──────────────────────────────────────────────────────────
    const bInd1 = await crearAlumnoInicial({ clave: 'B_IND1', apellido: 'CASO4 INDIVIDUAL RECHAZADO', ofertaId: ctx.ofertaB2Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(bInd1.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
    const solBInd1 = await obtenerSolicitud(bInd1.solicitudId);
    verificar(4, 'B-IND1 rechazado: oferta individual nunca usa investigador aunque el profesor califique',
      solBInd1.estado_solicitud === 'rechazada_por_cupos' && solBInd1.tipo_cupo === null, solBInd1);

    // ── Caso 5 ──────────────────────────────────────────────────────────
    const bInv2 = await crearAlumnoInicial({ clave: 'B_INV2', apellido: 'CASO5 RESPALDO AGOTADO', ofertaId: ctx.ofertaB1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(bInv2.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
    const solBInv2 = await obtenerSolicitud(bInv2.solicitudId);
    verificar(5, 'B-INV2 rechazado: el respaldo (cupos_investigador=1) de la oferta B1 ya lo consumió B-INV1',
      solBInv2.estado_solicitud === 'rechazada_por_cupos' && solBInv2.tipo_cupo === null, solBInv2);

    // ── Caso 6 ──────────────────────────────────────────────────────────
    await avanzarHastaDocumentacionPendiente(aN1.usuarioId);
    await grCoordinadorService.decidirDocumentacion(aN1.solicitudId, 'rechazar_definitivo', 'Motivo de prueba (seed-prueba-cupos-profesor): caso 6.', ctx.coordinadorUsuarioId);
    const solAN1Rechazada = await obtenerSolicitud(aN1.solicitudId);
    verificar(6, 'A-N1 (era tipo_cupo=normal) queda rechazada_definitivamente con tipo_cupo NULL',
      solAN1Rechazada.estado_solicitud === 'rechazada_definitivamente' && solAN1Rechazada.tipo_cupo === null, solAN1Rechazada);

    // Verificación aritmética directa pedida: llamar la función REAL de
    // conteo, no solo confirmar el efecto indirecto de A-N4.
    const ocupadosNormalesProfesorA = await contarCuposNormalesOcupados(ctx.profesorAId);
    verificar(6, 'contarCuposNormalesOcupados(profesorA) = 1 justo después del rechazo (solo A-N2 sigue ocupando; A-N1 se liberó, A-N3 nunca contó)',
      ocupadosNormalesProfesorA === 1, { ocupadosNormalesProfesorA });

    const aN4 = await crearAlumnoInicial({ clave: 'A_N4', apellido: 'CASO6 NUEVO TRAS LIBERACION', ofertaId: ctx.ofertaA1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(aN4.solicitudId, 'aceptar', ctx.profesorAUsuarioId);
    const solAN4 = await obtenerSolicitud(aN4.solicitudId);
    verificar(6, 'A-N4 sí puede entrar como normal tras liberarse el cupo de A-N1', solAN4.estado_solicitud === 'aceptada_por_profesor' && solAN4.tipo_cupo === 'normal', solAN4);

    // ── Caso 7 ──────────────────────────────────────────────────────────
    await avanzarHastaDocumentacionPendiente(bInv1.usuarioId);
    await grCoordinadorService.decidirDocumentacion(bInv1.solicitudId, 'rechazar_definitivo', 'Motivo de prueba (seed-prueba-cupos-profesor): caso 7.', ctx.coordinadorUsuarioId);
    const solBInv1Rechazada = await obtenerSolicitud(bInv1.solicitudId);
    verificar(7, 'B-INV1 (era tipo_cupo=investigador) queda rechazada_definitivamente con tipo_cupo NULL',
      solBInv1Rechazada.estado_solicitud === 'rechazada_definitivamente' && solBInv1Rechazada.tipo_cupo === null, solBInv1Rechazada);

    const bCheck1 = await crearAlumnoInicial({ clave: 'B_CHECK1', apellido: 'CASO7 NORMALES SIGUEN LLENOS', ofertaId: ctx.ofertaB2Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(bCheck1.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
    const solBCheck1 = await obtenerSolicitud(bCheck1.solicitudId);
    verificar(7, 'B-CHECK1 sigue rechazado: liberar un investigador NO libera un cupo normal (B-N1/B-N2 siguen llenando al profesor B)',
      solBCheck1.estado_solicitud === 'rechazada_por_cupos' && solBCheck1.tipo_cupo === null, solBCheck1);

    const bCheck2 = await crearAlumnoInicial({ clave: 'B_CHECK2', apellido: 'CASO7 RESPALDO LIBERADO', ofertaId: ctx.ofertaB1Id, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
    await grProfesorService.decidirSolicitud(bCheck2.solicitudId, 'aceptar', ctx.profesorBUsuarioId);
    const solBCheck2 = await obtenerSolicitud(bCheck2.solicitudId);
    verificar(7, 'B-CHECK2 sí puede entrar como investigador: el respaldo de la oferta B1 sí se liberó al rechazar B-INV1',
      solBCheck2.estado_solicitud === 'aceptada_por_profesor' && solBCheck2.tipo_cupo === 'investigador', solBCheck2);

  } catch (err) {
    console.error('❌ Una operación del seed falló a media ejecución:', err.message);
    resultados.push({ caso: '—', descripcion: `Excepción no esperada: ${err.message}`, ok: false, detalle: null });
  } finally {
    // ── Reporte ──────────────────────────────────────────────────────
    console.log('\n📋 Reporte final — seed-prueba-cupos-profesor');
    console.log('Caso | Resultado | Descripción');
    console.log('-----|-----------|----------------------------------------------------------------');
    resultados.forEach((r) => {
      console.log(`${String(r.caso).padEnd(4)} | ${r.ok ? '✅ OK   ' : '❌ FALLO'} | ${r.descripcion}`);
      if (!r.ok) console.log(`     |           detalle: ${JSON.stringify(r.detalle)}`);
    });
    const okCount = resultados.filter((r) => r.ok).length;
    console.log(`\n   ${okCount}/${resultados.length} verificaciones correctas.\n`);

    // ── Limpieza SIEMPRE, pase lo que pase arriba ──────────────────────
    console.log('🧹 Limpiando todas las entidades creadas por este seed...');
    const correosCreados = [
      COORDINADOR.correo_institucional,
      PROFESOR_A.correo_institucional,
      PROFESOR_B.correo_institucional,
      ...Object.values(ALUMNOS).map(correoDe),
    ];
    const { count } = await prisma.usuario.deleteMany({ where: { correo_institucional: { in: correosCreados } } });
    console.log(`   ${count} usuario(s) eliminado(s) (cascada elimina profesor/alumno/oferta/solicitud/característica/documento asociados).`);

    const residual = await prisma.usuario.count({ where: { correo_institucional: { in: correosCreados } } });
    if (residual > 0) {
      console.error(`🚨 ALERTA: quedaron ${residual} usuario(s) sin borrar — revisar manualmente.`);
    } else {
      console.log('✅ Limpieza confirmada: no quedó ningún residuo de este seed.');
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ El seed no se pudo ejecutar.');
    console.error('   Motivo:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
