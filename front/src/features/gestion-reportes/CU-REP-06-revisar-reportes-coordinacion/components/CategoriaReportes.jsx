import { RADIUS } from "@/themes/colors";
import { ReporteCard } from "./ReporteCard";
import { claveReporte } from "../../CU-REP-05-revisar-reportes-profesor/revisionReportes";

// Una categoría colapsable (Pendientes / Aprobados / Rechazados) de la bandeja de coordinación —
// lista plana, sin agrupar por alumno (coordinación ve a todos los alumnos del sistema, agrupar no
// aporta aquí como sí lo hace en la bandeja de UN profesor). El encabezado siempre muestra el
// conteo aunque esté colapsada.
export function CategoriaReportes({ titulo, reportes, abierta, onToggle, seleccionado, onSeleccionar, estaDestacado, busqueda, C }) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", cursor: "pointer", padding: "0 0 0.625rem", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {titulo} ({reportes.length})
        </span>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth={2.5} strokeLinecap="round"
          style={{ transform: abierta ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {abierta && (
        reportes.length === 0 ? (
          <div style={{
            padding: "1rem", borderRadius: RADIUS.lg,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            textAlign: "center", marginBottom: "0.5rem",
          }}>
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
              {busqueda ? `Sin resultados para "${busqueda}".` : `Sin reportes en "${titulo.toLowerCase()}".`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem" }}>
            {reportes.map((r) => (
              <ReporteCard
                key={claveReporte(r)}
                reporte={r}
                activo={seleccionado === claveReporte(r)}
                onSeleccionar={onSeleccionar}
                destacado={estaDestacado(r)}
                C={C}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
