import { RADIUS } from "@/themes/colors";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function AlumnoSelectorCard({ alumno, seleccionado, tieneBaja, onSeleccionar, C }) {
  return (
    <div
      onClick={() => onSeleccionar(alumno)}
      style={{
        padding: "1rem 1.25rem", borderRadius: RADIUS.lg,
        cursor: tieneBaja ? "not-allowed" : "pointer",
        opacity: tieneBaja ? 0.6 : 1,
        background: seleccionado ? C.navItemActive : C.bgCard,
        border: `1px solid ${seleccionado ? C.accent : C.borderDefault}`,
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: seleccionado ? C.accent : C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
          color: seleccionado ? "#fff" : C.accentText,
          flexShrink: 0,
        }}>
          {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {alumno.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
            {CARRERA_LABEL[alumno.carrera] ?? alumno.carrera} · {alumno.boleta}
          </p>
        </div>
        {tieneBaja && (
          <span style={{
            flexShrink: 0, padding: "2px 8px", borderRadius: RADIUS.full,
            background: C.warningSoft, color: C.warning,
            fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            Solicitud enviada
          </span>
        )}
      </div>
    </div>
  );
}
