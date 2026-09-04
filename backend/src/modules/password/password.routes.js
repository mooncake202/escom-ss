const express = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const {
  postForgotPassword,
  postResetPassword,
  postChangePasswordSesion,
  getValidarToken,
} = require('./password.controller');

const router = express.Router();

// Público — es justo el flujo para cuando NO puedes iniciar sesión.
router.post('/forgot', postForgotPassword);
router.get('/reset/:token/validar', getValidarToken);
router.post('/reset/:token', postResetPassword);

// Requiere sesión — "Cambiar contraseña" desde dentro de la app.
router.post('/change', requireAuth, postChangePasswordSesion);

module.exports = router;