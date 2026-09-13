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

// CU-AH-04 — revisar bitácoras.
export async function listarBitacorasPendientes(filtroNombre) {
  const query = filtroNombre ? `?nombre=${encodeURIComponent(filtroNombre)}` : "";
  return apiFetch(`/profesor/bitacoras${query}`);
}

export async function aprobarBitacora(bitacoraId, actividadAdicional = null) {
  return apiFetch(`/profesor/bitacoras/${bitacoraId}/aprobar`, {
    method: "POST",
    body: JSON.stringify({ actividadAdicional }),
  });
}

export async function rechazarBitacora(bitacoraId, motivoRechazo) {
  return apiFetch(`/profesor/bitacoras/${bitacoraId}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ motivoRechazo }),
  });
}
