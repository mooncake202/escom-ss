import { RADIUS } from "@/themes/colors";
import { EstatusBadge, ESTADO_MAP } from "./EstatusBadge";

export function ReporteItem({ reporte: r, abierto, onToggle, onVerSeguimiento, onEditar, onDescargar, C }) {
  const s = ESTADO_MAP[r.estado] || ESTADO_MAP.pendiente_firma;
  const esRechazado = r.estado === "rechazado_profesor";
  const esAprobado  = r.estado === "aprobado";

  return (
    <div
      style={{
        background: C.bgCard,
        borderRadius: RADIUS.xl,
        border: `1px solid ${abierto ? s.color(C) : C.borderDefault}`,
        borderLeft: `3px solid ${s.color(C)}`,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Fila del reporte — siempre visible */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "transparent", border: "none",
          padding: "1rem 1.25rem",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "1rem",
          fontFamily: "inherit",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.titulo}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
            {r.periodo} · Enviado el {r.fechaEnvio}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <EstatusBadge estado={r.estado} C={C} />
          <svg
            width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: abierto ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {/* Detalle expandido */}
      {abierto && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: "1rem 1.25rem" }}>
          {/* Métricas */}
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {[
              { label: "Días laborados",   valor: `${r.diasLaborados} días` },
              { label: "Horas reportadas", valor: `${r.horas} h` },
              { label: "Revisor",          valor: r.profesor },
            ].map(({ label, valor }) => (
              <div key={label}>
                <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
                <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, fontWeight: 600 }}>{valor}</p>
              </div>
            ))}
          </div>

          {/* Retroalimentación */}
          {r.comentario ? (
            <div style={{
              padding: "10px 14px", borderRadius: RADIUS.md, marginBottom: esRechazado ? "1rem" : 0,
              background: esRechazado ? "rgba(239,68,68,0.05)" : C.bgInput,
              border: `1px solid ${esRechazado ? C.danger : C.borderDefault}`,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: esRechazado ? C.danger : C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Retroalimentación
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.65 }}>
                {r.comentario}
              </p>
            </div>
          ) : (
            <p style={{ margin: esRechazado ? "0 0 1rem" : 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
              Sin retroalimentación registrada.
            </p>
          )}

          {/* Acciones */}
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginTop: "1rem" }}>

            {/* Ver seguimiento — todos los reportes */}
            <button
              onClick={onVerSeguimiento}
              style={{
                padding: "8px 16px", borderRadius: RADIUS.md,
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Ver seguimiento
            </button>

            {/* Editar — solo rechazados */}
            {esRechazado && (
              <button
                onClick={onEditar}
                style={{
                  padding: "8px 16px", borderRadius: RADIUS.md,
                  background: C.danger, border: "none", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Editar y reenviar →
              </button>
            )}

            {/* Descargar — solo aprobados */}
            {esAprobado && (
              <button
                onClick={onDescargar}
                style={{
                  padding: "8px 16px", borderRadius: RADIUS.md,
                  background: "transparent", border: `1px solid ${C.success}`,
                  color: C.success, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
