import { apiFetch } from "./apiClient";

export function obtenerResumenDashboard() {
  return apiFetch("/dashboard/resumen");
}
