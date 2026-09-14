import { useState, useEffect, useRef } from "react";
import { RADIUS } from "@/themes/colors";

// Mismo patrón visual/estructural que DatePicker.jsx (CU-ADM-08): trigger +
// popover absoluto, cierre con mousedown fuera del ref. Aquí se agregan 2
// meses lado a lado y selección de RANGO (2 clics) en vez de 1 sola fecha —
// no hay librería de date-picker instalada en el proyecto (front/package.json
// no trae ninguna), así que se construye a mano en vez de sumar una
// dependencia nueva solo para este control.
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTOS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const DIAS = ["D","L","M","M","J","V","S"];

function isoDe(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatoCorto(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES_CORTOS[m - 1]}`;
}

function Mes({ y, m, fechaDesde, fechaHasta, hoverIso, onHover, onSeleccionar, C }) {
  const diasEnMes = new Date(y, m + 1, 0).getDate();
  const offset = new Date(y, m, 1).getDay();
  const total = Math.ceil((offset + diasEnMes) / 7) * 7;

  // Rango a resaltar: el ya confirmado, o la vista previa mientras se
  // está eligiendo el fin (fechaDesde fijo, aún sin fechaHasta).
  const previewHasta = fechaDesde && !fechaHasta && hoverIso && hoverIso >= fechaDesde ? hoverIso : null;
  const rangoIni = fechaDesde || null;
  const rangoFin = fechaHasta || previewHasta || null;

  return (
    <div style={{ width: 200 }}>
      <p style={{ margin: "0 0 8px", textAlign: "center", fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
        {MESES[m]} {y}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {DIAS.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.textDisabled, padding: "2px 0", opacity: i === 0 || i === 6 ? 0.5 : 1 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
        {Array.from({ length: total }, (_, idx) => {
          const d = idx - offset + 1;
          if (d < 1 || d > diasEnMes) return <div key={idx} />;
          const iso = isoDe(y, m, d);
          const esInicio = iso === rangoIni;
          const esFin = iso === rangoFin;
          const enRango = rangoIni && rangoFin && iso > rangoIni && iso < rangoFin;
          const seleccionado = esInicio || esFin;
          return (
            <div
              key={idx}
              onClick={() => onSeleccionar(iso)}
              onMouseEnter={() => onHover(iso)}
              style={{
                textAlign: "center", fontSize: 11, padding: "5px 2px", cursor: "pointer",
                borderRadius: seleccionado ? RADIUS.sm : 0,
                background: seleccionado ? C.accent : enRango ? "rgba(46,134,222,0.18)" : "transparent",
                color: seleccionado ? "#fff" : C.textPrimary,
                fontWeight: seleccionado ? 700 : 400,
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RangoFechasPicker({ fechaDesde, fechaHasta, onChange, C }) {
  const [open, setOpen] = useState(false);
  const [hoverIso, setHoverIso] = useState(null);
  const ref = useRef(null);

  const base = fechaHasta ? new Date(fechaHasta) : fechaDesde ? new Date(fechaDesde) : new Date();
  const [vm, setVm] = useState({ y: base.getFullYear(), m: base.getMonth() });

  useEffect(() => {
    if (!open) return;
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function prevMes() { setVm(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }); }
  function nextMes() { setVm(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }); }

  function seleccionar(iso) {
    if (!fechaDesde || fechaHasta) {
      // Sin rango activo, o rango ya cerrado: empieza uno nuevo.
      onChange(iso, "");
      return;
    }
    if (iso < fechaDesde) {
      // Clic antes del inicio elegido: reinicia el rango desde esa fecha.
      onChange(iso, "");
      return;
    }
    onChange(fechaDesde, iso);
    setOpen(false);
  }

  const siguienteMes = vm.m === 11 ? { y: vm.y + 1, m: 0 } : { y: vm.y, m: vm.m + 1 };
  const texto = fechaDesde && fechaHasta
    ? `${formatoCorto(fechaDesde)} - ${formatoCorto(fechaHasta)}`
    : fechaDesde
      ? `Desde ${formatoCorto(fechaDesde)}...`
      : "Todas las fechas";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "7px 12px", background: C.bgInput,
          border: `1px solid ${C.borderDefault}`, borderRadius: RADIUS.md,
          color: (fechaDesde || fechaHasta) ? C.textPrimary : C.textDisabled,
          fontSize: 12, cursor: "pointer", userSelect: "none", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        }}
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{texto}</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 1000,
          background: "#1a1a1a", border: `1px solid ${C.borderDefault}`,
          borderRadius: RADIUS.lg, padding: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={prevMes} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>‹</button>
            <span style={{ fontSize: 11, color: C.textDisabled }}>
              {fechaDesde && !fechaHasta ? "Elige la fecha final" : "Elige el rango de fechas"}
            </span>
            <button onClick={nextMes} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>›</button>
          </div>
          <div style={{ display: "flex", gap: 14 }} onMouseLeave={() => setHoverIso(null)}>
            <Mes y={vm.y} m={vm.m} fechaDesde={fechaDesde} fechaHasta={fechaHasta} hoverIso={hoverIso} onHover={setHoverIso} onSeleccionar={seleccionar} C={C} />
            <Mes y={siguienteMes.y} m={siguienteMes.m} fechaDesde={fechaDesde} fechaHasta={fechaHasta} hoverIso={hoverIso} onHover={setHoverIso} onSeleccionar={seleccionar} C={C} />
          </div>
          {(fechaDesde || fechaHasta) && (
            <button
              onClick={() => { onChange("", ""); setOpen(false); }}
              style={{ alignSelf: "flex-end", background: "transparent", border: "none", color: C.accent, cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "2px 4px" }}
            >
              Limpiar rango
            </button>
          )}
        </div>
      )}
    </div>
  );
}
