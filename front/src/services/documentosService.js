import { apiFetch, apiFetchBlob } from "./apiClient";

// CU-ADM-13 (expediente documental histórico, solo consulta) y CU-ADM-14 (carta compromiso firmada).
//
// El alumno nunca manda su boleta: el backend la deriva del token. Solo coordinación navega por
// alumno, y para eso sí pasa la boleta elegida de la lista.

// ── CU-ADM-13 ───────────────────────────────────────────────────────────────

export function obtenerMiExpediente() {
  return apiFetch("/documentos/mi-expediente");
}

export function obtenerAlumnosConDocumentos() {
  return apiFetch("/documentos/alumnos");
}

export function obtenerExpedienteDeAlumno(boleta) {
  return apiFetch(`/documentos/alumnos/${encodeURIComponent(boleta)}`);
}

// El PDF llega descifrado al vuelo. `descargar` decide si se abre en el visor o se baja.
export function obtenerArchivoDocumento(id, { descargar = false } = {}) {
  return apiFetchBlob(`/documentos/${encodeURIComponent(id)}/archivo${descargar ? "?descargar=1" : ""}`);
}

// ── CU-ADM-14 ───────────────────────────────────────────────────────────────

export function obtenerAlumnosCartaFirmada() {
  return apiFetch("/documentos/carta-firmada/alumnos");
}

// multipart/form-data: el navegador pone su propio Content-Type con boundary (ver apiClient).
export function subirCartaFirmada(boleta, archivo) {
  const cuerpo = new FormData();
  cuerpo.append("carta", archivo);
  return apiFetch(`/documentos/carta-firmada/${encodeURIComponent(boleta)}`, {
    method: "POST",
    body: cuerpo,
  });
}
