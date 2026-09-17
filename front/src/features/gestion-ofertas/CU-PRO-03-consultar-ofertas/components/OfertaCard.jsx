import { useTheme, RADIUS } from "@/themes/colors";
import { EstatusBadge } from "./EstatusBadge";
import { ModalidadBadge } from "@/features/gestion-ofertas/components/ModalidadBadge";

export function OfertaCard({ oferta, seleccionado, onSelect, destacado }) {
  const { C } = useTheme();
  const isSelected = seleccionado?.id === oferta.id;

  const colorDestacado = oferta.estado === "rechazado"   ? C.danger
                       : oferta.estado === "aprobado"     ? C.success
                       : oferta.estado === "pendiente"    ? C.warning
                       : C.info;

  return (
    <button onClick={() => onSelect(oferta)} style={{
      width: "100%", textAlign: "left", cursor: "pointer",
      background: isSelected ? C.accentSoft : C.bgCard,
      borderRadius: RADIUS.lg,
      border: `2px solid ${isSelected ? C.accent : destacado ? colorDestacado : C.borderDefault}`,
      padding: "1rem 1.25rem", fontFamily: "inherit", outline: "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
          {oferta.nombre}
        </p>
        <EstatusBadge estado={oferta.estado} />
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 12, color: C.textMuted }}>{oferta.profesor}</p>
      <ModalidadBadge modalidad={oferta.modalidad} />
    </button>
  );
}