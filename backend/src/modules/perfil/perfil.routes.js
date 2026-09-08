const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { putPerfilProfesor } = require('./perfil.controller');

const router = express.Router();

router.put('/profesor', requireAuth, requireRole('profesor'), putPerfilProfesor);

module.exports = router;
