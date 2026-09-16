// Constantes compartidas del módulo LSS (Liberación del Servicio Social).
// Centralizadas aquí para que dashboard.service.js y los archivos propios
// de lss/ usen la MISMA fuente de verdad para los valores de
// liberacion_proceso.estado — antes dashboard.service.js las tenía
// hardcodeadas localmente por su cuenta.

const ESTADO_EVALUACION_SOLICITADA = 'evaluacion_solicitada';
const ESTADO_EXPEDIENTE_EN_REVISION = 'expediente_en_revision';
const ESTADO_TERMINAL = 'constancia_disponible'; // último estado del flujo LSS

module.exports = {
  ESTADO_EVALUACION_SOLICITADA,
  ESTADO_EXPEDIENTE_EN_REVISION,
  ESTADO_TERMINAL,
};
