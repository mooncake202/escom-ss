import { RADIUS } from "@/themes/colors";
import { ReporteCard } from "./ReporteCard";
import { claveReporte } from "../revisionReportes";

// Una categoría colapsable (Pendientes / Aprobados / Rechazados), agrupada por alumno dentro. El
// encabezado siempre muestra el conteo aunque esté colapsada — así el profesor ve de un vistazo
// cuántos tiene en cada estado sin tener que abrir las 3.
export function CategoriaReportes({ titulo, total, abierta, onToggle, agrupados, esPendiente, seleccionado, onSeleccionar, estaDestacado, busqueda, C }) {
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
          {titulo} ({total})
        </span>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth={2.5} strokeLinecap="round"
          style={{ transform: abierta ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {abierta && (
        agrupados.length === 0 ? (
          <div style={{
            padding: "1rem", borderRadius: RADIUS.lg,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            textAlign: "center",
          }}>
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
              {busqueda ? `Sin resultados para "${busqueda}".` : `Sin reportes en "${titulo.toLowerCase()}".`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {agrupados.map((grupo) => (
              <div key={grupo.boleta}>
                <p style={{ margin: "0 0 0.375rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {grupo.alumno}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {grupo.reportes.map((r) => (
                    <ReporteCard
                      key={claveReporte(r)} reporte={r}
                      activo={seleccionado === claveReporte(r)}
                      onSeleccionar={onSeleccionar}
                      esPendiente={esPendiente} destacado={estaDestacado(r)} C={C}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
