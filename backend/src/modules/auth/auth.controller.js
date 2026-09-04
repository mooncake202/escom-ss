const authService = require('./auth.service');

async function postLogin(req, res) {
  try {
    // Acepta tanto los nombres del schema (correo_institucional, contrasena)
    // como los que ya usa LoginPage.jsx (correoInst, password).
    const correo = req.body.correo_institucional || req.body.correoInst;
    const pass = req.body.contrasena || req.body.password;

    const resultado = await authService.login({
      correo_institucional: correo,
      contrasena: pass,
      ip: req.ip,
    });

    return res.status(200).json(resultado);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Ocurrió un error. Intenta de nuevo más tarde.' : err.message;

    if (status === 500) {
      // Log real del error para depurar; nunca se lo mandamos al cliente (Excepción E2).
      console.error('Error inesperado en login:', err);
    }

    return res.status(status).json({ message });
  }
}

module.exports = { postLogin };
