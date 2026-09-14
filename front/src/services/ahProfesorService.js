import { apiFetch } from "./apiClient";

// Mismo criterio ya usado en listarBitacorasPendientes: solo agrega al
// query string los filtros con valor real.
function construirQuery(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "todos") params.set(k, v);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

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

// CU-AH-05 — consultar acumulado de horas.
export async function getAcumuladoAlumnos() {
  return apiFetch("/profesor/horas");
}

// CU-AH-06 — consultar historial de un alumno propio.
export async function getHistorialAlumno(alumnoId, filtros) {
  return apiFetch(`/profesor/historial${construirQuery({ alumnoId, ...filtros })}`);
}

// CU-AH-06 — aprobar una bitácora rechazada desde el historial (RN-AH-26
// corregida). Ruta separada de aprobarBitacora (CU-AH-04, solo aplica a
// pendiente_revision).
export async function aprobarBitacoraDesdeHistorial(bitacoraId, confirmarSobrepasoHoras = false) {
  return apiFetch(`/profesor/bitacoras/${bitacoraId}/aprobar-desde-historial`, {
    method: "POST",
    body: JSON.stringify({ confirmarSobrepasoHoras }),
  });
}

// CU-AH-06 — extender fecha límite desde el historial (reusa TAL CUAL
// extenderFechaLimiteActividad del backend, expuesto en una ruta nueva y
// separada de editarActividad/PUT /actividades/:id).
export async function extenderFechaActividad(actividadId, nuevaFecha) {
  return apiFetch(`/profesor/actividades/${actividadId}/extender-fecha`, {
    method: "PUT",
    body: JSON.stringify({ fecha_limite: nuevaFecha }),
  });
}
