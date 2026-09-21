const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { getReportes, getDetalleReporte, getPdfReporte, postRechazar, postAprobar } = require('./reportes-coordinacion.controller');

const router = express.Router();

// Montado bajo '/coordinador' en server.js (mismo prefijo que gr-coordinador.routes.js y ah-coordinador.routes.js).
router.get('/reportes', requireAuth, requireRole('coordinador'), getReportes);
router.get('/reportes/:tipoReporte/:id', requireAuth, requireRole('coordinador'), getDetalleReporte);
router.get('/reportes/:tipoReporte/:id/pdf', requireAuth, requireRole('coordinador'), getPdfReporte);
router.post('/reportes/:tipoReporte/:id/rechazar', requireAuth, requireRole('coordinador'), postRechazar);
router.post('/reportes/:tipoReporte/:id/aprobar', requireAuth, requireRole('coordinador'), postAprobar);

module.exports = router;
