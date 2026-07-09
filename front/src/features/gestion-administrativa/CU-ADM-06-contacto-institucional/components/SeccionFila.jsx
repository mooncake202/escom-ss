export function ContactoFila({ label, valor, C }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: "1rem", padding: "7px 0", borderBottom: `1px solid ${C.borderDefault}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.textDisabled, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: C.textPrimary, textAlign: "right", fontFamily: "inherit" }}>{valor}</span>
    </div>
  );
}
