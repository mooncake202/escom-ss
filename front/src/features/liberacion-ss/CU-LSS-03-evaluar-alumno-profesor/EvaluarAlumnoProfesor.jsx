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
    alumnoSeleccionado,
    seleccionarAlumno,
    estado,
    guardar,
    firmar,
    marcarValidadoSISS,
  } = useEvaluarAlumnoProfesor();

  return (
    <DashboardLayout
      titulo="Evaluación de desempeño"
      subtitulo="CU-03 Evaluar alumno profesor"
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

              {/* ALERTA: requiere validación SISS */}
              {estado.requiereValidacion && (
                <div style={{
                  marginBottom: "1.5rem",
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
                    Este alumno solicitó que valides sus reportes en la plataforma SISS antes de continuar con la evaluación.
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
                      marginBottom: "0.75rem",
                      textDecoration: "none",
                    }}
                  >
                    Ir a la plataforma SISS →
                  </a>

                  <div style={{
                    padding: "10px 12px",
                    borderRadius: RADIUS.md,
                    border: `1px solid ${estado.validadoSISS ? "rgba(21,128,61,0.3)" : C.borderDefault}`,
                    background: estado.validadoSISS ? "rgba(21,128,61,0.06)" : C.bgInput,
                    transition: "all 0.15s",
                  }}>
                    <label style={{ display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={estado.validadoSISS}
                        onChange={marcarValidadoSISS}
                        style={{ marginTop: 2, accentColor: "#15803d" }}
                      />
                      <span style={{ fontSize: 13, color: estado.validadoSISS ? "#15803d" : C.textPrimary, lineHeight: 1.4 }}>
                        Confirmo que los reportes del alumno han sido validados en SISS
                      </span>
                    </label>
                    
                  </div>

                </div>
                

              )}

              {/* FORMULARIO DE EVALUACIÓN */}
              <FormEvaluacion
                estado={estado}
                onGuardar={guardar}
              />

              {/* PANEL DE FIRMA */}
              <FirmaPanel
                tipo="profesor"
                estado={{
                  ...estado,
                  requiereValidacion: estado.requiereValidacion && !estado.validadoSISS,
                }}
                onFirmar={firmar}
              />

            </>
          )}
        </div>

      </div>
      </div>
      
    </DashboardLayout>
  );
}