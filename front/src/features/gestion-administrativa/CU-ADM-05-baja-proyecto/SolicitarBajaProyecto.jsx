import { useTheme, RADIUS }              from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { Campo }                         from "./components/Campo";
import { ProyectoCard }                  from "./components/ProyectoCard";
import { useSolicitarBajaProyecto }      from "./hooks/useSolicitarBajaProyecto";

export default function SolicitarBajaProyecto() {
  const { C } = useTheme();
  const {
    alumno, tieneProyecto, solicitudActiva, proyecto,
    motivo, errores, enviado,
    handleMotivoChange, handleSubmit, handleCancelar, handleIrProyectos,
  } = useSolicitarBajaProyecto();

  const inputStyle = (hasError) => ({
    width: "100%", padding: "10px 14px",
    background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary,
    fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", resize: "vertical", lineHeight: 1.55,
  });

  // ── Estado: sin proyecto asignado ────────────────────────────
  if (!tieneProyecto) {
    return (
      <DashboardLayout
        titulo="Solicitar baja del proyecto"
        subtitulo="CU-ADM-05 · Alumno"
        rol="alumno"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.borderDefault}`,
            padding: "2rem", textAlign: "center",
          }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
              No tienes proyecto asignado
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
              Actualmente no estás asignado a un proyecto de servicio social,
              por lo que no puedes registrar una solicitud de baja.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Estado: ya existe solicitud activa ───────────────────────
  if (solicitudActiva) {
    return (
      <DashboardLayout
        titulo="Solicitar baja del proyecto"
        subtitulo="CU-ADM-05 · Alumno"
        rol="alumno"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.warning}`, padding: "2rem",
          }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
              Ya existe una solicitud activa
            </h3>
            <p style={{ margin: "0 0 1rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
              Ya tienes una solicitud de baja pendiente de procesamiento.
              No es posible registrar una nueva hasta que coordinación resuelva la actual.
            </p>
            <span style={{
              display: "inline-block", padding: "4px 14px", borderRadius: RADIUS.full,
              background: C.warningSoft, color: C.warning, fontSize: 13, fontWeight: 700,
            }}>
              Pendiente de procesamiento
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Estado: solicitud enviada exitosamente ───────────────────
  if (enviado) {
    return (
      <DashboardLayout
        titulo="Solicitar baja del proyecto"
        subtitulo="CU-ADM-05 · Alumno"
        rol="alumno"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
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
            <p style={{ margin: "0 0 0.25rem", fontSize: 14, color: C.textMuted }}>
              Tu solicitud de baja fue registrada con estado:
            </p>
            <span style={{
              display: "inline-block", margin: "0.5rem 0 1.25rem",
              padding: "4px 14px", borderRadius: RADIUS.full,
              background: C.warningSoft, color: C.warning, fontSize: 13, fontWeight: 700,
            }}>
              Pendiente de procesamiento
            </span>
            <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
              El profesor y coordinación serán notificados. La baja no es inmediata
              y quedará sujeta a revisión y procesamiento.
            </p>
            <button
              onClick={handleIrProyectos}
              style={{
                padding: "10px 28px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Ir a mis proyectos
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Flujo principal ───────────────────────────────────────────
  return (
    <DashboardLayout
      titulo="Solicitar baja del proyecto"
      subtitulo="CU-ADM-05 · Alumno"
      rol="alumno"
      usuario={alumno.nombre}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>

        {/* Aviso */}
        <div style={{
          marginBottom: "1.5rem", padding: "12px 16px",
          borderRadius: RADIUS.md, background: C.warningSoft,
          border: `1px solid ${C.warning}`, color: C.warning,
          fontSize: 13, lineHeight: 1.5,
        }}>
          <strong>Aviso:</strong> La solicitud de baja no implica una baja inmediata.
          Quedará registrada como pendiente de procesamiento y será notificada al profesor
          y a coordinación.
        </div>

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            Proyecto actual
          </h3>

          <ProyectoCard proyecto={proyecto} />

          <Campo
            label="Motivo de la solicitud de baja"
            required
            hint="Explica brevemente la razón por la que deseas solicitar tu baja del proyecto."
            error={errores.motivo}
          >
            <textarea
              name="motivo"
              value={motivo}
              onChange={handleMotivoChange}
              placeholder="Describe el motivo de tu solicitud..."
              rows={5}
              style={inputStyle(!!errores.motivo)}
            />
          </Campo>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleCancelar}
              style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}
            >
              Enviar solicitud de baja
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
