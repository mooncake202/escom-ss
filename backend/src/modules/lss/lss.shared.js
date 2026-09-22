// Constantes compartidas del módulo LSS (Liberación del Servicio Social).
// Centralizadas aquí para que dashboard.service.js y los archivos propios
// de lss/ usen la MISMA fuente de verdad para los valores de
// liberacion_proceso.estado — antes dashboard.service.js las tenía
// hardcodeadas localmente por su cuenta.

const ESTADO_EVALUACION_SOLICITADA = 'evaluacion_solicitada';
const ESTADO_EXPEDIENTE_EN_REVISION = 'expediente_en_revision';
const ESTADO_TERMINAL = 'constancia_disponible'; // último estado del flujo LSS

// Valor real de reporte_mensual.estado_reporte / reporte_global.estado_reporte
// cuando Coordinación aprobó definitivamente (CU-REP-06). Confirmado contra
// reportes.shared.js (rama feature/reportes, todavía no fusionada — por eso
// se duplica aquí en vez de importarse). Al fusionar, reemplazar por un
// import real de ESTADOS_REPORTE.APROBADO_COORDINADOR.
const ESTADO_REPORTE_APROBADO_COORDINADOR = 'aprobado_coordinador';

// Catálogo de evaluacion_desempeno.estado (CU-LSS-02/03/04) — diseño nuevo,
// sin precedente real todavía (LSS-03/04 no existen), definido aquí para
// que CU-LSS-02 lo consuma y LSS-03/04 lo reutilicen cuando se construyan.
// Mismo criterio de nombres ya usado en Reportes (pendiente_revision_*,
// aprobado_coordinador) por consistencia dentro del proyecto. El "sin
// evaluar" (profesor no ha hecho nada) NO es un valor de estado — se
// representa por la AUSENCIA de la fila evaluacion_desempeno, ya que
// documento_id es obligatorio ahí y no hay documento hasta que el
// profesor evalúa.
const ESTADO_EVALUACION_RECHAZADO_PROFESOR = 'rechazado_profesor';
const ESTADO_EVALUACION_PENDIENTE_COORDINADOR = 'pendiente_revision_coordinador';
const ESTADO_EVALUACION_APROBADO_COORDINADOR = 'aprobado_coordinador';

// liberacion_proceso.estado al que se avanza cuando el alumno completa el
// Alterno D de CU-LSS-02 (descargó + subió a SISS + solicitó). Confirmado
// que no existía en ningún lado del código antes de esta tarea.
const ESTADO_SOLICITUD_CARTA_TERMINO = 'solicitud_carta_termino';

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

/**
 * Mismo patrón que exigirEstadoLiberacion, pero para evaluacion_desempeno
 * (CU-LSS-02/03/04). `evaluacion` puede ser null (fila inexistente = Alterno
 * A) — en ese caso también falla, ya que ningún estado esperado real puede
 * coincidir con "no existe".
 */
function exigirEstadoEvaluacion(evaluacion, estadoEsperado, mensaje) {
  if (!evaluacion || evaluacion.estado !== estadoEsperado) {
    const error = new Error(mensaje || 'Tu evaluación de desempeño ya no está en el paso esperado.');
    error.status = 409;
    throw error;
  }
}

module.exports = {
  ESTADO_EVALUACION_SOLICITADA,
  ESTADO_EXPEDIENTE_EN_REVISION,
  ESTADO_TERMINAL,
  ESTADO_REPORTE_APROBADO_COORDINADOR,
  ESTADO_EVALUACION_RECHAZADO_PROFESOR,
  ESTADO_EVALUACION_PENDIENTE_COORDINADOR,
  ESTADO_EVALUACION_APROBADO_COORDINADOR,
  ESTADO_SOLICITUD_CARTA_TERMINO,
  exigirEstadoLiberacion,
  exigirEstadoEvaluacion,
};
