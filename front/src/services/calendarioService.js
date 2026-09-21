import { API_URL } from "./apiClient";

// apiFetch solo propaga `message`; el formulario del calendario necesita además `code` y `errores`
// (mensajes por campo del backend), así que este servicio conserva ambos en el Error.
async function peticion(path, options = {}) {
  const token = localStorage.getItem("token");

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw Object.assign(new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde."), { status: 0 });
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw Object.assign(new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde."), { status: res.status });
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.dispatchEvent(new CustomEvent("sesion-expirada"));
    }
    throw Object.assign(new Error(json.message || "Ocurrió un error."), {
      status: res.status,
      code: json.code,
      errores: json.errores,
    });
  }
  return json;
}

// CU-ADM-08 — { eventos, ultimaModificacion, contexto: { hoy, horaActual } }
export function getEventosCalendario() {
  return peticion("/calendario/eventos");
}

export function crearEventoCalendario(datos) {
  return peticion("/calendario/eventos", { method: "POST", body: JSON.stringify(datos) });
}

export function actualizarInhabilCalendario(id, datos) {
  return peticion(`/calendario/eventos/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}

export function eliminarEventoCalendario(id) {
  return peticion(`/calendario/eventos/${id}`, { method: "DELETE" });
}
