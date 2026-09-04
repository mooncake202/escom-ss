const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { generarToken } = require('../../lib/jwt');

// RN-CRED-02
const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 5;

// RF-CRED-04: mensaje genérico, nunca se revela si falló el correo o la contraseña.
const MENSAJE_CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos.';

function minutosTranscurridosDesde(fecha) {
  return (Date.now() - new Date(fecha).getTime()) / 60000;
}

async function registrarInicioSesion(usuarioId, ip, resultado) {
  await prisma.inicio_sesion.create({
    data: {
      usuario_id: usuarioId,
      fecha_hora: new Date(),
      ip_acceso: ip || 'desconocida',
      resultado,
    },
  });
}

/**
 * CU-CRED-01 — Iniciar sesión
 */
async function login({ correo_institucional, contrasena, ip }) {
  if (!correo_institucional || !contrasena) {
    const error = new Error('Ingresa tu correo institucional y contraseña.');
    error.status = 400;
    throw error;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { correo_institucional },
  });

  // Flujo alterno 4.1: correo no registrado — mismo mensaje genérico, sin distinguir el motivo.
  if (!usuario) {
    const error = new Error(MENSAJE_CREDENCIALES_INVALIDAS);
    error.status = 401;
    throw error;
  }

  // Excepción E1: cuenta ya bloqueada — revisa si ya pasaron los 5 minutos.
  if (usuario.cuenta_bloqueada) {
    const minutosPasados = minutosTranscurridosDesde(usuario.fecha_bloqueo);

    if (minutosPasados < MINUTOS_BLOQUEO) {
      const minutosRestantes = Math.ceil(MINUTOS_BLOQUEO - minutosPasados);
      const error = new Error(
        `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minuto(s).`
      );
      error.status = 423; // Locked
      throw error;
    }

    // Ya pasó el tiempo de bloqueo: se desbloquea automáticamente y continúa validando.
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { cuenta_bloqueada: false, intentos_fallidos: 0, fecha_bloqueo: null },
    });
    usuario.cuenta_bloqueada = false;
    usuario.intentos_fallidos = 0;
  }

  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

  // Flujo alterno 4.2: contraseña incorrecta.
  if (!contrasenaValida) {
    const intentosActualizados = (usuario.intentos_fallidos || 0) + 1;
    const seBloqueaAhora = intentosActualizados >= MAX_INTENTOS;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentos_fallidos: intentosActualizados,
        cuenta_bloqueada: seBloqueaAhora,
        fecha_bloqueo: seBloqueaAhora ? new Date() : null,
      },
    });

    await registrarInicioSesion(usuario.id, ip, false);

    if (seBloqueaAhora) {
      const error = new Error(
        `Cuenta bloqueada temporalmente por 5 intentos fallidos. Intenta de nuevo en ${MINUTOS_BLOQUEO} minutos.`
      );
      error.status = 423;
      throw error;
    }

    const error = new Error(MENSAJE_CREDENCIALES_INVALIDAS);
    error.status = 401;
    throw error;
  }

  // Login correcto: resetea contador y registra el acceso.
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { intentos_fallidos: 0, cuenta_bloqueada: false, fecha_bloqueo: null },
  });

  await registrarInicioSesion(usuario.id, ip, true);

  const token = generarToken({ sub: usuario.id, rol: usuario.rol });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo_institucional: usuario.correo_institucional,
      rol: usuario.rol,
    },
  };
}

module.exports = { login };
