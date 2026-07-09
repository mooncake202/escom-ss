import { RADIUS } from "@/themes/colors";

export function Breadcrumb({ items, C }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 6px",
      background: C.bgCard, borderRadius: RADIUS.md,
      border: `1px solid ${C.borderDefault}`,
      padding: "8px 14px", marginBottom: "1.25rem",
    }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && (
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
              stroke={C.textDisabled} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              style={{
                background: "none", border: "none", padding: 0,
                fontSize: 12, color: C.accent, cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
              }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{
              fontSize: 12, fontWeight: i === items.length - 1 ? 700 : 400,
              color: i === items.length - 1 ? C.textPrimary : C.textDisabled,
            }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
