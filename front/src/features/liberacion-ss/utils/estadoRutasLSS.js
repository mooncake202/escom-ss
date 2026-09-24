// estadoRutasLSS.js
//
// Mapa liberacion_proceso.estado -> ruta, mismo criterio que ESTADO_A_RUTA
// de GR (front/src/features/gestion-registro/utils/estadoRutas.js), pero
// HONESTO sobre lo que hoy es real: solo 1 estado ('evaluacion_solicitada')
// está respaldado por lógica real de backend (CU-LSS-01, ya construido).
// El resto de CU-LSS-03 a 11 todavía no tienen un valor de `estado` real
// que el backend escriba — mismo hueco ya documentado en
// utils/pasoLSS.js (PASO_POR_ESTADO). NO inventar valores aquí — agregar
// la entrada real solo cuando el CU correspondiente exista de verdad.

// Ruta a la que va un alumno_asignado que TODAVÍA no tiene liberacion_proceso.
export const RUTA_LSS_SIN_PROCESO = "/alumno/iniciar-proceso-evaluacion";

// Si algún día apareciera un `estado` real que aún no está en el mapa de
// abajo (ej. se agregó un CU nuevo en el backend pero se nos olvidó
// agregar su entrada aquí), cae aquí en vez de a una ruta inventada.
export const RUTA_LSS_FALLBACK = RUTA_LSS_SIN_PROCESO;

export const ESTADO_LSS_A_RUTA = {
  // CU-LSS-02 — real: lo escribe iniciarEvaluacion (CU-LSS-01, ya construido).
  // Los 4 alternos de CU-LSS-02 (sin evaluar / rechazado / pendiente
  // coordinación / ambas firmas) viven DENTRO de esta misma ruta — no
  // cambian liberacion_proceso.estado, solo evaluacion_desempeno.
  evaluacion_solicitada: "/alumno/seguimiento-evaluacion",

  // CU-LSS-02 — real: lo escribe solicitarCartaTermino, al
  // completar el Alterno D (descargó + subió a SISS + solicitó).
  solicitud_carta_termino: "/alumno/seguimiento-carta-termino",

  // CU-LSS-05 (esta tarea) — real: lo escribe confirmarRecogida al
  // confirmar que ya recogió su carta de término. CU-LSS-07 (Integración
  // de expediente) todavía no tiene lógica de backend propia, pero su
  // pantalla YA existe como mockup real (IntegracionExpediente.jsx, con
  // guardaLSS) — se apunta ahí en vez de inventar un placeholder.
  carta_recogida: "/alumno/integracion-expediente",

  // TODO(LSS-08/09): agregar aquí el/los estado(s) reales de evaluación de
  // expediente/resolución cuando ese CU exista.
  // TODO(LSS-08/09): agregar aquí el/los estado(s) reales de evaluación de
  // expediente/resolución cuando ese CU exista.
  // 'expediente_en_revision' ya está reservado como nombre en
  // lss.shared.js, pero AÚN NADIE lo escribe — no se mapea a una ruta
  // todavía, a propósito, hasta confirmar contra qué CU real corresponde.
  // TODO(LSS-10/11): agregar aquí el/los estado(s) reales de constancia de
  // término cuando ese CU exista. 'constancia_disponible' — mismo caso.
};

/**
 * Dada la respuesta de GET /alumno/liberacion/requisitos ({ yaExiste,
 * estado }), regresa la ÚNICA ruta en la que un alumno_asignado puede
 * estar en este momento dentro de LSS.
 */
export function rutaCorrectaParaLSS({ yaExiste, estado }) {
  if (!yaExiste) return RUTA_LSS_SIN_PROCESO;
  return ESTADO_LSS_A_RUTA[estado] || RUTA_LSS_FALLBACK;
}
