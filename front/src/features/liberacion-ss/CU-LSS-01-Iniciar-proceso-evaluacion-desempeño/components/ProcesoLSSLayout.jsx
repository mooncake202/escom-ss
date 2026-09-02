import { useTheme } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProcesoSidebarLSS } from "./ProcesoSidebarLSS";

const PASOS = [
  { id: 1, label: "Requisitos" },
  { id: 2, label: "Evaluación de desempeño" },
  { id: 3, label: "Carta término" },
  { id: 4, label: "Integración Expediente" },
  { id: 5, label: "Revisión Expediente" },
  { id: 6, label: "Constancia de Término" },

];

export function ProcesoLSSLayout({
  pasoActual = 1,
  titulo,
  subtitulo,
  rol,
  usuario,
  children
}) {
  const { C } = useTheme();

  return (
    <DashboardLayout
      titulo={titulo}
      subtitulo={subtitulo}
      rol={rol}
      usuario={usuario}
    >
      {/* CONTENEDOR PRINCIPAL */}
      <div style={{ display: "flex", height: "100%" }}>

        {/* SIDEBAR PROCESO */}
        <ProcesoSidebarLSS pasoActual={pasoActual} pasosCustom={PASOS} />

        {/* CONTENIDO */}
        <div style={{
          flex: 1,
          display: "flex",
          justifyContent: "center"
        }}>
          <div style={{
            width: "95%",
            maxWidth: 1100
          }}>
            {children}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}