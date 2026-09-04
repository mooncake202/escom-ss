const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { generarTokenSeguro } = require('../../lib/tokens');
const { enviarCorreoRecuperacion } = require('../../lib/mailer');
const { validarContrasena } = require('../../lib/validators');

const MINUTOS_VIGENCIA_TOKEN = 30; // RN-CRED-03

/**
 * Paso 1-3 del flujo principal: el usuario pide el enlace de recuperación.
 *
 * RF-CRED-09: a diferencia de CU-CRED-01 (login), aquí SÍ se revela si el
 * correo está registrado — es una decisión de negocio intencional para este
 * sistema institucional cerrado (ver conversación previa del proyecto).
 */
async function solicitarRestablecimiento(correoInstitucional) {
  if (!correoInstitucional) {
    const error = new Error('Ingresa tu correo institucional.');
    error.status = 400;
    throw error;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { correo_institucional: correoInstitucional },
  });

  // Flujo alterno 2.1
  if (!usuario) {
    const error = new Error(
      'Ingresa un correo válido del IPN. Si cree que esto es un error y el correo no está ' +
      'registrado en el sistema, vaya al área de Servicio Social en la ESCOM.'
    );
    error.status = 404;
    throw error;
  }

  const token = generarTokenSeguro();
  const ahora = new Date();
  const fechaExpiracion = new Date(ahora.getTime() + MINUTOS_VIGENCIA_TOKEN * 60000);

  await prisma.token_contrasena.create({
    data: { usuario_id: usuario.id, token, fecha_expiracion: fechaExpiracion, usado: false },
  });

  // Excepción E1: si falla el envío, el token ya quedó creado (puede
  // reintentarse pidiendo el enlace de nuevo); no se revierte nada.
  let correoEnviado = true;
  try {
    await enviarCorreoRecuperacion({ to: usuario.correo_institucional, nombre: usuario.nombre, token });
  } catch (err) {
    console.error('Error al enviar correo de recuperación:', err);
    correoEnviado = false;
  }

  return { correoEnviado };
}

/**
 * Valida que el token exista, no esté usado y no haya expirado.
 * Flujo alterno 4.1.
 */
async function validarTokenVigente(token) {
  const registro = await prisma.token_contrasena.findFirst({
    where: { token },
    orderBy: { id: 'desc' },
  });

  if (!registro || registro.usado || registro.fecha_expiracion < new Date()) {
    const error = new Error('El enlace no es válido o ya expiró. Solicita uno nuevo.');
    error.status = 400;
    throw error;
  }

  return registro;
}

/**
 * Paso 4-6 del flujo principal: el usuario entra desde el link y define su
 * nueva contraseña.
 */
async function restablecerContrasena(token, nuevaContrasena) {
  const registro = await validarTokenVigente(token);

  // Flujo B: requisitos de seguridad (RN-CRED-04)
  validarContrasena(nuevaContrasena);

  const usuario = await prisma.usuario.findUnique({ where: { id: registro.usuario_id } });

  // Flujo C: no puede ser igual a la anterior (RN-CRED-05)
  const esIgualAnterior = await bcrypt.compare(nuevaContrasena, usuario.contrasena);
  if (esIgualAnterior) {
    const error = new Error('La nueva contraseña no puede ser igual a la anterior.');
    error.status = 400;
    throw error;
  }

  const hash = await bcrypt.hash(nuevaContrasena, 10);

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: usuario.id }, data: { contrasena: hash } }),
    // RF-CRED-10: invalida el enlace inmediatamente tras usarlo.
    prisma.token_contrasena.update({ where: { id: registro.id }, data: { usado: true } }),
  ]);
}

/**
 * Atajo para "Cambiar contraseña" desde sesión activa: reutiliza el mismo
 * mecanismo de correo, mandándolo al propio correo del usuario autenticado
 * (no requiere que lo escriba, ya lo sabemos por el token JWT).
 */
async function solicitarCambioDesdeSesion(usuarioId) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }
  return solicitarRestablecimiento(usuario.correo_institucional);
}

module.exports = {
  solicitarRestablecimiento,
  restablecerContrasena,
  solicitarCambioDesdeSesion,
  validarTokenVigente,
};