import { GRADIENTS } from "../../themes/colors";

export function StepProgressBar({ step, steps, C }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        {steps.map((label, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i < step ? C.accent : i === step ? C.accentHover : "transparent",
              border: i <= step ? `2px solid ${C.accentHover}` : `2px solid ${C.textDisabled}`,
              color: i <= step ? C.textInverse : C.textDisabled,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, transition: "all 0.3s ease",
              boxShadow: i === step ? `0 0 0 4px ${C.accentSoft}` : "none",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 11, marginTop: 6,
              fontWeight: i === step ? 600 : 400,
              color: i === step ? C.accentText : i < step ? C.textMuted : C.textDisabled,
              letterSpacing: "0.03em", textAlign: "center",
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", height: 3, background: C.borderSubtle, borderRadius: 2, marginTop: 4 }}>
        <div style={{
          position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 2,
          background: GRADIENTS.progress,
          width: `${(step / (steps.length - 1)) * 100}%`,
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}
