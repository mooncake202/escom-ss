const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { getEstadoRequisitos, postIniciarEvaluacion } = require('./lss-alumno.controller');

const router = express.Router();

// Montado bajo '/alumno' en server.js — CU-LSS-01, iniciar evaluación de desempeño.
router.get('/liberacion/requisitos', requireAuth, requireRole('alumno_asignado'), getEstadoRequisitos);
router.post('/liberacion/iniciar', requireAuth, requireRole('alumno_asignado'), postIniciarEvaluacion);

module.exports = router;
