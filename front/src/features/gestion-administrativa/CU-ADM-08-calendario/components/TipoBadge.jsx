import { RADIUS } from "@/themes/colors";

export const TIPO_CONFIG = {
  "Periodo de prestación": { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  dot: "#3b82f6" },
  "Día inhábil":           { color: "#ef4444", bg: "rgba(239,68,68,0.10)",   dot: "#ef4444" },
  "Periodo vacacional":    { color: "#6b7280", bg: "rgba(107,114,128,0.12)", dot: "#6b7280" },
};

export function TipoBadge({ tipo }) {
  const s = TIPO_CONFIG[tipo] || { color: "#6b7280", bg: "rgba(107,114,128,0.12)" };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: RADIUS.full,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {tipo}
    </span>
  );
}