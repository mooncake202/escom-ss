import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { apiFetch } from "@/services/apiClient";

/**
 * Se muestra "sobre" cualquier pantalla (mismo patrón que el aviso de
 * sesión expirada) cuando el alumno tiene pendiente confirmar que ya es
 * Alumno Asignado — sin importar si llegó aquí sin recargar (todavía con
 * su token viejo de alumno_sin_asignar) o volviendo a iniciar sesión
 * (ya con token de alumno_asignado). El backend resuelve ambos casos.
 */
export function ModalBienvenidaAlumnoAsignado({ mensaje, onConfirmado }) {
  const { C } = useTheme();
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmar = async () => {
    setEnviando(true);
    setError("");
    try {
      const resultado = await apiFetch("/registro/confirmar-bienvenida", { method: "POST" });
      if (resultado.token) {
        localStorage.setItem("token", resultado.token);
        const actual = JSON.parse(localStorage.getItem("usuario") || "null");
        if (actual) localStorage.setItem("usuario", JSON.stringify({ ...actual, rol: "alumno_asignado" }));
      }
      if (onConfirmado) {
        onConfirmado();
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        maxWidth: 440, width: "90%", background: C.bgCard, borderRadius: RADIUS.lg,
        boxShadow: SHADOWS.xl, padding: "2rem", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>🎓</div>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: 20, fontWeight: 700, color: C.success }}>
          ¡Ya eres Alumno Asignado!
        </h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>
          {mensaje}
        </p>

        {error && (
          <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{error}</p>
        )}

        <button
          onClick={handleConfirmar}
          disabled={enviando}
          style={{
            padding: "12px 32px", borderRadius: RADIUS.md,
            fontSize: 14, fontWeight: 600, cursor: enviando ? "wait" : "pointer",
            background: enviando ? C.borderDefault : GRADIENTS.primary,
            border: "none", color: "#fff", fontFamily: "inherit", boxShadow: enviando ? "none" : SHADOWS.accent,
          }}
        >
          {enviando ? "Procesando..." : "Entendido"}
        </button>
      </div>
    </div>
  );
}
