import { RADIUS } from "@/themes/colors";
import { TipoBadge } from "./TipoBadge";
import { MOTIVOS_NO_EDITABLE, textoHoraInhabil } from "../hooks/calendarioAdaptador";

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

export function EventoRow({ ev, index, total, hoy, diaSelec, modo, evActivoId, puedeAdministrar, guardando, recienCreado, onEditar, onEliminar, onCancelar, onConfirmarEliminar, C }) {
  const eliminandoEste = modo === "eliminar" && evActivoId === ev.id;
  const modoActivo     = modo !== null;
  const esFuturo       = fechaPrincipal(ev) >= hoy;
  const resaltado      =
    ev.tipo === "Día inhábil"        ? ev.fecha         === diaSelec
    : ev.tipo === "Periodo vacacional" ? ev.fechaInicioVac === diaSelec
    : ev.fechaInicio === diaSelec;

  const fechaTexto =
    ev.tipo === "Día inhábil"
      ? `${formatFechaDisplay(ev.fecha)} · ${textoHoraInhabil(ev)}`
    : ev.tipo === "Periodo vacacional"
      ? `${formatFechaDisplay(ev.fechaInicioVac)} — ${formatFechaDisplay(ev.fechaFinVac)}`
    : `${formatFechaDisplay(ev.fechaInicio)} — ${formatFechaDisplay(ev.fechaTermino)}`;

  const motivoNoEditable = MOTIVOS_NO_EDITABLE[ev.motivoNoEditable] ?? "Este evento no puede modificarse.";
  const noEditable       = !ev.editable && !ev.eliminable;

  return (
    <div id={`evento-${ev.id}`}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 220px 140px 140px",
        gap: "1rem", padding: "12px 1.25rem", alignItems: "center",
        borderBottom: index < total - 1 || eliminandoEste ? `1px solid ${C.borderDefault}` : "none",
        background: recienCreado ? "rgba(16,185,129,0.18)" : eliminandoEste ? "rgba(239,68,68,0.04)" : resaltado ? C.accentSoft : "transparent",
        boxShadow: recienCreado ? "inset 3px 0 0 #10b981" : "inset 3px 0 0 transparent",
        transition: "background 0.8s ease, box-shadow 0.8s ease",
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: esFuturo ? C.textPrimary : C.textDisabled }}>
            {ev.nombre}
          </span>
          {ev.tipo === "Periodo de prestación" && (
            <p style={{ margin: "3px 0 0", fontSize: 11, color: C.textDisabled }}>
              Ciclo {ev.anio}/{ev.semestre}
              {ev.fechaLimiteExpediente && ` · Límite expediente: ${formatFechaDisplay(ev.fechaLimiteExpediente)}`}
            </p>
          )}
        </div>
        <span style={{ fontSize: 12, color: esFuturo ? C.textMuted : C.textDisabled }}>{fechaTexto}</span>
        <TipoBadge tipo={ev.tipo} />
        <div style={{ display: "flex", gap: "0.5rem" }} title={puedeAdministrar && ev.tipo === "Día inhábil" && noEditable ? motivoNoEditable : undefined}>
          {puedeAdministrar && ev.tipo === "Día inhábil" && (() => {
            const bloqueaEditar   = modoActivo || !ev.editable;
            const bloqueaEliminar = modoActivo || !ev.eliminable;
            const estiloBoton = (bloqueado) => ({
              padding: "5px 10px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 500,
              cursor: bloqueado ? "default" : "pointer", background: "transparent",
              border: `1px solid ${C.borderDefault}`,
              color: bloqueado ? C.textDisabled : C.textMuted, fontFamily: "inherit",
              opacity: bloqueado ? 0.4 : 1,
            });
            return (
              <>
                <button onClick={() => onEditar(ev)} disabled={bloqueaEditar} style={estiloBoton(bloqueaEditar)}>Editar</button>
                <button onClick={() => onEliminar(ev)} disabled={bloqueaEliminar} style={estiloBoton(bloqueaEliminar)}>Eliminar</button>
              </>
            );
          })()}
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
            <button onClick={onCancelar} disabled={guardando} style={{
              padding: "6px 14px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 500,
              cursor: guardando ? "default" : "pointer", background: "transparent",
              border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontFamily: "inherit",
            }}>Cancelar</button>
            <button onClick={onConfirmarEliminar} disabled={guardando} style={{
              padding: "6px 14px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 700,
              cursor: guardando ? "default" : "pointer", background: C.danger, border: "none", color: "#fff", fontFamily: "inherit",
              opacity: guardando ? 0.6 : 1,
            }}>{guardando ? "Eliminando…" : "Sí, eliminar"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
