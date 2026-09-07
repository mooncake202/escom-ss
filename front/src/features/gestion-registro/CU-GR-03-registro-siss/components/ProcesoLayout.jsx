import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS } from "@/themes/colors";
import { ProcesoSidebar } from "./ProcesoSidebar";

export function ProcesoLayout({ pasoActual = 2, usuario = "Alumno", children }) {
  const { C } = useTheme();
  const navigate = useNavigate();

  const iniciales = usuario.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div style={{
      display: "flex", width: "100vw", height: "100vh", overflow: "hidden",
      background: C.bgPage,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar de pasos */}
      <ProcesoSidebar pasoActual={pasoActual} />

      {/* Columna derecha */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <header style={{
          height: 56, flexShrink: 0,
          background: C.bgCard, borderBottom: `1px solid ${C.navBorder}`,
          display: "flex", alignItems: "center",
          padding: "0 1.5rem", justifyContent: "space-between",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            Paso <span style={{ color: C.textPrimary, fontWeight: 600 }}>{pasoActual}</span> de 5
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 13, color: C.textSecondary }}>{usuario}</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: GRADIENTS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
              {iniciales}
            </div>
            <button
              onClick={cerrarSesion}
              title="Cerrar sesión"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: `1px solid ${C.borderDefault}`,
                borderRadius: 8, padding: "6px 12px",
                color: C.textMuted, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Salir
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main style={{ flex: 1, overflowY: "auto", padding: "2.5rem 3rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}