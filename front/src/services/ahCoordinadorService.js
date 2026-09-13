import { apiFetch } from "./apiClient";

// CU-AH-05 — consultar acumulado de horas (vista coordinador).
export async function getAcumuladoProfesores() {
  return apiFetch("/coordinador/horas");
}
