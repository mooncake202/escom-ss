import { RADIUS } from "@/themes/colors";

function Dato({ etiqueta, valor, color, C }) {
  return (
    <div>
      <p style={{
        margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {etiqueta}
      </p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: color ?? C.textPrimary }}>
        {valor}
      </p>
    </div>
  );
}

// Panel de situación actual. Un profesor tiene 0 o 1 característica vigente: cuando no tiene
// ninguna es "Profesor base", que no es una fila del catálogo sino la ausencia de característica.
export function CaracteristicasActuales({ profesor, C }) {
  const { caracteristicaVigente, cuposTotales, ocupados, cuposBase } = profesor;
  const sinCupos = ocupados >= cuposTotales;

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
    }}>
      <p style={{
        margin: "0 0 0.875rem", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        Mi situación actual
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "flex-start" }}>
        <div>
          <p style={{
            margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.textDisabled,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Característica vigente
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "7px 14px", borderRadius: RADIUS.md,
            background: C.bgInput, border: `1px solid ${C.borderDefault}`,
          }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
              stroke={C.accentText} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
              {caracteristicaVigente ? caracteristicaVigente.nombre : "Profesor base"}
            </span>
            <div style={{ width: 1, height: 14, background: C.borderDefault }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accentText }}>
              {caracteristicaVigente
                ? `${cuposBase} base +${caracteristicaVigente.incrementoCupos}`
                : `${cuposBase} cupos base`}
            </span>
          </div>
        </div>

        <Dato etiqueta="Capacidad total" valor={`${cuposTotales} cupos`} C={C} />
        <Dato
          etiqueta="Cupos ocupados"
          valor={`${ocupados} de ${cuposTotales}`}
          color={sinCupos ? C.warning : C.textPrimary}
          C={C}
        />
      </div>

      <p style={{ margin: "0.875rem 0 0", fontSize: 11, color: C.textDisabled, lineHeight: 1.5 }}>
        Solo puedes tener una característica a la vez: la que solicites reemplazará a la vigente.
        Los cupos ocupados son los alumnos que hoy dependen de ti; un cambio que deje menos cupos
        que alumnos asignados no puede solicitarse.
      </p>
    </div>
  );
}
