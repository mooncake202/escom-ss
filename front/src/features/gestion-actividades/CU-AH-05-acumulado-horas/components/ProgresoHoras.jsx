import { RADIUS } from "@/themes/colors";

// ── Círculo de progreso principal ────────────────────────────
export function ProgresoCircular({ porcentaje, horasRealizadas, horasTotales, C }) {
  const radio   = 70;
  const circunf = 2 * Math.PI * radio;
  const offset  = circunf * (1 - porcentaje / 100);
  const color   = porcentaje >= 90 ? "#22C55E" : porcentaje >= 50 ? "#2E86DE" : "#F59E0B";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      <div style={{ position: "relative", width: 180, height: 180 }}>
        <svg width={180} height={180} viewBox="0 0 180 180">
          {/* Fondo */}
          <circle cx={90} cy={90} r={radio} fill="none" stroke={C.borderSubtle} strokeWidth={10} />
          {/* Progreso */}
          <circle
            cx={90} cy={90} r={radio} fill="none"
            stroke={color} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={circunf} strokeDashoffset={offset}
            transform="rotate(-90 90 90)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{porcentaje}%</span>
          <span style={{ fontSize: 12, color: C.textDisabled, marginTop: 4 }}>completado</span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: C.textMuted, textAlign: "center" }}>
        <strong style={{ color: C.textPrimary }}>{horasRealizadas}</strong> de <strong style={{ color: C.textPrimary }}>{horasTotales}</strong> horas requeridas
      </p>
    </div>
  );
}

// ── Tarjetas de métricas ─────────────────────────────────────
export function MetricaCards({ datos, C }) {
  const faltasSeguidasAlerta = datos.faltasSeguidas >= 4;   // aviso desde 4/5
  const faltasTotalAlerta    = datos.faltasTotal    >= 15;  // aviso desde 15/18

  const tarjetas = [
    {
      label:  "Horas realizadas",
      valor:  datos.horasRealizadas,
      unidad: "h",
      color:  "#2E86DE",
      bg:     "rgba(10,102,194,0.1)",
      desc:   `de ${datos.horasTotales}h requeridas`,
    },
    {
      label:  "Horas restantes",
      valor:  datos.horasRestantes,
      unidad: "h",
      color:  C.textPrimary,
      bg:     C.bgCard,
      desc:   "para completar el servicio",
    },
    {
      label:  "Horas rechazadas",
      valor:  datos.horasRechazadas,
      unidad: "h",
      color:  datos.horasRechazadas > 0 ? "#EF4444" : C.textDisabled,
      bg:     datos.horasRechazadas > 0 ? "rgba(239,68,68,0.1)" : C.bgInput,
      desc:   "no acreditadas",
    },
    {
      label:  "Faltas seguidas",
      valor:  datos.faltasSeguidas,
      unidad: `/ 5`,
      color:  faltasSeguidasAlerta ? "#EF4444" : datos.faltasSeguidas > 0 ? "#F59E0B" : "#22C55E",
      bg:     faltasSeguidasAlerta ? "rgba(239,68,68,0.1)" : datos.faltasSeguidas > 0 ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
      desc:   faltasSeguidasAlerta ? "⚠️ cerca del límite" : "consecutivas registradas",
    },
    {
      label:  "Faltas totales",
      valor:  datos.faltasTotal,
      unidad: `/ 18`,
      color:  faltasTotalAlerta ? "#EF4444" : datos.faltasTotal > 0 ? "#F59E0B" : "#22C55E",
      bg:     faltasTotalAlerta ? "rgba(239,68,68,0.1)" : datos.faltasTotal > 0 ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
      desc:   faltasTotalAlerta ? "⚠️ cerca del límite" : "acumuladas en total",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
      {tarjetas.map(({ label, valor, unidad, color, bg, desc }) => (
        <div key={label} style={{ padding: "1rem 1.25rem", borderRadius: RADIUS.lg, background: bg, border: `1px solid ${C.borderSubtle}` }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
          <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
            {valor}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>{unidad}</span>
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{desc}</p>
        </div>
      ))}
    </div>
  );
}

// ── Barra de progreso detallada ──────────────────────────────
export function BarraProgreso({ datos, C }) {
  const pctRealizado  = (datos.horasRealizadas / datos.horasTotales) * 100;
  const pctRechazado  = (datos.horasRechazadas / datos.horasTotales) * 100;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>Progreso acumulado</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>{datos.horasRealizadas}h / {datos.horasTotales}h</span>
      </div>
      <div style={{ height: 10, background: C.borderSubtle, borderRadius: 5, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${pctRealizado}%`, background: "#2E86DE", transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#2E86DE" }} />
          <span style={{ fontSize: 11, color: C.textDisabled }}>Realizadas</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: C.borderSubtle }} />
          <span style={{ fontSize: 11, color: C.textDisabled }}>Restantes</span>
        </div>
      </div>
    </div>
  );
}
