import { apiFetch } from "./apiClient";

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
