import { RADIUS } from "@/themes/colors";

export function ProfesorHeader({ profesor, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem", marginBottom: "1rem",
      display: "flex", alignItems: "center", gap: "1rem",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: RADIUS.full,
        background: "rgba(0,58,143,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
      }}>
        👨‍🏫
      </div>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
          {profesor.nombre}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>
          {profesor.correo}
        </p>
      </div>
    </div>
  );
}