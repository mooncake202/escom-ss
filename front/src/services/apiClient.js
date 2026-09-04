const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error("El servidor no respondió correctamente. Intenta de nuevo.");
  }

  if (!res.ok) {
    throw new Error(json.message || "Ocurrió un error.");
  }

  return json;
}

export { API_URL };
