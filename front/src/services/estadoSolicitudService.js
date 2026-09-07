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

/**
 * CU-GR-04 — RN-GR-25: datos personalizados (programa, actividad, fecha
 * de inicio) para mostrar en las instrucciones de SISS.
 */
export async function getInfoSISS() {
  return apiFetch("/registro/info-siss");
}

/**
 * CU-GR-04 — RN-GR-24/27: confirma el registro en SISS y avanza a CU-GR-05.
 */
export async function confirmarRegistroSISS() {
  return apiFetch("/registro/confirmar-siss", { method: "POST" });
}

/**
 * CU-GR-05 — sube la carta de créditos y la constancia de seguro social
 * juntas, en una sola petición multipart/form-data.
 */
export async function adjuntarDocumentacionInicial(cartaCreditos, seguroSocial) {
  const formData = new FormData();
  formData.append("cartaCreditos", cartaCreditos);
  formData.append("seguroSocial", seguroSocial);
  return apiFetch("/registro/adjuntar-documentacion", {
    method: "POST",
    body: formData,
  });
}

/**
 * CU-GR-06, Flujo A — botón "Continuar" cuando SISS_docs_aprobados.
 */
export async function continuarACartaCompromiso() {
  return apiFetch("/registro/continuar-carta-compromiso", { method: "POST" });
}

/**
 * CU-GR-06, Flujo B — botón "Corregir y reenviar" cuando corregir_docsini.
 */
export async function corregirDocumentacion() {
  return apiFetch("/registro/corregir-documentacion", { method: "POST" });
}

/**
 * CU-GR-06, Flujo C — botón "Corregir registro en SISS" cuando corregir_SISS.
 */
export async function corregirRegistroSISS() {
  return apiFetch("/registro/corregir-siss", { method: "POST" });
}

/**
 * CU-GR-06, Flujo D / RN-GR-36 — botón "Modificar solicitud y reenviar".
 * Usado por el componente compartido SolicitudRechazadaDefinitivamente,
 * sin importar desde qué pantalla se dispare.
 */
export async function iniciarModificarSolicitud() {
  return apiFetch("/registro/modificar-solicitud", { method: "POST" });
}

/**
 * Lista de documentos del alumno — de propósito general, no exclusiva de
 * ningún CU en particular.
 */
export async function getMisDocumentos() {
  return apiFetch("/registro/mis-documentos");
}

/**
 * CU-GR-08, RN-GR-45/47 — el alumno confirma que descargó, imprimió y
 * firmó su carta compromiso.
 */
export async function confirmarCartaCompromiso() {
  return apiFetch("/registro/confirmar-carta-compromiso", { method: "POST" });
}

/**
 * CU-GR-08, Flujo A — botón "Continuar" cuando carta_compromiso_confirmada.
 */
export async function continuarAExpediente() {
  return apiFetch("/registro/continuar-expediente", { method: "POST" });
}