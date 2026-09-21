// Utilidades puras de CU-REP-02 y CU-REP-03: solo presentan lo que responde el backend (listado y seguimiento del alumno).
// El historial sale de las revisiones guardadas; aquí no se inventa ningún evento.
import { idsDestacados, tipoDeUrl } from "../CU-REP-05-revisar-reportes-profesor/revisionReportes.js";

// Estados reales de reporte_mensual.estado_reporte, vistos por el alumno.
export const ESTADO_ALUMNO_MAP = {
  pendiente_revision_profesor:    { bg: (C) => C.warningSoft,        color: (C) => C.warning,    label: "En revisión del profesor"    },
  rechazado_profesor:             { bg: () => "rgba(239,68,68,0.1)", color: (C) => C.danger,     label: "Rechazado por el profesor"   },
  pendiente_revision_coordinador: { bg: (C) => C.accentSoft,         color: (C) => C.accentText, label: "En revisión de coordinación" },
  rechazado_coordinador:          { bg: () => "rgba(239,68,68,0.1)", color: (C) => C.danger,     label: "Rechazado por coordinación"  },
  aprobado_coordinador:           { bg: (C) => C.successSoft,        color: (C) => C.success,    label: "Aprobado"                    },
};

// Un estado que no se conoce se muestra tal cual y en neutro (nunca como "pendiente" ni "aprobado").
export const estadoAlumnoDe = (estado) => ESTADO_ALUMNO_MAP[estado] ?? { bg: (C) => C.bgInput, color: (C) => C.textMuted, label: estado };

const TITULOS_EVENTO = {
  "alumno:enviado":         "Reporte enviado al profesor",
  "alumno:reenviado":       "Corrección reenviada al profesor",
  "profesor:aprobado":      "Aprobado por el profesor",
  "profesor:rechazado":     "Rechazado por el profesor",
  "coordinacion:aprobado":  "Validado por coordinación",
  "coordinacion:rechazado": "Rechazado por coordinación",
};

/** Título de un evento del historial y si fue un rechazo (para pintarlo en rojo). */
export function describirEvento(evento) {
  return {
    titulo: TITULOS_EVENTO[`${evento.etapa}:${evento.resultado}`] ?? `${evento.etapa} · ${evento.resultado}`,
    rechazo: evento.resultado === "rechazado",
  };
}

// Lo que sigue según el estado ACTUAL. No es un evento guardado: se muestra aparte, sin fecha.
const ESPERA_POR_ESTADO = {
  pendiente_revision_profesor:    "En espera de la revisión del profesor",
  pendiente_revision_coordinador: "En espera de la validación de coordinación",
  rechazado_profesor:             "En espera de tu corrección",
  rechazado_coordinador:          "En espera de tu corrección",
};

export const textoEsperaActual = (estado) => ESPERA_POR_ESTADO[estado] ?? null;

/** Fecha (ISO) del último evento guardado, o null si no hay historial. */
export const fechaUltimoEvento = (historial) => (historial?.length ? historial[historial.length - 1].fecha : null);

/** Parámetros de URL para abrir un reporte (seguimiento o corrección): los ids del mensual y del global se repiten. */
export const consultaDeReporte = (reporte) => `reporte=${reporte.id}${reporte.tipoReporte === "global" ? "&tipo=global" : ""}`;

/**
 * Reporte que pide la URL de "Mis reportes" al llegar desde una notificación: ?destacar=<id> (con &tipo=global para el global;
 * sin tipo, mensual). Sin un id válido, null.
 */
export function destacadoDeConsulta(destacar, tipo) {
  const id = [...idsDestacados(destacar)][0];
  return id === undefined ? null : { id, tipo: tipoDeUrl(tipo) };
}

/** ¿Esta ruta de una notificación lleva a "Mis reportes" y señala EXACTAMENTE este reporte (id + tipo)? */
export function esNotificacionDeReporte(rutaRelacionada, reporte) {
  if (typeof rutaRelacionada !== "string") return false;
  const [ruta, consulta = ""] = rutaRelacionada.split("?");
  if (ruta !== "/alumno/reportes") return false;
  const destacado = destacadoDeConsulta(new URLSearchParams(consulta).get("destacar"), new URLSearchParams(consulta).get("tipo"));
  return destacado !== null && destacado.id === reporte.id && destacado.tipo === reporte.tipoReporte;
}

/** Nombre legible de la etapa de un rechazo. */
export const nombreEtapa = (etapa) => ({ alumno: "Alumno", profesor: "Profesor", coordinacion: "Coordinación" }[etapa] ?? etapa);
