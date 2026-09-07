import { apiFetch, API_URL } from "./apiClient";

export async function getSolicitudesDocumentacion() {
  return apiFetch("/coordinador/documentacion");
}

export async function decidirDocumentacion(id, decision, motivoRechazo) {
  return apiFetch(`/coordinador/documentacion/${id}/decidir`, {
    method: "POST",
    body: JSON.stringify({ decision, motivoRechazo }),
  });
}

/**
 * Descarga un documento (PDF ya descifrado por el backend) y lo abre en una
 * pestaña nueva. No reutiliza apiFetch porque la respuesta es binaria, no
 * JSON — pero sí manda el mismo header de autenticación.
 */
export async function verDocumentoPDF(documentoId) {
  const token = localStorage.getItem("token");
  let res;
  try {
    res = await fetch(`${API_URL}/coordinador/documentos/${documentoId}/descargar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde.");
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "No se pudo abrir el documento.");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
