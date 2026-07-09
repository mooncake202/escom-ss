import { RADIUS } from "@/themes/colors";

export function OrigenBadge({ origen }) {
  const isCoord = origen === "coordinacion";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 9px", borderRadius: RADIUS.full,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      background: isCoord ? "rgba(0,58,143,0.13)" : "rgba(139,92,246,0.13)",
      color: isCoord ? "#4A90D9" : "#a78bfa",
    }}>
      {isCoord ? "Coordinación" : "Profesor"}
    </span>
  );
}
