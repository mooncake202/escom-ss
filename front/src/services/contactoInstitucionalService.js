import { apiFetch } from "./apiClient";

// CU-ADM-06 — Contacto institucional.
// Lectura: alumno asignado y coordinación. Escritura: solo coordinación.
//
// El modelo es tipo + valor: no viaja ninguna etiqueta porque no se persiste.

export function obtenerContactos() {
  return apiFetch("/contacto-institucional");
}

export function crearContacto({ tipo, valor }) {
  return apiFetch("/contacto-institucional", { method: "POST", body: JSON.stringify({ tipo, valor }) });
}

export function actualizarContacto(id, { tipo, valor }) {
  return apiFetch(`/contacto-institucional/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ tipo, valor }),
  });
}

export function eliminarContacto(id) {
  return apiFetch(`/contacto-institucional/${encodeURIComponent(id)}`, { method: "DELETE" });
}
