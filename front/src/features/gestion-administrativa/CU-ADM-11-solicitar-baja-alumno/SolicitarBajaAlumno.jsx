import { useTheme, RADIUS }           from "@/themes/colors";
import { DashboardLayout }             from "@/components/layout/DashboardLayout";
import { AlumnoSelectorCard }          from "./components/AlumnoSelectorCards";
import { BajaForm }                    from "./components/BajaForm";
import { useBajaAlumnoProfesor }       from "./hooks/useSolicitarBajaAlumno";

export default function BajaAlumnoProfesor() {
  const { C } = useTheme();
  const {
    profesor, alumnos, totalAlumnos, alumnoSeleccionado, motivo, errores, enviado,
    busqueda, setBusqueda,
    seleccionarAlumno, handleMotivoChange,
    handleSubmit, handleNuevaSolicitud,
  } = useBajaAlumnoProfesor();

  return (
    <DashboardLayout
      titulo="Solicitar baja del alumno"
      subtitulo="CU-ADM-11 · Profesor"
      rol="profesor"
      usuario={profesor.nombre}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>

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

        {/* ── Confirmación de envío ── */}
        {enviado && alumnoSeleccionado && (
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.success}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: C.successSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
                stroke={C.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
              Solicitud enviada
            </h3>
            <p style={{ margin: "0 0 0.25rem", fontSize: 14, color: C.textMuted }}>
              La solicitud de baja de <strong>{alumnoSeleccionado.nombre}</strong> fue registrada con estado:
            </p>
            <span style={{
              display: "inline-block", margin: "0.5rem 0 1.25rem",
              padding: "4px 14px", borderRadius: RADIUS.full,
              background: C.warningSoft, color: C.warning, fontSize: 13, fontWeight: 700,
            }}>
              Pendiente de procesamiento
            </span>
            <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
              Coordinación revisará la solicitud y decidirá si las horas acumuladas
              del alumno son contabilizadas. El alumno será notificado del resultado.
            </p>
            <button
              onClick={handleNuevaSolicitud}
              style={{
                padding: "10px 28px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Nueva solicitud
            </button>
          </div>
        )}

        {/* ── Layout principal: lista + formulario ── */}
        {totalAlumnos > 0 && !enviado && (
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
