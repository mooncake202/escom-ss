import { useTheme, RADIUS }              from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { DatePicker }                    from "./components/DatePicker";
import { TipoBadge, TIPO_CONFIG }        from "./components/TipoBadge";
import { EventoForm }                    from "./components/EventoForm";
import { EventoRow, formatFechaDisplay } from "./components/EventoRow";
import {
  useCalendarioInstitucional,
  COORDINACION, TIPOS, MESES, DIAS_SEM, ANIOS_DISPONIBLES,
  CICLOS_DISPONIBLES, rangoSemestre,
  getDiasEnMes, getPrimerDia, toISO, esFinDeSemana,
} from "./hooks/useCalendarioInstitucional";

export default function CalendarioInstitucional() {
  const { C } = useTheme();
  const {
    hoy, eventosFiltrados, evsPorFecha, periodosPorFecha,
    mes, setMes, anio, setAnio, diaSelec,
    modo, evActivo, form, errores, toast, ultimaMod, tooltip, setTooltip,
    filtroTipo, setFiltroTipo, filtroDesde, setFiltroDesde, filtroHasta, setFiltroHasta,
    filtroCiclo, setFiltroCiclo,
    filtroPeriodo, setFiltroPeriodo,
    hayFiltroActivo, limpiarFiltros,
    irMesAnterior, irMesSiguiente,
    handleChange, handleClickDia, handleGuardar, handleEliminar,
    abrirNuevo, abrirEditar, abrirEliminar, cancelar,
  } = useCalendarioInstitucional();

  const diasEnMes    = getDiasEnMes(anio, mes);
  const offsetInicio = getPrimerDia(anio, mes);
  const totalCeldas  = Math.ceil((offsetInicio + diasEnMes) / 7) * 7;
  const modoActivo   = modo !== null;

  return (
    <DashboardLayout
      titulo="Calendario institucional"
      subtitulo="CU-ADM-10 · Coordinación"
      rol="coordinacion"
      usuario={COORDINACION.nombre}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>

        {/* Toast */}
        {toast && (
          <div style={{
            marginBottom: "1.25rem", padding: "11px 16px", borderRadius: RADIUS.md,
            background: toast.tipo === "danger" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            border: `1px solid ${toast.tipo === "danger" ? C.danger : "#10b981"}`,
            color: toast.tipo === "danger" ? C.danger : "#10b981",
            fontSize: 13, fontWeight: 500,
          }}>
            {toast.msg}
          </div>
        )}

        {/* ── CALENDARIO MENSUAL ── */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          marginBottom: "1.25rem", overflow: "hidden",
        }}>

          {/* Cabecera */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.875rem 1.25rem", gap: "1rem",
            borderBottom: `1px solid ${C.borderDefault}`, background: C.bgInput,
          }}>
            {/* Navegador mes */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={irMesAnterior} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", borderRadius: RADIUS.sm }}
                onMouseEnter={e => e.currentTarget.style.color = C.textPrimary}
                onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, minWidth: 100, textAlign: "center", userSelect: "none" }}>
                {MESES[mes]}
              </span>
              <button onClick={irMesSiguiente} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center", padding: "4px", borderRadius: RADIUS.sm }}
                onMouseEnter={e => e.currentTarget.style.color = C.textPrimary}
                onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            {/* Selector año + última mod */}
            <div style={{ textAlign: "center" }}>
              <select value={anio} onChange={e => setAnio(Number(e.target.value))} style={{
                padding: "5px 10px", borderRadius: RADIUS.md,
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                color: C.textPrimary, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", outline: "none",
                display: "block", margin: "0 auto 3px",
              }}>
                {ANIOS_DISPONIBLES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
                Última mod.: <strong style={{ color: C.textMuted }}>{ultimaMod}</strong>
              </p>
            </div>
          </div>

          {/* Encabezado días semana */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${C.borderDefault}` }}>
            {DIAS_SEM.map((d, i) => (
              <div key={d} style={{
                padding: "6px 4px", textAlign: "center", fontSize: 11, fontWeight: 700,
                color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.05em",
                borderRight: i < 6 ? `1px solid ${C.borderDefault}` : "none",
                opacity: i === 0 || i === 6 ? 0.45 : 1,
              }}>{d}</div>
            ))}
          </div>

          {/* Celdas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {Array.from({ length: totalCeldas }, (_, idx) => {
              const diaNum   = idx - offsetInicio + 1;
              const esValido = diaNum >= 1 && diaNum <= diasEnMes;
              const col      = idx % 7;
              const fila     = Math.floor(idx / 7);
              const filas    = totalCeldas / 7;
              const esFinSem = col === 0 || col === 6;
              const borderRight  = col < 6 ? `1px solid ${C.borderDefault}` : "none";
              const borderBottom = fila < filas - 1 ? `1px solid ${C.borderDefault}` : "none";

              if (!esValido) return <div key={idx} style={{ minHeight: 68, background: C.bgPage, borderRight, borderBottom }} />;

              const fechaISO = toISO(anio, mes, diaNum);
              const todosHoy = evsPorFecha[fechaISO] || [];
              const periodo  = periodosPorFecha[fechaISO];
              const esHoy    = fechaISO === hoy;
              const esSelec  = fechaISO === diaSelec;
              const tiposOtros = [...new Set(todosHoy.filter(ev => ev.tipo !== "Periodo de prestación").map(ev => ev.tipo))];

              let bgCelda = "transparent";
              if (esFinSem) bgCelda = C.bgPage;
              else if (esSelec) bgCelda = C.accentSoft;
              else if (esHoy)   bgCelda = "rgba(99,102,241,0.10)";

              return (
                <div
                  key={idx}
                  onClick={() => !esFinSem && handleClickDia(fechaISO)}
                  style={{ minHeight: 68, padding: "6px 7px", borderRight, borderBottom, background: bgCelda, cursor: esFinSem ? "default" : "pointer", transition: "background 0.12s", userSelect: "none", opacity: esFinSem ? 0.4 : 1, position: "relative" }}
                  onMouseEnter={e => {
                    if (!esFinSem && !esSelec && !esHoy) e.currentTarget.style.background = C.bgInput;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ x: rect.left + rect.width / 2, y: rect.top, fechaISO });
                  }}
                  onMouseLeave={e => { e.currentTarget.style.background = bgCelda; setTooltip(null); }}
                >
                  {periodo?.enRango && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: periodo.esLimite ? "#f59e0b" : "#3b82f6", borderRadius: periodo.esInicio ? "0 0 0 4px" : periodo.esTermino ? "0 0 4px 0" : 0 }} />
                  )}
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: esHoy ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: esHoy || esSelec ? 700 : 400, color: esHoy ? "#fff" : esSelec ? C.accentText : C.textPrimary }}>{diaNum}</span>
                  </div>
                  {tiposOtros.length > 0 && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {tiposOtros.map(tipo => (
                        <div key={tipo} style={{ width: 7, height: 7, borderRadius: "50%", background: TIPO_CONFIG[tipo]?.dot || "#6b7280", flexShrink: 0 }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {tooltip && (() => {
            const tHoy = evsPorFecha[tooltip.fechaISO] || [];
            const tPer = periodosPorFecha[tooltip.fechaISO];
            const lineas = [];
            if (tPer?.enRango) {
              const ev = eventosFiltrados.find(e => e.tipo === "Periodo de prestación" && tooltip.fechaISO >= e.fechaInicio && tooltip.fechaISO <= e.fechaTermino);
              if (ev) {
                lineas.push({ label: ev.nombre, color: "#3b82f6" });
                if (tPer.esInicio)  lineas.push({ label: "Inicio de periodo",            color: "#3b82f6" });
                if (tPer.esTermino) lineas.push({ label: "Término de periodo",           color: "#3b82f6" });
                if (tPer.esLimite)  lineas.push({ label: "Límite entrega de expediente", color: "#f59e0b" });
              }
            }
            tHoy.filter(e => e.tipo !== "Periodo de prestación").forEach(ev => {
              const cfg   = TIPO_CONFIG[ev.tipo];
              const extra = ev.tipo === "Día inhábil" && ev.hora ? ` · ${ev.hora} hrs` : "";
              lineas.push({ label: `${ev.nombre}${extra}`, color: cfg?.dot || "#6b7280" });
            });
            if (lineas.length === 0) return null;
            return (
              <div style={{ position: "fixed", left: tooltip.x, top: tooltip.y - 8, transform: "translate(-50%, -100%)", zIndex: 9999, background: "#1C1C1C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: RADIUS.md, padding: "8px 12px", minWidth: 180, maxWidth: 260, boxShadow: "0 4px 16px rgba(0,0,0,0.3)", pointerEvents: "none", opacity: 0.92 }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {formatFechaDisplay(tooltip.fechaISO)}
                </p>
                {lineas.map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: i > 0 ? 4 : 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 12, color: "#fff", lineHeight: 1.4 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Leyenda */}
          <div style={{ padding: "8px 1.25rem", borderTop: `1px solid ${C.borderDefault}`, display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            {TIPOS.map(tipo => (
              <div key={tipo} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: tipo === "Periodo de prestación" ? 18 : 8, height: tipo === "Periodo de prestación" ? 4 : 8, borderRadius: tipo === "Periodo de prestación" ? 2 : "50%", background: TIPO_CONFIG[tipo].dot }} />
                <span style={{ fontSize: 11, color: C.textDisabled }}>{tipo}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 18, height: 4, borderRadius: 2, background: "#f59e0b" }} />
              <span style={{ fontSize: 11, color: C.textDisabled }}>Límite expediente</span>
            </div>
            <span style={{ fontSize: 11, color: C.textDisabled, marginLeft: "auto" }}>
              Clic en un día hábil vacío para agregar un evento
            </span>
          </div>
        </div>

        {/* ── FILTROS ── */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "0.875rem 1.25rem", marginBottom: "1.25rem",
          display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
        }}>

          {/* Botones de tipo */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Todas", "Periodo de prestación", "Día inhábil", "Periodo vacacional"].map(t => (
              <button
                key={t} onClick={() => setFiltroTipo(t)}
                style={{
                  padding: "6px 12px", borderRadius: RADIUS.full,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  background: filtroTipo === t ? C.accent : "transparent",
                  border: `1px solid ${filtroTipo === t ? C.accent : C.borderDefault}`,
                  color: filtroTipo === t ? "#fff" : C.textMuted,
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Separador */}
          <div style={{ width: 1, height: 24, background: C.borderDefault, flexShrink: 0 }} />

          {/* Filtro por semestre */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.textDisabled, whiteSpace: "nowrap" }}>Ciclo:</span>
            <select
              value={filtroCiclo}
              onChange={e => { setFiltroCiclo(e.target.value); setFiltroPeriodo(""); }}
              style={{
                padding: "6px 10px", borderRadius: RADIUS.md, fontSize: 12,
                background: C.bgInput, border: `1px solid ${filtroCiclo ? C.accent : C.borderDefault}`,
                color: filtroCiclo ? C.textPrimary : C.textDisabled,
                cursor: "pointer", fontFamily: "inherit", outline: "none",
              }}
            >
              <option value="">Año...</option>
              {CICLOS_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filtroPeriodo}
              onChange={e => setFiltroPeriodo(e.target.value)}
              disabled={!filtroCiclo}
              style={{
                padding: "6px 10px", borderRadius: RADIUS.md, fontSize: 12,
                background: C.bgInput,
                border: `1px solid ${filtroPeriodo ? C.accent : C.borderDefault}`,
                color: filtroPeriodo ? C.textPrimary : C.textDisabled,
                cursor: filtroCiclo ? "pointer" : "default",
                fontFamily: "inherit", outline: "none",
                opacity: filtroCiclo ? 1 : 0.45,
              }}
            >
              <option value="">Semestre...</option>
              <option value="01">01 · Ago–Ene</option>
              <option value="02">02 · Ene–Jul</option>
            </select>

            {/* Etiqueta del rango seleccionado */}
            {filtroCiclo && filtroPeriodo && (
              <span style={{
                fontSize: 11, color: C.accentText, fontWeight: 600,
                padding: "3px 8px", borderRadius: RADIUS.full,
                background: C.accentSoft,
              }}>
                {rangoSemestre(parseInt(filtroCiclo), filtroPeriodo).label}
              </span>
            )}
          </div>

          {/* Limpiar */}
          {hayFiltroActivo && (
            <button
              onClick={limpiarFiltros}
              style={{
                marginLeft: "auto", padding: "6px 10px", borderRadius: RADIUS.md, fontSize: 12,
                cursor: "pointer", background: "transparent",
                border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontFamily: "inherit",
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Botón agregar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
          <button onClick={() => abrirNuevo()} disabled={modoActivo} style={{ padding: "8px 18px", borderRadius: RADIUS.md, background: modoActivo ? C.bgInput : C.accent, border: "none", color: modoActivo ? C.textDisabled : "#fff", fontSize: 13, fontWeight: 700, cursor: modoActivo ? "default" : "pointer", fontFamily: "inherit" }}>
            + Agregar evento
          </button>
        </div>

        {/* Formulario */}
        {(modo === "agregar" || modo === "editar") && (
          <EventoForm
            modo={modo} form={form} errores={errores} hoy={hoy}
            onChange={handleChange} onGuardar={handleGuardar} onCancelar={cancelar}
            C={C}
          />
        )}

        {/* ── LISTA DE EVENTOS ── */}
        <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 140px 140px", gap: "1rem", padding: "9px 1.25rem", background: C.bgInput, borderBottom: `1px solid ${C.borderDefault}` }}>
            {["Evento", "Fechas", "Tipo", ""].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
            ))}
          </div>

          {eventosFiltrados.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
                {hayFiltroActivo ? "No hay eventos que coincidan con el filtro." : "No hay eventos en el calendario."}
              </p>
            </div>
          )}

          {eventosFiltrados.map((ev, i) => (
            <EventoRow
              key={ev.id}
              ev={ev} index={i} total={eventosFiltrados.length}
              hoy={hoy} diaSelec={diaSelec}
              modo={modo} evActivoId={evActivo?.id}
              onEditar={abrirEditar} onEliminar={abrirEliminar}
              onCancelar={cancelar} onConfirmarEliminar={handleEliminar}
              C={C}
            />
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
