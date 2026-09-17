import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useRegistroOferta } from "./hooks/useRegistroOferta";
import { CampoFormulario } from "./components/CampoFormulario";
import { ConfirmacionEnvio } from "./components/ConfirmacionEnvio";
import { CarreraSelector } from "./components/CarreraSelector";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

export default function SolicitarRegistroOferta() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const { form, errores, enviado, enviando, handleChange, handleCarreraToggle, handleSubmit } = useRegistroOferta();

  const inputStyle = (hasError) => ({
    width: "100%", padding: "10px 14px",
    background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary,
    fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  });

  if (enviado) {
    return (
      <DashboardLayout titulo="Registrar proyecto" subtitulo="CU-PRO-01 · Profesor" rol="profesor" usuario={nombreCompletoSesion(usuario)}>
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <ConfirmacionEnvio tipo="proyecto" onVolver={() => navigate("/profesor/proyectos")} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Registrar proyecto" subtitulo="CU-PRO-01 · Profesor" rol="profesor" usuario={nombreCompletoSesion(usuario)}>
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

        {errores.general && (
          <div style={{
            marginBottom: "1.5rem", padding: "12px 16px", borderRadius: RADIUS.md,
            background: C.dangerSoft ?? "rgba(220,38,38,0.1)", border: `1px solid ${C.danger}`,
            color: C.danger, fontSize: 13,
          }}>
            {errores.general}
          </div>
        )}

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
            label="Descripción y actividades a realizar" required
            error={errores.descripcion}
          >
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
              placeholder="Describe en qué consiste el proyecto, su contexto y las actividades concretas que realizarán los alumnos durante el servicio social..."
              rows={6} style={{ ...inputStyle(!!errores.descripcion), resize: "vertical", lineHeight: 1.55 }} />
          </CampoFormulario>

          <div style={{ borderTop: `1px solid ${C.borderDefault}`, margin: "0.25rem 0 1.5rem" }} />
          <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Cupos solicitados
          </h3>

          <CampoFormulario
            label="Total de cupos iniciales solicitados" required
            error={errores.cuposTotal}
          >
            <input type="number" name="cuposTotal" value={form.cuposTotal} onChange={handleChange}
              min={2} placeholder="Ej. 3"
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
            <button onClick={() => navigate("/profesor/proyectos")} disabled={enviando} style={{
              flex: 1, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 500, cursor: enviando ? "not-allowed" : "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textMuted, fontFamily: "inherit",
            }}>Cancelar</button>
            <button onClick={handleSubmit} disabled={enviando} style={{
              flex: 2, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, cursor: enviando ? "not-allowed" : "pointer",
              background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              opacity: enviando ? 0.6 : 1,
            }}>{enviando ? "Enviando..." : "Enviar solicitud"}</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}