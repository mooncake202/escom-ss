import { RADIUS } from "@/themes/colors";

const ICONOS = {
  1: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  2: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  3: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  4: (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

export function CaracteristicaSelector({ catalogo, seleccionada, aprobadas, error, onSeleccionar, C }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8,
      }}>
        Característica a registrar <span style={{ color: C.danger }}>*</span>
      </label>

      {/* 4 columnas — una por característica */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.75rem",
      }}>
        {catalogo.map(item => {
          const yaAprobada      = aprobadas.has(item.id);
          const estaSeleccionada = seleccionada === item.id;

          return (
            <div
              key={item.id}
              onClick={() => !yaAprobada && onSeleccionar(item.id)}
              style={{
                padding: "1rem 0.875rem",
                borderRadius: RADIUS.md,
                cursor: yaAprobada ? "not-allowed" : "pointer",
                opacity: yaAprobada ? 0.5 : 1,
                background: estaSeleccionada ? C.accentSoft : C.bgInput,
                border: `1px solid ${
                  estaSeleccionada ? C.accent
                  : error          ? C.danger
                  : C.borderDefault
                }`,
                transition: "all 0.15s",
                display: "flex", flexDirection: "column", gap: "0.625rem",
                position: "relative",
              }}
            >
              {/* Checkmark seleccionado */}
              {estaSeleccionada && (
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  width: 16, height: 16, borderRadius: "50%",
                  background: C.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none"
                    stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}

              {/* Ícono */}
              <div style={{
                width: 38, height: 38, borderRadius: RADIUS.sm,
                background: estaSeleccionada ? C.accent : C.bgCard,
                border: `1px solid ${estaSeleccionada ? C.accent : C.borderDefault}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: estaSeleccionada ? "#fff" : C.textMuted,
                flexShrink: 0,
              }}>
                {ICONOS[item.id]}
              </div>

              {/* Nombre */}
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 700, lineHeight: 1.35,
                color: estaSeleccionada ? C.accentText : C.textPrimary,
              }}>
                {item.nombre}
              </p>

              {/* Badge de cupos */}
              <div style={{
                display: "inline-flex", alignItems: "flex-start", gap: 5,
                padding: "4px 8px", borderRadius: RADIUS.sm,
                background: estaSeleccionada ? "rgba(0,58,143,0.15)" : C.bgCard,
                border: `1px solid ${estaSeleccionada ? C.accent : C.borderDefault}`,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                  color: estaSeleccionada ? C.accentText : C.textMuted,
                }}>
                  {item.cupos}
                </span>
                <span style={{ fontSize: 10, color: C.textDisabled, lineHeight: 1.4 }}>
                  {item.cuposDesc}
                </span>
              </div>

              {yaAprobada && (
                <span style={{ fontSize: 10, fontWeight: 700, color: C.success }}>
                  ✓ Ya aprobada
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{error}</p>
      )}
    </div>
  );
}
