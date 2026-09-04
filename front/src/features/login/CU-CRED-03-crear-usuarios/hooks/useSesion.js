/**
 * Lee la sesión guardada por LoginPage.jsx (localStorage: "usuario", "token").
 * Devuelve null si no hay sesión o el JSON está corrupto, para que cada
 * pantalla decida cómo reaccionar (redirigir a login, mostrar "Usuario", etc.)
 */
export function useSesion() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const token = localStorage.getItem("token");
    return { usuario, token };
  } catch {
    return { usuario: null, token: null };
  }
}

export function nombreCompletoSesion(usuario) {
  if (!usuario) return "Usuario";
  return `${usuario.nombre ?? ""} ${usuario.apellidos ?? ""}`.trim() || "Usuario";
}
