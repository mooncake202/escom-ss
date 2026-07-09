import { RADIUS } from "@/themes/colors";

export function AvanceActividades({ avances, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
    }}>
      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
        Avance de actividades trabajadas
      </p>
      <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textDisabled, lineHeight: 1.5 }}>
        Acumulado del periodo basado en las bitácoras registradas día con día. Solo informativo.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {avances.map(({ titulo, porcentaje }) => (
          <div key={titulo}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "baseline", marginBottom: 5,
            }}>
              <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>{titulo}</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: C.accentText,
                padding: "1px 8px", borderRadius: RADIUS.full, background: C.accentSoft,
              }}>
                {porcentaje}%
              </span>
            </div>
            <div style={{
              height: 8, borderRadius: RADIUS.full,
              background: C.bgInput, border: `1px solid ${C.borderDefault}`, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${porcentaje}%`,
                borderRadius: RADIUS.full, background: C.accent,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}