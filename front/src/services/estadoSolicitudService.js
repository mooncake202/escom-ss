import { apiFetch } from "./apiClient";

/**
 * GET /registro/estado — requiere sesión (alumno_sin_asignar).
 * Cada llamada revisa (y aplica si aplica) el vencimiento del plazo de
 * expediente en el backend, igual que hace el login.
 * @returns {Promise<{estado_solicitud: string, motivo_rechazo: string|null}>}
 */
export async function getEstadoSolicitud() {
  return apiFetch("/registro/estado");
}

/**
 * CU-GR-03 — RN-GR-17 a RN-GR-20: cambiar de oferta reutilizando los datos
 * de CU-GR-01, solo cambian oferta_id y motivacion_oferta.
 */
export async function cambiarOferta(ofertaId, motivacion) {
  return apiFetch("/registro/cambiar-oferta", {
    method: "POST",
    body: JSON.stringify({ ofertaId, motivacion }),
  });
}

/**
 * CU-GR-03, Flujo D — botón "Siguiente paso" cuando ya fue aceptado.
 */
export async function continuarARegistroSISS() {
  return apiFetch("/registro/continuar-siss", { method: "POST" });
}
