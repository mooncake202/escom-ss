import { RADIUS } from "@/themes/colors";

const DIAS_SEMANA = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Los días llegan clasificados por el backend (GET /reportes/mensual/siguiente → calendario.dias): aquí solo se dibujan.
// Un día que no está en `dias` queda fuera del periodo del reporte.
export function CalendarioReporte({ anio, mes, dias, C }) {
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const offset    = new Date(anio, mes, 1).getDay();
  const porFecha  = new Map(dias.map((d) => [d.fecha, d]));
  const cells     = [];

  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDias; d++) cells.push(d);

  const fechaDe = (day) => `${anio}-${String(mes + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  function describir(dia) {
    if (!dia) return "Fuera del periodo del reporte";
    if (dia.tipo === "laborado") return `Bitácora aprobada (${dia.horas} h)`;
    if (dia.tipo === "vacacional" || dia.tipo === "inhabil") return dia.evento?.nombre ?? (dia.tipo === "vacacional" ? "Día vacacional" : "Día inhábil");
    if (dia.tipo === "fin_de_semana") return "Fin de semana";
    return "Sin bitácora aprobada";
  }

  return (
    <div>
      <p style={{
        margin: "0 0 8px", fontSize: 12, fontWeight: 700,
        color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {MESES[mes]} {anio}
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

          const dia      = porFecha.get(fechaDe(day));
          const fuera    = !dia;
          const laborado = dia?.tipo === "laborado";
          const noLabor  = dia && (dia.tipo === "vacacional" || dia.tipo === "inhabil" || dia.tipo === "fin_de_semana");
          const tachado  = dia && (dia.tipo === "vacacional" || dia.tipo === "inhabil");

          return (
            <div
              key={day}
              title={describir(dia)}
              style={{
                height: 36, borderRadius: RADIUS.md,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: laborado ? 700 : 400,
                background: laborado ? C.accent : "transparent",
                color: laborado ? "#fff" : fuera || noLabor ? C.textDisabled : C.textPrimary,
                border: fuera || noLabor ? "none" : laborado ? "none" : `1px solid ${C.borderDefault}`,
                opacity: fuera ? 0.25 : noLabor && !laborado ? 0.4 : 1,
                textDecoration: tachado && !laborado ? "line-through" : "none",
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
          { color: C.accent,      border: "none",                         label: "Bitácora aprobada" },
          { color: "transparent", border: `1px solid ${C.borderDefault}`, label: "Sin bitácora"      },
          { tachado: true,                                                 label: "Inhábil"           },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {item.tachado ? (
              // Igual que el día inhábil del calendario: atenuado y tachado.
              <div style={{ width: 12, height: 12, display: "flex", alignItems: "center" }}>
                <div style={{ width: "100%", height: 1.5, background: C.textDisabled, opacity: 0.6 }} />
              </div>
            ) : (
              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: item.border }} />
            )}
            <span style={{ fontSize: 11, color: C.textDisabled }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
