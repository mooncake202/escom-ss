import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { DashboardLayout }       from "@/components/layout/DashboardLayout";
import { AlumnoCard }            from "./components/AlumnoCard";
import { ActividadRow }          from "./components/ActividadRow";
import { useAsignarActividades } from "./hooks/useAsignarActividades";

export default function AsignarActividades() {
  const { C } = useTheme();
  const {
    alumnos, alumnoSeleccionado, form, errores, loading, exitoso,
    modoFormulario, setModoForm,
    seleccionarAlumno, handleChange, registrarActividad,
  } = useAsignarActividades();

  return (
    <DashboardLayout
      titulo="Asignar actividades"
      subtitulo="CU-AH-01 · Profesor"
      rol="profesor"
      usuario="Dr. Torres Vega"
    >
      <div style={{ display: "grid", gridTemplateColumns: "500px 1fr", gap: "1.5rem", height: "calc(100vh - 56px - 3.5rem)", minHeight: 0 }}>

        {/* ── Columna izquierda: lista de alumnos ── */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.textDisabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Mis alumnos ({alumnos.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
            {alumnos.map(a => (
              <AlumnoCard
                key={a.id} alumno={a} C={C}
                seleccionado={alumnoSeleccionado?.id === a.id}
                onSeleccionar={seleccionarAlumno}
              />
            ))}
          </div>
        </div>

        {/* ── Columna derecha: detalle + formulario ── */}
        <div style={{ overflowY: "auto", minHeight: 0 }}>
          {!alumnoSeleccionado ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>👈</p>
              <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>Selecciona un alumno para ver sus actividades</p>
            </div>
          ) : (
            <div>
              {/* Header del alumno seleccionado */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{alumnoSeleccionado.nombre}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>{alumnoSeleccionado.correoInst}</p>
                </div>
                <button
                  onClick={() => { setModoForm(true); }}
                  style={{ padding: "9px 18px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600, cursor: "pointer", background: GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: SHADOWS.accent }}
                >
                  + Asignar actividad
                </button>
              </div>

              {/* Toast éxito */}
              {exitoso && (
                <div style={{ marginBottom: "1.25rem", padding: "10px 14px", borderRadius: RADIUS.md, background: C.successSoft, border: `1px solid ${C.success}`, color: C.success, fontSize: 13, fontWeight: 500 }}>
                  ✓ Actividad registrada correctamente. El alumno fue notificado.
                </div>
              )}

              {/* Formulario nueva actividad */}
              {modoFormulario && (
                <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.accent}`, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.accentText, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Nueva actividad
                    </p>
                    <button onClick={() => setModoForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDisabled, fontSize: 18, padding: 2 }}>✕</button>
                  </div>

                  {/* Título — RN-AH-03 */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                      Título *
                    </label>
                    <input
                      name="titulo"
                      value={form.titulo}
                      onChange={handleChange}
                      placeholder="Ej. Desarrollo del módulo de login"
                      style={{ width: "100%", padding: "10px 14px", background: C.bgInput, border: `1px solid ${errores.titulo ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                    {errores.titulo && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.titulo}</p>}
                  </div>

                  {/* Descripción — RN-AH-03 */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                      Descripción *
                    </label>
                    <textarea
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      placeholder="Describe detalladamente lo que el alumno debe realizar..."
                      rows={3}
                      style={{ width: "100%", padding: "10px 14px", background: C.bgInput, border: `1px solid ${errores.descripcion ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }}
                    />
                    {errores.descripcion && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.descripcion}</p>}
                  </div>

                  {/* Entregable — RN-AH-03 opcional */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                      Entregable esperado <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
                    </label>
                    <input
                      name="entregable"
                      value={form.entregable}
                      onChange={handleChange}
                      placeholder="Ej. Documento PDF con el análisis completo"
                      style={{ width: "100%", padding: "10px 14px", background: C.bgInput, border: `1px solid ${C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => setModoForm(false)}
                      style={{ flex: 1, padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: "inherit" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={registrarActividad}
                      disabled={loading}
                      style={{ flex: 2, padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", background: loading ? C.borderDefault : GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: loading ? "none" : SHADOWS.accent }}
                    >
                      {loading ? "Guardando..." : "Registrar actividad"}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de actividades — RN-AH-05 */}
              <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.25rem 1.5rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                  Actividades asignadas
                </p>
                <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textMuted }}>
                  {alumnoSeleccionado.actividades.length === 0
                    ? "Aún no has asignado actividades a este alumno"
                    : `${alumnoSeleccionado.actividades.length} actividad${alumnoSeleccionado.actividades.length !== 1 ? "es" : ""}`
                  }
                </p>

                {alumnoSeleccionado.actividades.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: C.textDisabled, fontSize: 13 }}>
                    El alumno no podrá registrar bitácoras hasta que asignes al menos una actividad.
                  </div>
                ) : (
                  alumnoSeleccionado.actividades.map(act => (
                    <ActividadRow key={act.id} actividad={act} C={C} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
