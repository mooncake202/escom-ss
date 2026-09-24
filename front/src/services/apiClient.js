const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:3000";

const MENSAJE_NO_DISPONIBLE = "El servicio no está disponible temporalmente. Intenta de nuevo más tarde.";

async function pedir(path, options) {
  const token = localStorage.getItem("token");
  const { timeoutMs, ...fetchOptions } = options;

  // Timeout opcional para operaciones que pueden quedarse esperando
  // indefinidamente, por ejemplo subidas grandes de archivos.
  const controller = timeoutMs ? new AbortController() : null;
  const temporizador = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    return await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      ...(controller ? { signal: controller.signal } : {}),
      headers: {
        // Si el body es FormData (subida de archivos), NO se fuerza
        // Content-Type: application/json — el navegador debe poner su
        // propio "multipart/form-data; boundary=..." automáticamente.
        ...(fetchOptions.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOptions.headers || {}),
      },
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        "La operación tardó demasiado y fue cancelada. Verifica tu conexión e intenta de nuevo."
      );
    }

    // Excepción E3: fetch() nunca llegó a tener respuesta.
    throw new Error(MENSAJE_NO_DISPONIBLE);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

async function leerJson(res) {
  try {
    return await res.json();
  } catch {
    // Excepción E3, caso 2: SÍ hubo respuesta, pero no es JSON — típico de
    // nginx/Cloudflare devolviendo su propia página de error (502/503/504)
    // porque el backend real está caído detrás de ellos.
    throw new Error(MENSAJE_NO_DISPONIBLE);
  }
}

// El Error conserva `status`, `code` y el cuerpo completo (`detalles`) para quien necesite más que el mensaje.
function errorDeRespuesta(res, path, json) {
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
  return Object.assign(new Error(json.message || "Ocurrió un error."), {
    status: res.status,
    code: json.code,
    detalles: json,
  });
}

export async function apiFetch(path, options = {}) {
  const res = await pedir(path, options);
  const json = await leerJson(res);
  if (!res.ok) throw errorDeRespuesta(res, path, json);
  return json;
}

/**
 * Como apiFetch, pero una respuesta correcta es un archivo (p. ej. un PDF) y se devuelve como Blob.
 * Los errores siguen llegando como JSON y se manejan igual que en apiFetch.
 */
export async function apiFetchBlob(path, options = {}) {
  const res = await pedir(path, options);
  if (!res.ok) throw errorDeRespuesta(res, path, await leerJson(res));
  return res.blob();
}

export { API_URL };
