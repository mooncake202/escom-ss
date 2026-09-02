import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "./components/ProcesoLSSLayout";

import { useValidacionRequisitos } from "./hooks/useValidacionRequisitos";

const MOCK_ALUMNO = { nombre: "García López Juan Carlos" };

export default function ValidacionRequisitos() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const { confirmado, solicitarValidacion, error, loading, enviado, toggleConfirmado, toggleSolicitud, confirmar, completo } =
    useValidacionRequisitos();


    // 🔧 PRUEBA — cambia a true/false para simular
const tieneHoras = false;
const tieneReportes = false;

  // ✅ MISMO patrón de éxito que tu ejemplo
  if (enviado) {
    return (
      <ProcesoLSSLayout 
        pasoActual={1} 
        titulo="Liberación de servicio social"
        subtitulo="CU 01 - Inicio de proceso de evaluación de desempeño"
        rol="alumno"
        usuario={MOCK_ALUMNO.nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>📋</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
            Requisitos confirmados
          </h2>
          <p style={{ margin: "0 0 0.5rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Tu solicitud fue enviada correctamente. Tu profesor será notificado para continuar con tu evaluación.
          </p>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
            Podrás consultar el avance de tu proceso desde el estado de tu solicitud.
          </p>

          <button
            onClick={() => navigate("/alumno/seguimiento-evaluacion")}
            style={{
              padding: "12px 32px",
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: GRADIENTS.primary,
              border: "none",
              color: "#fff",
              fontFamily: "inherit",
              boxShadow: SHADOWS.accent,

            }}
          >
            Ver estado de mi evaluacion →
          </button>
        </div>
      </ProcesoLSSLayout>
    );
  }

  return (
    <ProcesoLSSLayout
      pasoActual={1}
      titulo="Liberación de servicio social"
      subtitulo="CU 01 - Inicio de proceso de evaluación de desempeño"
      rol="alumno"
      usuario={MOCK_ALUMNO.nombre}
     >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* TÍTULO (MISMO ESTILO) */}
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Validación de requisitos previos
        </h2>

        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Antes de iniciar tu liberación, verifica que tus reportes estén correctamente validados en el sistema SISS.
          Una vez confirmado, tu profesor podrá realizar tu evaluación de desempeño.
        </p>

        {/* CARD (idéntica a tu patrón) */}
        <div
          style={{
            background: C.bgCard,
            borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderSubtle}`,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              margin: "0 0 1.25rem",
              fontSize: 12,
              fontWeight: 700,
              color: C.accentText,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Estado de tus requisitos
          </p>

          {/* Auto validados */}
          <div style={{
  padding: "12px",
  borderRadius: 10,
  border: `1px solid ${tieneHoras ? C.success : C.danger}`,
  background: tieneHoras ? C.successSoft : C.dangerSoft,
  marginBottom: "1rem",
  fontSize: 13,
  color: tieneHoras ? C.success : C.danger
}}>
  {tieneHoras ? "✅" : "❌"} 480 horas completadas
</div>

<div style={{
  padding: "12px",
  borderRadius: 10,
  border: `1px solid ${tieneReportes ? C.success : C.danger}`,
  background: tieneReportes ? C.successSoft : C.dangerSoft,
  marginBottom: "1.25rem",
  fontSize: 13,
  color: tieneReportes ? C.success : C.danger
}}>
  {tieneReportes ? "✅" : "❌"} Reportes mensuales y global registrados y aprobados
</div>

          {/* Confirmación */}
          <div style={{
            border: `2px dashed ${error ? C.danger : C.borderDefault}`,
            borderRadius: 12,
            padding: "1rem",
            background: C.bgInput,
            marginBottom: "1rem"
          }}>
            <label style={{ display: "flex", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={confirmado}
                onChange={toggleConfirmado}
              />
              <span style={{ fontSize: 13 }}>
                Confirmo que mis reportes han sido validados en la plataforma SISS
              </span>
            </label>
          </div>

          {/* Enlace a registro */}
          <p style={{ margin: "1.25rem 0 0", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            ¿No tienes tus reportes validados en la{" "}
            <a
              href="https://serviciosocial.ipn.mx"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.accentText, fontWeight: 600 }}
            >
              plataforma SISS? 
            </a>
              
          </p>
          <p style={{ margin: "0rem 0 1.25rem", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            
              Marca la casilla de abajo para pedirle al profesor que lo haga.
          </p>


          {/* Solicitud */}
          <div style={{
            border: `2px dashed ${error ? C.danger : C.borderDefault}`,
            borderRadius: 12,
            padding: "1rem",
            background: C.bgInput,
          }}>
            <label style={{ display: "flex", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={solicitarValidacion}
                onChange={toggleSolicitud}
              />
              <span style={{ fontSize: 13 }}>
                Solicito que se validen mis reportes en la plataforma SISS
              </span>
            </label>
          </div>

          {error && (
            <p style={{ marginTop: 6, fontSize: 12, color: C.danger }}>
              {error}
            </p>
          )}

            


           

          
        </div>

        {/* AVISO (mismo patrón visual) */}
        <div
          style={{
            padding: "12px 14px",
            borderRadius: RADIUS.md,
            marginBottom: "1.5rem",
            background: "rgba(59,130,246,0.08)",
            border: `1px solid ${C.borderSubtle}`,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            Este paso confirma que tus reportes han sido validados correctamente. Si detectas algún problema,
            deberás resolverlo en el SISS antes de continuar con tu proceso de liberación.
          </p>
        </div>

        {/* BOTÓN (idéntico comportamiento) */}
        <button
          onClick={confirmar}
          disabled={!completo || loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 600,
            cursor: !completo || loading ? "not-allowed" : "pointer",
            background: !completo || loading ? C.borderDefault : GRADIENTS.primary,
            border: "none",
            color: "#fff",
            fontFamily: "inherit",
            boxShadow: !completo || loading ? "none" : SHADOWS.accent,
            opacity: !completo ? 0.5 : 1,
          }}
        >
          {loading ? "Enviando..." : "Solicitar Reporte de Desempeño →"}
        </button>
      </div>
    </ProcesoLSSLayout>
  );
}