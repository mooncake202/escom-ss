import { RADIUS } from "@/themes/colors";

const ESTADO_STYLE = {
  "Sin comenzar": { bg: "rgba(85,85,85,0.12)",        color: "#9A9A9A" },
  "En progreso":  { bg: "rgba(10,102,194,0.12)",       color: "#2E86DE" },
  "Completada":   { bg: "rgba(34,197,94,0.12)",        color: "#22C55E" },
};

export function ActividadRow({ actividad, C }) {
  const estilo = ESTADO_STYLE[actividad.estado] ?? ESTADO_STYLE["Sin comenzar"];
  const fecha  = new Date(actividad.fechaAsignacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ padding: "0.875rem 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{actividad.titulo}</p>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: estilo.bg, color: estilo.color, fontWeight: 600, flexShrink: 0 }}>
          {actividad.estado}
        </span>
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{actividad.descripcion}</p>
      <p style={{ fontSize: 12, color: C.textMuted }}>
        Fecha límite: {
          actividad.fechaLimite
            ? new Date(actividad.fechaLimite).toLocaleDateString("es-MX")
            : "Sin definir"
        }
      </p>
      {actividad.entregable && (
        <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textDisabled }}>
          Entregable: {actividad.entregable}
        </p>
      )}
      {/* Barra de progreso */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 4, background: C.borderSubtle, borderRadius: 2 }}>
          <div style={{ width: `${actividad.progreso}%`, height: "100%", borderRadius: 2, background: actividad.progreso === 100 ? "#22C55E" : "#2E86DE", transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 11, color: C.textDisabled, minWidth: 30, textAlign: "right" }}>{actividad.progreso}%</span>
        <span style={{ fontSize: 11, color: C.textDisabled }}>{fecha}</span>
      </div>
    </div>
  );
}
