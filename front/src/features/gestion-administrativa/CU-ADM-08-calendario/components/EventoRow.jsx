import { RADIUS } from "@/themes/colors";
import { TipoBadge } from "./TipoBadge";

export function formatFechaDisplay(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const meses = ["enero","febrero","marzo","abril","mayo","junio",
                 "julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}`;
}

export function fechaPrincipal(ev) {
  if (ev.tipo === "Día inhábil")        return ev.fecha;
  if (ev.tipo === "Periodo vacacional") return ev.fechaInicioVac;
  return ev.fechaInicio;
}

export function EventoRow({ ev, index, total, hoy, diaSelec, modo, evActivoId, onEditar, onEliminar, onCancelar, onConfirmarEliminar, C }) {
  const eliminandoEste = modo === "eliminar" && evActivoId === ev.id;
  const modoActivo     = modo !== null;
  const esFuturo       = fechaPrincipal(ev) >= hoy;
  const resaltado      =
    ev.tipo === "Día inhábil"        ? ev.fecha         === diaSelec
    : ev.tipo === "Periodo vacacional" ? ev.fechaInicioVac === diaSelec
    : ev.fechaInicio === diaSelec;

  const fechaTexto =
    ev.tipo === "Día inhábil"
      ? formatFechaDisplay(ev.fecha) + (ev.hora ? ` · ${ev.hora} hrs` : "")
    : ev.tipo === "Periodo vacacional"
      ? `${formatFechaDisplay(ev.fechaInicioVac)} — ${formatFechaDisplay(ev.fechaFinVac)}`
    : `${formatFechaDisplay(ev.fechaInicio)} — ${formatFechaDisplay(ev.fechaTermino)}`;

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 220px 140px 140px",
        gap: "1rem", padding: "12px 1.25rem", alignItems: "center",
        borderBottom: index < total - 1 || eliminandoEste ? `1px solid ${C.borderDefault}` : "none",
        background: eliminandoEste ? "rgba(239,68,68,0.04)" : resaltado ? C.accentSoft : "transparent",
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: esFuturo ? C.textPrimary : C.textDisabled }}>
            {ev.nombre}
          </span>
          {ev.tipo === "Periodo de prestación" && ev.fechaLimiteExpediente && (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: C.textDisabled }}>
              Límite expediente: {formatFechaDisplay(ev.fechaLimiteExpediente)}
            </p>
          )}
        </div>
        <span style={{ fontSize: 12, color: esFuturo ? C.textMuted : C.textDisabled }}>{fechaTexto}</span>
        <TipoBadge tipo={ev.tipo} />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => onEditar(ev)} disabled={modoActivo} style={{
            padding: "5px 10px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 500,
            cursor: modoActivo ? "default" : "pointer", background: "transparent",
            border: `1px solid ${C.borderDefault}`,
            color: modoActivo ? C.textDisabled : C.textMuted, fontFamily: "inherit",
          }}>Editar</button>
          <button onClick={() => onEliminar(ev)} disabled={modoActivo} style={{
            padding: "5px 10px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 500,
            cursor: modoActivo ? "default" : "pointer", background: "transparent",
            border: `1px solid ${modoActivo ? C.borderDefault : C.danger}`,
            color: modoActivo ? C.textDisabled : C.danger, fontFamily: "inherit",
          }}>Eliminar</button>
        </div>
      </div>

      {eliminandoEste && (
        <div style={{
          padding: "0.875rem 1.25rem",
          background: "rgba(239,68,68,0.06)", borderTop: `1px solid ${C.danger}`,
          borderBottom: index < total - 1 ? `1px solid ${C.borderDefault}` : "none",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: C.danger, fontWeight: 500 }}>
            ¿Eliminar <strong>"{ev.nombre}"</strong> del calendario?
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onCancelar} style={{
              padding: "6px 14px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 500,
              cursor: "pointer", background: "transparent",
              border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontFamily: "inherit",
            }}>Cancelar</button>
            <button onClick={onConfirmarEliminar} style={{
              padding: "6px 14px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 700,
              cursor: "pointer", background: C.danger, border: "none", color: "#fff", fontFamily: "inherit",
            }}>Sí, eliminar</button>
          </div>
        </div>
      )}
    </div>
  );
}
