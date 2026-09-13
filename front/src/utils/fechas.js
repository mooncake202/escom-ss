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
export function formatearFechaUTC(fecha, opciones = {}) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-MX", { ...opciones, timeZone: "UTC" });
}

/**
 * Medianoche del día calendario MÉXICO actual, expresada en UTC — mismo
 * patrón y misma razón de ser que calcularDiaMexicoUTC en
 * backend/src/lib/fechas.js (Intl.DateTimeFormat con timeZone
 * explícito, nunca getUTCFullYear/Month/Date directo sobre `new Date()`).
 *
 * Por qué existe esto: calcular "hoy" con el día UTC crudo del instante
 * actual (ej. `new Date(Date.UTC(ahora.getUTCFullYear(), ...))`) da un
 * resultado adelantado durante la noche en México (18:00-23:59, cuando en
 * UTC ya es el día siguiente) — causaba rechazos falsos de fechas límite
 * que en México todavía eran válidas. Cualquier validación de frontend que
 * compare una fecha de negocio contra "hoy" debe usar esta función, no
 * reimplementar el cálculo.
 */
export function calcularDiaMexicoUTC(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(ahora);
  const obtener = (tipo) => Number(partes.find((p) => p.type === tipo).value);
  return new Date(Date.UTC(obtener("year"), obtener("month") - 1, obtener("day")));
}

/**
 * Formatea un timestamp real (campo @db.DateTime — fecha_asignacion,
 * fecha_aplicacion, etc., NO un @db.Date puro) en hora MÉXICO explícita.
 *
 * Por qué existe esto: sin timeZone explícito, toLocaleDateString usa la
 * zona horaria del NAVEGADOR del usuario, no necesariamente México — un
 * usuario con su dispositivo configurado en otra zona vería el día (o la
 * hora) equivocada. No uses formatearFechaUTC para esto: ese helper es
 * para campos @db.Date puros (sin hora real), donde forzar UTC es lo
 * correcto; aquí el dato SÍ tiene una hora real y debe interpretarse en
 * México, no en UTC ni en la hora local de quien mira la pantalla.
 *
 * `opciones` se combina con las de Intl.DateTimeFormat/toLocaleDateString
 * (ej. { hour: "2-digit", minute: "2-digit" }) — timeZone siempre queda
 * forzado a México, sin importar lo que se pase en `opciones`.
 */
export function formatearFechaMexico(fecha, opciones = {}) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-MX", { ...opciones, timeZone: "America/Mexico_City" });
}
