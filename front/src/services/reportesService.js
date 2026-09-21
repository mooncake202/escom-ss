import { apiFetch, apiFetchBlob } from "./apiClient";

// CU-REP-01 (alumno): datos del siguiente reporte, calendario, bloqueos y si falta la firma.
export function obtenerSiguienteReporte() {
  return apiFetch("/reportes/mensual/siguiente");
}

// Rúbrica: se sube una sola vez (multipart, campo "rubrica"). Por defecto es la del alumno; el profesor usa su propia ruta.
export function subirRubrica(archivo, ruta = "/reportes/rubrica") {
  const formData = new FormData();
  formData.append("rubrica", archivo);
  return apiFetch(ruta, { method: "POST", body: formData });
}

// PDF generado por el servidor (no se firma ni se guarda nada). Devuelve un Blob.
export async function obtenerVistaPrevia(actividades) {
  const pdf = await apiFetchBlob("/reportes/mensual/vista-previa", {
    method: "POST",
    body: JSON.stringify({ actividades }),
  });
  if (!pdf.type.includes("pdf")) throw new Error("No se pudo generar la vista previa. Intenta de nuevo.");
  return pdf;
}

// Envío definitivo: genera el PDF, lo sella y lo registra para revisión.
export function enviarReporteMensual(actividades) {
  return apiFetch("/reportes/mensual", {
    method: "POST",
    body: JSON.stringify({ actividades }),
  });
}

// ── CU-REP-05 (profesor) ─────────────────────────────────────

// { pendientes, procesados, totales } de los alumnos asignados a sus ofertas.
export function listarReportesProfesor() {
  return apiFetch("/profesor/reportes");
}

// tipoReporte: "mensual" | "global" (hoy solo hay mensuales). El profesor sale del token, nunca del cliente.
export function obtenerDetalleReporteProfesor(tipoReporte, id) {
  return apiFetch(`/profesor/reportes/${encodeURIComponent(tipoReporte)}/${encodeURIComponent(id)}`);
}

// PDF almacenado (el que envió y firmó el alumno), tal cual; el servidor no lo regenera. Devuelve un Blob.
export async function obtenerPdfReporteProfesor(tipoReporte, id) {
  const pdf = await apiFetchBlob(`/profesor/reportes/${encodeURIComponent(tipoReporte)}/${encodeURIComponent(id)}/pdf`);
  if (!pdf.type.includes("pdf")) throw new Error("No se pudo abrir el PDF del reporte. Intenta de nuevo.");
  return pdf;
}

// Rúbrica del profesor: solo dice si ya existe ({ tieneRubrica, requiereSubirRubrica }); nunca la imagen.
export function obtenerEstadoRubricaProfesor() {
  return apiFetch("/profesor/reportes/rubrica");
}

// Misma subida segura que la del alumno, hacia la ruta del profesor.
export function subirRubricaProfesor(archivo) {
  return subirRubrica(archivo, "/profesor/reportes/rubrica");
}

// Rechazo con motivo obligatorio: solo cambia el estado y avisa al alumno (sin firma ni sello).
export function rechazarReporteProfesor(tipoReporte, id, comentario) {
  return apiFetch(`/profesor/reportes/${encodeURIComponent(tipoReporte)}/${encodeURIComponent(id)}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ comentario }),
  });
}

// Aprueba y firma con la rúbrica ya guardada: el servidor agrega la firma al PDF del alumno, lo sella y lo envía a Coordinación.
export function aprobarReporteProfesor(tipoReporte, id) {
  return apiFetch(`/profesor/reportes/${encodeURIComponent(tipoReporte)}/${encodeURIComponent(id)}/aprobar`, { method: "POST" });
}

// ── CU-REP-06 (coordinación) ─────────────────────────────────

const rutaCoordinacion = (tipoReporte, id) => `/coordinador/reportes/${encodeURIComponent(tipoReporte)}/${encodeURIComponent(id)}`;

// { pendientes, procesados, totales }: la bandeja compartida de Coordinación (lo que aprobó el profesor y lo ya resuelto).
export function listarReportesCoordinacion() {
  return apiFetch("/coordinador/reportes");
}

export function obtenerDetalleReporteCoordinacion(tipoReporte, id) {
  return apiFetch(rutaCoordinacion(tipoReporte, id));
}

// PDF almacenado vigente (alumno + profesor, y el sello de validación si ya se validó), tal cual. Devuelve un Blob.
export async function obtenerPdfReporteCoordinacion(tipoReporte, id) {
  const pdf = await apiFetchBlob(`${rutaCoordinacion(tipoReporte, id)}/pdf`);
  if (!pdf.type.includes("pdf")) throw new Error("No se pudo abrir el PDF del reporte. Intenta de nuevo.");
  return pdf;
}

// Rechazo con motivo obligatorio: solo cambia el estado y avisa al alumno y al profesor (sin PDF, sello ni hash).
export function rechazarReporteCoordinacion(tipoReporte, id, comentario) {
  return apiFetch(`${rutaCoordinacion(tipoReporte, id)}/rechazar`, { method: "POST", body: JSON.stringify({ comentario }) });
}

// Valida: el servidor agrega el sello de validación del prototipo al PDF vigente, lo sella en el tiempo y lo aprueba.
export function aprobarReporteCoordinacion(tipoReporte, id) {
  return apiFetch(`${rutaCoordinacion(tipoReporte, id)}/aprobar`, { method: "POST" });
}

// ── CU-REP-02 / 03 / 04 (alumno) ─────────────────────────────

const rutaAlumno = (tipoReporte, id) => `/reportes/${encodeURIComponent(tipoReporte)}/${encodeURIComponent(id)}`;

// { reportes, total }: solo los reportes del alumno del token, del más reciente al más antiguo.
export function listarReportesAlumno() {
  return apiFetch("/reportes");
}

// Seguimiento de un reporte propio: resumen, historial real (append-only), último rechazo y si se puede corregir.
export function obtenerSeguimientoReporte(tipoReporte, id) {
  return apiFetch(rutaAlumno(tipoReporte, id));
}

// PDF almacenado de un reporte propio (la última versión enviada), tal cual. Devuelve un Blob.
export async function obtenerPdfReporteAlumno(tipoReporte, id) {
  const pdf = await apiFetchBlob(`${rutaAlumno(tipoReporte, id)}/pdf`);
  if (!pdf.type.includes("pdf")) throw new Error("No se pudo abrir el PDF del reporte. Intenta de nuevo.");
  return pdf;
}

// PDF de la corrección con la plantilla actual: en memoria, no firma ni guarda nada. Devuelve un Blob.
export async function obtenerVistaPreviaCorreccion(tipoReporte, id, actividades) {
  const pdf = await apiFetchBlob(`${rutaAlumno(tipoReporte, id)}/correccion/vista-previa`, {
    method: "POST",
    body: JSON.stringify({ actividades }),
  });
  if (!pdf.type.includes("pdf")) throw new Error("No se pudo generar la vista previa. Intenta de nuevo.");
  return pdf;
}

// Reenvío definitivo: solo cambian las actividades; el servidor firma con la rúbrica ya registrada, sella y vuelve a enviar al profesor.
export function reenviarReporteCorregido(tipoReporte, id, actividades) {
  return apiFetch(`${rutaAlumno(tipoReporte, id)}/correccion`, { method: "POST", body: JSON.stringify({ actividades }) });
}

// ── CU-REP-07 (alumno): reporte global ───────────────────────

// Horas acumuladas y requeridas (480), periodo completo del servicio, si ya existe uno, datos que faltan y si falta la rúbrica.
export function obtenerSiguienteReporteGlobal() {
  return apiFetch("/reportes/global/siguiente");
}

// PDF generado por el servidor con la plantilla del mensual (no se firma ni se guarda nada). Devuelve un Blob.
export async function obtenerVistaPreviaGlobal(actividades) {
  const pdf = await apiFetchBlob("/reportes/global/vista-previa", {
    method: "POST",
    body: JSON.stringify({ actividades }),
  });
  if (!pdf.type.includes("pdf")) throw new Error("No se pudo generar la vista previa. Intenta de nuevo.");
  return pdf;
}

// Envío definitivo: firma con la rúbrica ya registrada, sella y lo manda al profesor. El servidor vuelve a validar las 480 h.
export function enviarReporteGlobal(actividades) {
  return apiFetch("/reportes/global", { method: "POST", body: JSON.stringify({ actividades }) });
}
