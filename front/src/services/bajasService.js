import { apiFetch, apiFetchBlob, API_URL } from "./apiClient";

// CU-ADM-09 (profesor), CU-ADM-11 (alumno) y CU-ADM-12 (Coordinación).
// El solicitante lo deriva el backend del token: aquí nunca se manda un profesor_id ni una boleta propia.

// ── ADM-09 · Profesor ──
export function listarMisAlumnosParaBaja() {
  return apiFetch("/bajas/mis-alumnos");
}

export function solicitarBajaAlumnoProfesor({ alumnoBoleta, motivo }) {
  return apiFetch("/bajas/profesor", {
    method: "POST",
    body: JSON.stringify({ alumnoBoleta, motivo }),
  });
}

// La amonestación solo manda una notificación al alumno: no crea historial ni toca sus faltas.
export function amonestarAlumno({ alumnoBoleta, observaciones }) {
  return apiFetch("/bajas/amonestacion", {
    method: "POST",
    body: JSON.stringify({ alumnoBoleta, observaciones }),
  });
}

// ── ADM-11 · Alumno ──
export function consultarMiSolicitudBaja() {
  return apiFetch("/bajas/mi-solicitud");
}

// Va como multipart: el PDF se cifra en el backend antes de tocar el disco.
// No se fija Content-Type a propósito — el navegador debe poner su propio boundary.
export function solicitarMiBaja({ motivo, archivo }) {
  const cuerpo = new FormData();
  cuerpo.append("motivo", motivo);
  cuerpo.append("expediente", archivo);
  return apiFetch("/bajas/alumno", { method: "POST", body: cuerpo });
}

// ── ADM-12 · Coordinación ──
export function listarSolicitudesBaja() {
  return apiFetch("/bajas");
}

export function obtenerSolicitudBaja(id) {
  return apiFetch(`/bajas/${id}`);
}

export function obtenerExpedienteBaja(id) {
  return apiFetchBlob(`/bajas/${id}/expediente`);
}

export function urlExpedienteBaja(id) {
  return `${API_URL}/bajas/${id}/expediente`;
}

export function aprobarSolicitudBaja(id, comentario) {
  return apiFetch(`/bajas/${id}/aprobar`, {
    method: "POST",
    body: JSON.stringify({ comentario }),
  });
}

export function rechazarSolicitudBaja(id, comentario) {
  return apiFetch(`/bajas/${id}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ comentario }),
  });
}
