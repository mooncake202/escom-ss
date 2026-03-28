import { RADIUS } from "../../../../themes/colors";

export function OfertaCard({ oferta, selected, onSelect, C }) {
  return (
    <div
      onClick={() => onSelect(oferta.id)}
      style={{
        padding: "1.25rem", borderRadius: RADIUS.lg, cursor: "pointer",
        border: selected ? `2px solid ${C.accent}` : `1px solid ${C.borderDefault}`,
        background: selected ? C.accentSoft : C.bgCard,
        transition: "all 0.2s ease", position: "relative", overflow: "hidden",
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: C.accent, borderRadius: "50%",
          width: 22, height: 22, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700,
        }}>✓</div>
      )}
      <h4 style={{ margin: "0 0 6px", color: C.textPrimary, fontSize: 15 }}>{oferta.titulo}</h4>
      <p style={{ margin: "0 0 6px", fontSize: 13, color: C.textMuted }}>
        <span style={{ color: C.accentText, fontWeight: 600 }}>Profesor:</span> {oferta.profesor}
      </p>
      <p style={{ margin: "0 0 10px", fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
        {oferta.descripcion}
      </p>
      <div style={{
        display: "inline-block", padding: "4px 10px", borderRadius: RADIUS.full,
        background: oferta.cupos > 3 ? C.successSoft : C.dangerSoft,
        color: oferta.cupos > 3 ? C.success : C.danger,
        fontSize: 12, fontWeight: 600,
      }}>
        {oferta.cupos} cupos disponibles
      </div>
    </div>
  );
}
