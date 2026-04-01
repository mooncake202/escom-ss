import { useTheme } from "@/themes/colors";

export function Campo({ label, required, hint, error, children }) {
  const { C } = useTheme();

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
      }}>
        {label} {required && <span style={{ color: C.danger }}>*</span>}
      </label>

      {children}

      {hint && !error && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.textDisabled }}>
          {hint}
        </p>
      )}

      {error && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}
