import { RADIUS } from "@/themes/colors";

export function CampoLocked({ label, valor, C }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
      }}>
        {label}
      </label>
      <div style={{
        padding: "10px 14px", borderRadius: RADIUS.md,
        background: C.bgPage, border: `1px solid ${C.borderDefault}`,
        fontSize: 13, color: C.textDisabled,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "0.5rem",
      }}>
        <span>{valor}</span>
        <span style={{ fontSize: 11, color: C.textDisabled, fontStyle: "italic" }}>No editable</span>
      </div>
    </div>
  );
}
