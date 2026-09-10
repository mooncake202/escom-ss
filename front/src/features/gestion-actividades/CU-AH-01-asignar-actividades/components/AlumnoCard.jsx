import { RADIUS } from "@/themes/colors";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

const ESTADOS_COMPLETADA = ["completada_a_tiempo", "completada_tarde"];

export function AlumnoCard({ alumno, seleccionado, onSeleccionar, C }) {
  // "Activas" = solo lo que aún requiere acción del alumno. Vencida queda
  // fuera de ambos contadores (ni activa ni completada).
  const activas = alumno.actividades.filter(a => a.estado === "sin_comenzar" || a.estado === "en_progreso").length;
  const completadas = alumno.actividades.filter(a => ESTADOS_COMPLETADA.includes(a.estado)).length;

  return (
    <div
      onClick={() => onSeleccionar(alumno)}
      style={{
        padding: "1rem 1.25rem", borderRadius: RADIUS.lg, cursor: "pointer",
        background: seleccionado ? C.navItemActive : C.bgCard,
        border: `1px solid ${seleccionado ? C.accent : C.borderDefault}`,
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {/* Avatar + nombre */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: seleccionado ? C.accent : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: seleccionado ? "#fff" : C.accentText, flexShrink: 0 }}>
            {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{alumno.nombre}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{CARRERA_LABEL[alumno.carrera]} · {alumno.boleta}
            <br />
            <span style={{ fontSize: 10, color: C.textDisabled }}>
              {alumno.proyecto}
            </span></p>
          </div>
        </div>
        {/* Contadores */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {activas > 0 && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: C.accentSoft, color: C.accentText, fontWeight: 600 }}>
              {activas} activa{activas !== 1 ? "s" : ""}
            </span>
          )}
          {completadas > 0 && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: C.successSoft, color: C.success, fontWeight: 600 }}>
              {completadas} completada{completadas !== 1 ? "s" : ""}
            </span>
          )}
          {alumno.actividades.length === 0 && (
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: C.bgInput, color: C.textDisabled, fontWeight: 600 }}>
              Sin actividades
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
