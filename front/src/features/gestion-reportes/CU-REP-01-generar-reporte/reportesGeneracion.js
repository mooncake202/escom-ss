// Utilidades puras de CU-REP-01. Solo presentan lo que responde el backend: nada de periodos ni horas se calcula aquí.

export const LIMITE_FIRMA_BYTES = 3 * 1024 * 1024;
const TIPOS_FIRMA = ["image/png", "image/jpeg"];

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const nombreMes = (mes) => MESES[mes];

/** Agrupa los días del calendario del backend (YYYY-MM-DD) por mes, en el mismo orden. */
export function agruparDiasPorMes(dias = []) {
  const meses = [];
  for (const dia of dias) {
    const [anio, mes] = dia.fecha.split("-").map(Number);
    let grupo = meses[meses.length - 1];
    if (!grupo || grupo.anio !== anio || grupo.mes !== mes - 1) {
      grupo = { anio, mes: mes - 1, dias: [] };
      meses.push(grupo);
    }
    grupo.dias.push(dia);
  }
  return meses;
}

/**
 * Fecha y hora de un instante (ISO, UTC) en America/Mexico_City, sin depender de la zona del navegador ni del servidor.
 * hourCycle "h23" evita el "24:05" que algunos motores dan a la medianoche con hour12:false.
 */
export function formatearFechaHoraMexico(iso) {
  const instante = new Date(iso);
  if (!iso || Number.isNaN(instante.getTime())) return null;
  const formato = (opciones) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", ...opciones }).format(instante);
  return {
    fecha: formato({ day: "numeric", month: "long", year: "numeric" }),
    hora: formato({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  };
}

const ETIQUETAS_ESTADO = {
  pendiente_revision_profesor: "Pendiente de revisión por profesor",
  rechazado_profesor: "Rechazado por profesor",
  pendiente_revision_coordinador: "Pendiente de revisión por coordinación",
  rechazado_coordinador: "Rechazado por coordinación",
  aprobado_coordinador: "Aprobado por coordinación",
};

export const etiquetaEstadoReporte = (estado) => ETIQUETAS_ESTADO[estado] ?? estado;

/** Validación previa de la firma (el servidor valida de verdad: estructura, dimensiones y tamaño). */
export function validarArchivoFirma(archivo) {
  if (!archivo) return "La firma es obligatoria.";
  if (!TIPOS_FIRMA.includes(archivo.type)) return "Solo se aceptan imágenes PNG o JPG.";
  if (archivo.size > LIMITE_FIRMA_BYTES) return "La imagen de la firma excede el tamaño máximo permitido (3 MB).";
  return null;
}

const ACCION_POR_CODIGO = {
  ACTIVIDADES_VACIAS: "actividades",
  TEXTO_INVALIDO: "actividades",
  CARACTERES_NO_SOPORTADOS: "actividades",
  ACTIVIDADES_EXCEDEN_ESPACIO: "actividades",
  ACTIVIDADES_PALABRA_DEMASIADO_LARGA: "actividades",
  REPORTE_NO_GENERABLE: "recargar",
  RUBRICA_NO_REGISTRADA: "recargar",
  DATOS_DEL_REPORTE_CAMBIARON: "recargar",
  SELLO_TIEMPO_NO_DISPONIBLE: "reintentar",
  REPORTE_YA_EXISTE: "lista",
  // CU-REP-04: la corrección exige cambiar las actividades; un reporte ya reenviado o aprobado no se puede corregir.
  SIN_CAMBIOS_EN_ACTIVIDADES: "actividades",
  REPORTE_NO_CORREGIBLE: "lista",
};

/**
 * Traduce un error del backend a { mensaje, accion } para la pantalla.
 * accion: "actividades" (corregir el texto), "recargar" (volver a consultar los datos), "reintentar",
 * "lista" (el reporte ya existe) o "ninguna".
 */
export function describirError(err) {
  const accion = ACCION_POR_CODIGO[err?.code] ?? "ninguna";
  // El mensaje del backend ya es claro (incluye los caracteres no soportados, las líneas de más, etc.).
  const mensaje = err?.message || "Ocurrió un error. Intenta de nuevo más tarde.";
  return { mensaje, accion, codigo: err?.code ?? null };
}
