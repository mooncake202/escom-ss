const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getEvaluacionesPendientesDictamen,
  getDescargarParaRevision,
  postDictaminarAprobado,
  postDictaminarRechazado,
} = require('./lss-coordinador.controller');

const router = express.Router();

// Montado bajo '/coordinador' en server.js — CU-LSS-04, dictaminar evaluación de desempeño.
router.get('/evaluacion/pendientes', requireAuth, requireRole('coordinador'), getEvaluacionesPendientesDictamen);
router.get('/evaluacion/:id/descargar', requireAuth, requireRole('coordinador'), getDescargarParaRevision);
router.post('/evaluacion/:id/aprobar', requireAuth, requireRole('coordinador'), postDictaminarAprobado);
router.post('/evaluacion/:id/rechazar', requireAuth, requireRole('coordinador'), postDictaminarRechazado);

module.exports = router;
