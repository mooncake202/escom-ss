import { apiFetch, API_URL } from "./apiClient";

// CU-LSS-04 — dictaminar evaluación de desempeño (actor: Coordinador).

export async function getEvaluacionesPendientesDictamen() {
  return apiFetch("/coordinador/evaluacion/pendientes");
}

export async function dictaminarAprobado(evaluacionId) {
  return apiFetch(`/coordinador/evaluacion/${evaluacionId}/aprobar`, { method: "POST" });
}

export async function dictaminarRechazado(evaluacionId, motivoRechazoCoordinacion) {
  return apiFetch(`/coordinador/evaluacion/${evaluacionId}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ motivoRechazoCoordinacion }),
  });
}

/**
 * Descarga el PDF (ya descifrado por el backend) para que coordinación lo
 * revise antes de dictaminar, mediante un <a download> disparado por código
 * — no se usa window.open porque, tras el await de fetch/blob, ya se perdió
 * el contexto de gesto de usuario y el navegador lo bloquea como pop-up.
 * Mismo patrón exacto que descargarEvaluacion (lssAlumnoService.js). No
 * reutiliza apiFetch porque la respuesta es binaria, no JSON.
 */
export async function descargarParaRevision(evaluacionId) {
  const token = localStorage.getItem("token");
  let res;
  try {
    res = await fetch(`${API_URL}/coordinador/evaluacion/${evaluacionId}/descargar`, {
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
