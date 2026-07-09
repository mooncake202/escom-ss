import { RADIUS } from "@/themes/colors";

export function SeccionCard({ icono, titulo, children, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      overflow: "hidden", marginBottom: "1rem",
    }}>
      <div style={{
        padding: "10px 16px", background: C.bgInput,
        borderBottom: `1px solid ${C.borderDefault}`,
        display: "flex", alignItems: "center", gap: "0.625rem",
      }}>
        <span style={{ display: "flex", flexShrink: 0 }}>{icono}</span>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{titulo}</p>
      </div>
      <div style={{ padding: "0.875rem 1rem" }}>
        {children}
      </div>
    </div>
  );
}
