import { RADIUS } from "@/themes/colors";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function AlumnoCartaCard({ item, onVer, C }) {
  return (
    <div style={{
      padding: "1.1rem 1.25rem", borderRadius: RADIUS.lg,
      background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.alumno.nombre}
        </p>
        <p style={{ margin: "0 0 3px", fontSize: 12, color: C.textMuted }}>
          {CARRERA_LABEL[item.alumno.carrera]} · Boleta {item.alumno.boleta}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
          Profesor: {item.profesor}
        </p>
      </div>

      {/* Badge estado */}
      <span style={{
        fontSize: 11, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
        background: "rgba(245,158,11,0.12)", color: C.warning ?? "#F59E0B",
        fontWeight: 600,
      }}>
        Esperando carta
      </span>

      <button
        onClick={() => onVer(item)}
        style={{
          padding: "8px 18px", borderRadius: RADIUS.md,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          background: C.accentSoft, border: `1px solid ${C.accent}`,
          color: C.accentText, fontFamily: "inherit", flexShrink: 0,
        }}
      >
        Registrar
      </button>
    </div>
  );
}
