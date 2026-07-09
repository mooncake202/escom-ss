import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReporteItem } from "./components/ReporteItem";
import { useHistorialReportes } from "./hooks/useHistorialReportes";

export default function HistorialReportes() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { alumno, tieneHistorial, reportes, expandido, toggleExpandir } = useHistorialReportes();

  // ── Estado vacío ──────────────────────────────────────────
  if (!tieneHistorial) {
    return (
      <DashboardLayout titulo="Mis reportes" subtitulo="CU-REP-03 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
            <button
              onClick={() => navigate("/alumno/reportes/generar")}
              style={{
                padding: "9px 18px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              + Generar nuevo reporte
            </button>
          </div>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.borderDefault}`,
            padding: "3rem 2rem", textAlign: "center",
          }}>
            <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📄</p>
            <p style={{ margin: "0 0 0.25rem", fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
              Sin reportes registrados
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              Genera tu primer reporte mensual de actividades.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Mis reportes" subtitulo="CU-REP-03 · Alumno" rol="alumno" usuario={alumno.nombre}>
      <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>

        {/* Encabezado con acción */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            {reportes.length} reporte{reportes.length !== 1 ? "s" : ""} 
          </p>
          <button
            onClick={() => navigate("/alumno/reportes/generar")}
            style={{
              padding: "9px 18px", borderRadius: RADIUS.md,
              background: C.accent, border: "none", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            + Generar nuevo reporte
          </button>
        </div>

        {/* Lista de reportes — accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {reportes.map((r) => (
            <ReporteItem
              key={r.id}
              reporte={r}
              abierto={expandido === r.id}
              onToggle={() => toggleExpandir(r.id)}
              onVerSeguimiento={() => navigate("/alumno/reportes/estatus", { state: { reporteId: r.id, estado: r.estado } })}
              onEditar={() => navigate("/alumno/reportes/modificar")}
              onDescargar={() => alert(`Descargando: ${r.titulo}`)}
              C={C}
            />
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
