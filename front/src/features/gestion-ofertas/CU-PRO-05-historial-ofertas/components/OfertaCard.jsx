import { useTheme, RADIUS } from "@/themes/colors";
import { EstatusBadge } from "./EstatusBadge";
import { TipoBadge } from "./TipoBadge";

function formatFecha(iso) {
  if (!iso) return null;
  return new Date(iso + "T00:00:00").toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function OfertaCard({ oferta, seleccionadaId, onSelect }) {
  const { C } = useTheme();
  const isSelected  = seleccionadaId === oferta.id;
  const esFinal     = oferta.estatus === "concluido" || oferta.estatus === "cerrado";
  const esRechazada = oferta.estatus === "rechazada";
  return (
    <div onClick={() => onSelect(oferta)} style={{
      background: C.bgCard, borderRadius: RADIUS.xl,
      border: `1px solid ${isSelected ? C.accent : esRechazada ? C.danger + "55" : C.borderDefault}`,
      padding: "1rem 1.25rem", cursor: "pointer",
      opacity: esFinal ? 0.72 : 1,
      boxShadow: isSelected ? `0 0 0 2px ${C.accent}28` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
            {oferta.titulo}
          </p>
          {oferta.fechaRegistro && (
            <p style={{ margin: "0 0 8px", fontSize: 12, color: C.textDisabled }}>
              {formatFecha(oferta.fechaRegistro)}
            </p>
          )}
          <TipoBadge tipo={oferta.tipo} />
        </div>
        <EstatusBadge estatus={oferta.estatus} />
      </div>
    </div>
  );
}