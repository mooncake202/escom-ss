// Constantes compartidas del módulo LSS (Liberación del Servicio Social).
// Centralizadas aquí para que dashboard.service.js y los archivos propios
// de lss/ usen la MISMA fuente de verdad para los valores de
// liberacion_proceso.estado — antes dashboard.service.js las tenía
// hardcodeadas localmente por su cuenta.

const ESTADO_EVALUACION_SOLICITADA = 'evaluacion_solicitada';
const ESTADO_EXPEDIENTE_EN_REVISION = 'expediente_en_revision';
const ESTADO_TERMINAL = 'constancia_disponible'; // último estado del flujo LSS

/**
 * Guardia reutilizable para las funciones de servicio de LSS-03 en
 * adelante: valida que `proceso.estado` sea exactamente el esperado antes
 * de procesar, mismo patrón 409 "ya fue procesada" que GR ya usa en cada
 * una de sus funciones (ej. gr-profesor.service.js, gr.service.js) — GR
 * nunca centralizó ese chequeo, cada función repite su propio `if`, pero
 * aquí sí conviene centralizarlo desde ahora porque LSS todavía tiene ~9
 * funciones futuras (CU-LSS-03 a 11) que necesitarán exactamente este
 * mismo chequeo, y así no hay que decidirlo de nuevo cada vez.
 */
function exigirEstadoLiberacion(proceso, estadoEsperado, mensaje) {
  if (proceso.estado !== estadoEsperado) {
    const error = new Error(mensaje || 'Tu proceso de liberación ya no está en el paso esperado.');
    error.status = 409;
    throw error;
  }
}

module.exports = {
  ESTADO_EVALUACION_SOLICITADA,
  ESTADO_EXPEDIENTE_EN_REVISION,
  ESTADO_TERMINAL,
  exigirEstadoLiberacion,
};
