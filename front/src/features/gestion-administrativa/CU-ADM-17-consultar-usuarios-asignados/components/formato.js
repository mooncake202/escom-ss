// `alumno.creditos` es el PORCENTAJE de avance académico (100 = 100%), no horas de servicio social
// ni "créditos acumulados". Se etiqueta siempre como avance para que nadie lo lea como horas.
export function formatearAvance(creditos) {
  if (creditos === null || creditos === undefined) return "—";
  const n = Number(creditos);
  if (Number.isNaN(n)) return "—";
  return `${Number.isInteger(n) ? n : n.toFixed(2)}%`;
}

