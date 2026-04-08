import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";

export function FirmaPanel({ tipo, estado, onFirmar }) {
  const { C } = useTheme();

  const bloqueado =
  (tipo === "coordinacion" && !estado.firmadoProfesor) ||
  (tipo === "profesor" && estado.requiereValidacion); // 🔥 NUEVO

  const yaFirmado = tipo === "profesor" ? estado.firmadoProfesor : estado.firmadoCoordinacion;
  const etiqueta = tipo === "profesor" ? "del profesor" : "de coordinación";

  return (
    <div style={{
  marginTop: "2rem",
  padding: "1.5rem",
  borderRadius: 12,
  border: `1px solid ${C.borderSubtle}`,
  background: C.bgCard,
}}>
  
  <p style={{
    margin: "0 0 0.75rem",
    fontSize: 12,
    fontWeight: 700,
    color: C.accentText,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  }}>
    Firma del profesor
  </p>

  <p style={{
    margin: "0 0 1.25rem",
    fontSize: 13,
    color: C.textMuted,
  }}>
    Al firmar, confirmas que la evaluación es correcta y no podrá ser modificada.
  </p>

  <button
    disabled={bloqueado}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      background: GRADIENTS.primary,
      border: "none",
      color: "#fff",
      boxShadow: SHADOWS.accent,
    }}
  >
    Firmar evaluación →
  </button>
</div>
  );
}