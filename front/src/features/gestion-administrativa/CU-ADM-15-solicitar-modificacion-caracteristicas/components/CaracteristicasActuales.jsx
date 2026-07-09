import { RADIUS } from "@/themes/colors";

export function CaracteristicasActuales({ caracteristicas, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
    }}>
      <p style={{
        margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        Mis características actuales
      </p>

      {caracteristicas.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>
          Sin características registradas.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
          {caracteristicas.map(c => (
            <div
              key={c.id}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "7px 14px", borderRadius: RADIUS.md,
                background: C.bgInput, border: `1px solid ${C.borderDefault}`,
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                  stroke={C.accentText} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                  {c.nombre}
                </span>
              </div>
              {c.cuposInfo && (
                <>
                  <div style={{ width: 1, height: 14, background: C.borderDefault }} />
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: C.accentText, letterSpacing: "0.02em",
                  }}>
                    {c.cuposInfo}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ margin: "0.75rem 0 0", fontSize: 11, color: C.textDisabled }}>
        Las características ya aprobadas no pueden solicitarse nuevamente.
      </p>
    </div>
  );
}
