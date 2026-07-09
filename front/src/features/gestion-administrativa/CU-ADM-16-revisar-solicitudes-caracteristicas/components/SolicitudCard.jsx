import { RADIUS } from "@/themes/colors";

export function SolicitudCard({ solicitud, seleccionada, onSeleccionar, C }) {
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
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 8, marginBottom: 6,
      }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 700,
          color: seleccionada ? C.accentText : C.textPrimary,
          lineHeight: 1.3,
        }}>
          {solicitud.profesor.nombre}
        </p>
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700,
          padding: "2px 8px", borderRadius: RADIUS.full,
          background: "rgba(234,179,8,0.12)", color: "#ca8a04",
          border: "1px solid rgba(234,179,8,0.3)",
        }}>
          Pendiente
        </span>
      </div>

      <p style={{ margin: "0 0 4px", fontSize: 12, color: C.textMuted }}>
        Solicita:{" "}
        <span style={{ fontWeight: 600, color: seleccionada ? C.accentText : C.textPrimary }}>
          {solicitud.caracteristica.nombre}
        </span>
      </p>
      <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
        {solicitud.fechaEnvio}
      </p>
    </div>
  );
}
