import { useTheme, RADIUS }           from "@/themes/colors";
import { DashboardLayout }             from "@/components/layout/DashboardLayout";
import { AlumnoSelectorCard }          from "./components/AlumnoSelectorCards";
import { BajaForm }                    from "./components/BajaForm";
import { useBajaAlumnoProfesor }       from "./hooks/useSolicitarBajaAlumno";

export default function BajaAlumnoProfesor() {
  const { C } = useTheme();
  const {
    profesor, alumnos, totalAlumnos, alumnosConBaja,
    alumnoSeleccionado, motivo, errores,
    busqueda, setBusqueda,
    toast, dismissToast,
    seleccionarAlumno, handleMotivoChange, handleSubmit,
  } = useBajaAlumnoProfesor();

  return (
    <DashboardLayout
      titulo="Solicitar baja del alumno"
      subtitulo="CU-ADM-11 · Profesor"
      rol="profesor"
      usuario={profesor.nombre}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>

        {/* ── Toast ── */}
        {toast && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "1rem", marginBottom: "1.25rem", padding: "12px 16px",
            borderRadius: RADIUS.md, background: "rgba(34,197,94,0.1)",
            border: "1px solid #22c55e",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                stroke="#22c55e" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 500 }}>{toast}</span>
            </div>
            <button onClick={dismissToast} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#22c55e", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0,
            }}>✕</button>
          </div>
        )}

        {/* ── Empty state: sin alumnos activos ── */}
        {totalAlumnos === 0 && (
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`,
            padding: "4rem 2rem", textAlign: "center",
          }}>
            <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>👨‍🎓</p>
            <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
              Sin alumnos activos
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              No tienes alumnos activos asignados para solicitar una baja.
            </p>
          </div>
        )}

        {/* ── Layout principal: lista + formulario ── */}
        {totalAlumnos > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "1.5rem",
            alignItems: "stretch",
          }}>
            {/* Columna izquierda — lista de alumnos */}
            <div>
              <p style={{
                margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700,
                color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                Mis alumnos ({alumnos.length})
              </p>
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o boleta..."
                style={{
                  width: "100%", padding: "8px 12px", marginBottom: "0.75rem",
                  boxSizing: "border-box", background: C.bgInput,
                  border: `1px solid ${C.borderDefault}`, borderRadius: 8,
                  color: C.textPrimary, fontSize: 13, outline: "none", fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {alumnos.length === 0 && (
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted, textAlign: "center", padding: "1.5rem 0" }}>
                    Sin coincidencias para "{busqueda}"
                  </p>
                )}
                {alumnos.map(a => (
                  <AlumnoSelectorCard
                    key={a.id}
                    alumno={a}
                    seleccionado={alumnoSeleccionado?.id === a.id}
                    tieneBaja={alumnosConBaja.has(a.id)}
                    onSeleccionar={seleccionarAlumno}
                    C={C}
                  />
                ))}
              </div>
            </div>

            {/* Columna derecha — formulario o placeholder */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {!alumnoSeleccionado ? (
                <div style={{
                  flex: 1,
                  background: C.bgCard, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.borderDefault}`,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: "2rem", textAlign: "center",
                }}>
                  <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>👈</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
                    Selecciona un alumno para registrar la solicitud de baja.
                  </p>
                </div>
              ) : (
                <BajaForm
                  alumno={alumnoSeleccionado}
                  motivo={motivo}
                  errores={errores}
                  onMotivoChange={handleMotivoChange}
                  onSubmit={handleSubmit}
                  onCancelar={() => seleccionarAlumno(null)}
                  C={C}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
