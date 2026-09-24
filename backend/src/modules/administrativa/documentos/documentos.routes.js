const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const {
  getMiExpediente, getAlumnos, getExpedienteDeAlumno, getArchivo,
  getAlumnosCarta, postCartaFirmada,
} = require('./documentos.controller');

const router = express.Router();

// Montado bajo '/documentos' en server.js.

// ── CU-ADM-13 · Expediente documental histórico (SOLO CONSULTA) ─────────────
// No hay POST, PUT ni DELETE aquí: este CU no sube, no modifica, no aprueba y no elimina.

// El alumno consulta SUS documentos. No recibe boleta: sale del token.
router.get('/mi-expediente', requireAuth, requireRole('alumno_asignado'), getMiExpediente);

// Coordinación: lista de alumnos y expediente de uno concreto.
// '/alumnos' va antes de '/alumnos/:boleta...' para que Express no lo capture como boleta.
router.get('/alumnos', requireAuth, requireRole('coordinador'), getAlumnos);
router.get('/alumnos/:boleta', requireAuth, requireRole('coordinador'), getExpedienteDeAlumno);

// ── CU-ADM-14 · Carta compromiso firmada (única escritura del bloque) ───────
// Se declara ANTES de '/:id' para que 'carta-firmada' no se interprete como un id.

router.get('/carta-firmada/alumnos', requireAuth, requireRole('coordinador'), getAlumnosCarta);

// Registra o SUSTITUYE la carta del alumno de esa boleta. multipart/form-data, campo `carta`.
router.post('/carta-firmada/:boleta', requireAuth, requireRole('coordinador'), postCartaFirmada);

// ── Archivo (ambos roles) ───────────────────────────────────────────────────
// Sirve el PDF descifrado al vuelo. El alcance lo impone el servicio según el rol: al alumno se le
// exige además que el documento sea de SU boleta. Va al final por llevar un parámetro libre.
router.get('/:id/archivo', requireAuth, requireRole('alumno_asignado', 'coordinador'), getArchivo);

module.exports = router;
