const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@escom-ss.local';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_HOST) {
    // Sin SMTP configurado: no truena, solo imprime el correo en consola.
    // Útil en desarrollo antes de tener credenciales reales.
    transporter = {
      sendMail: async (opciones) => {
        console.log('\n📧 [SMTP no configurado — correo simulado]');
        console.log('Para:', opciones.to);
        console.log('Asunto:', opciones.subject);
        console.log('Texto:', opciones.text);
        console.log('');
        return { simulated: true };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

/**
 * RF-CRED-14 — correo de bienvenida al crear usuario (CU-CRED-03).
 * Reutiliza el mismo flujo de establecer contraseña que CU-CRED-02.
 */
async function enviarCorreoBienvenida({ to, nombre, token }) {
  const link = `${FRONTEND_URL}/establecer-contrasena/${token}`;

  await getTransporter().sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Tu cuenta en el Sistema de Servicio Social — ESCOM',
    text:
      `Hola ${nombre},\n\n` +
      `Tu cuenta fue creada en el Sistema de Servicio Social de ESCOM.\n` +
      `Para poder acceder, primero debes establecer tu contraseña aquí:\n\n${link}\n\n` +
      `Este enlace es válido por 30 minutos y de un solo uso.\n\n` +
      `Si el enlace expira solo debes ir al inicio de sesión y dar en "Olvidé contraseña"\n\n` +
      `Si no reconoces esta acción, contacta al área de Servicio Social en ESCOM.`,
  });
}

module.exports = { enviarCorreoBienvenida };
