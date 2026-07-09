import { useTheme, RADIUS } from "@/themes/colors";

export function ModalidadBadge({ modalidad }) {
  const { C } = useTheme();
  const esIndividual = modalidad === "individual";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: RADIUS.full,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      background: esIndividual ? "rgba(99,102,241,0.12)" : C.bgInput,
      color: esIndividual ? "#818cf8" : C.textMuted,
      border: `1px solid ${esIndividual ? "rgba(99,102,241,0.3)" : C.borderDefault}`,
    }}>
      {esIndividual ? "Individual" : "Grupal"}
    </span>
  );
}