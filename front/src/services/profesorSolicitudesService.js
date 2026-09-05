import { apiFetch } from "./apiClient";

export async function getSolicitudesPendientes() {
  return apiFetch("/profesor/solicitudes");
}

export async function decidirSolicitud(id, decision) {
  return apiFetch(`/profesor/solicitudes/${id}/decidir`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}
