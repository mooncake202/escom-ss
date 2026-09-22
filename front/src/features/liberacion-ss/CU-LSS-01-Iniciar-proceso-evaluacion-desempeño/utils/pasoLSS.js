// Mapeo liberacion_proceso.estado -> número de paso del proceso LSS (6
// pasos totales, definidos en ProcesoLSSLayout.jsx). Solo los pasos 1 y 2
// son alcanzables con lo construido hasta ahora (CU-LSS-01) — el resto
// queda documentado como referencia para cuando se construyan los demás
// CU de LSS y se confirmen sus valores reales de `estado`.
const PASO_POR_ESTADO = {
  evaluacion_solicitada: 2, // CU-LSS-01/02 — evaluación de desempeño en curso (los 4 alternos de LSS-02 viven DENTRO de este mismo paso)
  solicitud_carta_termino: 3, // CU-LSS-02 (esta tarea) — evaluación completa, carta término solicitada
  // TODO(LSS-03+): agregar aquí el/los estado(s) reales del paso 4 (Integración Expediente) cuando se construya ese CU
  expediente_en_revision: 5, // ya referenciado en dashboard.service.js (resumenCoordinacion)
  constancia_disponible: 6,  // estado terminal del flujo LSS
};

export function calcularPasoActual(estado) {
  if (!estado) return 1; // sin liberacion_proceso todavía -> pantalla de requisitos
  return PASO_POR_ESTADO[estado] ?? 1;
}
