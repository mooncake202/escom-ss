import { apiFetch } from "./apiClient";

// CU-ADM-05 — Recursos del proceso de registro.
// Lectura del catálogo completo: solo coordinación. Escritura: solo coordinación.
// No se suben archivos: solo se administra la URL.

export function obtenerRecursos() {
  return apiFetch("/recursos");
}

// CU-GR-01: público, sin sesión — expone solo la URL de este recurso puntual, no el catálogo.
export function obtenerUrlConstanciaCreditos() {
  return apiFetch("/recursos/publico/constancia-creditos");
}

export function crearRecurso({ nombre, url, tipo }) {
  return apiFetch("/recursos", { method: "POST", body: JSON.stringify({ nombre, url, tipo: tipo || null }) });
}

export function actualizarRecurso(id, { nombre, url, tipo }) {
  return apiFetch(`/recursos/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ nombre, url, tipo: tipo || null }),
  });
}

export function eliminarRecurso(id) {
  return apiFetch(`/recursos/${encodeURIComponent(id)}`, { method: "DELETE" });
}
