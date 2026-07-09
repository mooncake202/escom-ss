import { RADIUS } from "@/themes/colors";

export const ESTADO_MAP = {
  pendiente_validacion:   { bg: (C) => C.warningSoft,              color: (C) => C.warning, label: "Pendiente de validación"    },
  validado:               { bg: (C) => C.successSoft,              color: (C) => C.success, label: "Validado por coordinación"  },
  rechazado_coordinacion: { bg: () => "rgba(239,68,68,0.1)",       color: (C) => C.danger,  label: "Rechazado por coordinación" },
};

export function EstatusBadge({ estado, C }) {
  const s = ESTADO_MAP[estado] ?? ESTADO_MAP.pendiente_validacion;
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