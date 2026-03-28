import { useTheme, GRADIENTS } from "@/themes/colors";

const ROL_LABEL = {
  alumno:       "Alumno",
  profesor:     "Profesor",
  coordinacion: "Coordinación",
};

const ROL_COLOR = {
  alumno:       { bg: "rgba(10,102,194,0.12)", color: "#2E86DE" },
  profesor:     { bg: "rgba(34,197,94,0.12)",  color: "#22C55E" },
  coordinacion: { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
};

export function Header({ titulo, subtitulo, rol = "profesor", usuario = "Usuario" }) {
  const { C } = useTheme();
  const rolColor = ROL_COLOR[rol] ?? ROL_COLOR.profesor;

  // Iniciales del usuario
  const iniciales = usuario
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <header style={{
      height: 56, flexShrink: 0,
      background: C.bgCard,
      borderBottom: `1px solid ${C.navBorder}`,
      display: "flex", alignItems: "center",
      padding: "0 1.5rem", gap: "1rem",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* Título de la página */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {titulo}
        </h1>
        {subtitulo && (
          <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {subtitulo}
          </p>
        )}
      </div>

      {/* Badge de rol */}
      <div style={{
        padding: "3px 10px", borderRadius: 20,
        background: rolColor.bg, color: rolColor.color,
        fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        flexShrink: 0,
      }}>
        {ROL_LABEL[rol]}
      </div>

      {/* Avatar usuario */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: GRADIENTS.primary,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#fff",
        flexShrink: 0, cursor: "pointer",
      }}
        title={usuario}
      >
        {iniciales}
      </div>
    </header>
  );
}
