import { apiFetch, API_URL } from "./apiClient";
import { nombreDesdeContentDisposition } from "./descargaUtils";

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
  enlace.download = nombreDesdeContentDisposition(res.headers.get("Content-Disposition")) || "evaluacion-desempeno.pdf";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// CU-LSS-06 — gestionar estado de carta de término.
export async function listarSolicitudesCartaTermino() {
  return apiFetch("/coordinador/carta-termino/solicitudes");
}

export async function marcarCartaLista(liberacionProcesoId) {
  return apiFetch(`/coordinador/carta-termino/${liberacionProcesoId}/marcar-lista`, { method: "POST" });
}

// CU-LSS-09 — dictaminar expediente.
export async function listarExpedientesPendientes() {
  return apiFetch("/coordinador/expediente/pendientes");
}

export async function dictaminarExpedienteAprobado(documentoId) {
  return apiFetch(`/coordinador/expediente/${documentoId}/aprobar`, { method: "POST" });
}

export async function dictaminarExpedienteRechazado(documentoId, observaciones) {
  return apiFetch(`/coordinador/expediente/${documentoId}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ observaciones }),
  });
}

/**
 * Mismo patrón <a download> ya usado en descargarParaRevision — evita el
 * bloqueo de pop-up por pérdida de gesto de usuario tras el await.
 */
export async function descargarExpediente(documentoId) {
  const token = localStorage.getItem("token");
  let res;
  try {
    res = await fetch(`${API_URL}/coordinador/expediente/${documentoId}/descargar`, {
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
  // Bug real encontrado (mismo que en lssAlumnoService.js): sin leer
  // Content-Disposition, la descarga se guardaba con el nombre genérico
  // "expediente.pdf" en vez del real (BOLETA_PATERNO_MATERNO_NOMBRE.pdf).
  enlace.download = nombreDesdeContentDisposition(res.headers.get("Content-Disposition")) || "expediente.pdf";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// CU-LSS-11 — gestionar estado de la constancia de término.
export async function listarSolicitudesConstancia() {
  return apiFetch("/coordinador/constancia-termino/pendientes");
}

export async function emitirConstancia(liberacionProcesoId, mensaje) {
  return apiFetch(`/coordinador/constancia-termino/${liberacionProcesoId}/emitir`, {
    method: "POST",
    body: JSON.stringify({ mensaje }),
  });
}
