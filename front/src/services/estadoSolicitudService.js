import { apiFetch } from "./apiClient";

export async function getEstadoSolicitud() {
  return apiFetch("/registro/estado");
}
export async function cambiarOferta(ofertaId, motivacion) {
  return apiFetch("/registro/cambiar-oferta", { method: "POST", body: JSON.stringify({ ofertaId, motivacion }) });
}
export async function continuarARegistroSISS() {
  return apiFetch("/registro/continuar-siss", { method: "POST" });
}
export async function getInfoSISS() {
  return apiFetch("/registro/info-siss");
}
export async function confirmarRegistroSISS() {
  return apiFetch("/registro/confirmar-siss", { method: "POST" });
}
export async function adjuntarDocumentacionInicial(cartaCreditos, seguroSocial) {
  const formData = new FormData();
  formData.append("cartaCreditos", cartaCreditos);
  formData.append("seguroSocial", seguroSocial);
  return apiFetch("/registro/adjuntar-documentacion", { method: "POST", body: formData });
}
export async function continuarACartaCompromiso() {
  return apiFetch("/registro/continuar-carta-compromiso", { method: "POST" });
}
export async function corregirDocumentacion() {
  return apiFetch("/registro/corregir-documentacion", { method: "POST" });
}
export async function corregirRegistroSISS() {
  return apiFetch("/registro/corregir-siss", { method: "POST" });
}
export async function iniciarModificarSolicitud() {
  return apiFetch("/registro/modificar-solicitud", { method: "POST" });
}
export async function getInfoModificarSolicitud() {
  return apiFetch("/registro/info-modificar-solicitud");
}
export async function reenviarSolicitudModificada(datos) {
  return apiFetch("/registro/reenviar-solicitud", { method: "POST", body: JSON.stringify(datos) });
}
export async function getMisDocumentos() {
  return apiFetch("/registro/mis-documentos");
}
export async function confirmarCartaCompromiso() {
  return apiFetch("/registro/confirmar-carta-compromiso", { method: "POST" });
}
export async function continuarAExpediente() {
  return apiFetch("/registro/continuar-expediente", { method: "POST" });
}
export async function getInfoExpediente() {
  return apiFetch("/registro/info-expediente");
}
export async function subirExpediente({ cartaCompromiso, curp, constanciaCreditos, dictamen }) {
  const formData = new FormData();
  formData.append("cartaCompromiso", cartaCompromiso);
  formData.append("curp", curp);
  formData.append("constanciaCreditos", constanciaCreditos);
  if (dictamen) formData.append("dictamen", dictamen);
  return apiFetch("/registro/subir-expediente", { method: "POST", body: formData });
}
export async function corregirExpediente() {
  return apiFetch("/registro/corregir-expediente", { method: "POST" });
}

/**
 * CU-GR-11, Flujo B — fallback manual (el flujo normal ahora pasa por el
 * modal de bienvenida, ver ModalBienvenidaAlumnoAsignado.jsx).
 */
export async function continuarAlumnoAsignado() {
  return apiFetch("/registro/continuar-alumno-asignado", { method: "POST" });
}