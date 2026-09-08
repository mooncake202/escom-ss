const express = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { getPendientes, putMarcarLeida } = require('./notificaciones.controller');

const router = express.Router();

router.get('/', requireAuth, getPendientes);
router.put('/:id/leer', requireAuth, putMarcarLeida);

module.exports = router;
