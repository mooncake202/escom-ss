export function ContactRow({ tipo, valor, C }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      gap: "1rem", padding: "12px 16px",
      borderBottom: `1px solid ${C.borderDefault}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.textDisabled, flexShrink: 0, minWidth: 160 }}>
        {tipo}
      </span>
      <span style={{ fontSize: 13, color: C.textPrimary, textAlign: "right" }}>{valor}</span>
    </div>
  );
}
