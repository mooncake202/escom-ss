// `alumno.creditos` es el PORCENTAJE de avance académico (100 = 100%), no horas de servicio social
// ni "créditos acumulados". Se etiqueta siempre como avance para que nadie lo lea como horas.
export function formatearAvance(creditos) {
  if (creditos === null || creditos === undefined) return "—";
  const n = Number(creditos);
  if (Number.isNaN(n)) return "—";
  return `${Number.isInteger(n) ? n : n.toFixed(2)}%`;
}

// Las tres carreras del catálogo.
const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IIA: "Ing. Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

// Si apareciera una clave fuera del catálogo se muestra tal cual, sin inventar un nombre.
export const etiquetaCarrera = (carrera) => CARRERA_LABEL[carrera] ?? carrera ?? "—";
