import { apiFetch } from "./apiClient";

export function solicitarRecuperacion(correo_institucional) {
  return apiFetch("/password/forgot", {
    method: "POST",
    body: JSON.stringify({ correo_institucional }),
  });
}

export function validarTokenRecuperacion(token) {
  return apiFetch(`/password/reset/${token}/validar`);
}

export function restablecerContrasena(token, contrasena) {
  return apiFetch(`/password/reset/${token}`, {
    method: "POST",
    body: JSON.stringify({ contrasena }),
  });
}

export function solicitarCambioDesdeSesion() {
  return apiFetch("/password/change", { method: "POST" });
}
