const prisma = require('../../lib/prisma');

const TIPOS_VALIDOS = ['info', 'warning', 'urgente', 'success'];

/**
 * Regresa las notificaciones SIN LEER del usuario, más recientes primero.
 * Las ya leídas nunca se muestran de nuevo — por diseño, no hay "historial"
 * en esta primera versión.
 */
async function listarPendientes(usuarioId) {
  return prisma.notificacion.findMany({
    where: { usuario_id: usuarioId, leida: false },
    orderBy: { fecha_creacion: 'desc' },
  });
}

async function marcarLeida(id, usuarioId) {
  // El where incluye usuario_id a propósito: así un usuario nunca puede
  // marcar como leída una notificación que no es suya, aunque adivine un id.
  const resultado = await prisma.notificacion.updateMany({
    where: { id, usuario_id: usuarioId, leida: false },
    data: { leida: true, fecha_leida: new Date() },
  });

  if (resultado.count === 0) {
    const error = new Error('Notificación no encontrada.');
    error.status = 404;
    throw error;
  }
}

/**
 * Helper para que OTROS módulos (reportes, actividades, LSS, etc.) creen
 * notificaciones cuando su propia spec diga "notifica a X" — es lo mismo
 * que ya insertamos directo en cada flujo (ej. inicio_sesion), solo que
 * centralizado aquí para no repetir la forma del objeto en cada lugar.
 *
 * Uso típico dentro de otro service:
 *   const { crearNotificacion } = require('../notificaciones/notificaciones.service');
 *   await crearNotificacion({
 *     usuarioId: alumno.usuario_id,
 *     tipo: 'warning',
 *     mensaje: 'Tu reporte fue rechazado por coordinación.',
 *     rutaRelacionada: '/alumno/reportes/modificar',
 *   });
 */
async function crearNotificacion({ usuarioId, tipo, mensaje, rutaRelacionada = null }) {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new Error(`Tipo de notificación inválido: "${tipo}". Debe ser uno de: ${TIPOS_VALIDOS.join(', ')}.`);
  }

  return prisma.notificacion.create({
    data: {
      usuario_id: usuarioId,
      tipo,
      mensaje,
      ruta_relacionada: rutaRelacionada,
      fecha_creacion: new Date(),
    },
  });
}

module.exports = { listarPendientes, marcarLeida, crearNotificacion };
