import { RADIUS } from "@/themes/colors";

export const ESTADO_MAP = {
  aprobado:           { bg: (C) => C.successSoft,                color: (C) => C.success,    label: "Aprobado" },
  rechazado_profesor: { bg: () => "rgba(239,68,68,0.1)",         color: (C) => C.danger,     label: "Rechazado" },
  pendiente_revision: { bg: (C) => C.warningSoft,               color: (C) => C.warning,    label: "Pendiente de revisión" },
  pendiente_firma:    { bg: (C) => C.accentSoft,                color: (C) => C.accentText, label: "Pendiente de firma" },
};

export function EstatusBadge({ estado, C }) {
  const s = ESTADO_MAP[estado] || ESTADO_MAP.pendiente_firma;
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
