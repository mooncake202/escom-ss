import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useRegistroOferta } from "./hooks/useRegistroOferta";
import { CampoFormulario } from "./components/CampoFormulario";
import { ConfirmacionEnvio } from "./components/ConfirmacionEnvio";
import { CarreraSelector } from "./components/CarreraSelector";

export default function SolicitarRegistroOferta() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { form, errores, enviado, handleChange, handleCarreraToggle, handleSubmit } = useRegistroOferta();

  const inputStyle = (hasError) => ({
    width: "100%", padding: "10px 14px",
    background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary,
    fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  });

  if (enviado) {
    return (
      <DashboardLayout titulo="Registrar proyecto" subtitulo="CU-PRO-01 · Profesor" rol="profesor" usuario="Dr. Torres Vega">
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <ConfirmacionEnvio tipo="proyecto" onVolver={() => navigate("/profesor/proyectos")} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Registrar proyecto" subtitulo="CU-PRO-01 · Profesor" rol="profesor" usuario="Dr. Torres Vega">
      <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>

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
          background: C.warningSoft, border: `1px solid ${C.warning}`,
          color: C.warning, fontSize: 13,
        }}>
          <strong>Aviso:</strong> Los cupos solicitados son una referencia inicial sujeta a los cupos que dispone.
        </div>

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        }}>
          <h3 style={{ margin: "0 0 1.75rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            Información del proyecto
          </h3>

          <CampoFormulario label="Nombre del proyecto" required error={errores.nombre}>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Ej. Sistema de análisis de datos con Python"
              style={inputStyle(!!errores.nombre)} />
          </CampoFormulario>

          <CampoFormulario
            label="Título para plataforma SISS" required
            hint="Nombre del proyecto tal como aparecerá registrado en la plataforma SISS."
            error={errores.tituloSISS}
          >
            <input name="tituloSISS" value={form.tituloSISS} onChange={handleChange}
              placeholder="Ej. Academia de Ciencia de Datos"
              style={inputStyle(!!errores.tituloSISS)} />
          </CampoFormulario>

          <CampoFormulario label="Descripción del proyecto" required error={errores.descripcion}>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
              placeholder="Describe los objetivos, alcance y contexto del proyecto..."
              rows={4} style={{ ...inputStyle(!!errores.descripcion), resize: "vertical", lineHeight: 1.55 }} />
          </CampoFormulario>

          <CampoFormulario
            label="Actividades a realizar" required
            hint="Describe las actividades que desarrollarán los alumnos durante el servicio social."
            error={errores.actividades}
          >
            <textarea name="actividades" value={form.actividades} onChange={handleChange}
              placeholder="Ej. Análisis de requerimientos, diseño de base de datos, desarrollo de módulos, pruebas..."
              rows={3} style={{ ...inputStyle(!!errores.actividades), resize: "vertical", lineHeight: 1.55 }} />
          </CampoFormulario>

          <div style={{ borderTop: `1px solid ${C.borderDefault}`, margin: "0.25rem 0 1.5rem" }} />
          <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Cupos solicitados
          </h3>

          <CampoFormulario
            label="Total de cupos iniciales solicitados" required
            hint="Número de alumnos que podría aceptar el proyecto. Sujeto a aprobación por coordinación."
            error={errores.cuposTotal}
          >
            <input type="number" name="cuposTotal" value={form.cuposTotal} onChange={handleChange}
              min={1} max={5} placeholder="Ej. 3"
              style={{ ...inputStyle(!!errores.cuposTotal), maxWidth: 160 }} />
          </CampoFormulario>

          <div style={{
            marginBottom: "1.75rem", padding: "1.125rem",
            borderRadius: RADIUS.lg, background: C.bgInput, border: `1px solid ${C.borderDefault}`,
          }}>
            <p style={{
              margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700,
              color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em",
            }}>
              Perfil de carrera deseado <span style={{ color: C.danger }}>*</span>
            </p>
            <CarreraSelector value={form.carreras} onToggle={handleCarreraToggle} error={errores.carreras} />
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