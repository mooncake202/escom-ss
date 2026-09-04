const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function postLogin(data) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error("El servidor no respondió correctamente. Intenta de nuevo.");
  }

  if (!res.ok) {
    throw new Error(json.message || "Ocurrió un error al iniciar sesión.");
  }

  return json;
}