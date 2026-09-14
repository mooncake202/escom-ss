import { apiFetch } from "./apiClient";

// Mismo criterio ya usado en el resto de servicios de ah/: solo agrega al
// query string los filtros con valor real.
function construirQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "todos") params.set(k, v);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// CU-AH-05 — consultar acumulado de horas (vista coordinador).
export async function getAcumuladoProfesores() {
  return apiFetch("/coordinador/horas");
}

// CU-AH-06 — consultar historial de cualquier alumno (sin restricción de
// supervisión). La lista de selección profesor→alumno se reusa de
// getAcumuladoProfesores (AH-05), sin duplicar un endpoint de listado.
export async function getHistorialAlumno(alumnoId, filtros) {
  return apiFetch(`/coordinador/historial${construirQuery({ alumnoId, ...filtros })}`);
}
