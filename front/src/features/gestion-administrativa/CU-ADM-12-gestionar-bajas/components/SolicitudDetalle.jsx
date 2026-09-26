import { RADIUS } from "@/themes/colors";
import { ESTADO_CONFIG, ORIGEN_LABEL, fechaLegible } from "./estadosBaja";
import { BotonVerPdf, VisorPdf } from "@/features/gestion-reportes/compartido/VisorPdf";
import { codigoCarrera } from "@/features/gestion-administrativa/utils/carreraLabel";

function Dato({ etiqueta, children, C }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{
        margin: "0 0 4px", fontSize: 11, fontWeight: 700,
        color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {etiqueta}
      </p>
      {children}
    </div>
  );
}

export function SolicitudDetalle({
  solicitud, panel, comentario, errores, procesando,
  pdf, onVerExpediente, onCerrarPdf,
  onEnviarARevision, onAprobar, onRechazar, onCancelar, onComentarioChange,
  onConfirmarAprobacion, onConfirmarRechazo, C,
}) {
  const cfg = ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG.pendiente;
  const { alumno, servicio } = solicitud;
  // Una resuelta es historial: se consulta, no se acciona.
  const resuelta = !solicitud.puedeResolverse;

  return (
    <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`, padding: "1.5rem" }}>

      <div style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: `1px solid ${C.borderDefault}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{alumno.nombre}</p>
          <span style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: RADIUS.full,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          }}>
            {cfg.label}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
          {alumno.boleta} · {codigoCarrera(alumno.carrera)} · {alumno.correo}
        </p>
      </div>

      {/* Aviso del trámite externo: el oficio de las autoridades no vive en el sistema. */}
      {solicitud.enRevisionInstitucional && (
        <div style={{
          marginBottom: "1.25rem", padding: "0.875rem 1rem", borderRadius: RADIUS.md,
          background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.35)",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>
            En revisión institucional
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.6 }}>
            Envía el expediente a las autoridades correspondientes. Resuélvela aquí cuando
            recibas su respuesta; el oficio oficial se gestiona por correo institucional y no se
            almacena en la plataforma.
          </p>
        </div>
      )}

      <Dato etiqueta="Solicitada por" C={C}>
        <p style={{ margin: 0, fontSize: 13, color: C.textPrimary }}>
          {ORIGEN_LABEL[solicitud.origen]} · {solicitud.solicitante.nombre}
        </p>
      </Dato>

      {servicio && (
        <Dato etiqueta="Servicio social en curso" C={C}>
          <p style={{ margin: 0, fontSize: 13, color: C.textPrimary }}>
            {servicio.oferta ? servicio.oferta.nombre : "Sin oferta"}
            {servicio.profesor ? ` · ${servicio.profesor}` : ""}
          </p>
          {servicio.oferta && servicio.oferta.estado !== "aprobada" && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textDisabled }}>
              La oferta está {servicio.oferta.estado}: al aprobar no se le devolverá el lugar.
            </p>
          )}
        </Dato>
      )}

      <div style={{
        marginBottom: "1rem", padding: "0.875rem 1rem",
        background: C.bgInput, borderRadius: RADIUS.md, border: `1px solid ${C.borderDefault}`,
      }}>
        <p style={{
          margin: "0 0 4px", fontSize: 11, fontWeight: 700,
          color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          Motivo
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.65 }}>{solicitud.motivo}</p>
      </div>

      {/* El PDF se pide CON el token (mismo visor que CU-REP-05/06) y se muestra desde su object URL:
          un enlace directo al endpoint no llevaría el Authorization y daría 401. */}
      <Dato etiqueta="Expediente" C={C}>
        {solicitud.tieneExpediente ? (
          <BotonVerPdf pdf={pdf} onVerPdf={onVerExpediente} C={C} etiqueta="Ver expediente PDF ↗" />
        ) : (
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: C.warning }}>
              Expediente pendiente
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
              El alumno aún no ha adjuntado el expediente de baja. Debe adjuntarlo antes de que puedas
              turnar la solicitud a las autoridades.
            </p>
          </div>
        )}
      </Dato>

      <p style={{ margin: "0 0 1.25rem", fontSize: 11, color: C.textDisabled }}>
        Enviada el {fechaLegible(solicitud.fecha)}
      </p>

      {/* Resolución, si ya la hubo. Puede haberla escrito otro coordinador: la bandeja es compartida. */}
      {resuelta && (
        <div style={{ padding: "1rem", borderRadius: RADIUS.md, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize: 11, color: C.textDisabled }}>el {fechaLegible(solicitud.fechaRespuesta)}</span>
          </div>
          {solicitud.comentario ? (
            <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.65 }}>
              <strong style={{ color: C.textMuted }}>
                {solicitud.estado === "rechazada" ? "Motivo:" : "Comentario:"}
              </strong>{" "}
              {solicitud.comentario}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontStyle: "italic" }}>Sin comentario.</p>
          )}
        </div>
      )}

      {errores.accion && panel === "detalle" && (
        <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>{errores.accion}</p>
      )}

      <VisorPdf
        pdf={pdf}
        titulo={`Expediente de baja · ${alumno.nombre}`}
        tituloIframe="Expediente de baja"
        onCerrar={onCerrarPdf}
        C={C}
      />

      {/* ── Acciones ──
          Qué se ofrece lo decide el BACKEND con puedeEnviarARevision / puedeAprobarse /
          puedeRechazarse. La pantalla no reimplementa la máquina de estados:
            pendiente   → "En revisión" (exige expediente) o "Rechazar"
            en_revision → "Aprobar" (baja definitiva) o "Rechazar"
          "Aprobar" NUNCA aparece mientras la solicitud siga pendiente. */}
      {!resuelta && panel === "detalle" && (
        <>
          {solicitud.puedeEnviarARevision === false && solicitud.puedeAprobarse === false && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
              Esta solicitud todavía no tiene expediente. El alumno debe adjuntarlo antes de que
              puedas turnarla a las autoridades.
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            {solicitud.puedeRechazarse && (
              <button onClick={onRechazar} style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                background: "transparent", border: `1px solid ${C.danger}`, color: C.danger,
              }}>
                Rechazar
              </button>
            )}

            {solicitud.puedeEnviarARevision && (
              <button onClick={onEnviarARevision} disabled={procesando} style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: procesando ? "wait" : "pointer", fontFamily: "inherit",
                background: C.accent, border: "none", color: "#fff",
              }}>
                {procesando ? "Turnando..." : "Marcar en revisión"}
              </button>
            )}

            {solicitud.puedeAprobarse && (
              <button onClick={onAprobar} style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                background: C.accent, border: "none", color: "#fff",
              }}>
                Aprobar solicitud
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Confirmación explícita: aprobar CANCELA el servicio social, conservando la cuenta ── */}
      {!resuelta && panel === "confirmarAprobacion" && (
        <div style={{
          padding: "1.25rem", borderRadius: RADIUS.md,
          background: "rgba(239,68,68,0.06)", border: `2px solid ${C.danger}`,
        }}>
          <p style={{ margin: "0 0 0.625rem", fontSize: 14, fontWeight: 700, color: C.danger }}>
            ¿Estás seguro de aprobar esta solicitud de baja?
          </p>
          {/* El sistema de Bajas ya NO manda correos: nada aquí debe prometer uno. La mención al
              "oficio oficial" del aviso de en_revision sí se conserva, porque ese es un trámite
              institucional externo a la plataforma. */}
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textPrimary, lineHeight: 1.65 }}>
            Se dará de baja el servicio social actual de <strong>{alumno.nombre}</strong>{" "}
            ({alumno.boleta}). Se eliminará el avance asociado al servicio y se liberará su lugar en
            la oferta.{" "}
            <strong style={{ color: C.danger }}>Esta acción no se puede revertir.</strong>
          </p>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
            La cuenta del alumno se conservará. Al iniciar sesión nuevamente podrá modificar su
            solicitud y postularse a otra oferta.
          </p>

          <label style={{
            display: "block", fontSize: 11, fontWeight: 700, color: C.textDisabled,
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
          }}>
            Comentario (opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Nota interna sobre la resolución…"
            value={comentario}
            onChange={onComentarioChange}
            style={{
              width: "100%", boxSizing: "border-box", padding: "8px 12px",
              borderRadius: RADIUS.md, fontSize: 12, background: C.bgInput,
              border: `1px solid ${C.borderDefault}`, color: C.textPrimary,
              fontFamily: "inherit", outline: "none", resize: "vertical",
              lineHeight: 1.5, marginBottom: "0.875rem",
            }}
          />

          {errores.accion && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>{errores.accion}</p>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onCancelar} style={{
              flex: 1, padding: "9px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted,
            }}>
              Cancelar
            </button>
            <button onClick={onConfirmarAprobacion} disabled={procesando} style={{
              flex: 2, padding: "9px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 700, cursor: procesando ? "wait" : "pointer", fontFamily: "inherit",
              opacity: procesando ? 0.6 : 1,
              background: C.danger, border: "none", color: "#fff",
            }}>
              {procesando ? "Dando de baja…" : "Sí, aprobar y dar de baja"}
            </button>
          </div>
        </div>
      )}

      {/* ── Rechazo ── */}
      {!resuelta && panel === "rechazo" && (
        <div style={{ padding: "1.25rem", borderRadius: RADIUS.md, background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}` }}>
          <p style={{ margin: "0 0 0.375rem", fontSize: 13, fontWeight: 700, color: C.danger }}>Confirmar rechazo</p>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
            No se elimina nada. El alumno continúa su servicio social y el motivo le llegará como notificación.
          </p>

          <label style={{
            display: "block", fontSize: 11, fontWeight: 700, color: C.textDisabled,
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
          }}>
            Motivo del rechazo <span style={{ color: C.danger }}>*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Explica el motivo del rechazo…"
            value={comentario}
            onChange={onComentarioChange}
            style={{
              width: "100%", boxSizing: "border-box", padding: "8px 12px",
              borderRadius: RADIUS.md, fontSize: 12, background: C.bgInput,
              border: `1px solid ${errores.comentario ? C.danger : C.borderDefault}`,
              color: C.textPrimary, fontFamily: "inherit", outline: "none",
              resize: "vertical", lineHeight: 1.5,
              marginBottom: errores.comentario ? 4 : "0.875rem",
            }}
          />
          {errores.comentario && (
            <p style={{ margin: "4px 0 12px", fontSize: 12, color: C.danger }}>{errores.comentario}</p>
          )}
          {errores.accion && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>{errores.accion}</p>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onCancelar} style={{
              flex: 1, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted,
            }}>
              Cancelar
            </button>
            <button onClick={onConfirmarRechazo} disabled={procesando} style={{
              flex: 2, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 700, cursor: procesando ? "wait" : "pointer", fontFamily: "inherit",
              opacity: procesando ? 0.6 : 1,
              background: C.danger, border: "none", color: "#fff",
            }}>
              {procesando ? "Rechazando…" : "Confirmar rechazo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
