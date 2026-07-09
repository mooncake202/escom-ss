export function InfoRow({ label, valor, C }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      gap: "1rem", padding: "7px 0", borderBottom: `1px solid ${C.borderDefault}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.textDisabled, flexShrink: 0, minWidth: 130 }}>{label}</span>
      <span style={{ fontSize: 13, color: C.textPrimary, textAlign: "right" }}>{valor}</span>
    </div>
  );
}