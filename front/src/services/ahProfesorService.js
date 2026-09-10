import { apiFetch } from "./apiClient";

export async function getAlumnosAsignados() {
  return apiFetch("/profesor/actividades/alumnos");
}

export async function getDetalleAlumno(solicitudId) {
  return apiFetch(`/profesor/actividades/alumnos/${solicitudId}`);
}

export async function crearActividad(solicitudId, datos) {
  return apiFetch(`/profesor/actividades/alumnos/${solicitudId}`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function editarActividad(actividadId, datos) {
  return apiFetch(`/profesor/actividades/${actividadId}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export async function eliminarActividad(actividadId) {
  return apiFetch(`/profesor/actividades/${actividadId}`, { method: "DELETE" });
}

export async function extenderFechaLimite(actividadId, nuevaFecha) {
  return apiFetch(`/profesor/actividades/${actividadId}`, {
    method: "PUT",
    body: JSON.stringify({ fecha_limite: nuevaFecha }),
  });
}
