import { RADIUS } from "@/themes/colors";
import { EstatusBadge } from "./EstatusBadge";
import { estadoDe } from "../validacionReportes";
import { claveReporte, etiquetaReporte } from "../../CU-REP-05-revisar-reportes-profesor/revisionReportes";

export function ReporteCard({ reporte, activo, onSeleccionar, destacado, C }) {
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
      <p style={{ margin: "0 0 2px", fontSize: 12, color: C.textMuted }}>
        {etiquetaReporte(reporte)}
      </p>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textDisabled }}>
        {reporte.profesor?.nombreCompleto ?? "Profesor no disponible"}
      </p>
      <EstatusBadge estado={reporte.estadoReporte} C={C} />
    </button>
  );
}
