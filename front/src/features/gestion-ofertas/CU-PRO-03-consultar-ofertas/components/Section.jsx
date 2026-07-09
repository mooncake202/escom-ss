import { useTheme } from "@/themes/colors";

export function Section({ label, children, last = false }) {
  const { C } = useTheme();
  return (
    <div style={{ marginBottom: last ? 0 : "1.25rem" }}>
      <p style={{
        margin: "0 0 0.5rem", fontSize: 10, fontWeight: 700,
        color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.1em",
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}