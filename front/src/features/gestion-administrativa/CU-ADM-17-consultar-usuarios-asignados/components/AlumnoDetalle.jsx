import { RADIUS } from "@/themes/colors";

const CAMPO = ({ label, value, C }) => (
  <div style={{
    padding: "0.75rem 1rem",
    background: C.bgInput, borderRadius: RADIUS.md,
    border: `1px solid ${C.borderDefault}`,
  }}>
    <p style={{
      margin: "0 0 2px", fontSize: 10, fontWeight: 700,
      color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
    }}>
      {label}
    </p>
    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
      {value ?? "—"}
    </p>
  </div>
);

export function AlumnoDetalle({ alumno, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "1.5rem",
    }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        marginBottom: "1.5rem", paddingBottom: "1.25rem",
        borderBottom: `1px solid ${C.borderDefault}`,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke={C.accentText} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            {alumno.nombre}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: RADIUS.full,
              background: C.bgInput, border: `1px solid ${C.borderDefault}`, color: C.textMuted,
            }}>
              {alumno.carrera}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: RADIUS.full,
              background: C.accentSoft, border: `1px solid ${C.accent}`, color: C.accentText,
            }}>
              {alumno.creditos} créditos acumulados
            </span>
          </div>
        </div>
      </div>

      {/* Aviso solo lectura (RN-ADM-02) */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 12px", borderRadius: RADIUS.md,
        background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)",
        marginBottom: "1.25rem",
      }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
          stroke="#ca8a04" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: 11, color: "#b45309" }}>Vista de solo lectura</span>
      </div>

      {/* Campos (RN-ADM-01, RF-ADM-04) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
        <CAMPO label="Boleta"                 value={alumno.boleta}    C={C} />
        <CAMPO label="Carrera"                value={alumno.carrera}   C={C} />
        <CAMPO label="Correo institucional"   value={alumno.correoInst} C={C} />
        <CAMPO label="Correo alternativo"     value={alumno.correoAlt} C={C} />
        <CAMPO label="Teléfono personal"      value={alumno.telefono}  C={C} />
        <CAMPO label="Créditos acumulados"    value={`${alumno.creditos} créditos`} C={C} />
      </div>
    </div>
  );
}
