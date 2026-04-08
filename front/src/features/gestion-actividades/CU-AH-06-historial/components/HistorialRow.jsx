import { GRADIENTS, RADIUS, SHADOWS } from "@/themes/colors";

// ── Estilos por estado ───────────────────────────────────────
const ESTADO_STYLE = {
  "Aprobada":           { bg: "rgba(34,197,94,0.12)",   color: "#22C55E" },
  "Rechazada":          { bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  "PendienteRevision":  { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
  "Completada":         { bg: "rgba(34,197,94,0.12)",   color: "#22C55E" },
  "En progreso":        { bg: "rgba(10,102,194,0.12)",  color: "#2E86DE" },
  "Sin comenzar":       { bg: "rgba(85,85,85,0.12)",    color: "#9A9A9A" },
};

const ESTADO_LABEL = {
  "PendienteRevision": "Pendiente",
};

// ── Fila del historial ───────────────────────────────────────
export function HistorialRow({ registro, expandido, onToggle, C }) {
  const estilo = ESTADO_STYLE[registro.estado] ?? ESTADO_STYLE["Sin comenzar"];
  const label  = ESTADO_LABEL[registro.estado] ?? registro.estado;
  const esBitacora = registro.tipo === "bitacora";

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden",
      border: `1px solid ${expandido ? C.accent : C.borderDefault}`,
      background: C.bgCard, transition: "border-color 0.15s",
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{ padding: "0.875rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        {/* Icono tipo */}
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: esBitacora ? "rgba(10,102,194,0.1)" : "rgba(34,197,94,0.1)", fontSize: 15 }}>
          {esBitacora ? "📝" : "✅"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 20, background: esBitacora ? "rgba(10,102,194,0.1)" : "rgba(34,197,94,0.1)", color: esBitacora ? "#2E86DE" : "#22C55E", fontWeight: 600 }}>
              {esBitacora ? "Bitácora" : "Actividad"}
            </span>
            <span style={{ fontSize: 12, color: C.textDisabled }}>{registro.fecha}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {esBitacora
              ? registro.avances.map(a => a.actividad).join(", ")
              : registro.titulo
            }
          </p>
          {esBitacora && (
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
              {registro.horaInicio} – {registro.horaFin} · {registro.horasTrabajadas}h
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: estilo.bg, color: estilo.color, fontWeight: 600 }}>
            {label}
          </span>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round"
            style={{ transform: expandido ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${C.borderSubtle}` }}>
          <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

            {/* BITÁCORA */}
            {esBitacora && (
              <>
                
                {/* Avances */}
                <div>
                  
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Actividades trabajadas
                  </p>
                  {registro.avances.map((av, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: C.textSecondary, flex: 1 }}>{av.actividad}</span>
                      <div style={{ width: 80, height: 4, background: C.borderSubtle, borderRadius: 2 }}>
                        <div style={{ width: `${av.progreso}%`, height: "100%", borderRadius: 2, background: av.progreso === 100 ? "#22C55E" : "#2E86DE" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, minWidth: 32, textAlign: "right" }}>{av.progreso}%</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Descripción</p>
                  <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{registro.descripcion}</p>
                </div>

                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Evidencia</p>
                  {registro.evidencia.startsWith("http")
                    ? <a href={registro.evidencia} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2E86DE", wordBreak: "break-all" }}>{registro.evidencia}</a>
                    : <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>{registro.evidencia}</p>
                  }
                </div>

                {/* Comentario rechazo — RN-AH-55 */}
                {registro.estado === "Rechazada" && registro.comentarioProfesor && (
                  <div style={{ padding: "10px 14px", borderRadius: RADIUS.md, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.06em" }}>Motivo del rechazo</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{registro.comentarioProfesor}</p>
                  </div>
                )}
              </>
            )}

            {/* ACTIVIDAD */}
            {!esBitacora && (
              <>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em"  }}>Fecha límite de entrega: {registro.fechaLimite}</p>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Descripción</p>
                  <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{registro.descripcion}</p>
                </div>

                {registro.entregable && (
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Entregable esperado</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>{registro.entregable}</p>
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Progreso</p>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{registro.progreso}%</span>
                  </div>
                  <div style={{ height: 6, background: C.borderSubtle, borderRadius: 3 }}>
                    <div style={{ width: `${registro.progreso}%`, height: "100%", borderRadius: 3, background: registro.progreso === 100 ? "#22C55E" : "#2E86DE" }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
