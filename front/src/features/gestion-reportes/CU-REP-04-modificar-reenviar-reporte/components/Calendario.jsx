import { RADIUS } from "@/themes/colors";
import { MESES, DIAS_SEMANA, esDiaInhabil, diasEnMes, primerDiaSemana } from "../hooks/useModificarReenviarReporte";

export function Calendario({ year, month, seleccionados, C }) {
  const total  = diasEnMes(year, month);
  const offset = primerDiaSemana(year, month);
  const cells  = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, padding: "4px 0",
            color: d === "Sa" || d === "Do" ? "rgba(239,68,68,0.55)" : C.textDisabled }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const inhabil   = esDiaInhabil(year, month, day);
          const selected  = seleccionados.has(day);
          const dow       = new Date(year, month, day).getDay();
          const isWeekend = dow === 0 || dow === 6;
          return (
            <div key={day}
              title={inhabil ? (isWeekend ? "Fin de semana" : "Día inhábil") : `${day} de ${MESES[month]}`}
              style={{
                height: 36, borderRadius: RADIUS.md,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: selected ? 700 : 400,
                cursor: "default", userSelect: "none",
                background: inhabil ? "transparent" : selected ? C.accent : C.bgInput,
                color: inhabil ? (isWeekend ? "rgba(239,68,68,0.25)" : C.borderDefault) : selected ? "#fff" : C.textPrimary,
                textDecoration: inhabil && !isWeekend ? "line-through" : "none",
                opacity: inhabil ? 0.45 : 1,
              }}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
