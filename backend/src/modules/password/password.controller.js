const passwordService = require('./password.service');

async function postForgotPassword(req, res) {
  try {
    const { correo_institucional } = req.body;
    const resultado = await passwordService.solicitarRestablecimiento(correo_institucional);

    return res.status(200).json({
      message: resultado.correoEnviado
        ? 'Se envió un enlace de recuperación a tu correo institucional.'
        : 'No fue posible enviar el enlace. Intenta de nuevo más tarde.',
      correoEnviado: resultado.correoEnviado,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error en forgot-password:', err);
    return res.status(status).json({ message });
  }
}

async function postResetPassword(req, res) {
  try {
    const { token } = req.params;
    const { contrasena } = req.body;
    await passwordService.restablecerContrasena(token, contrasena);
    return res.status(200).json({
      message: 'Tu contraseña fue actualizada correctamente. Inicia sesión con tu nueva contraseña.',
    });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error en reset-password:', err);
    return res.status(status).json({ message });
  }
}

async function postChangePasswordSesion(req, res) {
  try {
    const usuarioId = req.usuario.sub;
    const resultado = await passwordService.solicitarCambioDesdeSesion(usuarioId);
    return res.status(200).json({
      message: resultado.correoEnviado
        ? 'Se envió un enlace a tu correo institucional para cambiar tu contraseña.'
        : 'No fue posible enviar el correo. Intenta de nuevo más tarde.',
      correoEnviado: resultado.correoEnviado,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    if (status === 500) console.error('Error en change-password:', err);
    return res.status(status).json({ message });
  }
}

async function getValidarToken(req, res) {
  try {
    await passwordService.validarTokenVigente(req.params.token);
    return res.status(200).json({ valido: true });
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;
    return res.status(status).json({ valido: false, message });
  }
}

module.exports = { postForgotPassword, postResetPassword, postChangePasswordSesion, getValidarToken };