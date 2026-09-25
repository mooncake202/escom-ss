import { apiFetch, API_URL } from "./apiClient";
import { nombreDesdeContentDisposition } from "./descargaUtils";

// CU-LSS-01 — iniciar evaluación de desempeño.
export async function getEstadoRequisitos() {
  return apiFetch("/alumno/liberacion/requisitos");
}

export async function iniciarEvaluacion(reportesValidadosSiss) {
  return apiFetch("/alumno/liberacion/iniciar", {
    method: "POST",
    body: JSON.stringify({ reportesValidadosSiss }),
  });
}

// CU-LSS-02 — seguimiento de evaluación de desempeño.
export async function getEstadoEvaluacion() {
  return apiFetch("/alumno/evaluacion/estado");
}

export async function reenviarSolicitudEvaluacion(reportesValidadosSiss) {
  return apiFetch("/alumno/evaluacion/reenviar", {
    method: "POST",
    body: JSON.stringify({ reportesValidadosSiss }),
  });
}

export async function confirmarSubidaSiss() {
  return apiFetch("/alumno/evaluacion/confirmar-siss", { method: "POST" });
}

export async function solicitarCartaTermino() {
  return apiFetch("/alumno/evaluacion/carta-termino", { method: "POST" });
}

/**
 * Descarga (PDF ya descifrado por el backend, y marca evaluacion_descargada
 * en el mismo request) mediante un <a download> disparado por código — no se
 * usa window.open porque, tras el await de fetch/blob, ya se perdió el
 * contexto de gesto de usuario y el navegador lo bloquea como pop-up. No
 * reutiliza apiFetch porque la respuesta es binaria, no JSON.
 */
export async function descargarEvaluacion() {
  const token = localStorage.getItem("token");
  let res;
  try {
    res = await fetch(`${API_URL}/alumno/evaluacion/descargar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde.");
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "No se pudo descargar la evaluación.");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "evaluacion-desempeno.pdf";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// CU-LSS-05 — seguimiento de carta de término.
export async function getEstadoCarta() {
  return apiFetch("/alumno/carta-termino/estado");
}

export async function confirmarRecogidaCarta() {
  return apiFetch("/alumno/carta-termino/confirmar", { method: "POST" });
}

// CU-LSS-07 — integración de expediente.
export async function getInfoExpediente() {
  return apiFetch("/alumno/expediente/info");
}

export async function subirExpedienteLss({ cartaCompromiso, cartaTermino, dictamen }) {
  const formData = new FormData();
  formData.append("cartaCompromiso", cartaCompromiso);
  formData.append("cartaTermino", cartaTermino);
  if (dictamen) formData.append("dictamen", dictamen);
  // timeoutMs: bug real encontrado con un archivo de 6.9MB que se quedaba
  // colgado sin ninguna respuesta — sin esto, una subida grande cuya
  // conexión se estanca deja al usuario viendo "Enviando expediente..."
  // para siempre, sin error ni éxito.
  return apiFetch("/alumno/expediente/subir", { method: "POST", body: formData, timeoutMs: 45000 });
}

/**
 * Mismo patrón <a download> ya usado en descargarEvaluacion — evita el
 * bloqueo de pop-up por pérdida de gesto de usuario tras el await.
 */
export async function descargarExpedienteLss() {
  const token = localStorage.getItem("token");
  let res;
  try {
    res = await fetch(`${API_URL}/alumno/expediente/descargar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("El servicio no está disponible temporalmente. Intenta de nuevo más tarde.");
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "No se pudo descargar el expediente.");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  // Bug real encontrado: sin leer Content-Disposition, la descarga se
  // guardaba con un nombre genérico ("expediente.pdf") en vez del real
  // (BOLETA_PATERNO_MATERNO_NOMBRE.pdf, ya generado por el backend).
  enlace.download = nombreDesdeContentDisposition(res.headers.get("Content-Disposition")) || "expediente.pdf";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// CU-LSS-08 — consultar estado de resolución del expediente.
export async function getEstadoExpediente() {
  return apiFetch("/alumno/expediente/estado");
}

export async function solicitarConstanciaTermino() {
  return apiFetch("/alumno/expediente/solicitar-constancia", { method: "POST" });
}

export async function corregirExpedienteLss() {
  return apiFetch("/alumno/expediente/corregir", { method: "POST" });
}
