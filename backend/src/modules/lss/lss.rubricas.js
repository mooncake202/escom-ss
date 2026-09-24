// Imágenes de firma/sello de los actores de LSS (rúbrica del profesor,
// CU-LSS-03; sello de coordinación, CU-LSS-04).
//
// Convención de carpetas confirmada por el usuario — DISTINTA de la que usa
// Reportes (uploads/rubricas/<usuario_id>/, un asset fijo versionado con el
// código y verificado por SHA-256 hardcodeado): aquí cada actor tiene su
// propia raíz, identificado por un campo natural en vez del id numérico, y
// es un archivo SUBIDO (cifrado), no un asset del código:
//   uploads/profesores/<correo_institucional>/Rubrica/rubrica.enc
//   uploads/coordinador/Sellos/sello-escom.enc
//
// El sello de coordinación es ÚNICO Y GLOBAL (el path no lleva id ni
// correo) — representa el sello de la dependencia (ESCOM), no la firma
// personal de un coordinador específico; cualquier coordinador que
// dictamine usa el mismo archivo.
//
// La ruta de alumno (uploads/documentos/<boleta>/Rubrica/rubrica.enc) NO
// se usa en ningún CU construido hasta ahora — queda como referencia.

const fs = require('fs');
const path = require('path');
const { cifrarBuffer, descifrarBuffer } = require('../../lib/fileEncryption');

const RUTA_BASE_PROFESORES = path.join(__dirname, '../../../uploads/profesores');
const RUTA_BASE_COORDINADOR = path.join(__dirname, '../../../uploads/coordinador');

function rutaRubricaProfesor(correoInstitucional) {
  return path.join(RUTA_BASE_PROFESORES, correoInstitucional, 'Rubrica', 'rubrica.enc');
}

function rutaSelloCoordinacion() {
  return path.join(RUTA_BASE_COORDINADOR, 'Sellos', 'sello-escom.enc');
}

/**
 * Bytes de la rúbrica del profesor (imagen original, ya descifrada), o
 * `null` si todavía no la tiene guardada. No lanza si no existe — quien
 * llama (registrarEvaluacion) decide el mensaje exacto para ese caso.
 */
function obtenerRubricaProfesor(correoInstitucional) {
  const ruta = rutaRubricaProfesor(correoInstitucional);
  if (!fs.existsSync(ruta)) return null;
  try {
    return descifrarBuffer(fs.readFileSync(ruta));
  } catch (err) {
    console.error(`No se pudo leer la rúbrica del profesor ${correoInstitucional}:`, err.message);
    return null;
  }
}

/**
 * Mismo criterio que obtenerRubricaProfesor, pero para el sello único de
 * coordinación (CU-LSS-04). `null` si no está sembrado — dictaminarAprobado
 * decide el mensaje exacto.
 */
function obtenerSelloCoordinacion() {
  const ruta = rutaSelloCoordinacion();
  if (!fs.existsSync(ruta)) return null;
  try {
    return descifrarBuffer(fs.readFileSync(ruta));
  } catch (err) {
    console.error('No se pudo leer el sello de coordinación:', err.message);
    return null;
  }
}

/**
 * SOLO para el seed de pruebas (sembrar-rubrica-profesor-prueba.js) — no es
 * un endpoint real: CU-LSS-03 no incluye "subir mi firma" en su alcance,
 * solo CONSUME una rúbrica ya sembrada. Idempotente: si ya existe, no la
 * sobreescribe (regresa creada:false).
 */
function guardarRubricaProfesorSiFalta(correoInstitucional, buffer) {
  const ruta = rutaRubricaProfesor(correoInstitucional);
  if (fs.existsSync(ruta)) return { creada: false, ruta };
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, cifrarBuffer(buffer));
  return { creada: true, ruta };
}

/**
 * Mismo criterio que guardarRubricaProfesorSiFalta, pero para el sello
 * único de coordinación — SOLO para el seed de pruebas
 * (sembrar-sello-coordinacion-prueba.js), CU-LSS-04 no incluye "subir el
 * sello" en su alcance.
 */
function guardarSelloCoordinacionSiFalta(buffer) {
  const ruta = rutaSelloCoordinacion();
  if (fs.existsSync(ruta)) return { creada: false, ruta };
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, cifrarBuffer(buffer));
  return { creada: true, ruta };
}

module.exports = {
  RUTA_BASE_PROFESORES,
  RUTA_BASE_COORDINADOR,
  rutaRubricaProfesor,
  rutaSelloCoordinacion,
  obtenerRubricaProfesor,
  obtenerSelloCoordinacion,
  guardarRubricaProfesorSiFalta,
  guardarSelloCoordinacionSiFalta,
};
