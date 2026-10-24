import { formatearFechaUTC, formatearFechaMexico } from "../../../../utils/fechas.js";
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
  if (Number.isNaN(new Date(iso).getTime())) return "—";
  // Instante real (DateTime): hora de México, sin depender del navegador.
  return formatearFechaMexico(iso, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** "1 de febrero de 2026" — inicio del periodo elegido en Registro. */
export function formatFechaLarga(iso) {
  if (!iso) return "—";
  if (Number.isNaN(new Date(iso).getTime())) return "—";
  // evento_calendario.fecha_inicio es @db.Date (medianoche UTC): con la zona del navegador saldría un día antes.
  return formatearFechaUTC(iso, { day: "numeric", month: "long", year: "numeric" });
}
