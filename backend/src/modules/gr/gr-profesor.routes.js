const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { getSolicitudesPendientes, postDecidirSolicitud } = require('./gr-profesor.controller');

const router = express.Router();

router.get('/solicitudes', requireAuth, requireRole('profesor'), getSolicitudesPendientes);
router.post('/solicitudes/:id/decidir', requireAuth, requireRole('profesor'), postDecidirSolicitud);

module.exports = router;
