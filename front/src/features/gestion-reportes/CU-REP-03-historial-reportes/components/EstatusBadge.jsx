import { RADIUS } from "@/themes/colors";
import { estadoAlumnoDe } from "../../CU-REP-02-consultar-estatus-reporte/seguimientoReportes";

export function EstatusBadge({ estado, C }) {
  const s = estadoAlumnoDe(estado);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: RADIUS.full,
      background: s.bg(C), color: s.color(C),
      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color(C) }} />
      {s.label}
    </span>
  );
}
