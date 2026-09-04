const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const { postCrearUsuario, postReenviarCorreo, getUsuarios, putActualizarUsuario } = require('./usuarios.controller');

const router = express.Router();

// RN-CRED-07: solo coordinador puede crear profesores o coordinadores.
router.get('/', requireAuth, requireRole('coordinador'), getUsuarios);
router.post('/', requireAuth, requireRole('coordinador'), postCrearUsuario);
router.put('/:id', requireAuth, requireRole('coordinador'), putActualizarUsuario);
router.post('/:id/resend-welcome-email', requireAuth, requireRole('coordinador'), postReenviarCorreo);

module.exports = router;