import { useTheme, RADIUS }       from "@/themes/colors";
import { DashboardLayout }         from "@/components/layout/DashboardLayout";
import { IntegranteCard }          from "./components/IntegranteCard";
import { useContactoEquipo }       from "./hooks/useContactoEquipo";

export default function ContactoEquipo() {
  const { C } = useTheme();
  const { proyecto, integrantes, alumnoSesionId } = useContactoEquipo();

  return (
    <DashboardLayout
      titulo="Contacto del equipo"
      subtitulo="CU-ADM-03 · Alumno"
      rol="alumno"
      usuario={integrantes.find(i => i.id === alumnoSesionId)?.nombre ?? "Alumno"}
      enProyecto={true}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>

        {/* Encabezado del proyecto */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "12px 16px", marginBottom: "1.25rem",
          display: "flex", alignItems: "center", gap: "0.875rem",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: RADIUS.md,
            background: C.accentSoft, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke={C.accentText} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 7a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
              {proyecto.nombre}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
              {proyecto.descripcion}
            </p>
          </div>
        </div>

        {/* Contador */}
        <p style={{ margin: "0 0 0.875rem", fontSize: 12, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {integrantes.length} integrante{integrantes.length !== 1 ? "s" : ""}
        </p>

        {/* Tarjetas de integrantes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {integrantes.map(integrante => (
            <IntegranteCard
              key={integrante.id}
              integrante={integrante}
              esTuPerfil={integrante.id === alumnoSesionId}
              C={C}
            />
          ))}
        </div>

        {/* Nota al pie */}
        <p style={{ margin: "1.25rem 0 0", fontSize: 11, color: C.textDisabled }}>
          Solo se muestran los datos de contacto que cada integrante ha habilitado en su perfil.
        </p>

      </div>
    </DashboardLayout>
  );
}