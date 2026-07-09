import { useTheme, RADIUS }                from "@/themes/colors";
import { DashboardLayout }                 from "@/components/layout/DashboardLayout";
import { useNavigate }                     from "react-router-dom";
import { CaracteristicasActuales }         from "./components/CaracteristicasActuales";
import { CaracteristicaSelector }          from "./components/CaracteristicaSelector";
import { useSolicitarModificacion }        from "./hooks/useSolicitarModificacion";

export default function SolicitarModificacionCaracteristicas() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const {
    profesor, catalogo,
    caracteristicasActuales, caracteristicasAprobadas,
    tieneSolicitudPendiente,
    caracteristicaId, caracteristicaSeleccionada,
    justificacion, errores, enviado,
    handleSeleccionar, handleJustificacionChange,
    handleSubmit, handleCancelar,
  } = useSolicitarModificacion();

  // ── Flujo 1.1: ya existe solicitud pendiente (RN-ADM-01) ─────
  if (tieneSolicitudPendiente) {
    return (
      <DashboardLayout
        titulo="Solicitar modificación de características"
        subtitulo="CU-ADM-12 · Profesor"
        rol="profesor"
        usuario={profesor.nombre}
      >
        <div style={{ maxWidth: 820, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.warning}`,
            padding: "2rem 1.75rem",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: C.warningSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
                stroke={C.warning} strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary, textAlign: "center" }}>
              Solicitud pendiente de resolución
            </h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6, textAlign: "center" }}>
              Ya tienes una solicitud de modificación de características pendiente de revisión por coordinación.
              No es posible enviar una nueva hasta que sea resuelta.
            </p>
            <CaracteristicasActuales caracteristicas={caracteristicasActuales} C={C} />
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                width: "100%", padding: "10px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Confirmación de envío exitoso ────────────────────────────
  if (enviado) {
    return (
      <DashboardLayout
        titulo="Solicitar modificación de características"
        subtitulo="CU-ADM-12 · Profesor"
        rol="profesor"
        usuario={profesor.nombre}
      >
        <div style={{ maxWidth: 820, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.success}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: C.successSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
                stroke={C.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
              Solicitud enviada
            </h3>
            <p style={{ margin: "0 0 0.5rem", fontSize: 13, color: C.textMuted }}>
              Solicitaste agregar la característica:
            </p>
            <span style={{
              display: "inline-block", margin: "0 0 1.25rem",
              padding: "4px 14px", borderRadius: RADIUS.full,
              background: C.accentSoft, border: `1px solid ${C.accent}`,
              fontSize: 13, fontWeight: 700, color: C.accentText,
            }}>
              {caracteristicaSeleccionada?.nombre}
            </span>
            <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
              Tu solicitud quedó registrada con estado{" "}
              <strong style={{ color: C.textMuted }}>Pendiente</strong>.
              Coordinación la revisará y recibirás una notificación cuando sea resuelta.
            </p>
            <button
              onClick={() => navigate("/profesor/datos-personales")}
              style={{
                padding: "10px 28px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Volver a mis datos
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Flujo principal ───────────────────────────────────────────
  return (
    <DashboardLayout
      titulo="Solicitar modificación de características"
      subtitulo="CU-ADM-12 · Profesor"
      rol="profesor"
      usuario={profesor.nombre}
    >
      <div style={{ maxWidth: 820, margin: "0 auto", width: "100%" }}>

        {/* Características actuales (RF-ADM-02) */}
        <CaracteristicasActuales caracteristicas={caracteristicasActuales} C={C} />

        {/* Formulario */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        }}>
          <h3 style={{ margin: "0 0 0.25rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            Nueva solicitud
          </h3>
          <p style={{ margin: "0 0 1.5rem", fontSize: 12, color: C.textMuted }}>
            Selecciona la característica que deseas agregar a tu perfil y proporciona una justificación.
          </p>

          {/* Selector de característica (RN-ADM-02, RN-ADM-03) */}
          <CaracteristicaSelector
            catalogo={catalogo}
            seleccionada={caracteristicaId}
            aprobadas={caracteristicasAprobadas}
            error={errores.caracteristica}
            onSeleccionar={handleSeleccionar}
            C={C}
          />

          {/* Justificación (RN-ADM-04) */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
            }}>
              Justificación <span style={{ color: C.danger }}>*</span>
            </label>
            <textarea
              value={justificacion}
              onChange={handleJustificacionChange}
              rows={4}
              placeholder="Explica los motivos por los que solicitas registrar esta característica en tu perfil..."
              style={{
                width: "100%", padding: "10px 14px", boxSizing: "border-box",
                background: C.bgInput,
                border: `1px solid ${errores.justificacion ? C.danger : C.borderDefault}`,
                borderRadius: RADIUS.md, color: C.textPrimary,
                fontSize: 13, outline: "none", fontFamily: "inherit",
                resize: "vertical", lineHeight: 1.55,
              }}
            />
            {errores.justificacion && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>
                {errores.justificacion}
              </p>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={handleCancelar} style={{
              flex: 1, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textMuted, fontFamily: "inherit",
            }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} style={{
              flex: 2, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
            }}>
              Enviar solicitud
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
