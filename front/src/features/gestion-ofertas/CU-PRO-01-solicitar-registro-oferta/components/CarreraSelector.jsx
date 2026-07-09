import { useTheme, RADIUS } from "@/themes/colors";

const CARRERAS = [
  { key: "ISC", label: "ISC — Ingeniería en Sistemas Computacionales" },
  { key: "LCD", label: "LCD — Licenciatura en Ciencia de Datos" },
  { key: "IIA", label: "IIA — Ingeniería en Inteligencia Artificial" },
];

export function CarreraSelector({ value = [], onToggle, error }) {
  const { C } = useTheme();
  return (
    <div>
      {error && (
        <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger }}>{error}</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {CARRERAS.map(({ key, label }) => {
          const checked = value.includes(key);
          return (
            <label key={key} style={{
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              padding: "7px 10px", borderRadius: RADIUS.md,
              background: checked ? C.accentSoft : "transparent",
              border: `1px solid ${checked ? C.accent : "transparent"}`,
            }}>
              <input
                type="checkbox" checked={checked} onChange={() => onToggle(key)}
                style={{ accentColor: C.accent, width: 15, height: 15, cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, color: checked ? C.textPrimary : C.textMuted }}>{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}