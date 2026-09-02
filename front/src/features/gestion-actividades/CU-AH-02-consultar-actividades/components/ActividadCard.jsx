import { RADIUS } from "@/themes/colors";

const ESTADO_STYLE = {
  "Sin comenzar": { bg: "rgba(85,85,85,0.12)",   color: "#9A9A9A" },
  "En progreso":  { bg: "rgba(10,102,194,0.12)", color: "#2E86DE" },
  "Completada":   { bg: "rgba(34,197,94,0.12)",  color: "#22C55E" },
};

export function ActividadCard({ actividad, expandida, onToggle, C }) {
  const estilo = ESTADO_STYLE[actividad.estado] ?? ESTADO_STYLE["Sin comenzar"];
  const fecha  = new Date(actividad.fechaAsignacion).toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden",
      border: `1px solid ${expandida ? C.accent : C.borderDefault}`,
      background: C.bgCard, transition: "border-color 0.15s",
    }}>
      {/* Header clickeable */}
      <div
        onClick={onToggle}
        style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        {/* Indicador progreso circular */}
        <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
          <svg width={40} height={40} viewBox="0 0 40 40">
            <circle cx={20} cy={20} r={16} fill="none" stroke={C.borderSubtle} strokeWidth={3} />
            <circle
              cx={20} cy={20} r={16} fill="none"
              stroke={actividad.progreso === 100 ? "#22C55E" : "#2E86DE"}
              strokeWidth={3} strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - actividad.progreso / 100)}`}
              transform="rotate(-90 20 20)"
              style={{ transition: "stroke-dashoffset 0.4s" }}
            />
          </svg>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.textPrimary }}>
            {actividad.progreso}%
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{actividad.titulo}</p>
          <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>Fecha límite de entrega: {fecha}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: estilo.bg, color: estilo.color, fontWeight: 600 }}>
            {actividad.estado}
          </span>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round"
            style={{ transform: expandida ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>

      {/* Detalle expandido — RN-AH-09 */}
      {expandida && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${C.borderSubtle}` }}>
          <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

          <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>Asignada el {fecha}</p>


            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Descripción</p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{actividad.descripcion}</p>
            </div>

            {actividad.entregable && (
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Entregable esperado</p>
                <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{actividad.entregable}</p>
              </div>
            )}

            {/* Barra de progreso detallada */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Progreso</p>
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{actividad.progreso}%</span>
              </div>
              <div style={{ height: 6, background: C.borderSubtle, borderRadius: 3 }}>
                <div style={{ width: `${actividad.progreso}%`, height: "100%", borderRadius: 3, background: actividad.progreso === 100 ? "#22C55E" : "#2E86DE", transition: "width 0.4s" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
