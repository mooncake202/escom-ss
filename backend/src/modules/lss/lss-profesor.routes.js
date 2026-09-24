const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getAlumnosConEvaluacionPendiente,
  postRegistrarEvaluacion,
  postRechazarPorSiss,
  postCorregirYReenviar,
} = require('./lss-profesor.controller');

const router = express.Router();

// Montado bajo '/profesor' en server.js — CU-LSS-03, evaluar desempeño del alumno.
router.get('/evaluacion/pendientes', requireAuth, requireRole('profesor'), getAlumnosConEvaluacionPendiente);
router.post('/evaluacion/:boleta/registrar', requireAuth, requireRole('profesor'), postRegistrarEvaluacion);
router.post('/evaluacion/:boleta/rechazar-siss', requireAuth, requireRole('profesor'), postRechazarPorSiss);
router.post('/evaluacion/:boleta/corregir', requireAuth, requireRole('profesor'), postCorregirYReenviar);

module.exports = router;
