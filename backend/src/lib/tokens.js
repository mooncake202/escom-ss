const crypto = require('crypto');

/**
 * Genera un token de un solo uso, criptográficamente aleatorio.
 * Se usa tanto para el link de "establecer tu contraseña" (CU-CRED-03)
 * como para el de "recuperar contraseña" (CU-CRED-02).
 */
function generarTokenSeguro() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Genera una contraseña aleatoria inaccesible: nunca se muestra a nadie,
 * solo se usa para inicializar la cuenta hasta que el usuario la cambie
 * a través del flujo de token_contrasena.
 */
function generarContrasenaAleatoria() {
  return crypto.randomBytes(24).toString('base64');
}

module.exports = { generarTokenSeguro, generarContrasenaAleatoria };
