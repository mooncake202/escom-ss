import { RADIUS } from "@/themes/colors";

export function ProfesorCard({ profesor, onSeleccionar, C }) {
  const total = profesor.alumnos.length;

  return (
    <div
      onClick={() => onSeleccionar(profesor)}
      style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`,
        padding: "1.125rem 1.25rem",
        cursor: "pointer", transition: "border-color 0.15s",
        display: "flex", flexDirection: "column", gap: "0.625rem",
      }}
    >
      {/* Ícono + nombre */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke={C.accentText} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary, lineHeight: 1.3 }}>
            {profesor.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>{profesor.idEmpleado}</p>
        </div>
      </div>

      {/* Badge alumnos + flecha */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: RADIUS.full,
          background: total === 0 ? C.bgInput : C.accentSoft,
          border: `1px solid ${total === 0 ? C.borderDefault : C.accent}`,
          color: total === 0 ? C.textDisabled : C.accentText,
        }}>
          {total} alumno{total !== 1 ? "s" : ""} asignado{total !== 1 ? "s" : ""}
        </span>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
          stroke={C.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}
