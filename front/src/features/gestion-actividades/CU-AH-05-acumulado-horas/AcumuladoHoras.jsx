import { useTheme, RADIUS, GRADIENTS } from "@/themes/colors";
import { DashboardLayout }   from "@/components/layout/DashboardLayout";
import { ProgresoCircular, MetricaCards, BarraProgreso } from "./components/ProgresoHoras";
import { useAcumuladoHoras } from "./hooks/useAcumuladoHoras";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

// ── Vista del alumno: solo su propio progreso ────────────────
function VistaAlumno({ propio, C }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>Mi acumulado de horas</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>Seguimiento de tu progreso en el servicio social</p>
      </div>

      {/* Aviso deuda */}
      {propio.horasDeuda > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: RADIUS.md, background: "rgba(245,158,11,0.08)", border: `1px solid #F59E0B`, marginBottom: "1.5rem", display: "flex", gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <p style={{ margin: 0, fontSize: 13, color: "#9A9A9A", lineHeight: 1.5 }}>
            Tienes <strong style={{ color: "#F59E0B" }}>{propio.horasDeuda} horas de deuda</strong>. Puedes recuperarlas registrando jornadas de hasta 6 horas hasta saldar la deuda.
          </p>
        </div>
      )}

      {/* Círculo de progreso centrado */}
      <div style={{ background: C.bgCard, borderRadius: RADIUS.xl, border: `1px solid ${C.borderSubtle}`, padding: "2rem", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
        <ProgresoCircular
          porcentaje={propio.porcentaje}
          horasRealizadas={propio.horasRealizadas}
          horasTotales={propio.horasTotales}
          C={C}
        />
      </div>

      {/* Métricas */}
      <MetricaCards datos={propio} C={C} />

      {/* Barra detallada */}
      <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.25rem 1.5rem", marginTop: "1rem" }}>
        <BarraProgreso datos={propio} C={C} />
      </div>
    </div>
  );
}

// ── Vista del profesor/coordinación: lista de alumnos ────────
function VistaListaAlumnos({ alumnos, alumnoVisto, setAlumnoVisto, C }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "500px 1fr", gap: "1.5rem", alignItems: "start" }}>

      {/* Lista alumnos */}
      <div>
        <p style={{ margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.textDisabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Alumnos ({alumnos.length})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {alumnos.map(a => {
            const activo = alumnoVisto?.id === a.id;
            const color  = a.porcentaje >= 90 ? "#22C55E" : a.porcentaje >= 50 ? "#2E86DE" : "#F59E0B";
            return (
              <div
                key={a.id}
                onClick={() => setAlumnoVisto(a)}
                style={{ padding: "0.875rem 1rem", borderRadius: RADIUS.lg, cursor: "pointer", background: activo ? C.navItemActive : C.bgCard, border: `1px solid ${activo ? C.accent : C.borderDefault}`, transition: "all 0.15s" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: activo ? C.accent : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: activo ? "#fff" : C.accentText, flexShrink: 0 }}>
                    {a.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nombre.split(" ").slice(0, 2).join(" ")}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 3, background: C.borderSubtle, borderRadius: 2 }}>
                        <div style={{ width: `${a.porcentaje}%`, height: "100%", borderRadius: 2, background: color }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>{a.porcentaje}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalle del alumno seleccionado */}
      {alumnoVisto && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{alumnoVisto.nombre}</h2>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>{CARRERA_LABEL[alumnoVisto.carrera]} · Boleta {alumnoVisto.boleta}</p>
          </div>

          <div style={{ background: C.bgCard, borderRadius: RADIUS.xl, border: `1px solid ${C.borderSubtle}`, padding: "1.5rem", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            <ProgresoCircular
              porcentaje={alumnoVisto.porcentaje}
              horasRealizadas={alumnoVisto.horasRealizadas}
              horasTotales={alumnoVisto.horasTotales}
              C={C}
            />
          </div>

          <MetricaCards datos={alumnoVisto} C={C} />

          <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.25rem 1.5rem", marginTop: "1rem" }}>
            <BarraProgreso datos={alumnoVisto} C={C} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function AcumuladoHoras({ rol = "alumno" }) {
  const { C } = useTheme();
  const { propio, alumnos, alumnoVisto, setAlumnoVisto } = useAcumuladoHoras(rol);

  const titulos = {
    alumno:       { titulo: "Mi acumulado de horas",     sub: "CU-AH-05 · Alumno" },
    profesor:     { titulo: "Acumulado de horas",         sub: "CU-AH-05 · Profesor" },
    coordinacion: { titulo: "Acumulado de horas",         sub: "CU-AH-05 · Coordinación" },
  };
  const { titulo, sub } = titulos[rol] ?? titulos.alumno;

  return (
    <DashboardLayout titulo={titulo} subtitulo={sub} rol={rol} usuario={rol === "alumno" ? "García López Juan Carlos" : rol === "profesor" ? "Dr. Torres Vega" : "Coordinación ESCOM"}>
      {rol === "alumno"
        ? <VistaAlumno propio={propio} C={C} />
        : <VistaListaAlumnos alumnos={alumnos} alumnoVisto={alumnoVisto} setAlumnoVisto={setAlumnoVisto} C={C} />
      }
    </DashboardLayout>
  );
}
