const express = require('express');
const { requireAuth, requireRole } = require('../../../middleware/auth.middleware');
const { getEventos, postEvento, putEvento, deleteEvento } = require('./calendario.controller');

const router = express.Router();

// Montado bajo '/calendario' en server.js. Lectura: sesión válida; el servicio decide por rol y rechaza con
// 403 ROL_SIN_ACCESO (p. ej. alumno_sin_asignar). Escritura: solo coordinador.
router.get('/eventos', requireAuth, getEventos);
router.post('/eventos', requireAuth, requireRole('coordinador'), postEvento);
router.put('/eventos/:id', requireAuth, requireRole('coordinador'), putEvento);
router.delete('/eventos/:id', requireAuth, requireRole('coordinador'), deleteEvento);

module.exports = router;
