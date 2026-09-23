import { RADIUS } from "@/themes/colors";
import { ESTADO_CONFIG, ORIGEN_LABEL, fechaLegible } from "./estadosBaja";
import { urlExpedienteBaja } from "@/services/bajasService";

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
  onAprobar, onRechazar, onCancelar, onComentarioChange,
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
          {alumno.boleta} · {alumno.carrera} · {alumno.correo}
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
            El expediente está en manos de las autoridades del Instituto. Resuélvela aquí cuando
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

      <Dato etiqueta="Expediente" C={C}>
        {solicitud.tieneExpediente ? (
          <a
            href={urlExpedienteBaja(solicitud.id)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "7px 14px", borderRadius: RADIUS.md,
              background: C.bgInput, border: `1px solid ${C.accent}`,
              color: C.accentText, fontSize: 12, fontWeight: 700, textDecoration: "none",
            }}
          >
            Ver expediente (PDF)
          </a>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontStyle: "italic" }}>
            Sin expediente: las bajas solicitadas por el profesor no lo requieren.
          </p>
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

      {/* ── Acciones ── */}
      {!resuelta && panel === "detalle" && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onRechazar} style={{
            flex: 1, padding: "10px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            background: "transparent", border: `1px solid ${C.danger}`, color: C.danger,
          }}>
            Rechazar
          </button>
          <button onClick={onAprobar} style={{
            flex: 2, padding: "10px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            background: C.accent, border: "none", color: "#fff",
          }}>
            Aprobar solicitud
          </button>
        </div>
      )}

      {/* ── Confirmación explícita: aprobar ELIMINA al usuario y todo su proceso, sin vuelta atrás ── */}
      {!resuelta && panel === "confirmarAprobacion" && (
        <div style={{
          padding: "1.25rem", borderRadius: RADIUS.md,
          background: "rgba(239,68,68,0.06)", border: `2px solid ${C.danger}`,
        }}>
          <p style={{ margin: "0 0 0.625rem", fontSize: 14, fontWeight: 700, color: C.danger }}>
            ¿Estás seguro de aprobar esta solicitud de baja?
          </p>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textPrimary, lineHeight: 1.65 }}>
            Al continuar, el usuario <strong>{alumno.nombre}</strong> ({alumno.boleta}) y toda la
            información asociada a su proceso de servicio social serán eliminados permanentemente:
            bitácoras, actividades, horas acumuladas, reportes, documentos y expedientes.{" "}
            <strong style={{ color: C.danger }}>Esta acción no se puede revertir.</strong>
          </p>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
            Se le avisará por correo. Si más adelante quiere retomar su servicio, deberá empezar
            desde el registro de su cuenta.
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
