import { RADIUS } from "@/themes/colors";
import { EstatusBadge, ESTADO_MAP } from "./EstatusBadge";

export function ReporteCard({ reporte, activo, onSeleccionar, esPendiente, C }) {
  const s = ESTADO_MAP[reporte.estado] ?? ESTADO_MAP.pendiente_revision;

  return (
    <button
      onClick={() => onSeleccionar(activo ? null : reporte.id)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: C.bgCard,
        border: `1px solid ${activo ? s.color(C) : C.borderDefault}`,
        borderLeft: `3px solid ${s.color(C)}`,
        borderRadius: RADIUS.lg, padding: "0.875rem 1rem",
        fontFamily: "inherit", transition: "border-color 0.15s",
      }}
    >
      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
        {reporte.alumno}
      </p>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textMuted }}>
        {reporte.periodo}
      </p>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <EstatusBadge estado={reporte.estado} C={C} />
        {esPendiente && (
          <span style={{ fontSize: 11, color: C.textDisabled }}>{reporte.fechaEnvio}</span>
        )}
      </div>
    </button>
  );
}