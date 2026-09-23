import { useTheme, RADIUS }         from "@/themes/colors";
import { DashboardLayout }           from "@/components/layout/DashboardLayout";
import { InstruccionesExpediente }   from "./components/InstruccionesExpediente";
import { CargaExpediente }           from "./components/CargaExpediente";
import { useBajaServicioSocial }     from "./hooks/useBajaServicioSocial";

// Estados reales de solicitud_baja. Una baja APROBADA elimina la cuenta del alumno, así que
// nunca puede verse desde esta pantalla: solo existen pendiente y rechazada.
const ESTADO_CONFIG = {
  pendiente: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "#f59e0b", texto: "Pendiente de revisión" },
  rechazada: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "#ef4444", texto: "Rechazada" },
};

const fechaLegible = (valor) => (valor
  ? new Date(valor).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
  : "—");

export default function BajaServicioSocial() {
  const { C } = useTheme();
  const {
    carga, recargar,
    alumno, solicitudActiva, solicitud, motivo, archivo, errores, enviando, enviado,
    handleMotivoChange, handleArchivoChange,
    handleSubmit, handleCancelar, handleIrInicio,
  } = useBajaServicioSocial();

  // ── Carga y error ──
  if (carga.estado !== "listo") {
    return (
      <DashboardLayout titulo="Solicitar baja del servicio social" subtitulo="CU-ADM-11 · Alumno" rol="alumno_asignado" usuario="">
        <div style={{ maxWidth: 820, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "2.5rem 2rem", textAlign: "center",
          }}>
            {carga.estado === "cargando" ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando...</p>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
                <button onClick={recargar} style={{
                  padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Reintentar</button>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Estado: ya existe solicitud activa ───────────────────────
  if (solicitudActiva) {
    const cfg = ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG.pendiente;
    return (
      <DashboardLayout
        titulo="Solicitar baja del servicio social"
        subtitulo="CU-ADM-11 · Alumno"
        rol="alumno_asignado"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${cfg.border}`, padding: "2rem",
          }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Solicitud de baja en proceso
            </p>
            <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Ya tienes una solicitud de baja registrada. No es posible enviar una nueva
              hasta que coordinación resuelva la actual.
            </p>

            {/* Estado actual */}
            <div style={{
              padding: "1rem", borderRadius: RADIUS.md,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              marginBottom: "1rem",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Estado actual
              </p>
              <span style={{
                display: "inline-block", padding: "4px 14px", borderRadius: RADIUS.full,
                background: cfg.bg, color: cfg.color, fontSize: 13, fontWeight: 700,
                border: `1px solid ${cfg.border}`,
              }}>
                {cfg.texto}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
              Fecha de envío: <strong style={{ color: C.textMuted }}>{fechaLegible(solicitud.fecha)}</strong>
            </p>
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
        subtitulo="CU-ADM-11 · Alumno"
        rol="alumno_asignado"
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
              background: "rgba(245,158,11,0.1)", color: "#f59e0b",
              fontSize: 13, fontWeight: 700, border: "1px solid #f59e0b",
            }}>
              Pendiente de revisión
            </span>
            <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
              Coordinación revisará tu expediente. El tiempo de resolución estimado
              es de <strong style={{ color: C.textMuted }}>1 a 3 meses hábiles</strong>.
              Recibirás una notificación en el sistema cuando haya una actualización.
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
      subtitulo="CU-ADM-11 · Alumno"
      rol="alumno_asignado"
      usuario={alumno.nombre}
    >
      <div style={{ maxWidth: 620, margin: "0 auto", width: "100%" }}>

        {/* Encabezado del alumno */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1rem 1.25rem", marginBottom: "1.25rem",
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

        {/* Instrucciones */}
        <InstruccionesExpediente C={C} />

        {/* Formulario */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.25rem 1.5rem",
        }}>
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
            Datos de la solicitud
          </p>

          {/* Motivo: obligatorio, igual que el expediente */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
            }}>
              Motivo de la baja <span style={{ color: C.danger }}>*</span>
            </label>
            <textarea
              value={motivo}
              onChange={handleMotivoChange}
              rows={4}
              placeholder="Explica por qué solicitas darte de baja del servicio social..."
              style={{
                width: "100%", padding: "10px 14px", boxSizing: "border-box",
                background: C.bgInput,
                border: `1px solid ${errores.motivo ? C.danger : C.borderDefault}`,
                borderRadius: RADIUS.md, color: C.textPrimary,
                fontSize: 13, outline: "none", fontFamily: "inherit",
                resize: "vertical", lineHeight: 1.55,
              }}
            />
            {errores.motivo && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{errores.motivo}</p>
            )}
          </div>

          {/* Carga de expediente */}
          <CargaExpediente
            archivo={archivo}
            error={errores.archivo}
            onChange={handleArchivoChange}
            C={C}
          />

          {/* El backend es la autoridad: revalida tipo, tamaño y duplicados. */}
          {errores.envio && (
            <div style={{
              marginBottom: "1rem", padding: "10px 14px", borderRadius: RADIUS.md,
              background: "rgba(239,68,68,0.06)", border: `1px solid ${C.danger}`,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: C.danger, lineHeight: 1.55 }}>{errores.envio}</p>
            </div>
          )}

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
            <button onClick={handleSubmit} disabled={enviando} style={{
              flex: 2, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, cursor: enviando ? "wait" : "pointer",
              opacity: enviando ? 0.6 : 1,
              background: C.danger, border: "none", color: "#fff", fontFamily: "inherit",
            }}>
              {enviando ? "Enviando…" : "Enviar solicitud de baja"}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}