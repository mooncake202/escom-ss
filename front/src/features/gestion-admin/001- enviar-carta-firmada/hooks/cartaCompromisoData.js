// ============================================================
//  ESCOM — Sistema de Servicio Social
//  Presentación de la carta compromiso firmada (CU-ADM-14)
// ============================================================
//
// Los datos de alumnos ya NO viven aquí: llegan del backend
// (GET /documentos/carta-firmada/alumnos). Este archivo conserva solo el
// formateo que comparten la lista y el panel de detalle.

/** "05 mar 2026, 10:30" — fecha y hora de registro del archivo. */
export function formatFechaHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** "1 de febrero de 2026" — inicio del periodo elegido en Registro. */
export function formatFechaLarga(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}
