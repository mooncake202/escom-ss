// Compartido entre lssAlumnoService.js y lssCoordinadorService.js (ambos
// descargan el mismo expediente, mismo header real) — evita duplicar el
// parseo del header en los 2 archivos.

/**
 * Extrae el filename="..." de un header Content-Disposition real
 * (ej. 'attachment; filename="2022630667_LAGARZA_ORTEGA_ANA.pdf"').
 * Regresa null si el header no existe o no trae filename (fail-safe: el
 * caller usa un nombre genérico como respaldo, nunca revienta la descarga).
 */
export function nombreDesdeContentDisposition(headerValue) {
  if (!headerValue) return null;
  const match = /filename="?([^";]+)"?/i.exec(headerValue);
  return match ? match[1] : null;
}
