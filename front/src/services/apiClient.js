const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    // Excepción E3 (varias fichas de GR), caso 1: fetch() nunca llegó a
    // tener respuesta — sin conexión, DNS, servidor totalmente inalcanzable.
    throw new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde.");
  }

  let json;
  try {
    json = await res.json();
  } catch {
    // Excepción E3, caso 2: SÍ hubo respuesta, pero no es JSON — típico de
    // nginx/Cloudflare devolviendo su propia página de error (502/503/504)
    // porque el backend real está caído detrás de ellos. Mismo mensaje que
    // el caso 1: para el usuario es la misma situación ("no puedo usar el
    // sistema ahorita"), sin importar en qué capa exacta falló.
    throw new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde.");
  }

  if (!res.ok) {
    // El login nunca tuvo una sesión que "expirar" — un 401 ahí es
    // simplemente credenciales incorrectas, no debe disparar el aviso de
    // sesión expirada (ese aviso es para peticiones YA autenticadas cuyo
    // token dejó de ser válido).
    const esLogin = path === "/auth/login";
    if (res.status === 401 && !esLogin) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.dispatchEvent(new CustomEvent("sesion-expirada"));
    }
    throw new Error(json.message || "Ocurrió un error.");
  }

  return json;
}

export { API_URL };