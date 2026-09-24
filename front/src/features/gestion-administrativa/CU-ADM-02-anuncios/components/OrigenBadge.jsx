import { RADIUS } from "@/themes/colors";

// `origen` es el enum OrigenAnuncio del esquema: 'coordinador' | 'profesor'.
export function OrigenBadge({ origen }) {
  const esCoordinacion = origen === "coordinador";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 9px", borderRadius: RADIUS.full,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      background: esCoordinacion ? "rgba(0,58,143,0.13)" : "rgba(139,92,246,0.13)",
      color: esCoordinacion ? "#4A90D9" : "#a78bfa",
    }}>
      {esCoordinacion ? "Coordinación" : "Profesor"}
    </span>
  );
}