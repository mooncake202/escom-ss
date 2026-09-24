import { apiFetch } from "./apiClient";

// CU-ADM-05 — Recursos del proceso de registro.
// Lectura: alumnos (asignados y sin asignar) y coordinación. Escritura: solo coordinación.
// No se suben archivos: solo se administra la URL.

export function obtenerRecursos() {
  return apiFetch("/recursos");
}

export function crearRecurso({ nombre, url }) {
  return apiFetch("/recursos", { method: "POST", body: JSON.stringify({ nombre, url }) });
}

export function actualizarRecurso(id, { nombre, url }) {
  return apiFetch(`/recursos/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ nombre, url }),
  });
}

export function eliminarRecurso(id) {
  return apiFetch(`/recursos/${encodeURIComponent(id)}`, { method: "DELETE" });
}
