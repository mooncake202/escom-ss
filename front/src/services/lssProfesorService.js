import { apiFetch } from "./apiClient";

// CU-LSS-03 — evaluar desempeño del alumno (actor: Profesor).

export async function getAlumnosConEvaluacionPendiente() {
  return apiFetch("/profesor/evaluacion/pendientes");
}

export async function registrarEvaluacion(boleta, { observacionesProfesor, reportesSissConfirmados, valores }) {
  return apiFetch(`/profesor/evaluacion/${boleta}/registrar`, {
    method: "POST",
    body: JSON.stringify({ observacionesProfesor, reportesSissConfirmados, valores }),
  });
}

export async function rechazarPorSiss(boleta, observacionesProfesor) {
  return apiFetch(`/profesor/evaluacion/${boleta}/rechazar-siss`, {
    method: "POST",
    body: JSON.stringify({ observacionesProfesor }),
  });
}

export async function corregirYReenviar(boleta, { observacionesProfesor, valores }) {
  return apiFetch(`/profesor/evaluacion/${boleta}/corregir`, {
    method: "POST",
    body: JSON.stringify({ observacionesProfesor, valores }),
  });
}
