import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useOfertaIndividual } from "./hooks/useOfertaIndividual";
import { ConfirmacionEnvio } from "./components/ConfirmacionEnvio";
import { CarreraSelector } from "./components/CarreraSelector";

export default function SolicitarOfertaIndividual() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { form, perfilesDeseados, errores, enviado, handleChange, toggleCarrera, handleSubmit } = useOfertaIndividual();

  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
  };

  const inputStyle = (hasError) => ({
    width: "100%", padding: "10px 14px", boxSizing: "border-box",
    background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary,
    fontSize: 13, outline: "none", fontFamily: "inherit",
  });

  if (enviado) {
    return (
      <DashboardLayout titulo="Solicitar oferta individual" subtitulo="CU-PRO-01 · Profesor" rol="profesor" usuario="Dr. Torres Vega">
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <ConfirmacionEnvio tipo="individual" onVolver={() => navigate("/profesor/proyectos")} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Solicitar oferta individual" subtitulo="CU-PRO-01 · Profesor" rol="profesor" usuario="Dr. Torres Vega">
      <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>

        <button onClick={() => navigate("/profesor/proyectos")} style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          background: "transparent", border: "none", cursor: "pointer",
          color: C.textMuted, fontSize: 13, padding: "0 0 1rem", fontFamily: "inherit",
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Mis proyectos
        </button>

        <div style={{
          marginBottom: "1.5rem", padding: "12px 16px", borderRadius: RADIUS.md,
          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)",
          fontSize: 15, color: C.textMuted,
        }}>
          <strong style={{ color: C.textPrimary }}>Oferta individual de servicio social.</strong>
        </div>

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "0.75rem",
            marginBottom: "1.75rem", padding: "0.875rem 1rem",
            borderRadius: RADIUS.lg, background: C.bgInput, border: `1px solid ${C.borderDefault}`,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.textMuted,
                textTransform: "uppercase", letterSpacing: "0.07em" }}>Tipo de oferta</p>
              <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                Oferta individual
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={labelStyle}>Nombre de la oferta <span style={{ color: C.danger }}>*</span></label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Ej. Desarrollo de módulo de reportes en Python"
              style={inputStyle(!!errores.nombre)} />
            {errores.nombre && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.nombre}</p>}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={labelStyle}>Título para plataforma SISS <span style={{ color: C.danger }}>*</span></label>
            <input name="tituloSISS" value={form.tituloSISS} onChange={handleChange}
              placeholder="Ej. Academia de Ciencia de Datos"
              style={inputStyle(!!errores.tituloSISS)} />
            {errores.tituloSISS && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.tituloSISS}</p>}
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label style={labelStyle}>Descripción y actividades a realizar <span style={{ color: C.danger }}>*</span></label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
              placeholder="Describe en qué consiste la oferta, su contexto y las actividades concretas que realizará el alumno durante el servicio social..."
              rows={6} style={{ ...inputStyle(!!errores.descripcion), resize: "vertical", lineHeight: 1.6 }} />
            {errores.descripcion && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.descripcion}</p>}
          </div>

          <div style={{
            marginBottom: "1.75rem", padding: "1.125rem",
            borderRadius: RADIUS.lg, background: C.bgInput, border: `1px solid ${C.borderDefault}`,
          }}>
            <p style={{ ...labelStyle, marginBottom: 4 }}>Perfil de carrera deseado</p>
            <CarreraSelector value={perfilesDeseados} onToggle={toggleCarrera} />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => navigate("/profesor/proyectos")} style={{
              flex: 1, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textMuted, fontFamily: "inherit",
            }}>Cancelar</button>
            <button onClick={handleSubmit} style={{
              flex: 2, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
            }}>Enviar solicitud</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}