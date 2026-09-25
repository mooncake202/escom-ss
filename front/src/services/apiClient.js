const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const { timeoutMs, ...fetchOptions } = options;

  // fetch() no tiene timeout propio — si la conexión se queda inerte (bug
  // real encontrado con subidas grandes de expediente vía el túnel de
  // ttservicio.com), la promesa nunca se resuelve ni se rechaza y el
  // try/catch/finally del llamador nunca llega a ejecutarse, dejando al
  // usuario con un spinner infinito. AbortController fuerza que SIEMPRE
  // haya una resolución. Solo se activa si el caller pasa timeoutMs
  // explícitamente (subidas grandes) — no cambia el comportamiento de las
  // demás peticiones.
  const controller = timeoutMs ? new AbortController() : null;
  const temporizador = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      ...(controller ? { signal: controller.signal } : {}),
      headers: {
        // Si el body es FormData (subida de archivos), NO se fuerza
        // Content-Type: application/json — el navegador debe poner su
        // propio "multipart/form-data; boundary=..." automáticamente. Si
        // lo sobrescribiéramos, el backend no podría parsear los archivos.
        ...(fetchOptions.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOptions.headers || {}),
      },
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("La operación tardó demasiado y fue cancelada. Verifica tu conexión e intenta de nuevo.");
    }
    // Excepción E3 (varias fichas de GR), caso 1: fetch() nunca llegó a
    // tener respuesta — sin conexión, DNS, servidor totalmente inalcanzable.
    throw new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde.");
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }

  let json;
  try {
    json = await res.json();
  } catch {
    // Excepción E3, caso 2: SÍ hubo respuesta, pero no es JSON — típico de
    // nginx/Cloudflare devolviendo su propia página de error (502/503/504)
    // porque el backend real está caído detrás de ellos.
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