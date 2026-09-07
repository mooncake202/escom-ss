import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { iniciarModificarSolicitud } from "@/services/estadoSolicitudService";

function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

/**
 * Se muestra INLINE, dentro de la pantalla de espera de origen, cuando
 * estado_solicitud === "rechazada_definitivamente" — sin importar si el
 * origen fue un rechazo de Coordinador o el vencimiento del plazo de
 * expediente (RN-GR-04). El motivo real siempre viene de motivo_rechazo.
 *
 * RN-GR-36: el botón primero transiciona la solicitud en el backend
 * (rechazada_definitivamente -> modificar_reenviar, limpiando oferta/
 * motivación/rechazo) y SOLO ENTONCES navega a CU-GR-13.
 */
export function SolicitudRechazadaDefinitivamente({ motivoRechazo }) {
  const { C } = useTheme();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleModificar = async () => {
    setEnviando(true);
    setError("");
    try {
      const resultado = await iniciarModificarSolicitud();
      // Sin esto, RutaProtegida rebota de vuelta a esta misma pantalla.
      actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: "rechazada_definitivamente" });
      navigate("/alumnoSinAsignar/modificar-solicitud");
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

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

      {error && (
        <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{error}</p>
      )}

      <button
        onClick={handleModificar}
        disabled={enviando}
        style={{
          padding: "12px 28px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
          cursor: enviando ? "wait" : "pointer",
          background: enviando ? C.borderDefault : GRADIENTS.primary,
          border: "none", color: "#fff", fontFamily: "inherit",
          boxShadow: enviando ? "none" : SHADOWS.accent,
        }}
      >
        {enviando ? "Procesando..." : "Modificar solicitud y reenviar →"}
      </button>
    </div>
  );
}