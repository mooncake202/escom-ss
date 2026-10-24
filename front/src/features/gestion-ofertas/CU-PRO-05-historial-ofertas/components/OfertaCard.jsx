import { useTheme, RADIUS } from "@/themes/colors";
import { EstatusBadge } from "./EstatusBadge";
import { ModalidadBadge } from "@/features/gestion-ofertas/components/ModalidadBadge";
import { formatearFechaUTC } from "@/utils/fechas";

// fechaRegistro llega como AAAA-MM-DD (día de México, ya calculado por el backend): se muestra tal cual con
// formatearFechaUTC, igual que CU-PRO-03, para que la zona del navegador no lo corra un día.
function formatFecha(iso) {
  if (!iso) return null;
  return formatearFechaUTC(iso, { day: "2-digit", month: "short", year: "numeric" });
}

export function OfertaCard({ oferta, seleccionadaId, onSelect, destacado }) {
  const { C } = useTheme();
  const isSelected  = seleccionadaId === oferta.id;
  const esFinal     = oferta.estatus === "concluido" || oferta.estatus === "cerrado";

  const colorDestacado = oferta.estatus === "rechazada"   ? C.danger
                        : oferta.estatus === "activo"      ? C.success
                        : oferta.estatus === "en_revision" ? C.warning
                        : C.info;

  return (
    <div onClick={() => onSelect(oferta)} style={{
      background: C.bgCard, borderRadius: RADIUS.xl,
      border: `1px solid ${isSelected ? C.accent : destacado ? colorDestacado : C.borderDefault}`,
      padding: "1rem 1.25rem", cursor: "pointer",
      opacity: esFinal ? 0.72 : 1,
      boxShadow: isSelected ? `0 0 0 2px ${C.accent}28` : destacado ? `0 0 0 2px ${colorDestacado}28` : "none",
      transition: "border-color 0.3s, box-shadow 0.3s",
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
          <ModalidadBadge modalidad={oferta.tipo} />
        </div>
        <EstatusBadge estatus={oferta.estatus} />
      </div>
    </div>
  );
}