// seed-manual-cupos.shared.js
//
// Constantes compartidas entre seed-manual-cupos-crear.js y
// seed-manual-cupos-borrar.js — única fuente de verdad de qué correos y
// boletas identifican los datos de este seed, para que el script de
// borrado nunca pueda desincronizarse de lo que el de creación realmente
// generó (mismo principio ya aplicado en cupos.js con el texto del motivo
// de rechazo: una sola fuente, nunca duplicado).
//
// AISLAMIENTO: prefijo "[MANUAL-CUPOS]" / "MANUALCUPOS" / correos
// "manualcupos####@alumno.ipn.mx" / boletas con año ficticio 2097 —
// distinto de seed-maestro-gr.js (2099) y de seed-prueba-cupos-profesor.js
// (2098), para que los 3 seeds puedan coexistir sin mezclarse nunca.

const PASSWORD_PLANO = '12345678';
const CARRERA_NOMBRE = 'ISC';
const ANIO_BOLETA = '2097';

const COORDINADOR = {
  correo_institucional: 'coordinador.manualcupos@ipn.mx',
  nombre: 'MANUALCUPOS',
  apellidos: 'COORDINADOR DEDICADO',
};

const PROFESOR_A = {
  correo_institucional: 'profesor.manualcuposA@ipn.mx',
  nombre: 'MANUALCUPOS',
  apellidos: 'PROFESOR A SIN INVESTIGADOR',
  cupos_totales: 2,
};

const PROFESOR_B = {
  correo_institucional: 'profesor.manualcuposB@ipn.mx',
  nombre: 'MANUALCUPOS',
  apellidos: 'PROFESOR B CON INVESTIGADOR',
  cupos_totales: 2,
};

const PROFESOR_D = {
  correo_institucional: 'profesor.manualcuposD@ipn.mx',
  nombre: 'MANUALCUPOS',
  apellidos: 'PROFESOR D CON INVESTIGADOR',
  cupos_totales: 2,
};

const NOMBRE_OFERTA_A1 = '[MANUAL-CUPOS] Oferta A1 individual';
const NOMBRE_OFERTA_B1 = '[MANUAL-CUPOS] Oferta B1 proyecto';
const NOMBRE_OFERTA_D1 = '[MANUAL-CUPOS] Oferta D1 proyecto';
const NOMBRE_OFERTA_D2 = '[MANUAL-CUPOS] Oferta D2 individual';
const NOMBRE_PERIODO = '[MANUAL-CUPOS] Periodo de pruebas manuales';

// Índice -> alumno (determinístico para boleta/correo y para el reporte).
const ALUMNOS = {
  A_N1: 1,
  A_N2: 2,
  A_PENDIENTE: 3,
  B_N1: 4,
  B_N2: 5,
  B_PENDIENTE: 6,
  D_N1: 7,
  D_N2: 8,
  D_INV1: 9,
  D_CHECK_Y: 10,
  D_CHECK_X: 11,
};

function boletaDe(n) {
  return `${ANIO_BOLETA}63${String(n).padStart(4, '0')}`;
}

function correoDe(n) {
  return `manualcupos${String(n).padStart(4, '0')}@alumno.ipn.mx`;
}

function todosLosCorreos() {
  return [
    COORDINADOR.correo_institucional,
    PROFESOR_A.correo_institucional,
    PROFESOR_B.correo_institucional,
    PROFESOR_D.correo_institucional,
    ...Object.values(ALUMNOS).map(correoDe),
  ];
}

module.exports = {
  PASSWORD_PLANO,
  CARRERA_NOMBRE,
  ANIO_BOLETA,
  COORDINADOR,
  PROFESOR_A,
  PROFESOR_B,
  PROFESOR_D,
  NOMBRE_OFERTA_A1,
  NOMBRE_OFERTA_B1,
  NOMBRE_OFERTA_D1,
  NOMBRE_OFERTA_D2,
  NOMBRE_PERIODO,
  ALUMNOS,
  boletaDe,
  correoDe,
  todosLosCorreos,
};
