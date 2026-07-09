import { RADIUS } from "@/themes/colors";

export function DestinatariosBar({ alumnos, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "0.875rem 1.25rem", marginBottom: "1.25rem",
      display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
    }}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0,
      }}>
        Visible para:
      </span>
      {alumnos.map(al => (
        <span key={al.id} style={{
          padding: "3px 10px", borderRadius: RADIUS.full,
          fontSize: 12, fontWeight: 500,
          background: "rgba(99,102,241,0.1)", color: "#818cf8",
        }}>
          {al.nombre}
        </span>
      ))}
    </div>
  );
}
