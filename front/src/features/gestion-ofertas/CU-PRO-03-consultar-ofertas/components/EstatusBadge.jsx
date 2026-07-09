import { useTheme, RADIUS } from "@/themes/colors";

export function EstatusBadge({ estado }) {
  const { C } = useTheme();
  const map = {
    aprobado:  { bg: C.successSoft, color: C.success,  label: "Aprobado"  },
    rechazado: { bg: C.dangerSoft,  color: C.danger,   label: "Rechazado" },
    pendiente: { bg: C.warningSoft, color: C.warning,  label: "Pendiente" },
  };
  const s = map[estado] || map.pendiente;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: RADIUS.full,
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}