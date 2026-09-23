import { RADIUS } from "@/themes/colors";
import { ESTADO_CONFIG, fechaLegible } from "./estadosBaja";

const ORIGEN_LABEL = { alumno: "Solicitada por el alumno", profesor: "Solicitada por su profesor" };

export function SolicitudCard({ solicitud, seleccionada, onSeleccionar, C }) {
  const cfg = ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG.pendiente;

  return (
    <div
      onClick={() => onSeleccionar(solicitud)}
      style={{
        padding: "0.875rem 1.125rem",
        borderRadius: RADIUS.md,
        background: seleccionada ? C.accentSoft : C.bgCard,
        border: `1px solid ${seleccionada ? C.accent : C.borderDefault}`,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.3,
          color: seleccionada ? C.accentText : C.textPrimary,
        }}>
          {solicitud.alumno.nombre}
        </p>
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700,
          padding: "2px 8px", borderRadius: RADIUS.full,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        }}>
          {cfg.label}
        </span>
      </div>

      <p style={{ margin: "0 0 4px", fontSize: 12, color: C.textMuted }}>
        {solicitud.alumno.boleta} · {ORIGEN_LABEL[solicitud.origen]}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
        {solicitud.estado === "pendiente"
          ? fechaLegible(solicitud.fecha)
          : `Resuelta el ${fechaLegible(solicitud.fechaRespuesta)}`}
      </p>

      {/* El expediente de ADM-11 puede pasar semanas con las autoridades del Instituto. */}
      {solicitud.enRevisionInstitucional && (
        <p style={{ margin: "6px 0 0", fontSize: 10, fontWeight: 700, color: "#3b82f6" }}>
          En revisión institucional
        </p>
      )}
    </div>
  );
}
