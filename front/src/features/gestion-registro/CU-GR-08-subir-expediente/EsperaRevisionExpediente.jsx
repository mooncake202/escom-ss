import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { useEsperaRevisionExpediente } from "./hooks/useEsperaRevisionExpediente";

const MOCK_ALUMNO = { nombre: "García López Juan Carlos" };

export default function EsperaRevisionExpediente() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const { estado, observacion } = useEsperaRevisionExpediente();

  // ── Aprobado: alumno pasa a ser Alumno Asignado ──────────────────────────
  if (estado === "Expediente aprobado") {
    return (
      <ProcesoLayout pasoActual={6} usuario={MOCK_ALUMNO.nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>🎓</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
            ¡Expediente aprobado!
          </h2>
          <p style={{ margin: "0 0 0.5rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Coordinación validó tu expediente. Ya eres Alumno Asignado y estás registrado formalmente en el programa de servicio social.
          </p>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
            Recibirás los formatos de reportes mensuales por correo. Mientras tanto puedes consultar el estado de tu proceso.
          </p>
          <button
            onClick={() => navigate("/alumnoAsignado/estado")}
            style={{
              padding: "12px 32px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              background: GRADIENTS.primary, border: "none",
              color: "#fff", fontFamily: "inherit", boxShadow: SHADOWS.accent,
            }}
          >
            Ver mi proceso →
          </button>
        </div>
      </ProcesoLayout>
    );
  }

  // ── Rechazado con correcciones ────────────────────────────────────────────
  if (estado === "Expediente con correcciones") {
    return (
      <ProcesoLayout pasoActual={6} usuario={MOCK_ALUMNO.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>

          {/* Notificación de rechazo */}
          <div style={{
            padding: "14px 18px", borderRadius: RADIUS.md,
            background: C.dangerSoft, border: `1px solid ${C.danger}`,
            display: "flex", alignItems: "flex-start", gap: 12,
            marginBottom: "2rem",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.danger }}>
                Tu expediente requiere correcciones
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                Coordinación revisó tu expediente y encontró observaciones. Corrígelo y vuelve a enviarlo antes de la fecha de inicio de tu servicio social.
              </p>
            </div>
          </div>

          {/* Observaciones */}
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderSubtle}`,
            padding: "1.5rem", marginBottom: "1.5rem",
          }}>
            <p style={{
              margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700,
              color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Observaciones de Coordinación
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              {observacion ?? "Sin observaciones registradas."}
            </p>
          </div>

          {/* Botón volver a integrar */}
          <button
            onClick={() => navigate("/alumnoSinAsignar/expediente")}
            style={{
              width: "100%", padding: "12px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              background: GRADIENTS.primary, border: "none",
              color: "#fff", fontFamily: "inherit", boxShadow: SHADOWS.accent,
            }}
          >
            Corregir y volver a enviar →
          </button>

        </div>
      </ProcesoLayout>
    );
  }

  // ── En espera (estado por defecto) ────────────────────────────────────────
  return (
    <ProcesoLayout pasoActual={6} usuario={MOCK_ALUMNO.nombre}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

        <div style={{ fontSize: 52, marginBottom: "1rem" }}>🕐</div>

        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Expediente en revisión
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Tu expediente fue enviado correctamente y está pendiente de revisión por parte de Coordinación. Te notificaremos aquí cuando haya una respuesta.
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
              Expediente integrado y enviado correctamente a Coordinación.
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
              Coordinación revisará tu expediente. Una vez aprobado, pasarás a ser Alumno Asignado y podrás iniciar tu servicio social en la fecha establecida.
            </p>
          </div>

          {/* Aviso fecha límite */}
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
              Tu expediente debe quedar aprobado antes de la fecha de inicio de tu periodo de servicio social. Si Coordinación solicita correcciones, atiéndelas a la brevedad.
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
