import { useTheme } from "@/themes/colors";
import { Sidebar } from "./Sidebar";
import { Header }  from "./Header";

/**
 * Uso:
 * <DashboardLayout titulo="Solicitudes pendientes" subtitulo="CU-GR-02" rol="profesor" usuario="Dr. Torres Vega">
 *   <TuPagina />
 * </DashboardLayout>
 */
export function DashboardLayout({ titulo, subtitulo, rol = "profesor", usuario = "Usuario", children }) {
  const { C } = useTheme();

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: C.bgPage,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar izquierdo */}
      <Sidebar rol={rol} />

      {/* Columna derecha: header + contenido */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header fijo arriba */}
        <Header titulo={titulo} subtitulo={subtitulo} rol={rol} usuario={usuario} />

        {/* Área de contenido scrolleable */}
        <main style={{
          flex: 1, overflowY: "auto",
          padding: "1.75rem 2rem",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
