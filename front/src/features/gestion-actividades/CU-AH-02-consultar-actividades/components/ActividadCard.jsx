import { RADIUS } from "@/themes/colors";

const ESTADO_LABEL = {
  sin_comenzar: "Sin comenzar",
  en_progreso: "En progreso",
  vencida: "Vencida",
  completada_a_tiempo: "Completada a tiempo",
  completada_tarde: "Completada fuera de tiempo",
};

const ESTADO_STYLE = {
  sin_comenzar:        { bg: "rgba(85,85,85,0.12)",   color: "#9A9A9A" },
  en_progreso:         { bg: "rgba(10,102,194,0.12)", color: "#2E86DE" },
  // RN-AH-10/RF-AH-12: vencida debe distinguirse visualmente — tono de alerta.
  vencida:             { bg: "rgba(239,68,68,0.14)",  color: "#EF4444" },
  completada_a_tiempo: { bg: "rgba(34,197,94,0.12)",  color: "#22C55E" },
  completada_tarde:    { bg: "rgba(245,158,11,0.14)", color: "#F59E0B" },
};

export function ActividadCard({ actividad, expandida, onToggle, servicioIniciado = true, C }) {
  const estilo   = ESTADO_STYLE[actividad.estado] ?? ESTADO_STYLE.sin_comenzar;
  const etiqueta = ESTADO_LABEL[actividad.estado] ?? actividad.estado;
  const fechaAsignacion = new Date(actividad.fecha_asignacion).toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const fechaLimite = actividad.fecha_limite
    ? new Date(actividad.fecha_limite).toLocaleDateString("es-MX", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" })
    : "Sin definir";

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden",
      border: `1px solid ${expandida ? C.accent : C.borderDefault}`,
      background: C.bgCard, transition: "border-color 0.15s, opacity 0.15s",
      // Tarjeta de solo lectura mientras el servicio del alumno no ha iniciado:
      // sigue siendo expandible para ver el detalle, solo se atenúa.
      opacity: servicioIniciado ? 1 : 0.6,
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
              stroke={actividad.porcentaje_progreso === 100 ? "#22C55E" : "#2E86DE"}
              strokeWidth={3} strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - actividad.porcentaje_progreso / 100)}`}
              transform="rotate(-90 20 20)"
              style={{ transition: "stroke-dashoffset 0.4s" }}
            />
          </svg>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.textPrimary }}>
            {actividad.porcentaje_progreso}%
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{actividad.titulo}</p>
          <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>Fecha límite de entrega: {fechaLimite}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: estilo.bg, color: estilo.color, fontWeight: 600 }}>
            {etiqueta}
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

          <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>Asignada el {fechaAsignacion}</p>

            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Descripción</p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{actividad.descripcion}</p>
            </div>

            {/* RN-AH-08: entregable_esperado es obligatorio, se muestra siempre */}
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Entregable esperado</p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{actividad.entregable_esperado}</p>
            </div>

            {/* Barra de progreso detallada */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Progreso</p>
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{actividad.porcentaje_progreso}%</span>
              </div>
              <div style={{ height: 6, background: C.borderSubtle, borderRadius: 3 }}>
                <div style={{ width: `${actividad.porcentaje_progreso}%`, height: "100%", borderRadius: 3, background: actividad.porcentaje_progreso === 100 ? "#22C55E" : "#2E86DE", transition: "width 0.4s" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
