const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const {
  getMisAlumnos, postBajaProfesor, postAmonestacion,
  getMiSolicitud, postBajaAlumno,
  getSolicitudes, getSolicitud, getExpediente, postAprobar, postRechazar,
} = require('./bajas.controller');

const router = express.Router();

// Montado bajo '/bajas' en server.js.
//
// Autorización estricta en las dos direcciones: un profesor no resuelve bajas y un coordinador no
// puede enviarlas como si fuera profesor o alumno. En ADM-09 y ADM-11 el solicitante SIEMPRE sale
// del token, así que nadie opera sobre otro. El servicio revalida todo: que el front confirme o
// deshabilite un botón no es una garantía de integridad.

// ── CU-ADM-09 · Profesor ──
router.get('/mis-alumnos', requireAuth, requireRole('profesor'), getMisAlumnos);
router.post('/profesor', requireAuth, requireRole('profesor'), postBajaProfesor);
router.post('/amonestacion', requireAuth, requireRole('profesor'), postAmonestacion);

// ── CU-ADM-11 · Alumno ──
router.get('/mi-solicitud', requireAuth, requireRole('alumno_asignado'), getMiSolicitud);
router.post('/alumno', requireAuth, requireRole('alumno_asignado'), postBajaAlumno);

// ── CU-ADM-12 · Coordinación ──
// Las literales van antes que '/:id' para que la paramétrica no las capture.
router.get('/', requireAuth, requireRole('coordinador'), getSolicitudes);
router.get('/:id', requireAuth, requireRole('coordinador'), getSolicitud);
router.get('/:id/expediente', requireAuth, requireRole('coordinador'), getExpediente);
router.post('/:id/aprobar', requireAuth, requireRole('coordinador'), postAprobar);
router.post('/:id/rechazar', requireAuth, requireRole('coordinador'), postRechazar);

module.exports = router;
