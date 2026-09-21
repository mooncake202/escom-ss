// Utilidades puras de CU-REP-05: solo presentan lo que responde el backend (listado y detalle del profesor).
import { formatearFechaHoraMexico } from "../CU-REP-01-generar-reporte/reportesGeneracion.js";

// Estados reales de reporte_mensual.estado_reporte, vistos por el profesor.
export const ESTADO_MAP = {
  pendiente_revision_profesor:    { bg: (C) => C.warningSoft,        color: (C) => C.warning,    label: "Pendiente de revisión"       },
  rechazado_profesor:             { bg: () => "rgba(239,68,68,0.1)", color: (C) => C.danger,     label: "Rechazado"                   },
  pendiente_revision_coordinador: { bg: (C) => C.accentSoft,         color: (C) => C.accentText, label: "En revisión de coordinación" },
  rechazado_coordinador:          { bg: () => "rgba(239,68,68,0.1)", color: (C) => C.danger,     label: "Rechazado por coordinación"  },
  aprobado_coordinador:           { bg: (C) => C.successSoft,        color: (C) => C.success,    label: "Aprobado"                    },
};

// Un estado que no se conoce se muestra tal cual y en neutro (nunca como "pendiente").
export const estadoDe = (estado) => ESTADO_MAP[estado] ?? { bg: (C) => C.bgInput, color: (C) => C.textMuted, label: estado };

// Los ids de reportes mensuales y globales pueden coincidir: la clave incluye el tipo.
export const claveReporte = (reporte) => `${reporte.tipoReporte}:${reporte.id}`;

// Datos del aviso que se muestra al profesor tras aprobar o rechazar (tipo: "aprobado" | "rechazado").
export function describirResultado(reporte, tipo) {
  return { tipo, alumno: reporte.alumno.nombreCompleto, periodo: textoPeriodo(reporte) ?? etiquetaReporte(reporte) };
}

// "?destacar=5" o "?destacar=5,7" (ids de reporte mensual que trae la notificación) → Set de números.
export function idsDestacados(valor) {
  const ids = String(valor ?? "").split(",").map((v) => v.trim()).filter((v) => /^\d+$/.test(v)).map(Number);
  return new Set(ids);
}

// Los ids del mensual y del global se repiten: la notificación indica el tipo (?tipo=global; sin él, mensual).
export const tipoDeUrl = (valor) => (valor === "global" ? "global" : "mensual");

export const esDestacado = (reporte, ids, tipo = "mensual") => reporte.tipoReporte === tipo && ids.has(reporte.id);

/** "Reporte Mensual No. 2" o "Reporte Global". El periodo real se muestra aparte (textoPeriodo). */
export function etiquetaReporte(reporte) {
  if (reporte.tipoReporte === "global") return "Reporte Global";
  return `Reporte Mensual No. ${reporte.numeroReporte}`;
}

/** "16 de julio de 2026 — 14 de agosto de 2026", o null si el reporte no tiene periodo calculable. */
export const textoPeriodo = (reporte) => (reporte.periodo ? `${reporte.periodo.inicioTexto} — ${reporte.periodo.finTexto}` : null);

/** "20 de septiembre de 2026, 15:50 h" en hora de México, o "—" si no hay fecha. */
export function textoFechaEnvio(iso) {
  const envio = formatearFechaHoraMexico(iso);
  return envio ? `${envio.fecha}, ${envio.hora} h` : "—";
}

/** Solo la fecha ("20 de septiembre de 2026"), para la tarjeta de la lista. */
export const textoFechaCorta = (iso) => formatearFechaHoraMexico(iso)?.fecha ?? "—";

export const sinAcentos = (texto) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Filtra por nombre de alumno, sin distinguir mayúsculas ni acentos. */
export function filtrarPorAlumno(reportes, busqueda) {
  const buscado = sinAcentos(busqueda.trim());
  if (!buscado) return reportes;
  return reportes.filter((r) => sinAcentos(r.alumno.nombreCompleto).includes(buscado));
}

/** Agrupa por alumno (por boleta), conservando el orden de aparición. */
export function agruparPorAlumno(reportes) {
  const grupos = new Map();
  for (const r of reportes) {
    if (!grupos.has(r.alumno.boleta)) grupos.set(r.alumno.boleta, { boleta: r.alumno.boleta, alumno: r.alumno.nombreCompleto, reportes: [] });
    grupos.get(r.alumno.boleta).reportes.push(r);
  }
  return [...grupos.values()];
}
