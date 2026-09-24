// seed-bajas.shared.js
//
// Constantes y helpers compartidos por los seeds de Bajas. Mismo principio que
// gr/seeds/seed-manual-cupos.shared.js: una sola fuente de verdad de qué identifica a los datos de
// prueba, para que crear y limpiar nunca puedan desincronizarse.
//
// Este módulo NO ejecuta nada al importarse: solo define. Los seeds sí tienen su `main()`.
//
// AISLAMIENTO POR PREFIJO DE BOLETA, como ya hacen los seeds de GR:
//   2096  reportes REP01 (SEEDREP01 ALUMNO UNO — NO tocar)
//   2097  gr/seed-manual-cupos
//   2098  gr/seed-prueba-cupos-profesor
//   2099  gr/seed-maestro-gr  y  administrativa/bajas/seed-e2e-bajas
//   2095  ESTE seed: flujo completo de baja (seed-baja-flujo-completo.js)
// Cada seed solo borra y crea lo que cae bajo SU prefijo y SUS correos.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../../lib/prisma');
const { cifrarBuffer } = require('../../../../lib/fileEncryption');

const PASSWORD_PLANO = '12345678';

// FORMATO DE CORREO INSTITUCIONAL que exige el sistema. El más estricto es el del LOGIN
// (front/src/features/login/LoginPage.jsx y RecuperarContrasena.jsx):
//
//   /^([^\s@]+@ipn\.mx|[a-zA-Z]+[0-9]{4}@alumno\.ipn\.mx)$/i
//
//   ALUMNO   → LETRAS seguidas de EXACTAMENTE 4 DÍGITOS y @alumno.ipn.mx
//              ('bajaflujo2095@alumno.ipn.mx' sí; 'baja.flujo@alumno.ipn.mx' NO: lleva punto y no
//              termina en 4 dígitos). Backend: validarCorreoInstitucionalAlumno exige además
//              @alumno.ipn.mx y un máximo de 35 caracteres.
//   PROFESOR → cualquier parte local + @ipn.mx, igual que 'profesor.normal@ipn.mx'.
//
// Un seed con un correo fuera de este formato crea un usuario que NO puede iniciar sesión.
const CORREO_ALUMNO_VALIDO = /^[a-zA-Z]+[0-9]{4}@alumno\.ipn\.mx$/;
const CORREO_PROFESOR_VALIDO = /^[^\s@]+@ipn\.mx$/;

/**
 * Falla PRONTO si un correo del seed no podría iniciar sesión. Es una red de seguridad contra el
 * error que ya ocurrió una vez: sembrar un usuario que el login rechaza.
 */
function validarCorreosDeSeed({ alumnos = [], profesores = [] }) {
  for (const correo of alumnos) {
    if (!CORREO_ALUMNO_VALIDO.test(correo)) {
      throw new Error(`Correo de ALUMNO inválido para el login: "${correo}". `
        + 'Debe ser letras + 4 dígitos + @alumno.ipn.mx (ej. bajaflujo2095@alumno.ipn.mx).');
    }
    if (correo.length > 35) {
      throw new Error(`El correo "${correo}" supera los 35 caracteres que acepta el backend.`);
    }
  }
  for (const correo of profesores) {
    if (!CORREO_PROFESOR_VALIDO.test(correo)) {
      throw new Error(`Correo de PROFESOR inválido para el login: "${correo}". Debe terminar en @ipn.mx.`);
    }
  }
}

// Catálogos reales que se REUTILIZAN, nunca se crean: verificados contra la BD.
const COORDINADOR_ID = 1;
const CARRERA_ID = 1;        // carrera.nombre = 'ISC'
const CARRERA_CODIGO = 'ISC';
const PERIODO_ID = 3;
const DICTAMEN_CREDITOS = 1; // DICTAMEN_MAP de gr.service.js: creditos=1, estancia=2, electiva=3

const RUTA_BASE_DOCUMENTOS = path.resolve(__dirname, '../../../../../uploads/documentos');
const carpetaDe = (boleta) => path.join(RUTA_BASE_DOCUMENTOS, boleta);

// Subcarpetas del servicio, las mismas que borra selectivamente una baja aprobada.
const SUBCARPETAS_DEL_SERVICIO = Object.freeze(['Reportes', 'Rubrica', 'CartaCompromisoFirmada']);

/**
 * Escribe un archivo CIFRADO con AES-256-GCM, igual que lo haría el sistema. En texto plano,
 * descifrarBuffer falla con "unable to authenticate data" al descargar el expediente: los .enc deben
 * ser cifrado real, no archivos con esa extensión.
 */
function escribirArchivoCifrado(boleta, rutaRelativaDentro, texto) {
  const destino = path.join(carpetaDe(boleta), rutaRelativaDentro);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, cifrarBuffer(Buffer.from(texto, 'utf8')));
  return path.join(boleta, rutaRelativaDentro);
}

/** Borra la carpeta completa de un alumno de prueba. Solo para limpieza idempotente del seed. */
function borrarCarpetaDeAlumno(boleta) {
  fs.rmSync(carpetaDe(boleta), { recursive: true, force: true });
}

/**
 * Elimina los usuarios de prueba por correo, en el orden correcto: los ALUMNOS antes que los
 * PROFESORES. Al borrar un profesor caen sus ofertas por CASCADE, y `solicitud_registro.oferta_id`
 * quedaría en NULL en vez de desaparecer junto con el alumno.
 *
 * @returns {Promise<number>} cuántos usuarios se borraron.
 */
async function limpiarUsuariosDePrueba(correos) {
  const existentes = await prisma.usuario.findMany({
    where: { correo_institucional: { in: correos } },
    select: { id: true, rol: true },
  });
  if (existentes.length === 0) return 0;

  const alumnos = existentes.filter((u) => u.rol !== 'profesor');
  const profesores = existentes.filter((u) => u.rol === 'profesor');
  for (const u of [...alumnos, ...profesores]) {
    await prisma.usuario.delete({ where: { id: u.id } });
  }
  return existentes.length;
}

/**
 * Red de seguridad para reejecutar un seed: borra al alumno de esa boleta sea cual sea el correo con
 * el que se creó. Cubre ejecuciones anteriores hechas con identificadores distintos, sin depender de
 * recordar cuáles fueron. La boleta es exclusiva del seed, así que no puede alcanzar a nadie más.
 *
 * @returns {Promise<boolean>} true si había un alumno con esa boleta y se eliminó.
 */
async function limpiarAlumnoPorBoleta(boleta) {
  const alumno = await prisma.alumno.findUnique({ where: { boleta }, select: { usuario_id: true } });
  if (!alumno) return false;
  await prisma.usuario.delete({ where: { id: alumno.usuario_id } });
  return true;
}

/**
 * Profesor BASE: 3 cupos y ninguna característica (`caracteristica_id: null`), como manda el modelo
 * (capacidad = 3 + incremento de la característica vigente). Sembrar más capacidad sería inventar un
 * dato que el sistema no puede producir.
 */
async function crearProfesorBase(tx, { correo, nombre, apellidos, cubiculo, hash }) {
  const usuario = await tx.usuario.create({
    data: {
      rol: 'profesor',
      correo_institucional: correo,
      nombre,
      apellidos,
      contrasena: hash,
      fecha_creacion: new Date(),
      intentos_fallidos: 0,
      cuenta_bloqueada: false,
    },
  });

  const profesor = await tx.profesor.create({
    data: {
      usuario_id: usuario.id,
      departamento: 'Ingeniería en Sistemas Computacionales',
      telefono_personal: '5500000000',
      horario_atencion: 'Lunes a viernes, 10:00 a 14:00',
      cubiculo,
      cupos_totales: 3,
      caracteristica_id: null,
    },
  });

  return { usuarioId: usuario.id, profesorId: profesor.id };
}

/** Oferta APROBADA de tipo proyecto: el único estado que puede recibir alumnos. */
async function crearOfertaAprobada(tx, { profesorId, nombreProyecto, ofertados = 3, disponibles = 2 }) {
  return tx.oferta_servicio.create({
    data: {
      profesor_id: profesorId,
      coordinador_id: COORDINADOR_ID,
      nombre_proyecto: nombreProyecto,
      tipo_oferta: 'proyecto',
      descripcion_actividades: 'Oferta creada solo para pruebas del módulo de bajas.',
      cupos_ofertados: ofertados,
      cupos_disponibles: disponibles,
      estado_oferta: 'aprobada',
      fecha_registro: new Date(),
      nombre_SISS: 'Actividad de prueba',
      programa_SISS: 'Programa de prueba',
    },
  });
}

/**
 * Alumno con su servicio social ACTIVO: usuario + alumno + solicitud_registro en 'alumno_asignado'
 * con todas las banderas del proceso de GR ya cumplidas, más su cúmulo de horas y faltas.
 *
 * `creditos` va en 60-70 porque el dictamen de créditos lo exige (validarDictamenYCreditos de
 * gr.service.js) — así el retorno a CU-GR-13 puede reenviar la solicitud sin fallar la validación.
 */
async function crearAlumnoAsignado(tx, { correo, nombre, apellidos, boleta, ofertaId, hash, motivacion }) {
  const ahora = new Date();

  const usuario = await tx.usuario.create({
    data: {
      rol: 'alumno_asignado',
      correo_institucional: correo,
      nombre,
      apellidos,
      contrasena: hash,
      fecha_creacion: ahora,
      intentos_fallidos: 0,
      cuenta_bloqueada: false,
    },
  });

  const alumno = await tx.alumno.create({
    data: {
      boleta,
      usuario_id: usuario.id,
      celular: '5512345678',
      carrera: CARRERA_CODIGO,
      creditos: 65.0,
      semestre: 8,
      correo_personal: null,
    },
  });

  const solicitud = await tx.solicitud_registro.create({
    data: {
      alumno_id: alumno.boleta,
      carrera_id: CARRERA_ID,
      periodo_registro_id: PERIODO_ID,
      oferta_id: ofertaId,
      dictamen: DICTAMEN_CREDITOS,
      estado_solicitud: 'alumno_asignado',
      estado_anterior: 'expediente_pendiente_revision',
      fecha_aplicacion: ahora,
      registro_siss: true,
      docs_iniciales: true,
      carta_compromiso: true,
      fecha_carta_compromiso: ahora,
      expediente: true,
      motivacion_oferta: motivacion,
    },
  });

  await tx.cumulo_horas_y_faltas.create({
    data: {
      alumno_id: alumno.boleta,
      horas_acumuladas: 48,
      horas_rechazadas: 4,
      faltas_acumuladas: 2,
      faltas_consecutivas: 1,
      fecha_ultima_evaluacion_faltas: null,
    },
  });

  return { usuarioId: usuario.id, boleta: alumno.boleta, solicitudRegistroId: solicitud.id };
}

module.exports = {
  PASSWORD_PLANO,
  COORDINADOR_ID,
  CARRERA_ID,
  CARRERA_CODIGO,
  PERIODO_ID,
  DICTAMEN_CREDITOS,
  RUTA_BASE_DOCUMENTOS,
  SUBCARPETAS_DEL_SERVICIO,
  carpetaDe,
  escribirArchivoCifrado,
  borrarCarpetaDeAlumno,
  limpiarUsuariosDePrueba,
  limpiarAlumnoPorBoleta,
  validarCorreosDeSeed,
  crearProfesorBase,
  crearOfertaAprobada,
  crearAlumnoAsignado,
};
