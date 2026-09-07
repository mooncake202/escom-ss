import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";

/**
 * Se muestra INLINE, dentro de la pantalla de espera de origen, cuando
 * estado_solicitud === "rechazada_definitivamente" — sin importar si el
 * origen fue un rechazo de Coordinador o el vencimiento del plazo de
 * expediente (RN-GR-04). El motivo real siempre viene de motivo_rechazo.
 */
export function SolicitudRechazadaDefinitivamente({ motivoRechazo }) {
  const { C } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
      <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>❌</div>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>
        Solicitud rechazada definitivamente
      </h2>

      <p style={{ margin: "0.75rem 0 1rem", color: C.textMuted }}>
        Lo sentimos, tu solicitud no puede continuar en su estado actual.
      </p>

      <div style={{
        background: C.bgCard, border: `1px solid ${C.borderSubtle}`,
        borderRadius: RADIUS.md, padding: "1rem", marginBottom: "1.5rem", textAlign: "left",
      }}>
        <strong style={{ fontSize: 13 }}>Motivo:</strong>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: C.textSecondary }}>
          {motivoRechazo || "No se especificó un motivo."}
        </p>
      </div>

      <button
        onClick={() => navigate("/alumnoSinAsignar/modificar-solicitud")}
        style={{
          padding: "12px 28px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
          cursor: "pointer", background: GRADIENTS.primary, border: "none",
          color: "#fff", fontFamily: "inherit", boxShadow: SHADOWS.accent,
        }}
      >
        Modificar solicitud y reenviar →
      </button>
    </div>
  );
}
