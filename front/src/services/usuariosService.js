import { apiFetch } from "./apiClient";

export function listarUsuarios() {
  return apiFetch("/usuarios");
}

export function crearUsuario(payload) {
  return apiFetch("/usuarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarUsuario(id, payload) {
  return apiFetch(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function reenviarCorreoBienvenida(usuarioId) {
  return apiFetch(`/usuarios/${usuarioId}/resend-welcome-email`, {
    method: "POST",
  });
}

export function listarCaracteristicas() {
  return apiFetch("/caracteristicas");
}