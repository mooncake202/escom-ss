import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { useEsperaEntregaCarta } from "./hooks/useEsperaEntregaCarta";

const MOCK_ALUMNO = { nombre: "García López Juan Carlos" };

export default function EsperaEntregaCartaCompromiso() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const { entregaConfirmada } = useEsperaEntregaCarta();

  // Estado: Coordinación ya confirmó la entrega presencial
  if (entregaConfirmada) {
    return (
      <ProcesoLayout pasoActual={5} usuario={MOCK_ALUMNO.nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>✅</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
            Entrega confirmada por Coordinación
          </h2>
          <p style={{ margin: "0 0 0.5rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Coordinación registró la recepción de tu carta compromiso. Ya puedes continuar con la carga de tu expediente.
          </p>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
            Accede al siguiente paso para subir tu documentación.
          </p>
          <button
            onClick={() => navigate("/alumnoSinAsignar/expediente")}
            style={{
              padding: "12px 32px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              background: GRADIENTS.primary, border: "none",
              color: "#fff", fontFamily: "inherit", boxShadow: SHADOWS.accent,
            }}
          >
            Continuar con mi expediente →
          </button>
        </div>
      </ProcesoLayout>
    );
  }

  // Estado: esperando que Coordinación confirme la entrega
  return (
    <ProcesoLayout pasoActual={4} usuario={MOCK_ALUMNO.nombre}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

        {/* Ícono de espera */}
        <div style={{ fontSize: 52, marginBottom: "1rem" }}>🕐</div>

        {/* Título */}
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Esperando confirmación de entrega
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Hemos notificado a Coordinación que estás próximo a entregar tu carta compromiso presencialmente. Una vez que la entregues y Coordinación registre la recepción, podrás continuar con la carga de tu expediente.
        </p>

        {/* Tarjeta de estado */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          padding: "1.5rem", marginBottom: "1.5rem",
          textAlign: "left",
        }}>
          <p style={{
            margin: "0 0 1.25rem", fontSize: 12, fontWeight: 700,
            color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Estado actual
          </p>

          {/* Paso completado */}
          <div style={{ display: "flex", gap: 12, marginBottom: "1rem", alignItems: "flex-start" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: C.successSoft, border: `1px solid ${C.success}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
            }}>
              ✓
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, paddingTop: 2 }}>
              Confirmaste que descargaste, imprimiste y firmaste tu carta compromiso.
            </p>
          </div>

          {/* Paso pendiente */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: C.accentSoft, border: `1px solid ${C.accent}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: C.accentText,
            }}>
              2
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, paddingTop: 2 }}>
              Entrega tu carta firmada presencialmente en las oficinas de Coordinación de ESCOM. Coordinación registrará la recepción en el sistema.
            </p>
          </div>

          {/* Aviso horario */}
          <div style={{
            margin: "1.25rem 0 0", padding: "12px 14px",
            background: C.bgPage, borderRadius: RADIUS.md,
            border: `1px solid ${C.borderSubtle}`,
          }}>
            <p style={{
              margin: "0 0 4px", fontSize: 12, fontWeight: 700,
              color: C.warning ?? "#F59E0B", letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Recuerda
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
              El horario de atención de Coordinación es de lunes a viernes de 10:00 a 18:00 hrs.
            </p>
          </div>
        </div>

        {/* Botón ver estado */}
        <button
          onClick={() => navigate("/alumnoSinAsignar/estado")}
          style={{
            padding: "12px 32px", borderRadius: RADIUS.md,
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: "transparent",
            border: `1px solid ${C.borderDefault}`,
            color: C.textSecondary, fontFamily: "inherit",
          }}
        >
          Ver estado de mi proceso
        </button>

      </div>
    </ProcesoLayout>
  );
}
