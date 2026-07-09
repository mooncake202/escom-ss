import { RADIUS } from "@/themes/colors";

export function SolicitudDetalle({
  solicitud, panel,
  comentario, errores,
  onAprobar, onRechazar, onCancelar,
  onComentarioChange,
  onConfirmarAprobacion, onConfirmarRechazo,
  C,
}) {
  const { profesor, caracteristica, justificacion, fechaEnvio } = solicitud;

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "1.5rem",
    }}>

      {/* Header — profesor */}
      <div style={{
        marginBottom: "1.25rem", paddingBottom: "1.25rem",
        borderBottom: `1px solid ${C.borderDefault}`,
      }}>
        <p style={{
          margin: "0 0 2px", fontSize: 11, fontWeight: 700,
          color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Profesor
        </p>
        <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
          {profesor.nombre}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>{profesor.id}</p>
      </div>

      {/* Cupos actuales (RF-ADM-02) */}
      <div style={{ marginBottom: "1rem" }}>
        <p style={{
          margin: "0 0 6px", fontSize: 11, fontWeight: 700,
          color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          Cupos actuales
        </p>
        <span style={{
          display: "inline-block", padding: "4px 12px", borderRadius: RADIUS.full,
          background: C.accentSoft, border: `1px solid ${C.accent}`,
          fontSize: 13, fontWeight: 700, color: C.accentText,
        }}>
          {profesor.cuposActuales} cupos
        </span>
      </div>

      {/* Características actuales (RF-ADM-02) */}
      <div style={{ marginBottom: "1rem" }}>
        <p style={{
          margin: "0 0 6px", fontSize: 11, fontWeight: 700,
          color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          Características actuales
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {profesor.caracteristicasActuales.map((c, i) => (
            <div key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 12px", borderRadius: RADIUS.md,
              background: C.bgInput, border: `1px solid ${C.borderDefault}`,
            }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none"
                stroke={C.accentText} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{c.nombre}</span>
              {c.cuposInfo && (
                <>
                  <div style={{ width: 1, height: 12, background: C.borderDefault }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.accentText }}>{c.cuposInfo}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Característica solicitada (RF-ADM-02) */}
      <div style={{ marginBottom: "1rem" }}>
        <p style={{
          margin: "0 0 6px", fontSize: 11, fontWeight: 700,
          color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          Característica solicitada
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "6px 14px", borderRadius: RADIUS.md,
          background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#ca8a04" }}>
            {caracteristica.nombre}
          </span>
          <div style={{ width: 1, height: 14, background: "rgba(234,179,8,0.3)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#b45309" }}>
            {caracteristica.cuposRef}
          </span>
        </div>
      </div>

      {/* Justificación (RF-ADM-02) */}
      <div style={{
        marginBottom: "1.25rem", padding: "0.875rem 1rem",
        background: C.bgInput, borderRadius: RADIUS.md,
        border: `1px solid ${C.borderDefault}`,
      }}>
        <p style={{
          margin: "0 0 4px", fontSize: 11, fontWeight: 700,
          color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          Justificación
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.65 }}>
          {justificacion}
        </p>
      </div>

      <p style={{ margin: "0 0 1.5rem", fontSize: 11, color: C.textDisabled }}>
        Enviada el {fechaEnvio}
      </p>

      {/* ── Panel: botones principales ── */}
      {panel === "detalle" && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onRechazar} style={{
            flex: 1, padding: "10px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            background: "transparent", border: `1px solid ${C.danger}`, color: C.danger,
          }}>
            Rechazar
          </button>
          <button onClick={onAprobar} style={{
            flex: 2, padding: "10px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            background: C.accent, border: "none", color: "#fff",
          }}>
            Aprobar
          </button>
        </div>
      )}

      {/* ── Panel: confirmar aprobación ── */}
      {panel === "aprobacion" && (
        <div style={{
          padding: "1.25rem", borderRadius: RADIUS.md,
          background: C.accentSoft, border: `1px solid ${C.accent}`,
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: 13, fontWeight: 700, color: C.accentText }}>
            Confirmar aprobación
          </p>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
            Se otorgarán{" "}
            <strong style={{ color: C.accentText }}>
              {caracteristica.cuposRef}
            </strong>{" "}
            al profesor y la característica quedará registrada en su perfil.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onCancelar} style={{
              flex: 1, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted,
            }}>
              Cancelar
            </button>
            <button onClick={onConfirmarAprobacion} style={{
              flex: 2, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              background: C.accent, border: "none", color: "#fff",
            }}>
              Confirmar aprobación
            </button>
          </div>
        </div>
      )}

      {/* ── Panel: confirmar rechazo (RN-ADM-03, RF-ADM-05) ── */}
      {panel === "rechazo" && (
        <div style={{
          padding: "1.25rem", borderRadius: RADIUS.md,
          background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}`,
        }}>
          <p style={{ margin: "0 0 0.375rem", fontSize: 13, fontWeight: 700, color: C.danger }}>
            Confirmar rechazo
          </p>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textMuted }}>
            El comentario será enviado al profesor como notificación.
          </p>

          <label style={{
            display: "block", fontSize: 11, fontWeight: 700,
            color: C.textDisabled, textTransform: "uppercase",
            letterSpacing: "0.07em", marginBottom: 5,
          }}>
            Motivo del rechazo <span style={{ color: C.danger }}>*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Explica el motivo del rechazo…"
            value={comentario}
            onChange={onComentarioChange}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 12px", borderRadius: RADIUS.md, fontSize: 12,
              background: C.bgInput,
              border: `1px solid ${errores.comentario ? C.danger : C.borderDefault}`,
              color: C.textPrimary, fontFamily: "inherit", outline: "none",
              resize: "vertical", lineHeight: 1.5,
              marginBottom: errores.comentario ? 4 : "0.875rem",
            }}
          />
          {errores.comentario && (
            <p style={{ margin: "4px 0 12px", fontSize: 12, color: C.danger }}>{errores.comentario}</p>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onCancelar} style={{
              flex: 1, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted,
            }}>
              Cancelar
            </button>
            <button onClick={onConfirmarRechazo} style={{
              flex: 2, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              background: C.danger, border: "none", color: "#fff",
            }}>
              Confirmar rechazo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
