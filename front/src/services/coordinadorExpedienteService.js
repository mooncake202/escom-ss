import { apiFetch } from "./apiClient";
export { verDocumentoPDF } from "./coordinadorDocumentacionService";

export async function getExpedientesPendientes() {
  return apiFetch("/coordinador/expedientes");
}

export async function decidirExpediente(id, decision, motivoRechazo) {
  return apiFetch(`/coordinador/expedientes/${id}/decidir`, {
    method: "POST",
    body: JSON.stringify({ decision, motivoRechazo }),
  });
}
