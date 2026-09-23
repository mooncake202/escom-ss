import { apiFetch } from "./apiClient";

// CU-ADM-15 (profesor) y CU-ADM-16 (coordinación) — solicitudes de modificación de características.
// El backend deriva al profesor del token: aquí nunca se manda un profesor_id.

// Característica vigente, capacidad, ocupados reales, opciones y solicitud pendiente del profesor.
export function obtenerContextoCaracteristicas() {
  return apiFetch("/solicitudes-caracteristicas/contexto");
}

export function listarMisSolicitudesCaracteristica() {
  return apiFetch("/solicitudes-caracteristicas/mias");
}

// caracteristicaId puede ser null a propósito: es la solicitud para volver a Profesor base.
export function crearSolicitudCaracteristica({ caracteristicaId, justificacion }) {
  return apiFetch("/solicitudes-caracteristicas", {
    method: "POST",
    body: JSON.stringify({ caracteristicaId, justificacion }),
  });
}

// Bandeja compartida de Coordinación: { pendientes, resueltas, totales }.
export function listarSolicitudesCaracteristica() {
  return apiFetch("/solicitudes-caracteristicas");
}

export function obtenerSolicitudCaracteristica(id) {
  return apiFetch(`/solicitudes-caracteristicas/${id}`);
}

export function aprobarSolicitudCaracteristica(id, comentario) {
  return apiFetch(`/solicitudes-caracteristicas/${id}/aprobar`, {
    method: "POST",
    body: JSON.stringify({ comentario }),
  });
}

export function rechazarSolicitudCaracteristica(id, comentario) {
  return apiFetch(`/solicitudes-caracteristicas/${id}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ comentario }),
  });
}
