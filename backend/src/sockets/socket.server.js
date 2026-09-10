// socket.server.js — infraestructura BASE de WebSockets (socket.io).
//
// Esta tarea es EXCLUSIVAMENTE infraestructura: no hay todavía ningún
// evento de negocio conectado. Ningún service existente emite nada por
// aquí — eso se diseña cuando se conecte el primer evento real.
//
// Autenticación del handshake replica exactamente lo que ya hace
// requireAuth (src/middleware/auth.middleware.js) para HTTP: mismo
// JWT_SECRET (vía verificarToken), mismo chequeo de blacklist en Redis
// (mismo fail-open si Redis falla), mismo shape de payload { sub, rol }.
// No se reutiliza requireAuth directamente porque es un middleware de
// Express (req/res/next) — la forma del middleware de socket.io es
// distinta — pero la LÓGICA es la misma a propósito.

const { Server } = require('socket.io');
const { verificarToken } = require('../lib/jwt');
const redis = require('../lib/redis');

let io = null;

async function autenticarSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('No se proporcionó un token de autenticación.'));
  }

  let decoded;
  try {
    decoded = verificarToken(token);
  } catch (err) {
    return next(new Error('Token inválido o expirado.'));
  }

  try {
    const revocado = await redis.get(`blacklist:${decoded.jti}`);
    if (revocado) {
      return next(new Error('Tu sesión fue cerrada. Vuelve a iniciar sesión.'));
    }
  } catch (err) {
    // Mismo criterio que requireAuth: si Redis falla, no bloqueamos la
    // conexión por eso (fail-open) — solo se pierde la protección de
    // blacklist momentáneamente.
    console.error('Error al consultar blacklist en Redis (socket):', err.message);
  }

  socket.data.usuarioId = decoded.sub;
  socket.data.rol = decoded.rol;
  next();
}

/**
 * Adjunta socket.io al mismo servidor HTTP que ya usa Express (no un
 * puerto/proceso aparte). Solo una sala por usuario (`usuario_<id>`) — sin
 * salas por rol ni por recurso todavía, eso se diseña con el primer evento
 * real.
 */
function inicializarSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' }, // mismo criterio que ya usa Express (app.use(cors()) sin opciones)
  });

  io.use(autenticarSocket);

  io.on('connection', (socket) => {
    socket.join(`usuario_${socket.data.usuarioId}`);
  });

  console.log('[socket.server] Socket.io inicializado.');
  return io;
}

/**
 * Reusable desde cualquier service futuro para emitir un evento dirigido a
 * UN usuario específico (todas sus conexiones activas, si tiene más de
 * una). Aún no se usa en ningún service existente.
 */
function emitirAUsuario(usuarioId, evento, datos) {
  if (!io) {
    console.error('[socket.server] emitirAUsuario llamado antes de inicializarSocketServer.');
    return;
  }
  io.to(`usuario_${usuarioId}`).emit(evento, datos);
}

module.exports = { inicializarSocketServer, emitirAUsuario };
