import { apiFetch, API_URL } from "./apiClient";
import { nombreDesdeContentDisposition } from "./descargaUtils";

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
 * Descarga un documento (PDF ya descifrado por el backend) mediante un
 * <a download> disparado por código — mismo patrón que descargarEvaluacion
 * (lssAlumnoService.js). No usa window.open(blobUrl): una URL blob: no lleva
 * el header Content-Disposition, así que el nombre real (documento.nombre_
 * expediente) se perdía al guardar — bug real ya corregido aquí. Tampoco
 * usa apiFetch porque la respuesta es binaria, no JSON.
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
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreDesdeContentDisposition(res.headers.get("Content-Disposition")) || "documento.pdf";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
