import { RADIUS } from "@/themes/colors";
import { ESTADO_CONFIG } from "./SolicitudCard";

const TIPO_SS  = { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" };
const ESTADOS  = ["Pendiente de revisión", "En revisión", "Aprobada", "Rechazada"];

export function SolicitudDetalle({ solicitud, onActualizarEstado, C }) {
  const estadoCfg = ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG["Pendiente de revisión"];
  const tipoCfg   = TIPO_SS;

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, overflow: "hidden",
    }}>
      {/* Encabezado */}
      <div style={{
        padding: "1.25rem 1.5rem", background: C.bgInput,
        borderBottom: `1px solid ${C.borderDefault}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
            {solicitud.alumno}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
            {solicitud.correo}
          </p>
        </div>
        <span style={{
          fontSize: 12, padding: "3px 10px", borderRadius: RADIUS.full,
          background: tipoCfg.bg, color: tipoCfg.color, fontWeight: 600, flexShrink: 0,
        }}>
          {solicitud.tipo}
        </span>
      </div>

      <div style={{ padding: "1.25rem 1.5rem" }}>

        {/* Datos de la solicitud */}
        <div style={{ marginBottom: "1.25rem" }}>
          {[
            { label: "Solicitado por", valor: solicitud.solicitante },
            { label: "Fecha de envío", valor: solicitud.fechaEnvio  },
            { label: "Boleta",         valor: solicitud.boleta       },
          ].map(({ label, valor }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              padding: "7px 0", borderBottom: `1px solid ${C.borderSubtle}`,
              gap: "1rem",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textDisabled }}>{label}</span>
              <span style={{ fontSize: 12, color: C.textPrimary, textAlign: "right" }}>{valor}</span>
            </div>
          ))}
        </div>

        {/* Expediente adjunto */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{
            margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: C.textDisabled,
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            Expediente adjunto
          </p>
          {solicitud.expediente ? (
            <a
              href={solicitud.expediente}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: RADIUS.md,
                background: C.bgInput, border: `1px solid ${C.borderDefault}`,
                color: C.accentText, fontSize: 12, fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Ver expediente PDF
            </a>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
              Sin expediente adjunto.
            </p>
          )}
        </div>

        {/* Estado actual */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{
            margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: C.textDisabled,
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            Estado actual
          </p>
          <span style={{
            display: "inline-block", padding: "4px 14px", borderRadius: RADIUS.full,
            background: estadoCfg.bg, color: estadoCfg.color,
            fontSize: 13, fontWeight: 700, border: `1px solid ${estadoCfg.border}`,
          }}>
            {solicitud.estado}
          </span>
        </div>

        {/* Actualizar estado */}
        {solicitud.estado !== "Aprobada" && solicitud.estado !== "Rechazada" && (
          <div>
            <p style={{
              margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: C.textDisabled,
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>
              Actualizar estado
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {ESTADOS
                .filter(e => e !== solicitud.estado)
                .map(estado => {
                  const cfg     = ESTADO_CONFIG[estado];
                  const esDanger = estado === "Rechazada";
                  return (
                    <button
                      key={estado}
                      onClick={() => onActualizarEstado(solicitud.id, estado)}
                      style={{
                        padding: "8px 16px", borderRadius: RADIUS.md,
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit",
                        background: esDanger ? "transparent" : cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        color: cfg.color,
                      }}
                    >
                      Marcar como {estado}
                    </button>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* Mensaje cuando ya está resuelta */}
        {(solicitud.estado === "Aprobada" || solicitud.estado === "Rechazada") && (
          <div style={{
            padding: "10px 14px", borderRadius: RADIUS.md,
            background: estadoCfg.bg, border: `1px solid ${estadoCfg.border}`,
            fontSize: 12, color: estadoCfg.color, fontWeight: 500,
          }}>
            {solicitud.estado === "Aprobada"
              ? "✓ Solicitud aprobada. El alumno fue notificado en el sistema."
              : "✕ Solicitud rechazada. El alumno fue notificado en el sistema."}
          </div>
        )}
      </div>
    </div>
  );
}