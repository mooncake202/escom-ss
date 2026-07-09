import { RADIUS } from "@/themes/colors";

const DIAS_SEMANA = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export function CalendarioReporte({ year, month, diasSeleccionados, diasInhabiles, C }) {
  const totalDias = new Date(year, month + 1, 0).getDate();
  const offset    = new Date(year, month, 1).getDay();
  const cells     = [];

  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDias; d++) cells.push(d);

  function esInhabil(day) {
    const dow = new Date(year, month, day).getDay();
    if (dow === 0 || dow === 6) return true;
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    if (diasInhabiles.has(`${mm}-${dd}`)) return true;
    if (diasInhabiles.has(`${year}-${mm}-${dd}`)) return true;
    return false;
  }

  return (
    <div>
      <p style={{
        margin: "0 0 8px", fontSize: 12, fontWeight: 700,
        color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {MESES[month]} {year}
      </p>

      {/* Encabezado días semana — sin color rojo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{
            textAlign: "center", fontSize: 11, fontWeight: 700,
            color: C.textDisabled,
            padding: "4px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Celdas — no interactivas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;

          const inhabil  = esInhabil(day);
          const laborado = diasSeleccionados.has(day);
          const dow      = new Date(year, month, day).getDay();
          const esFS     = dow === 0 || dow === 6;

          let bg     = "transparent";
          let color  = C.textPrimary;
          let border = `1px solid ${C.borderDefault}`;

          if (esFS)     { bg = "transparent"; color = C.textDisabled; }
          if (inhabil && !esFS) { bg = "transparent"; color = C.textDisabled; }
          if (laborado) { bg = C.accent;      color = "#fff"; }

          return (
            <div
              key={day}
              title={
                laborado  ? "Día con bitácora registrada (4 h)"
                : inhabil ? (esFS ? "Fin de semana" : "Día inhábil")
                : "Sin bitácora"
              }
              style={{
                height: 36, borderRadius: RADIUS.md,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: laborado ? 700 : 400,
                background: bg, color,
                border: inhabil || esFS ? "none" : border, 
                opacity: (inhabil || esFS) && !laborado ? 0.4 : 1,
                textDecoration: inhabil && !esFS ? "line-through" : "none",
                cursor: "default",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        {[
          { color: C.accent,       border: "none",                         label: "Con bitácora (4 h)" },
          { color: "transparent",  border: `1px solid ${C.borderDefault}`, label: "Sin bitácora"       },
          { color: C.textDisabled, border: "none",                         label: "Inhábil"            },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3,
              background: item.color,
              border: item.border,
              opacity: item.label === "Inhábil" ? 0.4 : 1,
            }} />
            <span style={{ fontSize: 11, color: C.textDisabled }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}