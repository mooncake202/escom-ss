import { apiFetch } from "./apiClient";

export async function getSolicitudesCartaCompromiso() {
  return apiFetch("/coordinador/cartas-compromiso");
}

export async function registrarRecepcionCarta(id) {
  return apiFetch(`/coordinador/cartas-compromiso/${id}/registrar-recepcion`, {
    method: "POST",
  });
}
