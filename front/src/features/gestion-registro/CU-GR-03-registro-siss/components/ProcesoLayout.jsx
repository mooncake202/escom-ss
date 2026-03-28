import { useTheme, GRADIENTS } from "@/themes/colors";
import { ProcesoSidebar } from "./ProcesoSidebar";

export function ProcesoLayout({ pasoActual = 2, usuario = "Alumno", children }) {
  const { C } = useTheme();

  const iniciales = usuario.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: C.textSecondary }}>{usuario}</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: GRADIENTS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
              {iniciales}
            </div>
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
