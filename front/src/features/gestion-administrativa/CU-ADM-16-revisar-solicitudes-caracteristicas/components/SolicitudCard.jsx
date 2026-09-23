import { RADIUS } from "@/themes/colors";

const fechaLegible = (valor) => (valor
  ? new Date(valor).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
  : null);

const ESTADO_ESTILO = {
  pendiente: { bg: "rgba(234,179,8,0.12)", color: "#ca8a04", borde: "rgba(234,179,8,0.3)", texto: "Pendiente" },
  aprobada:  { bg: "rgba(34,197,94,0.12)", color: "#16A34A", borde: "rgba(34,197,94,0.3)", texto: "Aprobada" },
  rechazada: { bg: "rgba(239,68,68,0.12)", color: "#DC2626", borde: "rgba(239,68,68,0.3)", texto: "Rechazada" },
};

// Una solicitud sin característica pide volver a Profesor base (caracteristica_id = null).
export function SolicitudCard({ solicitud, seleccionada, onSeleccionar, C }) {
  const destino = solicitud.caracteristicaSolicitada?.nombre ?? "Profesor base";
  const estilo = ESTADO_ESTILO[solicitud.estado] ?? ESTADO_ESTILO.pendiente;
  const pendiente = solicitud.estado === "pendiente";

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
          background: estilo.bg, color: estilo.color,
          border: `1px solid ${estilo.borde}`,
        }}>
          {estilo.texto}
        </span>
      </div>

      <p style={{ margin: "0 0 4px", fontSize: 12, color: C.textMuted }}>
        Solicita:{" "}
        <span style={{ fontWeight: 600, color: seleccionada ? C.accentText : C.textPrimary }}>
          {destino}
        </span>
      </p>
      <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
        {pendiente
          ? fechaLegible(solicitud.fecha)
          : `Resuelta el ${fechaLegible(solicitud.fechaRespuesta) ?? "—"}`}
      </p>

      {/* Aviso temprano: ya no cabe en la capacidad que dejaría el cambio. */}
      {pendiente && !solicitud.puedeAprobarse && (
        <p style={{ margin: "6px 0 0", fontSize: 10, fontWeight: 700, color: C.danger }}>
          ⚠ Ya no se puede aprobar
        </p>
      )}
    </div>
  );
}
