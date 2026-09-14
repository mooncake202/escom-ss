const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { getAcumuladoProfesores, getHistorialAlumno } = require('./ah-coordinador.controller');

const router = express.Router();

// Montado bajo '/coordinador' en server.js, junto a gr-coordinador.routes.js
// (mismo prefijo, sub-path '/horas'/'/historial' no chocan con
// '/documentacion', '/cartas-compromiso', '/expedientes' ya usados por GR).
// CU-AH-05 — primera vez que el módulo ah/ necesita un actor coordinador.
router.get('/horas', requireAuth, requireRole('coordinador'), getAcumuladoProfesores);

// CU-AH-06 — consultar historial de cualquier alumno (sin restricción de
// supervisión, a diferencia del profesor).
router.get('/historial', requireAuth, requireRole('coordinador'), getHistorialAlumno);

module.exports = router;
