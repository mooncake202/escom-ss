import { apiFetch, apiFetchBlob } from "./apiClient";

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

// Adjunta el expediente a la baja que solicitó el profesor. No lleva id: el backend la deriva del
// token, así que un alumno no puede completar la solicitud de otro.
export function completarExpedienteDeMiBaja({ archivo }) {
  const cuerpo = new FormData();
  cuerpo.append("expediente", archivo);
  return apiFetch("/bajas/alumno/expediente", { method: "POST", body: cuerpo });
}

// ── ADM-12 · Coordinación ──
export function listarSolicitudesBaja() {
  return apiFetch("/bajas");
}

export function obtenerSolicitudBaja(id) {
  return apiFetch(`/bajas/${id}`);
}

// El expediente viaja como Blob CON el token. No se expone una URL cruda del endpoint: una navegación
// directa del navegador no manda el header Authorization y el backend la rechazaría con 401.
export function obtenerExpedienteBaja(id) {
  return apiFetchBlob(`/bajas/${id}/expediente`);
}

// pendiente → en_revision. Coordinación ya revisó el expediente y lo turna a las autoridades.
export function marcarBajaEnRevision(id) {
  return apiFetch(`/bajas/${id}/en-revision`, { method: "POST" });
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
