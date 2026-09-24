import { apiFetch, API_URL } from "./apiClient";

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
