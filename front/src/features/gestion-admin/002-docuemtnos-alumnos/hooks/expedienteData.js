// ============================================================
//  ESCOM — Sistema de Servicio Social
//  Presentación del expediente documental (CU-ADM-13)
// ============================================================
//
// El CATÁLOGO ya no vive aquí: nombre, descripción, etapa y responsable los define el backend
// (documentos.catalogo.js) y llegan con cada documento. Este archivo solo guarda decoración y
// formato — así, agregar un tipo nuevo al catálogo no obliga a tocar el frontend.

// Icono por tipo. El `?? "📄"` es lo que permite que un tipo nuevo se muestre sin cambios aquí.
const ICONO_POR_TIPO = {
  expediente: "📁",
  carta_creditos: "🎓",
  constancia_seguro_social: "🩺",
  carta_compromiso_firmada: "📋",
  expediente_lss: "🗂️",
  evaluacion_desempeno: "⭐",
};

export const iconoDeDocumento = (tipo) => ICONO_POR_TIPO[tipo] ?? "📄";

export const etiquetaResponsable = (responsable) =>
  (responsable === "coordinacion" ? "Coordinación" : "Alumno");

export function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Porcentaje del progreso. Se calcula a partir del progreso DERIVADO que envía el backend
 * ({ disponibles, total }); no hay ningún número de documentos cableado.
 */
export function porcentajeProgreso({ disponibles = 0, total = 0 } = {}) {
  if (!total) return 0;
  return Math.round((disponibles / total) * 100);
}
