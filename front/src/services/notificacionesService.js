import { apiFetch } from "./apiClient";

export function listarNotificacionesPendientes() {
  return apiFetch("/notificaciones");
}

export function marcarNotificacionLeida(id) {
  return apiFetch(`/notificaciones/${id}/leer`, { method: "PUT" });
}

export function marcarLeidasPorRuta(rutaRelacionada) {
  return apiFetch("/notificaciones/leer-por-ruta", {
    method: "PUT",
    body: JSON.stringify({ rutaRelacionada }),
  });
}
