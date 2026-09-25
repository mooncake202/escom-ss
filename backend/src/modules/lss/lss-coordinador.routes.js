const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const {
  getEvaluacionesPendientesDictamen,
  getDescargarParaRevision,
  postDictaminarAprobado,
  postDictaminarRechazado,
  getSolicitudesCartaTermino,
  postMarcarCartaLista,
} = require('./lss-coordinador.controller');

const router = express.Router();

// Montado bajo '/coordinador' en server.js — CU-LSS-04, dictaminar evaluación de desempeño.
router.get('/evaluacion/pendientes', requireAuth, requireRole('coordinador'), getEvaluacionesPendientesDictamen);
router.get('/evaluacion/:id/descargar', requireAuth, requireRole('coordinador'), getDescargarParaRevision);
router.post('/evaluacion/:id/aprobar', requireAuth, requireRole('coordinador'), postDictaminarAprobado);
router.post('/evaluacion/:id/rechazar', requireAuth, requireRole('coordinador'), postDictaminarRechazado);

// CU-LSS-06 — gestionar estado de carta de término.
router.get('/carta-termino/solicitudes', requireAuth, requireRole('coordinador'), getSolicitudesCartaTermino);
router.post('/carta-termino/:id/marcar-lista', requireAuth, requireRole('coordinador'), postMarcarCartaLista);

module.exports = router;
