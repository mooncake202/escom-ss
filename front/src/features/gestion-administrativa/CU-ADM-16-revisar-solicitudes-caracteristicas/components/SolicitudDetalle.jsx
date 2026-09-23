import { RADIUS } from "@/themes/colors";

const fechaLegible = (valor) => (valor
  ? new Date(valor).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
  : "—");

function Bloque({ etiqueta, children, C, style }) {
  return (
    <div style={{ marginBottom: "1rem", ...style }}>
      <p style={{
        margin: "0 0 6px", fontSize: 11, fontWeight: 700,
        color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {etiqueta}
      </p>
      {children}
    </div>
  );
}

function Pastilla({ texto, detalle, C, tono = "neutro" }) {
  const tonos = {
    neutro: { bg: C.bgInput, borde: C.borderDefault, color: C.textPrimary, detalle: C.accentText },
    solicitado: { bg: "rgba(234,179,8,0.08)", borde: "rgba(234,179,8,0.3)", color: "#ca8a04", detalle: "#b45309" },
  };
  const t = tonos[tono];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "6px 14px", borderRadius: RADIUS.md,
      background: t.bg, border: `1px solid ${t.borde}`,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{texto}</span>
      {detalle && (
        <>
          <div style={{ width: 1, height: 14, background: t.borde }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: t.detalle }}>{detalle}</span>
        </>
      )}
    </div>
  );
}

const ESTADO_ESTILO = {
  aprobada:  { bg: "rgba(34,197,94,0.08)", borde: "rgba(34,197,94,0.35)", color: "#16A34A", texto: "Aprobada" },
  rechazada: { bg: "rgba(239,68,68,0.06)", borde: "rgba(239,68,68,0.35)", color: "#DC2626", texto: "Rechazada" },
};

export function SolicitudDetalle({
  solicitud, panel,
  comentario, errores, procesando,
  onAprobar, onRechazar, onCancelar,
  onComentarioChange,
  onConfirmarAprobacion, onConfirmarRechazo,
  C,
}) {
  const { profesor, caracteristicaSolicitada, justificacion, fecha, capacidadResultante, puedeAprobarse, cuposALiberar } = solicitud;

  // Un profesor sin característica vigente es "Profesor base"; una solicitud sin característica
  // pide volver a serlo. En ninguno de los dos casos hay una fila de catálogo detrás.
  const vigente = profesor.caracteristicaVigente?.nombre ?? "Profesor base";
  const destino = caracteristicaSolicitada?.nombre ?? "Profesor base";

  // Historial: una solicitud resuelta se consulta pero no admite ninguna acción.
  const resuelta = solicitud.estado !== "pendiente";
  const estilo = ESTADO_ESTILO[solicitud.estado];

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "1.5rem",
    }}>

      <div style={{
        marginBottom: "1.25rem", paddingBottom: "1.25rem",
        borderBottom: `1px solid ${C.borderDefault}`,
      }}>
        <p style={{
          margin: "0 0 2px", fontSize: 11, fontWeight: 700,
          color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Profesor
        </p>
        <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
          {profesor.nombre}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
          {profesor.correo} · {profesor.departamento}
        </p>
      </div>

      {/* Advertencia: era válida al enviarse pero ya no lo es. Solo aplica a pendientes. */}
      {!resuelta && !puedeAprobarse && (
        <div style={{
          marginBottom: "1.25rem", padding: "0.875rem 1rem", borderRadius: RADIUS.md,
          background: "rgba(239,68,68,0.06)", border: `1px solid ${C.danger}`,
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.danger }}>
            Esta solicitud ya no puede aprobarse
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.6 }}>
            Cuando el profesor la envió el cambio cabía, pero hoy tiene {profesor.ocupados} alumnos
            ocupando cupo y con esta característica su capacidad quedaría en {capacidadResultante}.
            Tendría que liberar {cuposALiberar} cupo{cuposALiberar !== 1 ? "s" : ""}. Aprobarla dejaría
            alumnos fuera de su capacidad, así que solo puedes rechazarla explicándole el motivo.
          </p>
        </div>
      )}

      <Bloque etiqueta="Característica vigente" C={C}>
        <Pastilla
          texto={vigente}
          detalle={`${profesor.capacidadActual} cupos · ${profesor.ocupados} ocupados`}
          C={C}
        />
      </Bloque>

      <Bloque etiqueta="Característica solicitada" C={C}>
        <Pastilla
          texto={destino}
          detalle={caracteristicaSolicitada ? `+${caracteristicaSolicitada.incrementoCupos} cupos` : "sin cupos extra"}
          tono="solicitado"
          C={C}
        />
      </Bloque>

      {/* Capacidad global: una característica no cambia ninguna oferta ni reasigna alumnos. */}
      <Bloque etiqueta="Efecto en su capacidad" C={C}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          padding: "0.75rem 1rem", borderRadius: RADIUS.md,
          background: C.bgInput, border: `1px solid ${C.borderDefault}`,
        }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            Actual <strong style={{ color: C.textPrimary }}>{profesor.capacidadActual}</strong>
          </span>
          <span style={{ fontSize: 12, color: C.textDisabled }}>→</span>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            Resultante{" "}
            <strong style={{ color: puedeAprobarse ? C.accentText : C.danger }}>{capacidadResultante}</strong>
          </span>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            · Ocupados <strong style={{ color: C.textPrimary }}>{profesor.ocupados}</strong>
          </span>
        </div>
      </Bloque>

      <div style={{
        marginBottom: "1.25rem", padding: "0.875rem 1rem",
        background: C.bgInput, borderRadius: RADIUS.md,
        border: `1px solid ${C.borderDefault}`,
      }}>
        <p style={{
          margin: "0 0 4px", fontSize: 11, fontWeight: 700,
          color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          Justificación
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.65 }}>
          {justificacion}
        </p>
      </div>

      <p style={{ margin: "0 0 1.5rem", fontSize: 11, color: C.textDisabled }}>
        Enviada el {fechaLegible(fecha)}
      </p>

      {/* Resolución. Puede haberla escrito otro coordinador: la bandeja es compartida. */}
      {resuelta && (
        <div style={{
          padding: "1rem", borderRadius: RADIUS.md,
          background: estilo.bg, border: `1px solid ${estilo.borde}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: estilo.color }}>{estilo.texto}</span>
            <span style={{ fontSize: 11, color: C.textDisabled }}>
              el {fechaLegible(solicitud.fechaRespuesta)}
            </span>
          </div>
          {solicitud.comentario ? (
            <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.65 }}>
              <strong style={{ color: C.textMuted }}>
                {solicitud.estado === "rechazada" ? "Motivo:" : "Comentario:"}
              </strong>{" "}
              {solicitud.comentario}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontStyle: "italic" }}>
              Sin comentario.
            </p>
          )}
        </div>
      )}

      {!resuelta && errores.accion && panel === "detalle" && (
        <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>
          {errores.accion}
        </p>
      )}

      {/* ── Panel: botones principales ── */}
      {!resuelta && panel === "detalle" && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onRechazar} style={{
            flex: 1, padding: "10px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            background: "transparent", border: `1px solid ${C.danger}`, color: C.danger,
          }}>
            Rechazar
          </button>
          {/* Aprobar se bloquea si ya no cabe; Rechazar sigue siempre disponible. */}
          <button
            onClick={onAprobar}
            disabled={!puedeAprobarse}
            style={{
              flex: 2, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700,
              cursor: puedeAprobarse ? "pointer" : "not-allowed",
              opacity: puedeAprobarse ? 1 : 0.45,
              background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
            }}
          >
            Aprobar
          </button>
        </div>
      )}

      {/* ── Panel: confirmar aprobación ── */}
      {!resuelta && panel === "aprobacion" && (
        <div style={{
          padding: "1.25rem", borderRadius: RADIUS.md,
          background: C.accentSoft, border: `1px solid ${C.accent}`,
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: 13, fontWeight: 700, color: C.accentText }}>
            Confirmar aprobación
          </p>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>
            {profesor.nombre} pasará de <strong style={{ color: C.accentText }}>{vigente}</strong> a{" "}
            <strong style={{ color: C.accentText }}>{destino}</strong> y su capacidad quedará en{" "}
            <strong style={{ color: C.accentText }}>{capacidadResultante} cupos</strong>.
            Sus ofertas y sus alumnos asignados no se modifican.
          </p>

          <label style={{
            display: "block", fontSize: 11, fontWeight: 700,
            color: C.textDisabled, textTransform: "uppercase",
            letterSpacing: "0.07em", marginBottom: 5,
          }}>
            Comentario (opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Nota interna o mensaje para el profesor…"
            value={comentario}
            onChange={onComentarioChange}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 12px", borderRadius: RADIUS.md, fontSize: 12,
              background: C.bgInput, border: `1px solid ${C.borderDefault}`,
              color: C.textPrimary, fontFamily: "inherit", outline: "none",
              resize: "vertical", lineHeight: 1.5, marginBottom: "0.875rem",
            }}
          />

          {errores.accion && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>
              {errores.accion}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onCancelar} style={{
              flex: 1, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted,
            }}>
              Cancelar
            </button>
            <button
              onClick={onConfirmarAprobacion}
              disabled={procesando}
              style={{
                flex: 2, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
                fontWeight: 700, cursor: procesando ? "wait" : "pointer", fontFamily: "inherit",
                opacity: procesando ? 0.6 : 1,
                background: C.accent, border: "none", color: "#fff",
              }}
            >
              {procesando ? "Aprobando…" : "Confirmar aprobación"}
            </button>
          </div>
        </div>
      )}

      {/* ── Panel: confirmar rechazo ── */}
      {!resuelta && panel === "rechazo" && (
        <div style={{
          padding: "1.25rem", borderRadius: RADIUS.md,
          background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}`,
        }}>
          <p style={{ margin: "0 0 0.375rem", fontSize: 13, fontWeight: 700, color: C.danger }}>
            Confirmar rechazo
          </p>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textMuted }}>
            El comentario será enviado al profesor como notificación.
          </p>

          <label style={{
            display: "block", fontSize: 11, fontWeight: 700,
            color: C.textDisabled, textTransform: "uppercase",
            letterSpacing: "0.07em", marginBottom: 5,
          }}>
            Motivo del rechazo <span style={{ color: C.danger }}>*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Explica el motivo del rechazo…"
            value={comentario}
            onChange={onComentarioChange}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 12px", borderRadius: RADIUS.md, fontSize: 12,
              background: C.bgInput,
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
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger, lineHeight: 1.55 }}>
              {errores.accion}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onCancelar} style={{
              flex: 1, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
              fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted,
            }}>
              Cancelar
            </button>
            <button
              onClick={onConfirmarRechazo}
              disabled={procesando}
              style={{
                flex: 2, padding: "8px", borderRadius: RADIUS.md, fontSize: 12,
                fontWeight: 700, cursor: procesando ? "wait" : "pointer", fontFamily: "inherit",
                opacity: procesando ? 0.6 : 1,
                background: C.danger, border: "none", color: "#fff",
              }}
            >
              {procesando ? "Rechazando…" : "Confirmar rechazo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
