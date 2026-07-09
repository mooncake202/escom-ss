import { RADIUS } from "@/themes/colors";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function AlumnoSelectorCard({
  alumno, seleccionado, tieneBaja, tieneAmonestacion, onSeleccionar, C,
}) {
  const deshabilitado = tieneBaja;
  const tieneFaltas   = alumno.faltasEfectivas > 0;

  return (
    <div
      onClick={() => !deshabilitado && onSeleccionar(alumno)}
      style={{
        padding: "1rem 1.25rem", borderRadius: RADIUS.lg,
        cursor: deshabilitado ? "not-allowed" : "pointer",
        opacity: deshabilitado ? 0.55 : 1,
        background: seleccionado ? C.navItemActive : C.bgCard,
        border: `1px solid ${
          seleccionado ? C.accent
          : tieneFaltas ? C.warning
          : C.borderDefault
        }`,
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: seleccionado ? C.accent : tieneFaltas ? C.warningSoft : C.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
          color: seleccionado ? "#fff" : tieneFaltas ? C.warning : C.accentText,
          flexShrink: 0,
        }}>
          {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {alumno.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
            {CARRERA_LABEL[alumno.carrera] ?? alumno.carrera} · {alumno.boleta}
          </p>
        </div>

        {/* Badges de estado — en orden de prioridad */}
        {tieneBaja && (
          <span style={{
            flexShrink: 0, padding: "2px 8px", borderRadius: RADIUS.full,
            background: C.warningSoft, color: C.warning,
            fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            Baja solicitada
          </span>
        )}
        {!tieneBaja && tieneAmonestacion && (
          <span style={{
            flexShrink: 0, padding: "2px 8px", borderRadius: RADIUS.full,
            background: "rgba(139,92,246,0.12)", color: "#a78bfa",
            border: "1px solid rgba(139,92,246,0.3)",
            fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            Amonestado
          </span>
        )}
        {!tieneBaja && tieneFaltas && (
          <span style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3,
            padding: "2px 8px", borderRadius: RADIUS.full,
            background: C.warningSoft, border: `1px solid ${C.warning}`,
            color: C.warning, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {alumno.faltasEfectivas} faltas
          </span>
        )}
      </div>
    </div>
  );
}
