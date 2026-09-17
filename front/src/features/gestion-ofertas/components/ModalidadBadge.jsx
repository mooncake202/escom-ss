import { RADIUS } from "@/themes/colors";

export function ModalidadBadge({ modalidad }) {
  const esIndividual = modalidad === "individual";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: RADIUS.full,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      background: esIndividual ? "rgba(99,102,241,0.12)" : "rgba(16,185,129,0.1)",
      color: esIndividual ? "#818cf8" : "#10b981",
      border: `1px solid ${esIndividual ? "rgba(99,102,241,0.3)" : "rgba(16,185,129,0.3)"}`,
    }}>
      {esIndividual ? "Individual" : "Proyecto"}
    </span>
  );
}
