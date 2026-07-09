import { useTheme, RADIUS } from "@/themes/colors";

export function EstatusBadge({ estatus }) {
  const { C } = useTheme();
  const map = {
    activo:      { bg: C.successSoft,  color: C.success,    label: "Activo"      },
    en_revision: { bg: C.warningSoft,  color: C.warning,    label: "En revisión" },
    concluido:   { bg: C.accentSoft,   color: C.accentText, label: "Concluido"   },
    cerrado:     { bg: C.bgInput,      color: C.textMuted,  label: "Cerrado"     },
    rechazada:   { bg: C.dangerSoft,   color: C.danger,     label: "Rechazada"   },
  };
  const s = map[estatus] || map.cerrado;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: RADIUS.full,
      background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}