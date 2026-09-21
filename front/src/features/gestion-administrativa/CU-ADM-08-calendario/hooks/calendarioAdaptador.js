import { formatearFechaMexico, formatearHoraMexico } from "@/utils/fechas";

// Traducción API ↔ UI del calendario institucional. Sin React: las funciones son puras.

export const TIPO_API_A_UI = {
  Periodo:    "Periodo de prestación",
  Inhabil:    "Día inhábil",
  Vacacional: "Periodo vacacional",
};

// Evento de la API → forma que ya usan el calendario, la lista y el formulario.
// `editable`/`eliminable`/`motivoNoEditable` los decide el backend (solo los envía al coordinador).
export function eventoDeApi(e) {
  const tipo = TIPO_API_A_UI[e.tipo];
  if (!tipo) return null;

  const base = {
    id: e.id, tipo, nombre: e.nombre,
    editable: e.editable === true,
    eliminable: e.eliminable === true,
    motivoNoEditable: e.motivoNoEditable ?? null,
  };
  if (e.tipo === "Periodo") {
    return {
      ...base,
      fechaInicio: e.fechaInicio, fechaTermino: e.fechaFin,
      fechaLimiteExpediente: e.periodo?.fechaMaxExpediente ?? "",
      anio: e.periodo?.anio ?? "", semestre: e.periodo?.semestre ?? "",
    };
  }
  if (e.tipo === "Vacacional") return { ...base, fechaInicioVac: e.fechaInicio, fechaFinVac: e.fechaFin };
  return { ...base, fecha: e.fechaInicio, hora: e.hora ?? "", todoElDia: e.hora === null };
}

// Semántica del filtro Ciclo/Semestre. `desde`/`hasta` son la ventana temporal del semestre (rangoSemestre).
//  - Periodo: por el anio + semestre registrados, nunca por sus fechas.
//  - Vacacional: si su rango intersecta la ventana.
//  - Día inhábil: si su fecha cae dentro de la ventana.
export function coincideConSemestre(ev, { ciclo, periodo, desde, hasta }) {
  if (ev.tipo === "Periodo de prestación") return String(ev.anio) === String(ciclo) && ev.semestre === periodo;
  if (ev.tipo === "Periodo vacacional")    return ev.fechaInicioVac <= hasta && ev.fechaFinVac >= desde;
  return ev.fecha >= desde && ev.fecha <= hasta;
}

// Cuerpo para POST/PUT. Al inhábil siempre se le manda hora (nunca null) y nunca fechaFin.
export function construirPayload(form, confirmacionPublicacion = false) {
  const nombre = form.nombre.trim();
  if (form.tipo === "Periodo de prestación") {
    return {
      tipo: "Periodo", nombre,
      anio: form.anio, semestre: form.semestre,
      fechaMaxExpediente: form.fechaLimiteExpediente,
      fechaInicio: form.fechaInicio, fechaFin: form.fechaTermino,
      confirmacionPublicacion,
    };
  }
  if (form.tipo === "Periodo vacacional") {
    return { tipo: "Vacacional", nombre, fechaInicio: form.fechaInicioVac, fechaFin: form.fechaFinVac, confirmacionPublicacion };
  }
  return { tipo: "Inhabil", nombre, fechaInicio: form.fecha, hora: form.hora };
}

// Campo de la API → campo del formulario, según el tipo que se está capturando.
const CAMPOS_API_A_FORM = {
  "Día inhábil":           { nombre: "nombre", tipo: "tipo", fechaInicio: "fecha", hora: "hora" },
  "Periodo vacacional":    { nombre: "nombre", tipo: "tipo", fechaInicio: "fechaInicioVac", fechaFin: "fechaFinVac" },
  "Periodo de prestación": {
    nombre: "nombre", tipo: "tipo", anio: "anio", semestre: "semestre",
    fechaInicio: "fechaInicio", fechaFin: "fechaTermino", fechaMaxExpediente: "fechaLimiteExpediente",
  },
};

// Errores del backend → `errores` del formulario. Lo que no corresponde a un campo visible
// (409, 403, confirmación, etc.) va al aviso `conflicto`, con el mensaje tal cual lo devolvió el backend.
export function erroresDeApi(err, tipoUI) {
  const mapa = CAMPOS_API_A_FORM[tipoUI] ?? {};
  const errores = {};
  const sinCampo = [];
  Object.entries(err.errores ?? {}).forEach(([campo, mensaje]) => {
    if (mapa[campo]) errores[mapa[campo]] = mensaje;
    else sinCampo.push(mensaje);
  });
  errores.conflicto = sinCampo.length > 0 ? sinCampo.join(" ") : err.message;
  return errores;
}

// Hora de un día inhábil: sin hora guardada = todo el día; con hora = "a partir de" esa hora.
export function textoHoraInhabil(ev) {
  return ev.todoElDia ? "Todo el día" : `a partir de las ${ev.hora} hrs`;
}

// Texto de `motivoNoEditable` (código del backend).
export const MOTIVOS_NO_EDITABLE = {
  EVENTO_INMUTABLE: "Los periodos y periodos vacacionales publicados no pueden editarse ni eliminarse.",
  EVENTO_YA_EN_VIGOR: "Este día inhábil ya entró en vigor y no puede modificarse ni eliminarse.",
};

// ISO de la última modificación → "15 de enero de 2026, 10:00" (hora de México), o null si no hay dato.
export function textoUltimaModificacion(iso) {
  if (!iso) return null;
  return `${formatearFechaMexico(iso, { day: "numeric", month: "long", year: "numeric" })}, ${formatearHoraMexico(iso)}`;
}

// Día siguiente de una fecha ISO (aritmética de calendario sobre el texto, sin relojes).
export function diaSiguiente(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
