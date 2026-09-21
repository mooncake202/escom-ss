import { RADIUS } from "@/themes/colors";
import { EstatusBadge } from "./EstatusBadge";
import { claveReporte, etiquetaReporte, textoFechaCorta, estadoDe } from "../revisionReportes";

export function ReporteCard({ reporte, activo, onSeleccionar, esPendiente, destacado, C }) {
  const s = estadoDe(reporte.estadoReporte);

  return (
    <button
      onClick={() => onSeleccionar(activo ? null : claveReporte(reporte))}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: C.bgCard,
        border: `1px solid ${activo || destacado ? s.color(C) : C.borderDefault}`,
        boxShadow: destacado && !activo ? `0 0 0 2px ${s.color(C)}28` : "none",
        borderRadius: RADIUS.lg, padding: "0.875rem 1rem",
        fontFamily: "inherit", transition: "border-color 0.15s",
      }}
    >
      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
        {reporte.alumno.nombreCompleto}
      </p>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textMuted }}>
        {etiquetaReporte(reporte)}
      </p>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <EstatusBadge estado={reporte.estadoReporte} C={C} />
        {esPendiente && (
          <span style={{ fontSize: 11, color: C.textDisabled }}>{textoFechaCorta(reporte.fechaEnvio)}</span>
        )}
      </div>
    </button>
  );
}