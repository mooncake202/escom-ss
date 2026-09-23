// Rúbrica (imagen de firma) del profesor para CU-LSS-03.
//
// Convención de carpetas confirmada por el usuario — DISTINTA de la que usa
// Reportes (uploads/rubricas/<usuario_id>/): aquí cada actor tiene su
// propia raíz, identificado por un campo natural en vez del id numérico:
//   uploads/profesores/<correo_institucional>/Rubrica/rubrica.enc
//
// Esta tarea (CU-LSS-03) SOLO necesita la ruta de profesor. Las de alumno
// (uploads/documentos/<boleta>/Rubrica/rubrica.enc) y coordinador
// (uploads/coordinador/Sellos/sello-escom.enc) son referencia para cuando
// se construya lo que corresponda — no se usan aquí.

const fs = require('fs');
const path = require('path');
const { cifrarBuffer, descifrarBuffer } = require('../../lib/fileEncryption');

const RUTA_BASE_PROFESORES = path.join(__dirname, '../../../uploads/profesores');

function rutaRubricaProfesor(correoInstitucional) {
  return path.join(RUTA_BASE_PROFESORES, correoInstitucional, 'Rubrica', 'rubrica.enc');
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

module.exports = {
  RUTA_BASE_PROFESORES,
  rutaRubricaProfesor,
  obtenerRubricaProfesor,
  guardarRubricaProfesorSiFalta,
};
