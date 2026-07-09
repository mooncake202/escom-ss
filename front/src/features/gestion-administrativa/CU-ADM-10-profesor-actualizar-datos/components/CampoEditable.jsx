import { RADIUS } from "@/themes/colors";

export function CampoEditable({ label, name, value, onChange, error, placeholder, tipo = "text", requerido = false, C }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
      }}>
        {label} {requerido && <span style={{ color: C.danger }}>*</span>}
      </label>
      <input
        type={tipo}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 14px", boxSizing: "border-box",
          background: C.bgInput,
          border: `1px solid ${error ? C.danger : C.borderDefault}`,
          borderRadius: RADIUS.md, color: C.textPrimary,
          fontSize: 13, outline: "none", fontFamily: "inherit",
        }}
      />
      {error && (
        <p style={{ margin: "5px 0 0", fontSize: 12, color: C.danger }}>{error}</p>
      )}
    </div>
  );
}
