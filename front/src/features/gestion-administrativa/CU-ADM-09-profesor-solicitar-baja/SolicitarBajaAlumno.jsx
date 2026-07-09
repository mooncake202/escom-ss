import { useTheme, RADIUS }           from "@/themes/colors";
import { DashboardLayout }             from "@/components/layout/DashboardLayout";
import { AlumnoSelectorCard }          from "./components/AlumnoSelectorCards";
import { BajaForm }                    from "./components/BajaForm";
import { AmonestacionForm }            from "./components/AmonestacionForm";
import { useBajaAlumnoProfesor }       from "./hooks/useSolicitarBajaAlumno";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export default function BajaAlumnoProfesor() {
  const { C } = useTheme();
  const {
    profesor, alumnos, totalAlumnos,
    alumnosConBaja, alumnosConAmonestacion,
    alumnoSeleccionado, modo, elegirAccion,
    motivo, observaciones, errores,
    busqueda, setBusqueda,
    toast, dismissToast,
    seleccionarAlumno,
    handleMotivoChange, handleSubmitBaja,
    handleObservacionesChange, handleSubmitAmonestacion,
  } = useBajaAlumnoProfesor();

  // Panel derecho según el modo activo
  function renderPanelDerecho() {
    if (!alumnoSeleccionado) {
      return (
        <div style={{
          flex: 1, background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "2rem", textAlign: "center",
        }}>
          <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>👈</p>
          <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
            Selecciona un alumno para registrar la solicitud de baja
            o enviar una amonestación.
          </p>
        </div>
      );
    }

    // ── Flujo Alterno 0.1: selector de acción (alumno con faltas) ──
    if (modo === "selector") {
      return (
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.warning}`, overflow: "hidden",
        }}>
          {/* Header alumno */}
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: `1px solid ${C.borderDefault}`,
            background: C.bgInput,
            display: "flex", alignItems: "center", gap: "1rem",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: C.warningSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700, color: C.warning, flexShrink: 0,
            }}>
              {alumnoSeleccionado.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
                {alumnoSeleccionado.nombre}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                {CARRERA_LABEL[alumnoSeleccionado.carrera] ?? alumnoSeleccionado.carrera} · {alumnoSeleccionado.boleta}
              </p>
            </div>
          </div>

          <div style={{ padding: "1.25rem 1.5rem" }}>
            {/* Alerta de faltas */}
            <div style={{
              marginBottom: "1.5rem", padding: "14px 16px",
              borderRadius: RADIUS.md, background: C.warningSoft,
              border: `1px solid ${C.warning}`,
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={C.warning} strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.warning }}>
                  Faltas acumuladas detectadas
                </p>
                <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                  Este alumno tiene <strong style={{ color: C.warning }}>{alumnoSeleccionado.faltasEfectivas} faltas acumuladas</strong>{" "}
                  ({alumnoSeleccionado.faltasConsEfectivas} consecutivas).
                  Elige la acción a tomar:
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              <button
                onClick={() => elegirAccion("baja")}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: RADIUS.md,
                  background: "transparent", border: `1px solid ${C.danger}`,
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: RADIUS.md, flexShrink: 0,
                  background: "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke={C.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.danger }}>
                    Solicitar baja del alumno
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
                    Enviar solicitud formal a coordinación para dar de baja al alumno.
                  </p>
                </div>
              </button>

              <button
                onClick={() => elegirAccion("amonestacion")}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: RADIUS.md,
                  background: "transparent", border: "1px solid rgba(139,92,246,0.5)",
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(139,92,246,0.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: RADIUS.md, flexShrink: 0,
                  background: "rgba(139,92,246,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke="#a78bfa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                    Enviar amonestación
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
                    Notificar al alumno y reiniciar sus contadores de faltas.
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={() => seleccionarAlumno(null)}
              style={{
                width: "100%", padding: "9px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      );
    }

    // ── Flujo A: solicitar baja ──────────────────────────────────
    if (modo === "baja") {
      return (
        <BajaForm
          alumno={alumnoSeleccionado}
          motivo={motivo}
          errores={errores}
          onMotivoChange={handleMotivoChange}
          onSubmit={handleSubmitBaja}
          onCancelar={() => seleccionarAlumno(null)}
          C={C}
        />
      );
    }

    // ── Flujo B: amonestación ────────────────────────────────────
    if (modo === "amonestacion") {
      return (
        <AmonestacionForm
          alumno={alumnoSeleccionado}
          observaciones={observaciones}
          errores={errores}
          onObservacionesChange={handleObservacionesChange}
          onSubmit={handleSubmitAmonestacion}
          onCancelar={() => elegirAccion("selector")}
          C={C}
        />
      );
    }

    return null;
  }

  return (
    <DashboardLayout
      titulo="Solicitar baja de alumno"
      subtitulo="CU-ADM-09 · Profesor"
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

        {/* ── Layout principal: lista + panel ── */}
        {totalAlumnos > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}>
            {/* Columna izquierda — lista */}
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
                    tieneAmonestacion={alumnosConAmonestacion.has(a.id)}
                    onSeleccionar={seleccionarAlumno}
                    C={C}
                  />
                ))}
              </div>
            </div>

            {/* Columna derecha — panel dinámico */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {renderPanelDerecho()}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
