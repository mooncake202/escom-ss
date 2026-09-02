import { GRADIENTS, RADIUS } from "@/themes/colors";

export function JornadaTimer({ segundos, limiteSeg, limiteHoras, porcentaje, onFinalizar, C }) {
  const radio   = 54;
  const circunf = 2 * Math.PI * radio;
  const offset  = circunf * (1 - porcentaje / 100);

  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const tiempo = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  const restante = Math.max(limiteSeg - segundos, 0);
  const rh = Math.floor(restante / 3600);
  const rm = Math.floor((restante % 3600) / 60);

  const color = porcentaje >= 90 ? "#EF4444" : porcentaje >= 70 ? "#F59E0B" : "#2E86DE";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "2rem 0" }}>

      {/* Reloj circular */}
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx={70} cy={70} r={radio} fill="none" stroke={C.borderSubtle} strokeWidth={6} />
          <circle
            cx={70} cy={70} r={radio} fill="none"
            stroke={color} strokeWidth={6} strokeLinecap="round"
            strokeDasharray={circunf} strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 0.5s, stroke 0.5s" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: "'DM Mono', monospace", letterSpacing: "0.02em" }}>
            {tiempo}
          </span>
          <span style={{ fontSize: 11, color: C.textDisabled, marginTop: 2 }}>transcurrido</span>
        </div>
      </div>

      {/* Info tiempo restante */}
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: C.textMuted }}>
          Límite por día: <strong style={{ color: C.textPrimary }}>{limiteHoras} horas</strong>
        </p>
        <p style={{ margin: 0, fontSize: 13, color: restante < 1800 ? "#EF4444" : C.textMuted }}>
          Tiempo restante: <strong style={{ color: restante < 1800 ? "#EF4444" : C.textPrimary }}>
            {rh > 0 ? `${rh}h ` : ""}{rm}min
          </strong>
        </p>
      </div>

      {/* Barra de progreso lineal */}
      <div style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ height: 6, background: C.borderSubtle, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${porcentaje}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.5s, background 0.5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: C.textDisabled }}>0h</span>
          <span style={{ fontSize: 11, color: C.textDisabled }}>{limiteHoras}h</span>
        </div>
      </div>

      {/* Botón finalizar */}
      <button
        onClick={onFinalizar}
        style={{
          padding: "12px 40px", borderRadius: RADIUS.md,
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          background: "transparent",
          border: `2px solid ${C.danger}`,
          color: C.danger, fontFamily: "inherit",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.dangerSoft; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        Finalizar jornada
      </button>
    </div>
  );
}
