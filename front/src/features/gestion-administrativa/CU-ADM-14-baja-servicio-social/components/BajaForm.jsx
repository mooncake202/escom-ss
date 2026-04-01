import { RADIUS } from "@/themes/colors";

export function BajaForm({ motivo, errores, onMotivoChange, onSubmit, onCancelar, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem",
    }}>
      {/* Aviso */}
      <div style={{
        marginBottom: "1.25rem", padding: "12px 16px",
        borderRadius: RADIUS.md, background: C.warningSoft,
        border: `1px solid ${C.warning}`, color: C.warning,
        fontSize: 13, lineHeight: 1.5,
      }}>
        <strong>Aviso:</strong> La solicitud será enviada a coordinación para su revisión.
        Coordinación decidirá si tus horas acumuladas son contabilizadas o no.
        La baja no es inmediata.
      </div>

      {/* Campo motivo */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{
          display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
        }}>
          Motivo de la solicitud <span style={{ color: C.danger }}>*</span>
        </label>
        <textarea
          value={motivo}
          onChange={onMotivoChange}
          placeholder="Describe el motivo por el que deseas solicitar tu baja del servicio social..."
          rows={5}
          style={{
            width: "100%", padding: "10px 14px", boxSizing: "border-box",
            background: C.bgInput,
            border: `1px solid ${errores.motivo ? C.danger : C.borderDefault}`,
            borderRadius: RADIUS.md, color: C.textPrimary,
            fontSize: 13, outline: "none", fontFamily: "inherit",
            resize: "vertical", lineHeight: 1.55,
          }}
        />
        {errores.motivo && (
          <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>
            {errores.motivo}
          </p>
        )}
      </div>

      {/* Botones */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={onCancelar} style={{
          flex: 1, padding: "10px", borderRadius: RADIUS.md,
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          background: "transparent", border: `1px solid ${C.borderDefault}`,
          color: C.textMuted, fontFamily: "inherit",
        }}>
          Cancelar
        </button>
        <button onClick={onSubmit} style={{
          flex: 2, padding: "10px", borderRadius: RADIUS.md,
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          background: C.danger, border: "none", color: "#fff", fontFamily: "inherit",
        }}>
          Enviar solicitud de baja
        </button>
      </div>
    </div>
  );
}
