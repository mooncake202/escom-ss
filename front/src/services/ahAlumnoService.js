import { apiFetch } from "./apiClient";

// Mismo criterio ya usado en ahProfesorService.js (listarBitacorasPendientes):
// solo agrega al query string los filtros con valor real.
function construirQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "todos") params.set(k, v);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

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

// CU-AH-05 — consultar acumulado de horas.
export async function getAcumuladoPropio() {
  return apiFetch("/alumno/horas");
}

// CU-AH-06 — consultar historial de actividades y bitácoras.
export async function getHistorialPropio(filtros) {
  return apiFetch(`/alumno/historial${construirQuery(filtros)}`);
}
