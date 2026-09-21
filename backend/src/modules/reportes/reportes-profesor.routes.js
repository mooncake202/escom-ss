const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { getReportes, getDetalleReporte, getPdfReporte, getEstadoRubrica, postRechazar, postAprobar } = require('./reportes-profesor.controller');
const { postRubrica } = require('./reportes-alumno.controller');

const router = express.Router();

// Montado bajo '/profesor' en server.js (mismo prefijo que gr-profesor.routes.js y ah.routes.js).
router.get('/reportes', requireAuth, requireRole('profesor'), getReportes);
router.get('/reportes/:tipoReporte/:id', requireAuth, requireRole('profesor'), getDetalleReporte);
router.get('/reportes/:tipoReporte/:id/pdf', requireAuth, requireRole('profesor'), getPdfReporte);
router.post('/reportes/:tipoReporte/:id/rechazar', requireAuth, requireRole('profesor'), postRechazar);
router.post('/reportes/:tipoReporte/:id/aprobar', requireAuth, requireRole('profesor'), postAprobar);

// Rúbrica del profesor: se sube una sola vez (mismo mecanismo y validaciones que la del alumno) y se reutiliza al aprobar.
router.get('/reportes/rubrica', requireAuth, requireRole('profesor'), getEstadoRubrica);
router.post('/reportes/rubrica', requireAuth, requireRole('profesor'), postRubrica);

module.exports = router;
