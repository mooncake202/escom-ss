import { RADIUS } from "@/themes/colors";

export function AlumnoCard({ alumno, onSeleccionar, C }) {
  return (
    <div
      onClick={() => onSeleccionar(alumno)}
      style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`,
        padding: "1.125rem 1.25rem",
        cursor: "pointer", transition: "border-color 0.15s",
        display: "flex", flexDirection: "column", gap: "0.5rem",
      }}
    >
      {/* Avatar + nombre */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: C.bgInput, border: `1px solid ${C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
            stroke={C.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary, lineHeight: 1.3 }}>
            {alumno.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>{alumno.boleta}</p>
        </div>
      </div>

      {/* Carrera + créditos + flecha */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: RADIUS.full,
            background: C.bgInput, border: `1px solid ${C.borderDefault}`, color: C.textMuted,
          }}>
            {alumno.carrera}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: RADIUS.full,
            background: C.accentSoft, border: `1px solid ${C.accent}`, color: C.accentText,
          }}>
            {alumno.creditos} créditos
          </span>
        </div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
          stroke={C.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}
