const express = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { getPendientes, putMarcarLeida, putMarcarLeidasPorRuta } = require('./notificaciones.controller');

const router = express.Router();

router.get('/', requireAuth, getPendientes);
router.put('/:id/leer', requireAuth, putMarcarLeida);
router.put('/leer-por-ruta', requireAuth, putMarcarLeidasPorRuta);

module.exports = router;
