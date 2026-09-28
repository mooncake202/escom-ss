const express = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const {
  postForgotPassword,
  postResetPassword,
  postChangePasswordSesion,
  getValidarToken,
  putCambiarContrasena,
} = require('./password.controller');

const router = express.Router();

// Público — es justo el flujo para cuando NO puedes iniciar sesión.
router.post('/forgot', postForgotPassword);
router.get('/reset/:token/validar', getValidarToken);
router.post('/reset/:token', postResetPassword);

// Requiere sesión — "Cambiar contraseña" desde dentro de la app.
router.post('/change', requireAuth, postChangePasswordSesion);

// RN-CRED-01, patrón B: cambio directo con contraseña actual + nueva, sin
// correo ni token — cualquier rol con sesión activa (alumno, profesor,
// coordinador), sin restricción de rol.
router.put('/cambiar', requireAuth, putCambiarContrasena);

module.exports = router;