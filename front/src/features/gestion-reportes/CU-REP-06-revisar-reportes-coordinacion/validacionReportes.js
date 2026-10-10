// Utilidades puras de CU-REP-06: solo presentan lo que responde el backend (bandeja de Coordinación).
import { sinAcentos } from "../CU-REP-05-revisar-reportes-profesor/revisionReportes.js";

// Estados reales de reporte_mensual.estado_reporte, vistos por Coordinación (los únicos que le llegan).
export const ESTADO_MAP = {
  pendiente_revision_coordinador: { bg: (C) => C.warningSoft,        color: (C) => C.warning, label: "Pendiente de validación"    },
  aprobado_coordinador:           { bg: (C) => C.successSoft,        color: (C) => C.success, label: "Validado por coordinación"  },
  rechazado_coordinador:          { bg: () => "rgba(239,68,68,0.1)", color: (C) => C.danger,  label: "Rechazado por coordinación" },
};

// Un estado que no se conoce se muestra tal cual y en neutro (nunca como "pendiente").
export const estadoDe = (estado) => ESTADO_MAP[estado] ?? { bg: (C) => C.bgInput, color: (C) => C.textMuted, label: estado };

export const CRITERIO = { TODOS: "todos", ALUMNO: "alumno", PROFESOR: "profesor", CARRERA: "carrera" };

// Los textos donde busca cada criterio (alumno, profesor y carrera del reporte).
const textosDe = (r) => ({
  [CRITERIO.ALUMNO]:   r.alumno.nombreCompleto,
  [CRITERIO.PROFESOR]: r.profesor?.nombreCompleto ?? "",
  [CRITERIO.CARRERA]:  r.alumno.carrera ?? "",
});

// Coordinación solo ve 2 estados "procesados": lo que ella misma validó o rechazó (nunca llega a ver
// rechazado_profesor, ese reporte ni siquiera sale de la bandeja del profesor).
export const esRechazadoPorCoordinacion = (reporte) => reporte.estadoReporte === 'rechazado_coordinador';

/** Separa "procesados" en lo que coordinación validó vs lo que rechazó. */
export function separarProcesados(procesados) {
  const aprobados = [];
  const rechazados = [];
  for (const r of procesados) (esRechazadoPorCoordinacion(r) ? rechazados : aprobados).push(r);
  return { aprobados, rechazados };
}

/** Filtra por alumno, profesor o carrera (o los tres), sin distinguir mayúsculas ni acentos. Vacío devuelve todo. */
export function filtrarReportes(reportes, criterio, busqueda) {
  const buscado = sinAcentos(busqueda.trim());
  if (!buscado) return reportes;
  return reportes.filter((r) => {
    const textos = textosDe(r);
    const donde = criterio in textos ? [textos[criterio]] : Object.values(textos);
    return donde.some((t) => sinAcentos(t).includes(buscado));
  });
}
