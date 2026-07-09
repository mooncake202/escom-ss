import { RADIUS } from "@/themes/colors";

export const ESTADO_CONFIG = {
  "Pendiente de revisión": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "#f59e0b" },
  "En revisión":           { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "#3b82f6" },
  "Aprobada":              { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "#22c55e" },
  "Rechazada":             { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "#ef4444" },
};

const TIPO_SS = { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" };

export function SolicitudCard({ solicitud, seleccionada, onSeleccionar, C }) {
  const estado = ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG["Pendiente de revisión"];
  const tipo   = TIPO_SS;

  return (
    <div
      onClick={() => onSeleccionar(solicitud)}
      style={{
        padding: "1rem 1.25rem", borderRadius: RADIUS.lg, cursor: "pointer",
        background: seleccionada ? C.navItemActive : C.bgCard,
        border: `1px solid ${seleccionada ? C.accent : C.borderDefault}`,
        transition: "all 0.15s",
      }}
    >
      {/* Nombre + tipo */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4 }}>
          {solicitud.alumno}
        </p>
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: RADIUS.full,
          background: tipo.bg, color: tipo.color, fontWeight: 600, flexShrink: 0,
        }}>
          {solicitud.tipo}
        </span>
      </div>

      {/* Solicitante + fecha */}
      <p style={{ margin: "0 0 6px", fontSize: 11, color: C.textMuted }}>
        Solicitado por: {solicitud.solicitante} · {solicitud.fechaEnvio}
      </p>

      {/* Estado */}
      <span style={{
        fontSize: 11, padding: "2px 8px", borderRadius: RADIUS.full,
        background: estado.bg, color: estado.color, fontWeight: 600,
        border: `1px solid ${estado.border}`,
      }}>
        {solicitud.estado}
      </span>
    </div>
  );
}