export function PasoCirculo({ completado, activo, rechazado, numero, C }) {
  let bg, border, color;
  if (rechazado) {
    bg = "rgba(239,68,68,0.1)"; border = C.danger; color = C.danger;
  } else if (completado) {
    bg = C.successSoft; border = C.success; color = C.success;
  } else if (activo) {
    bg = C.warningSoft; border = C.warning; color = C.warning;
  } else {
    bg = C.bgInput; border = C.borderDefault; color = C.textDisabled;
  }

  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: bg, border: `2px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, zIndex: 1, fontSize: 13, fontWeight: 700, color,
    }}>
      {rechazado ? "✕" : completado ? "✓" : numero}
    </div>
  );
}
