import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { useEvaluarAlumnoProfesor } from "./hooks/useEvaluarAlumnoProfesor";
import { ListaAlumnos } from "./components/ListaAlumnos";
import { FormEvaluacion } from "./components/FormEvaluacion";
import { FirmaPanel } from "./components/FirmaPanel";

export default function EvaluarAlumnoProfesor() {
  const { C } = useTheme();

  const {
    alumnos,
    cargando,
    error,
    accionEnCurso,
    alumnoSeleccionado,
    seleccionarAlumno,
    estado,
    guardar,
    firmar,
    rechazar,
    marcarReportesSissConfirmados,
  } = useEvaluarAlumnoProfesor();

  return (
    <DashboardLayout
      titulo="Evaluación de desempeño"
      
      rol="profesor"
      usuario="Profesor"
    >
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>

        {/* SIDEBAR - Lista de alumnos */}
        <ListaAlumnos
          alumnos={alumnos}
          seleccionado={alumnoSeleccionado}
          onSeleccionar={seleccionarAlumno}
        />

        {/* CONTENIDO PRINCIPAL */}
        <div style={{ 
        flex: 1,
        display: "flex",
        justifyContent: "center"
        }}>
        <div style={{
            width: "100%",
            maxWidth: 680
        }}>

          {/* Estado vacío */}
            {!alumnoSeleccionado && (
            <div style={{
                display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 300,
              background: C.bgCard,
              borderRadius: RADIUS.lg,
              border: `1px dashed ${C.borderDefault}`,
              padding: "3rem",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 32, marginBottom: "1rem" }}>👈</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: "0.35rem" }}>
                Selecciona un alumno
              </p>
              <p style={{ fontSize: 13, color: C.textMuted }}>
                Elige un alumno de la lista para ver y completar su evaluación.
              </p>
            </div>
          )}

          {alumnoSeleccionado && (
            <>

              {/* HEADER del alumno seleccionado */}
              <div style={{
                background: C.bgCard,
                borderRadius: RADIUS.lg,
                border: `1px solid ${C.borderSubtle}`,
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <p style={{
                  margin: "0 0 0.35rem",
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.accentText,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Solicitud recibida
                </p>
                  <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600, color: C.textPrimary }}>
                    {alumnoSeleccionado.nombre}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Proyecto: {alumnoSeleccionado.proyecto}
                  </p>

                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Fecha de envío: {alumnoSeleccionado.fechaEnvío}
                  </p>
                </div>
                {estado.firmadoProfesor && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "rgba(21,128,61,0.10)",
                    color: "#15803d",
                    border: "1px solid rgba(21,128,61,0.25)",
                  }}>
                    ✔ Firmada
                  </span>
                )}
              </div>

              {/* Texto informativo (solo lectura): qué eligió el alumno en
                  CU-LSS-01 — el profesor necesita verlo antes de decidir. */}
              <div style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: RADIUS.md,
                border: `1px solid ${C.borderSubtle}`,
                background: C.bgInput,
                fontSize: 13,
                color: C.textMuted,
              }}>
                {alumnoSeleccionado.reportesValidadosSissAlumno
                  ? "El alumno indicó que sus reportes ya están validados en SISS."
                  : "El alumno solicitó que tú valides sus reportes en SISS."}
              </div>

              {/* ALERTA: el alumno pidió que el profesor valide sus reportes */}
              {estado.requiereValidacion && (
                <div style={{
                  marginBottom: "1rem",
                  padding: "1rem 1.25rem",
                  borderRadius: RADIUS.lg,
                  border: "1px solid rgba(234,179,8,0.35)",
                  background: "rgba(234,179,8,0.07)",
                }}>
                  <p style={{
                    margin: "0 0 0.35rem",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#b45309",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}>
                    Validación SISS requerida
                  </p>
                  <p style={{
                    margin: "0 0 0.75rem",
                    fontSize: 13,
                    color: C.textMuted,
                    lineHeight: 1.5,
                  }}>
                    Revisa la plataforma SISS antes de continuar con la evaluación.
                  </p>

                  <a
                    href="https://serviciosocial.ipn.mx"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#b45309",
                      textDecoration: "none",
                    }}
                  >
                    Ir a la plataforma SISS →
                  </a>
                </div>
              )}

              {/* Confirmación del profesor (RN-LSS-09) — SIEMPRE visible,
                  independiente de si el alumno pidió o no la validación:
                  ambos casos necesitan que el profesor confirme antes de
                  poder firmar. */}
              <div style={{
                marginBottom: "1.5rem",
                padding: "10px 12px",
                borderRadius: RADIUS.md,
                border: `1px solid ${estado.reportesSissConfirmados ? "rgba(21,128,61,0.3)" : C.borderDefault}`,
                background: estado.reportesSissConfirmados ? "rgba(21,128,61,0.06)" : C.bgInput,
                transition: "all 0.15s",
              }}>
                <label style={{ display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start" }}>
                  <input
                    type="checkbox"
                    checked={estado.reportesSissConfirmados}
                    onChange={marcarReportesSissConfirmados}
                    style={{ marginTop: 2, accentColor: "#15803d" }}
                  />
                  <span style={{ fontSize: 13, color: estado.reportesSissConfirmados ? "#15803d" : C.textPrimary, lineHeight: 1.4 }}>
                    Confirmo que los reportes de este alumno están validados en el SISS
                  </span>
                </label>
              </div>

              {/* FORMULARIO DE EVALUACIÓN */}
              <FormEvaluacion
                estado={estado}
                onGuardar={guardar}
              />

              {error && (
                <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: "1rem" }}>{error}</p>
              )}

              {/* PANEL DE FIRMA */}
              <FirmaPanel
                tipo="profesor"
                estado={{
                  ...estado,
                  requiereValidacion: !estado.reportesSissConfirmados,
                }}
                onFirmar={firmar}
                onRechazar={rechazar}
              />

            </>
          )}
        </div>

      </div>
      </div>
      
    </DashboardLayout>
  );
}