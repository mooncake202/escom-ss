import { useTheme, RADIUS }         from "@/themes/colors";
import { DashboardLayout }           from "@/components/layout/DashboardLayout";
import { InstruccionesExpediente }   from "./components/InstruccionesExpediente";
import { CargaExpediente }           from "./components/CargaExpediente";
import { useBajaServicioSocial }     from "./hooks/useBajaServicioSocial";

// Estados reales de solicitud_baja. Una baja APROBADA ya NO elimina la cuenta: la fila sobrevive y
// puede aparecer en el historial si el alumno vuelve a estar asignado más adelante.
const ESTADO_CONFIG = {
  pendiente: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "#f59e0b", texto: "Pendiente de revisión" },
  en_revision: { color: "#0A4DB5", bg: "rgba(10,77,181,0.1)", border: "#0A4DB5", texto: "En revisión por las autoridades" },
  rechazada: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "#ef4444", texto: "Rechazada" },
  aprobada:  { color: "#22C55E", bg: "rgba(34,197,94,0.1)",  border: "#22C55E", texto: "Aprobada" },
};

// Vista de SEGUIMIENTO por etapa. La etapa la deriva el backend (`etapaDeBaja`): aquí no se vuelve a
// interpretar ningún estado, solo se elige el texto.
//
// `pendiente_expediente` no aparece aquí a propósito: ese caso lo atiende el flujo de completar el
// expediente (modoCompletar), que sí muestra formulario.
const SEGUIMIENTO_POR_ETAPA = {
  pendiente_coordinacion: {
    titulo: "Solicitud de baja en revisión por Coordinación",
    detalle: "Coordinación está revisando tu expediente. Si procede, lo turnará a las autoridades "
      + "correspondientes.",
    accion: "No necesitas realizar ninguna acción por el momento.",
  },
  en_revision_autoridades: {
    titulo: "Solicitud de baja en revisión",
    detalle: "Tu expediente fue enviado por Coordinación a las autoridades correspondientes.",
    accion: "No necesitas realizar ninguna acción por el momento.",
  },
};

const fechaLegible = (valor) => (valor
  ? new Date(valor).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
  : "—");

// Solicitudes anteriores del alumno. Lo habitual son las RECHAZADAS, y lo importante es que pueda
// leer el motivo que escribió Coordinación (`comentario`) para corregir y volver a solicitar. Una
// APROBADA puede aparecer aquí si el alumno retomó el servicio en otra oferta después de su baja:
// mientras su baja está vigente no llega a esta pantalla, porque deja de ser 'alumno_asignado'.
function HistorialSolicitudes({ solicitudes, C }) {
  if (solicitudes.length === 0) return null;

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem", marginTop: "1.25rem",
    }}>
      <p style={{
        margin: "0 0 0.875rem", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        Mis solicitudes anteriores
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {solicitudes.map((h) => {
          const cfg = ESTADO_CONFIG[h.estado] ?? ESTADO_CONFIG.pendiente;
          return (
            <div key={h.id} style={{
              padding: "0.875rem 1rem", borderRadius: RADIUS.md,
              background: C.bgInput, border: `1px solid ${C.borderDefault}`,
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8, marginBottom: 6,
              }}>
                <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                  Enviada el {fechaLegible(h.fecha)}
                  {h.fechaRespuesta ? ` · resuelta el ${fechaLegible(h.fechaRespuesta)}` : ""}
                </p>
                <span style={{
                  flexShrink: 0, padding: "2px 10px", borderRadius: RADIUS.full,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  fontSize: 10, fontWeight: 700,
                }}>
                  {cfg.texto}
                </span>
              </div>

              <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textPrimary, lineHeight: 1.6 }}>
                <strong style={{ color: C.textMuted }}>Tu motivo:</strong> {h.motivo}
              </p>

              {h.comentario && (
                <div style={{
                  marginTop: 8, padding: "8px 12px", borderRadius: RADIUS.sm,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.6 }}>
                    <strong style={{ color: cfg.color }}>Respuesta de Coordinación:</strong> {h.comentario}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BajaServicioSocial() {
  const { C } = useTheme();
  const {
    carga, recargar,
    alumno, solicitudActiva, solicitud, modoCompletar, motivoProfesor,
    historial, motivo, archivo, errores, enviando, enviado,
    handleMotivoChange, handleArchivoChange,
    handleSubmit, handleCancelar, handleIrInicio,
  } = useBajaServicioSocial();

  // ── Carga y error ──
  if (carga.estado !== "listo") {
    return (
      <DashboardLayout titulo="Solicitar baja del servicio social" subtitulo="Solicitud de baja y envío de expediente" rol="alumno_asignado" usuario="">
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

  // ── Estado: ya existe solicitud activa → SEGUIMIENTO, nunca el formulario ───
  if (solicitudActiva) {
    const cfg = ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG.pendiente;
    const seguimiento = SEGUIMIENTO_POR_ETAPA[solicitud.etapa] ?? SEGUIMIENTO_POR_ETAPA.pendiente_coordinacion;
    return (
      <DashboardLayout
        titulo="Solicitar baja del servicio social"
        subtitulo="Solicitud de baja y envío de expediente"
        rol="alumno_asignado"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${cfg.border}`, padding: "2rem",
          }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              {seguimiento.titulo}
            </p>
            <p style={{ margin: "0 0 0.5rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              {seguimiento.detalle}
            </p>
            <p style={{ margin: "0 0 1.25rem", fontSize: 13, fontWeight: 600, color: C.textSecondary, lineHeight: 1.6 }}>
              {seguimiento.accion}
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

            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.textDisabled }}>
              Fecha de envío: <strong style={{ color: C.textMuted }}>{fechaLegible(solicitud.fecha)}</strong>
            </p>

            <p style={{
              margin: 0, padding: "10px 14px", borderRadius: RADIUS.md,
              background: C.warningSoft, border: `1px solid ${C.warning}`,
              fontSize: 12, color: C.warning, lineHeight: 1.5,
            }}>
              <strong>Tiempo estimado de resolución:</strong> de 1 a 3 meses hábiles. Recibirás una
              notificación en el sistema cuando exista una resolución. No es posible enviar una nueva
              solicitud hasta que se resuelva la actual.
            </p>
          </div>

          <HistorialSolicitudes solicitudes={historial} C={C} />
        </div>
      </DashboardLayout>
    );
  }

  // ── Estado: confirmación de envío ────────────────────────────
  if (enviado) {
    return (
      <DashboardLayout
        titulo="Solicitar baja del servicio social"
        subtitulo="Solicitud de baja y envío de expediente"
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
              {modoCompletar
                ? "Tu expediente quedó adjunto a la solicitud de tu profesor, con estado:"
                : "Tu solicitud de baja fue registrada con estado:"}
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
              Coordinación revisará tu expediente y lo turnará a las autoridades correspondientes.
              El tiempo de resolución estimado es de{" "}
              <strong style={{ color: C.textMuted }}>1 a 3 meses hábiles</strong>.
              Recibirás una notificación en el sistema en cada actualización.
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
      subtitulo="Solicitud de baja y envío de expediente"
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

        {/* Baja iniciada por el PROFESOR: se reutiliza esta misma pantalla, avisando de dónde viene
            la solicitud y mostrando el motivo real que él escribió. */}
        {modoCompletar && (
          <div style={{
            background: "rgba(239,68,68,0.06)", borderRadius: RADIUS.lg,
            border: `1px solid ${C.danger}`,
            padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
          }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: 14, fontWeight: 700, color: C.danger }}>
              Tu profesor ha solicitado tu baja del servicio social
            </p>
            <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textPrimary, lineHeight: 1.6 }}>
              Para continuar con el trámite debes armar y adjuntar tu expediente. No se creará una
              solicitud nueva: el expediente se adjunta a la que ya registró tu profesor.
            </p>
            <p style={{
              margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled,
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>
              Motivo indicado por tu profesor:
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              {motivoProfesor}
            </p>
          </div>
        )}

        {/* Instrucciones: las mismas para los dos orígenes; solo el paso 2 cita el motivo del profesor. */}
        <InstruccionesExpediente C={C} motivoProfesor={motivoProfesor} />

        {/* Formulario */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.25rem 1.5rem",
        }}>
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
            {modoCompletar ? "Adjunta tu expediente" : "Datos de la solicitud"}
          </p>

          {/* Motivo: obligatorio SOLO cuando el alumno abre la solicitud. Si la abrió su profesor, el
              motivo ya está guardado y no se vuelve a capturar. */}
          {!modoCompletar && (
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
          )}

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
              {enviando
                ? "Enviando…"
                : (modoCompletar ? "Enviar expediente" : "Enviar solicitud de baja")}
            </button>
          </div>
        </div>

        <HistorialSolicitudes solicitudes={historial} C={C} />

      </div>
    </DashboardLayout>
  );
}