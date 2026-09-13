import { apiFetch } from "./apiClient";

export async function getActividadesAlumno() {
  return apiFetch("/alumno/actividades");
}

export async function getDetalleActividad(actividadId) {
  return apiFetch(`/alumno/actividades/${actividadId}`);
}

export async function getEstadoJornada() {
  return apiFetch("/alumno/bitacora/estado");
}

export async function iniciarJornadaApi() {
  return apiFetch("/alumno/bitacora/iniciar", { method: "POST" });
}

export async function finalizarJornadaApi() {
  return apiFetch("/alumno/bitacora/finalizar", { method: "POST" });
}

export async function cancelarJornadaApi() {
  return apiFetch("/alumno/bitacora/cancelar", { method: "POST" });
}

export async function confirmarBitacoraApi(avances) {
  return apiFetch("/alumno/bitacora/confirmar", {
    method: "POST",
    body: JSON.stringify({ avances }),
  });
}
