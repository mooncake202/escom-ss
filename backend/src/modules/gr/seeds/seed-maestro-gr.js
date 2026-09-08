// seed-maestro-gr.js
//
// Seed PERSISTENTE (no destructivo, no se auto-limpia) para pruebas MANUALES
// del módulo de Gestión de Registro (GR). Crea 1 alumno por cada uno de los
// 20 valores de estado_solicitud que existen en el sistema (inventario de la
// Fase 0), con datos coherentes para ese punto exacto del flujo, para poder
// iniciar sesión con cualquiera de ellos y ver directamente la pantalla que
// le toca — sin forzar nada por SQL a mano.
//
// PRINCIPIO DE DISEÑO (confirmado con el usuario): salvo la inserción
// inicial de cada alumno (usuario+alumno+solicitud_registro, que se hace por
// Prisma directo porque enviarSolicitudRegistro() exige una contraseña con
// mayúscula/minúscula/número/símbolo y aquí se usa la contraseña estándar de
// pruebas "12345678"), CADA transición posterior llama a la función de
// servicio REAL correspondiente (gr.service.js / gr-coordinador.service.js /
// gr-profesor.service.js), nunca se recrea esa lógica a mano. Esto es crítico
// para el caso de "rechazada_por_cupos": se llama a decidirSolicitud(...,
// 'aceptar', ...) sobre UN alumno en una oferta de cupo=1, y es esa misma
// función real (RN-GR-11) la que rechaza automáticamente al resto — nunca se
// simula ese rechazo automático por separado.
//
// AISLAMIENTO: crea su propio profesor, coordinador, oferta(s) y periodo
// dedicados (prefijo "seedmaestrogr" / "[SEED-MAESTRO-GR]") — NO toca ni
// reutiliza las ofertas/profesores ya sembrados por seed-test-users.js,
// seed-profesores-test.js, seed-ofertas-servicio.js ni
// seed-periodos-servicio-social.js.
//
// Requisitos antes de correr:
//   - El archivo muestra.pdf debe existir en la raíz del repositorio (se
//     usa como relleno real para los 2-4 documentos de cada expediente).
//
// Cómo correr (dentro del contenedor del backend):
//   docker compose exec backend node backend/src/modules/gr/seeds/seed-maestro-gr.js
//
// Idempotencia: si CUALQUIER correo/boleta de este seed ya existe (de una
// corrida previa, completa o a medias), el script NO inserta nada y lista
// exactamente qué encontró, para que decidas qué borrar antes de reintentar.

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// 0. Verificación del PDF de muestra — ANTES de tocar la base de datos.
// ─────────────────────────────────────────────────────────────
const MUESTRA_PDF_PATH = path.join(__dirname, '../../../../../muestra.pdf');
if (!fs.existsSync(MUESTRA_PDF_PATH)) {
  console.error('❌ No se encontró el PDF de muestra necesario para poblar documentos reales.');
  console.error(`   Ruta absoluta esperada: ${MUESTRA_PDF_PATH}`);
  console.error('   Verifica que "muestra.pdf" exista en la raíz del repositorio antes de reintentar.');
  process.exit(1);
}
const MUESTRA_PDF = fs.readFileSync(MUESTRA_PDF_PATH);

const prisma = require('../../../lib/prisma');
const grService = require('../gr.service');
const grCoordinadorService = require('../gr-coordinador.service');
const grProfesorService = require('../gr-profesor.service');

// ─────────────────────────────────────────────────────────────
// 1. Datos dedicados
// ─────────────────────────────────────────────────────────────
const PASSWORD_PLANO = '12345678';
const CARRERA_NOMBRE = 'ISC';

const COORDINADOR = {
  correo_institucional: 'coordinador.seedmaestrogr@ipn.mx',
  nombre: 'SEEDMAESTROGR',
  apellidos: 'COORDINADOR DEDICADO',
};

const PROFESOR = {
  correo_institucional: 'profesor.seedmaestrogr@ipn.mx',
  nombre: 'SEEDMAESTROGR',
  apellidos: 'PROFESOR DEDICADO',
  departamento: 'Computación',
  telefono_personal: '5511112222',
  horario_atencion: 'Lunes a viernes 09:00-11:00',
  cubiculo: 'SEED-MAESTRO-GR',
  cupos_totales: 20,
};

const NOMBRE_OFERTA_A = '[SEED-MAESTRO-GR] Oferta cupo limitado';
const NOMBRE_OFERTA_B = '[SEED-MAESTRO-GR] Oferta general';
const NOMBRE_PERIODO = '[SEED-MAESTRO-GR] Periodo de pruebas';

// Alumnos cuya secuencia pasa por decidirSolicitud('aceptar', ...) sobre la
// OFERTA B en algún punto (todo el que avanza más allá de "aceptada por
// profesor" tuvo que ser aceptado primero, vía avanzarHastaAceptado()) —
// cada uno consume 1 cupo real. Se deriva de aquí el tamaño de la oferta B
// en vez de adivinar un número fijo.
const ALUMNOS_QUE_ACEPTAN_OFERTA_B = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const MARGEN_CUPOS_OFERTA_B = 2; // colchón extra por si acaso
const CUPOS_OFERTA_B = ALUMNOS_QUE_ACEPTAN_OFERTA_B.length + MARGEN_CUPOS_OFERTA_B;

const TOTAL_ALUMNOS = 20;

// Boleta de 10 caracteres exactos, cumpliendo (19|20)\d{2}63\d{4}
// (4 dígitos de "año" + "63" + 4 dígitos de secuencia).
function boletaDeCorrecta(n) {
  return `2099` + `63` + String(n).padStart(4, '0');
}

function correoDe(n) {
  return `seedgr${String(n).padStart(4, '0')}@alumno.ipn.mx`;
}

function archivo(buffer) {
  return { buffer };
}

const ALUMNOS_CONFIG = [
  { n: 1, apellido: 'ESPERA PROFESOR' },
  { n: 2, apellido: 'ACEPTADO PROFESOR' },
  { n: 3, apellido: 'RECHAZADO PROFESOR' },
  { n: 4, apellido: 'RECHAZADO CUPOS' },
  { n: 5, apellido: 'REGISTRO SISS' },
  { n: 6, apellido: 'ADJUNTAR DOCUMENTACION' },
  { n: 7, apellido: 'DOCUMENTACION PENDIENTE' },
  { n: 8, apellido: 'DOCUMENTACION APROBADA' },
  { n: 9, apellido: 'CORREGIR SISS' },
  { n: 10, apellido: 'CORREGIR DOCUMENTOS' },
  { n: 11, apellido: 'RECHAZADO DEFINITIVO' },
  { n: 12, apellido: 'DESCARGAR CARTA' },
  { n: 13, apellido: 'ESPERA CONFIRMACION CARTA' },
  { n: 14, apellido: 'CARTA CONFIRMADA' },
  { n: 15, apellido: 'ADJUNTAR EXPEDIENTE' },
  { n: 16, apellido: 'EXPEDIENTE PENDIENTE' },
  { n: 17, apellido: 'EXPEDIENTE CORRECCIONES' },
  { n: 18, apellido: 'EXPEDIENTE APROBADO' },
  { n: 19, apellido: 'ALUMNO ASIGNADO' },
  { n: 20, apellido: 'MODIFICAR REENVIAR' },
];

// ─────────────────────────────────────────────────────────────
// 2. Verificación previa de duplicados (lista exactamente qué encontró)
// ─────────────────────────────────────────────────────────────
async function verificarSinDuplicados() {
  const correosAlumnos = ALUMNOS_CONFIG.map((a) => correoDe(a.n));
  const boletasAlumnos = ALUMNOS_CONFIG.map((a) => boletaDeCorrecta(a.n));
  const correosTodos = [COORDINADOR.correo_institucional, PROFESOR.correo_institucional, ...correosAlumnos];

  const usuariosExistentes = await prisma.usuario.findMany({
    where: { correo_institucional: { in: correosTodos } },
    select: { correo_institucional: true },
  });

  const alumnosExistentes = await prisma.alumno.findMany({
    where: { boleta: { in: boletasAlumnos } },
    select: { boleta: true },
  });

  const ofertasExistentes = await prisma.oferta_servicio.findMany({
    where: { nombre_proyecto: { in: [NOMBRE_OFERTA_A, NOMBRE_OFERTA_B] } },
    select: { nombre_proyecto: true },
  });

  const periodosExistentes = await prisma.evento_calendario.findMany({
    where: { nombre: NOMBRE_PERIODO },
    select: { nombre: true },
  });

  const problemas = [];
  if (usuariosExistentes.length > 0) {
    problemas.push(`  - Correos de usuario ya registrados: ${usuariosExistentes.map((u) => u.correo_institucional).join(', ')}`);
  }
  if (alumnosExistentes.length > 0) {
    problemas.push(`  - Boletas de alumno ya registradas: ${alumnosExistentes.map((a) => a.boleta).join(', ')}`);
  }
  if (ofertasExistentes.length > 0) {
    problemas.push(`  - Ofertas ya registradas: ${ofertasExistentes.map((o) => o.nombre_proyecto).join(', ')}`);
  }
  if (periodosExistentes.length > 0) {
    problemas.push(`  - Periodo ya registrado: ${periodosExistentes.map((p) => p.nombre).join(', ')}`);
  }

  if (problemas.length > 0) {
    throw new Error(
      'Ya existen datos de una corrida previa de seed-maestro-gr (completa o a medias). ' +
      'No se insertó nada nuevo. Esto es exactamente lo que se encontró:\n' +
      problemas.join('\n') +
      '\n\nBorra manualmente esas filas (usuario/alumno/oferta_servicio/evento_calendario y sus ' +
      'relaciones en cascada) antes de reintentar, o ajusta los prefijos en este script si quieres ' +
      'convivir con una corrida anterior.'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Creación de entidades dedicadas: coordinador, profesor, carrera, periodo, ofertas
// ─────────────────────────────────────────────────────────────
async function crearEntidadesDedicadas() {
  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  const { coordinadorId, coordinadorUsuarioId, profesorId, profesorUsuarioId } = await prisma.$transaction(async (tx) => {
    const coordinadorUsuario = await tx.usuario.create({
      data: {
        correo_institucional: COORDINADOR.correo_institucional,
        contrasena: hash,
        nombre: COORDINADOR.nombre,
        apellidos: COORDINADOR.apellidos,
        rol: 'coordinador',
        fecha_creacion: ahora,
      },
    });
    const coordinadorCreado = await tx.coordinador.create({ data: { usuario_id: coordinadorUsuario.id } });

    const profesorUsuario = await tx.usuario.create({
      data: {
        correo_institucional: PROFESOR.correo_institucional,
        contrasena: hash,
        nombre: PROFESOR.nombre,
        apellidos: PROFESOR.apellidos,
        rol: 'profesor',
        fecha_creacion: ahora,
      },
    });
    const profesorCreado = await tx.profesor.create({
      data: {
        usuario_id: profesorUsuario.id,
        departamento: PROFESOR.departamento,
        telefono_personal: PROFESOR.telefono_personal,
        horario_atencion: PROFESOR.horario_atencion,
        cubiculo: PROFESOR.cubiculo,
        cupos_totales: PROFESOR.cupos_totales,
      },
    });

    return {
      coordinadorId: coordinadorCreado.id,
      coordinadorUsuarioId: coordinadorUsuario.id,
      profesorId: profesorCreado.id,
      profesorUsuarioId: profesorUsuario.id,
    };
  });

  // Carrera: catálogo compartido, no es "propiedad" de este seed — se
  // reutiliza si ya existe, igual que hace seed-ofertas-servicio.js.
  let carrera = await prisma.carrera.findFirst({ where: { nombre: CARRERA_NOMBRE } });
  if (!carrera) {
    carrera = await prisma.carrera.create({ data: { nombre: CARRERA_NOMBRE } });
  }

  // Periodo dedicado: fechas cómodamente en el futuro para que ningún
  // "reloj" de vencimiento (RN-GR-04/RN-GR-63) auto-rechace a estos alumnos
  // mientras se usan para pruebas manuales.
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() + 365);
  const fechaFin = new Date(fechaInicio);
  fechaFin.setDate(fechaFin.getDate() + 120);
  const fechaMaxExpediente = new Date(fechaInicio);
  fechaMaxExpediente.setDate(fechaMaxExpediente.getDate() - 65); // ~300 días desde hoy, antes del inicio

  const eventoCalendario = await prisma.evento_calendario.create({
    data: {
      coordinador_id: coordinadorId,
      nombre: NOMBRE_PERIODO,
      tipo: 'Periodo',
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    },
  });

  const periodoRegistro = await prisma.periodo_registro.create({
    data: {
      evento_calendario_id: eventoCalendario.id,
      anio: String(fechaInicio.getFullYear()),
      semestre: 's01',
      fecha_max_expediente: fechaMaxExpediente,
    },
  });

  const ofertaA = await prisma.oferta_servicio.create({
    data: {
      profesor_id: profesorId,
      coordinador_id: coordinadorId,
      nombre_SISS: 'SEEDMAESTROGR - Cupo limitado',
      programa_SISS: 'Programa de pruebas SEED-MAESTRO-GR',
      nombre_proyecto: NOMBRE_OFERTA_A,
      tipo_oferta: 'proyecto',
      descripcion_actividades: 'Oferta dedicada exclusivamente al seed maestro de pruebas de GR (cupo=1, para simular rechazo automático por cupos).',
      cupos_ofertados: 1,
      cupos_disponibles: 1,
      estado_oferta: 'Aprobada',
      fecha_registro: ahora,
    },
  });

  const ofertaB = await prisma.oferta_servicio.create({
    data: {
      profesor_id: profesorId,
      coordinador_id: coordinadorId,
      nombre_SISS: 'SEEDMAESTROGR - General',
      programa_SISS: 'Programa de pruebas SEED-MAESTRO-GR',
      nombre_proyecto: NOMBRE_OFERTA_B,
      tipo_oferta: 'proyecto',
      descripcion_actividades: 'Oferta dedicada exclusivamente al seed maestro de pruebas de GR (uso general, cupo amplio).',
      cupos_ofertados: CUPOS_OFERTA_B,
      cupos_disponibles: CUPOS_OFERTA_B,
      estado_oferta: 'Aprobada',
      fecha_registro: ahora,
    },
  });

  return {
    coordinadorId,
    coordinadorUsuarioId,
    profesorId,
    profesorUsuarioId,
    carreraId: carrera.id,
    periodoId: periodoRegistro.id,
    ofertaAId: ofertaA.id,
    ofertaBId: ofertaB.id,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. Inserción inicial de un alumno (mismo shape que enviarSolicitudRegistro
//    dejaría), por Prisma directo — la contraseña "12345678" no pasa la
//    regla de complejidad de esa función, así que aquí se hashea a mano,
//    igual que hace seed-test-users.js.
// ─────────────────────────────────────────────────────────────
async function crearAlumnoInicial({ n, apellido, ofertaId, carreraId, periodoId }) {
  const boleta = boletaDeCorrecta(n);
  const correo = correoDe(n);
  const nombres = `SEEDGR${String(n).padStart(4, '0')}`;
  const apellidos = apellido;
  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  const { usuarioId, solicitudId } = await prisma.$transaction(async (tx) => {
    const usuarioCreado = await tx.usuario.create({
      data: {
        rol: 'alumno_sin_asignar',
        correo_institucional: correo,
        nombre: nombres,
        apellidos,
        contrasena: hash,
        fecha_creacion: ahora,
      },
    });

    await tx.alumno.create({
      data: {
        boleta,
        usuario_id: usuarioCreado.id,
        celular: `55${String(n).padStart(8, '0')}`,
        carrera: CARRERA_NOMBRE,
        creditos: '85.00',
        semestre: 8,
        correo_personal: null,
      },
    });

    const solicitudCreada = await tx.solicitud_registro.create({
      data: {
        alumno_id: boleta,
        carrera_id: carreraId,
        dictamen: null,
        periodo_registro_id: periodoId,
        oferta_id: ofertaId,
        motivacion_oferta: `Motivación de prueba generada por seed-maestro-gr para el alumno ${boleta}.`,
        estado_solicitud: 'espera_respuesta_de_profesor',
        estado_anterior: null,
        fecha_aplicacion: ahora,
      },
    });

    return { usuarioId: usuarioCreado.id, solicitudId: solicitudCreada.id };
  });

  return { usuarioId, solicitudId, boleta, correo };
}

// ─────────────────────────────────────────────────────────────
// 5. Pipelines por estado objetivo — cada uno llama SOLO a funciones de
//    servicio reales para avanzar más allá de la inserción inicial.
// ─────────────────────────────────────────────────────────────

async function seedEsperaRespuestaProfesor(ctx, cfg) {
  const alumno = await crearAlumnoInicial({ ...cfg, ofertaId: ctx.ofertaBId, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  return { ...alumno, estado: 'espera_respuesta_de_profesor' };
}

// Cubre #2 (aceptada_por_profesor) y #4 (rechazada_por_cupos) EN UNA SOLA
// llamada real — ver nota de diseño al inicio del archivo.
async function seedAceptadaYRechazadaPorCupos(ctx, cfgAceptado, cfgRechazado) {
  const aceptado = await crearAlumnoInicial({ ...cfgAceptado, ofertaId: ctx.ofertaAId, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  const rechazado = await crearAlumnoInicial({ ...cfgRechazado, ofertaId: ctx.ofertaAId, carreraId: ctx.carreraId, periodoId: ctx.periodoId });

  // Llamada real — dispara RN-GR-11 internamente sobre "rechazado".
  await grProfesorService.decidirSolicitud(aceptado.solicitudId, 'aceptar', ctx.profesorUsuarioId);

  return [
    { ...aceptado, estado: 'aceptada_por_profesor' },
    { ...rechazado, estado: 'rechazada_por_cupos' },
  ];
}

async function seedRechazadaPorProfesor(ctx, cfg) {
  const alumno = await crearAlumnoInicial({ ...cfg, ofertaId: ctx.ofertaBId, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(alumno.solicitudId, 'rechazar', ctx.profesorUsuarioId);
  return { ...alumno, estado: 'rechazada_por_profesor' };
}

async function avanzarHastaAceptado(ctx, cfg) {
  const alumno = await crearAlumnoInicial({ ...cfg, ofertaId: ctx.ofertaBId, carreraId: ctx.carreraId, periodoId: ctx.periodoId });
  await grProfesorService.decidirSolicitud(alumno.solicitudId, 'aceptar', ctx.profesorUsuarioId);
  return alumno;
}

async function seedRegistroSiss(ctx, cfg) {
  const alumno = await avanzarHastaAceptado(ctx, cfg);
  await grService.continuarARegistroSISS(alumno.usuarioId);
  return { ...alumno, estado: 'registro_SISS' };
}

async function avanzarHastaRegistroSiss(ctx, cfg) {
  const alumno = await avanzarHastaAceptado(ctx, cfg);
  await grService.continuarARegistroSISS(alumno.usuarioId);
  return alumno;
}

async function seedAdjuntarDocumentacionInicial(ctx, cfg) {
  const alumno = await avanzarHastaRegistroSiss(ctx, cfg);
  await grService.confirmarRegistroSISS(alumno.usuarioId);
  return { ...alumno, estado: 'adjuntar_documentacion_inicial' };
}

async function avanzarHastaAdjuntarDocumentacion(ctx, cfg) {
  const alumno = await avanzarHastaRegistroSiss(ctx, cfg);
  await grService.confirmarRegistroSISS(alumno.usuarioId);
  return alumno;
}

async function avanzarHastaDocumentacionPendiente(ctx, cfg) {
  const alumno = await avanzarHastaAdjuntarDocumentacion(ctx, cfg);
  await grService.adjuntarDocumentacionInicial(alumno.usuarioId, {
    cartaCreditos: archivo(MUESTRA_PDF),
    seguroSocial: archivo(MUESTRA_PDF),
  });
  return alumno;
}

async function seedSissYDocumentacionPendiente(ctx, cfg) {
  const alumno = await avanzarHastaDocumentacionPendiente(ctx, cfg);
  return { ...alumno, estado: 'SISS_y_documentacion_pendiente' };
}

async function seedSissDocsAprobados(ctx, cfg) {
  const alumno = await avanzarHastaDocumentacionPendiente(ctx, cfg);
  await grCoordinadorService.decidirDocumentacion(alumno.solicitudId, 'aceptar', null, ctx.coordinadorUsuarioId);
  return { ...alumno, estado: 'SISS_docs_aprobados' };
}

async function avanzarHastaDocsAprobados(ctx, cfg) {
  const alumno = await avanzarHastaDocumentacionPendiente(ctx, cfg);
  await grCoordinadorService.decidirDocumentacion(alumno.solicitudId, 'aceptar', null, ctx.coordinadorUsuarioId);
  return alumno;
}

async function seedCorregirSiss(ctx, cfg) {
  const alumno = await avanzarHastaDocumentacionPendiente(ctx, cfg);
  await grCoordinadorService.decidirDocumentacion(alumno.solicitudId, 'corregir_siss', 'Motivo de prueba (seed-maestro-gr): corregir registro en SISS.', ctx.coordinadorUsuarioId);
  return { ...alumno, estado: 'corregir_SISS' };
}

async function seedCorregirDocsini(ctx, cfg) {
  const alumno = await avanzarHastaDocumentacionPendiente(ctx, cfg);
  await grCoordinadorService.decidirDocumentacion(alumno.solicitudId, 'corregir_documentos', 'Motivo de prueba (seed-maestro-gr): corregir documentos adjuntos.', ctx.coordinadorUsuarioId);
  return { ...alumno, estado: 'corregir_docsini' };
}

async function seedRechazadaDefinitivamente(ctx, cfg) {
  const alumno = await avanzarHastaDocumentacionPendiente(ctx, cfg);
  await grCoordinadorService.decidirDocumentacion(alumno.solicitudId, 'rechazar_definitivo', 'Motivo de prueba (seed-maestro-gr): rechazo definitivo por documentación incongruente.', ctx.coordinadorUsuarioId);
  return { ...alumno, estado: 'rechazada_definitivamente' };
}

async function avanzarHastaRechazadaDefinitivamente(ctx, cfg) {
  const alumno = await avanzarHastaDocumentacionPendiente(ctx, cfg);
  await grCoordinadorService.decidirDocumentacion(alumno.solicitudId, 'rechazar_definitivo', 'Motivo de prueba (seed-maestro-gr): rechazo definitivo por documentación incongruente.', ctx.coordinadorUsuarioId);
  return alumno;
}

async function seedDescargarCartaCompromiso(ctx, cfg) {
  const alumno = await avanzarHastaDocsAprobados(ctx, cfg);
  await grService.continuarACartaCompromiso(alumno.usuarioId);
  return { ...alumno, estado: 'descargar_carta_compromiso' };
}

async function avanzarHastaDescargarCarta(ctx, cfg) {
  const alumno = await avanzarHastaDocsAprobados(ctx, cfg);
  await grService.continuarACartaCompromiso(alumno.usuarioId);
  return alumno;
}

async function seedEsperaConfirmacionCartaCompromiso(ctx, cfg) {
  const alumno = await avanzarHastaDescargarCarta(ctx, cfg);
  await grService.confirmarCartaCompromiso(alumno.usuarioId);
  return { ...alumno, estado: 'espera_confirmacion_carta_compromiso' };
}

async function avanzarHastaEsperaConfirmacionCarta(ctx, cfg) {
  const alumno = await avanzarHastaDescargarCarta(ctx, cfg);
  await grService.confirmarCartaCompromiso(alumno.usuarioId);
  return alumno;
}

async function seedCartaCompromisoConfirmada(ctx, cfg) {
  const alumno = await avanzarHastaEsperaConfirmacionCarta(ctx, cfg);
  await grCoordinadorService.registrarRecepcionCarta(alumno.solicitudId, ctx.coordinadorUsuarioId);
  return { ...alumno, estado: 'carta_compromiso_confirmada' };
}

async function avanzarHastaCartaConfirmada(ctx, cfg) {
  const alumno = await avanzarHastaEsperaConfirmacionCarta(ctx, cfg);
  await grCoordinadorService.registrarRecepcionCarta(alumno.solicitudId, ctx.coordinadorUsuarioId);
  return alumno;
}

async function seedAdjuntarExpediente(ctx, cfg) {
  const alumno = await avanzarHastaCartaConfirmada(ctx, cfg);
  await grService.continuarAExpediente(alumno.usuarioId);
  return { ...alumno, estado: 'adjuntar_expediente' };
}

async function avanzarHastaAdjuntarExpediente(ctx, cfg) {
  const alumno = await avanzarHastaCartaConfirmada(ctx, cfg);
  await grService.continuarAExpediente(alumno.usuarioId);
  return alumno;
}

async function avanzarHastaExpedientePendiente(ctx, cfg) {
  const alumno = await avanzarHastaAdjuntarExpediente(ctx, cfg);
  await grService.subirExpediente(alumno.usuarioId, {
    cartaCompromiso: archivo(MUESTRA_PDF),
    curp: archivo(MUESTRA_PDF),
    constanciaCreditos: archivo(MUESTRA_PDF),
  });
  return alumno;
}

async function seedExpedientePendienteRevision(ctx, cfg) {
  const alumno = await avanzarHastaExpedientePendiente(ctx, cfg);
  return { ...alumno, estado: 'expediente_pendiente_revision' };
}

async function seedExpedienteConCorrecciones(ctx, cfg) {
  const alumno = await avanzarHastaExpedientePendiente(ctx, cfg);
  await grCoordinadorService.decidirExpediente(alumno.solicitudId, 'rechazar', 'Motivo de prueba (seed-maestro-gr): corregir expediente.', ctx.coordinadorUsuarioId);
  return { ...alumno, estado: 'expediente_con_correcciones' };
}

async function seedExpedienteAprobado(ctx, cfg) {
  const alumno = await avanzarHastaExpedientePendiente(ctx, cfg);
  await grCoordinadorService.decidirExpediente(alumno.solicitudId, 'aprobar', null, ctx.coordinadorUsuarioId);
  return { ...alumno, estado: 'expediente_aprobado' };
}

async function seedAlumnoAsignado(ctx, cfg) {
  const alumno = await avanzarHastaExpedientePendiente(ctx, cfg);
  await grCoordinadorService.decidirExpediente(alumno.solicitudId, 'aprobar', null, ctx.coordinadorUsuarioId);
  await grService.continuarAlumnoAsignado(alumno.usuarioId);
  return { ...alumno, estado: 'alumno_asignado' };
}

async function seedModificarReenviar(ctx, cfg) {
  const alumno = await avanzarHastaRechazadaDefinitivamente(ctx, cfg);
  await grService.iniciarModificarSolicitud(alumno.usuarioId);
  return { ...alumno, estado: 'modificar_reenviar' };
}

// ─────────────────────────────────────────────────────────────
// 6. Orquestación
// ─────────────────────────────────────────────────────────────
function cfgDe(n) {
  const c = ALUMNOS_CONFIG.find((a) => a.n === n);
  return { n: c.n, apellido: c.apellido };
}

async function main() {
  console.log('🔎 Verificando que no existan datos de una corrida previa...');
  await verificarSinDuplicados();

  console.log('🏗️  Creando coordinador, profesor, carrera, periodo y ofertas dedicadas...');
  const ctx = await crearEntidadesDedicadas();
  console.log(`   Coordinador: ${COORDINADOR.correo_institucional}`);
  console.log(`   Profesor:    ${PROFESOR.correo_institucional}`);
  console.log(`   Oferta A (cupo=1): id ${ctx.ofertaAId}`);
  console.log(`   Oferta B (cupo=10): id ${ctx.ofertaBId}`);

  const resultados = [];

  async function ejecutar(nombreEstado, fn) {
    try {
      const res = await fn();
      const lista = Array.isArray(res) ? res : [res];
      lista.forEach((a) => resultados.push({ ...a, ok: true }));
      console.log(`✅ ${nombreEstado}`);
    } catch (err) {
      resultados.push({ estado: nombreEstado, ok: false, error: err.message });
      console.error(`❌ ${nombreEstado} — ${err.message}`);
    }
  }

  await ejecutar('espera_respuesta_de_profesor', () => seedEsperaRespuestaProfesor(ctx, cfgDe(1)));
  await ejecutar('aceptada_por_profesor + rechazada_por_cupos', () => seedAceptadaYRechazadaPorCupos(ctx, cfgDe(2), cfgDe(4)));
  await ejecutar('rechazada_por_profesor', () => seedRechazadaPorProfesor(ctx, cfgDe(3)));
  await ejecutar('registro_SISS', () => seedRegistroSiss(ctx, cfgDe(5)));
  await ejecutar('adjuntar_documentacion_inicial', () => seedAdjuntarDocumentacionInicial(ctx, cfgDe(6)));
  await ejecutar('SISS_y_documentacion_pendiente', () => seedSissYDocumentacionPendiente(ctx, cfgDe(7)));
  await ejecutar('SISS_docs_aprobados', () => seedSissDocsAprobados(ctx, cfgDe(8)));
  await ejecutar('corregir_SISS', () => seedCorregirSiss(ctx, cfgDe(9)));
  await ejecutar('corregir_docsini', () => seedCorregirDocsini(ctx, cfgDe(10)));
  await ejecutar('rechazada_definitivamente', () => seedRechazadaDefinitivamente(ctx, cfgDe(11)));
  await ejecutar('descargar_carta_compromiso', () => seedDescargarCartaCompromiso(ctx, cfgDe(12)));
  await ejecutar('espera_confirmacion_carta_compromiso', () => seedEsperaConfirmacionCartaCompromiso(ctx, cfgDe(13)));
  await ejecutar('carta_compromiso_confirmada', () => seedCartaCompromisoConfirmada(ctx, cfgDe(14)));
  await ejecutar('adjuntar_expediente', () => seedAdjuntarExpediente(ctx, cfgDe(15)));
  await ejecutar('expediente_pendiente_revision', () => seedExpedientePendienteRevision(ctx, cfgDe(16)));
  await ejecutar('expediente_con_correcciones', () => seedExpedienteConCorrecciones(ctx, cfgDe(17)));
  await ejecutar('expediente_aprobado', () => seedExpedienteAprobado(ctx, cfgDe(18)));
  await ejecutar('alumno_asignado', () => seedAlumnoAsignado(ctx, cfgDe(19)));
  await ejecutar('modificar_reenviar', () => seedModificarReenviar(ctx, cfgDe(20)));

  // ── Reporte final ──────────────────────────────────────────
  const exitosos = resultados.filter((r) => r.ok);
  const fallidos = resultados.filter((r) => !r.ok);

  console.log('\n📋 Reporte final — seed-maestro-gr');
  console.log(`   ${exitosos.length}/${TOTAL_ALUMNOS} alumnos creados correctamente.`);
  console.log(`   Contraseña de TODOS los alumnos, profesor y coordinador: ${PASSWORD_PLANO}\n`);

  console.log('Boleta        | Correo                          | Estado alcanzado');
  console.log('--------------|---------------------------------|--------------------------------------');
  exitosos
    .sort((a, b) => a.boleta.localeCompare(b.boleta))
    .forEach((a) => {
      console.log(`${a.boleta} | ${a.correo.padEnd(31)} | ${a.estado}`);
    });

  if (fallidos.length > 0) {
    console.log('\n⚠️  Estados que fallaron durante el seed:');
    fallidos.forEach((f) => console.log(`   - ${f.estado}: ${f.error}`));
  }
}

main()
  .catch((e) => {
    console.error('❌ El seed no se completó.');
    console.error('   Motivo:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
