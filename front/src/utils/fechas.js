/**
 * Formatea una fecha (Date, string ISO, o timestamp) como dd/mm/yyyy,
 * usando SIEMPRE la zona horaria UTC.
 *
 * Por qué existe esto: los campos @db.Date del backend (fecha_inicio,
 * fecha_fin, fecha_max_expediente, etc.) representan un día calendario sin
 * hora ni zona horaria real. Prisma los serializa como medianoche UTC
 * ("2026-10-01T00:00:00.000Z"). Si se formatean con la zona horaria LOCAL
 * del navegador (México = UTC-6), esa medianoche UTC cae en las 18:00 del
 * día ANTERIOR en hora local, y toLocaleDateString muestra un día atrás.
 * Forzar timeZone: "UTC" evita ese corrimiento.
 *
 * Úsalo en CUALQUIER lugar del frontend que muestre un campo @db.Date
 * (no solo periodos) — el mismo bug aplica a fecha_registro, fecha_limite
 * de actividades, etc.
 */
export function formatearFechaUTC(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-MX", { timeZone: "UTC" });
}
