import { RADIUS } from "@/themes/colors";

export function TipoBadge({ tipo }) {
  const esIndividual = tipo === "individual";
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: RADIUS.full,
      background: esIndividual ? "rgba(99,102,241,0.12)" : "rgba(16,185,129,0.1)",
      color: esIndividual ? "#818cf8" : "#10b981",
      fontSize: 12, fontWeight: 600,
    }}>
      {esIndividual ? "Individual" : "Proyecto"}
    </span>
  );
}