const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { getAcumuladoProfesores } = require('./ah-coordinador.controller');

const router = express.Router();

// Montado bajo '/coordinador' en server.js, junto a gr-coordinador.routes.js
// (mismo prefijo, sub-path '/horas' no choca con '/documentacion',
// '/cartas-compromiso', '/expedientes' ya usados por GR). CU-AH-05 — primera
// vez que el módulo ah/ necesita un actor coordinador.
router.get('/horas', requireAuth, requireRole('coordinador'), getAcumuladoProfesores);

module.exports = router;
