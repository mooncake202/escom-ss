import { useTheme, RADIUS }        from "@/themes/colors";
import { DashboardLayout }          from "@/components/layout/DashboardLayout";
import { BajaForm }                 from "./components/BajaForm";
import { useBajaServicioSocial }    from "./hooks/useBajaServicioSocial";

export default function BajaServicioSocial() {
  const { C } = useTheme();
  const {
    alumno, solicitudActiva, motivo, errores, enviado,
    handleMotivoChange, handleSubmit, handleCancelar, handleIrInicio,
  } = useBajaServicioSocial();

  // ── Estado: ya existe solicitud activa ───────────────────────
  if (solicitudActiva) {
    return (
      <DashboardLayout
        titulo="Solicitar baja del servicio social"
        subtitulo="CU-ADM-14 · Alumno"
        rol="alumno"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
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

  // ── Estado: confirmación de envío ────────────────────────────
  if (enviado) {
    return (
      <DashboardLayout
        titulo="Solicitar baja del servicio social"
        subtitulo="CU-ADM-14 · Alumno"
        rol="alumno"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
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
              
            </p>
            <button
              onClick={handleIrInicio}
              style={{
                padding: "10px 28px", borderRadius: RADIUS.md,
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

  // ── Flujo principal ───────────────────────────────────────────
  return (
    <DashboardLayout
      titulo="Solicitar baja del servicio social"
      subtitulo="CU-ADM-14 · Alumno"
      rol="alumno"
      usuario={alumno.nombre}
    >
      <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>

        {/* Encabezado informativo */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
          display: "flex", alignItems: "center", gap: "1rem",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: C.accentSoft, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 700, color: C.accentText,
          }}>
            {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
              {alumno.nombre}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
              Boleta: {alumno.boleta}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <BajaForm
          motivo={motivo}
          errores={errores}
          onMotivoChange={handleMotivoChange}
          onSubmit={handleSubmit}
          onCancelar={handleCancelar}
          C={C}
        />

      </div>
    </DashboardLayout>
  );
}
