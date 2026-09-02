import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { useFirmarEvaluacionCoordinacion } from "./hooks/useFirmarEvaluacionCoordinacion";
import { ListaAlumnos } from "./components/ListaAlumnos";
import { VistaCoordinacion } from "./components/VistaCoordinacion";

export default function FirmarEvaluacionCoordinacion() {
  const { C } = useTheme();

  const {
    alumnos,
    alumnoSeleccionado,
    seleccionarAlumno,
    estado,
    firmar,
    rechazar,
  } = useFirmarEvaluacionCoordinacion();

  return (
    <DashboardLayout
      titulo="Revisión y firma de evaluación"
      subtitulo="Vista de coordinación"
      rol="coordinacion"
      usuario="Coordinación"
    >
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>

        <ListaAlumnos
          alumnos={alumnos}
          seleccionado={alumnoSeleccionado}
          onSeleccionar={seleccionarAlumno}
        />

        <div style={{ 
        flex: 1,
        display: "flex",
        justifyContent: "center"
        }}>
          <div style={{
              width: "100%",
              maxWidth: 680
          }}>

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
                Elige un alumno de la lista para revisar y firmar su evaluación.
              </p>
            </div>
          )}

          {alumnoSeleccionado && (
            <>
              {/* HEADER */}
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
                    Profesor: {alumnoSeleccionado.profesor}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Proyecto: {alumnoSeleccionado.proyecto}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Fecha de envío: {alumnoSeleccionado.fechaEnvío}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                    background: estado.firmadoProfesor ? "rgba(21,128,61,0.10)" : "rgba(234,179,8,0.10)",
                    color: estado.firmadoProfesor ? "#15803d" : "#b45309",
                    border: `1px solid ${estado.firmadoProfesor ? "rgba(21,128,61,0.25)" : "rgba(234,179,8,0.25)"}`,
                  }}>
                    {estado.firmadoProfesor ? "✔ Profesor firmó" : "⏳ Esperando profesor"}
                  </span>

                  {estado.firmadoCoordinacion && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                      background: "rgba(21,128,61,0.10)", color: "#15803d",
                      border: "1px solid rgba(21,128,61,0.25)",
                    }}>
                      ✔ Coordinación firmó
                    </span>
                  )}

                  {estado.rechazado && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                      background: "rgba(185,28,28,0.10)", color: "#b91c1c",
                      border: "1px solid rgba(185,28,28,0.25)",
                    }}>
                      ✖ Rechazada
                    </span>
                  )}
                </div>
              </div>

              <VistaCoordinacion
                estado={estado}
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