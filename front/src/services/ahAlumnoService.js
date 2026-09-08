import { apiFetch } from "./apiClient";

export async function getActividadesAlumno() {
  return apiFetch("/alumno/actividades");
}

export async function getDetalleActividad(actividadId) {
  return apiFetch(`/alumno/actividades/${actividadId}`);
}
