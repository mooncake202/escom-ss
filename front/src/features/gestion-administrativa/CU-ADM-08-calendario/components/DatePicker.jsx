import { useState, useEffect, useRef } from "react";
import { useTheme, RADIUS } from "@/themes/colors";

const DP_MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DP_DIAS  = ["D","L","M","M","J","V","S"];

export function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa", hasError = false, small = false, minDate = "" }) {
  const { C } = useTheme();
  const [open, setOpen]                 = useState(false);
  const [vm, setVm]                     = useState(() => {
    if (value) { const [y, m] = value.split("-"); return { y: +y, m: +m - 1 }; }
    const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [editandoAnio, setEditandoAnio] = useState(false);
  const [anioInput, setAnioInput]       = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (value) { const [y, m] = value.split("-"); setVm({ y: +y, m: +m - 1 }); }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function prevMes() { setVm(v => v.m === 0  ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }); }
  function nextMes() { setVm(v => v.m === 11 ? { y: v.y + 1, m: 0  } : { y: v.y, m: v.m + 1 }); }

  function selDia(d) {
    const iso = `${vm.y}-${String(vm.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  }

  const diasEnMes = new Date(vm.y, vm.m + 1, 0).getDate();
  const offset    = new Date(vm.y, vm.m, 1).getDay();
  const total     = Math.ceil((offset + diasEnMes) / 7) * 7;
  const display   = value
    ? (() => { const [y, m, d] = value.split("-"); return `${d}/${m}/${y}`; })()
    : "";
  const pad = small ? { padding: "6px 10px", fontSize: 12 } : { padding: "10px 14px", fontSize: 13 };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...pad,
          background: C.bgInput,
          border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
          borderRadius: RADIUS.md, color: value ? C.textPrimary : C.textDisabled,
          cursor: "pointer", userSelect: "none", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          boxSizing: "border-box", width: "100%",
        }}
      >
        <span>{display || placeholder}</span>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
          stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8"  y1="2" x2="8"  y2="6"/>
          <line x1="3"  y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 1000,
          background: "#1a1a1a", border: `1px solid ${C.borderDefault}`,
          borderRadius: RADIUS.lg, padding: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: 220,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={prevMes} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>‹</button>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{DP_MESES[vm.m]}</span>
              {editandoAnio ? (
                <input
                  autoFocus
                  value={anioInput}
                  onChange={e => setAnioInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onKeyDown={e => {
                    if (e.key === "Enter") { const y = parseInt(anioInput); if (y >= 1900 && y <= 2100) setVm(v => ({ ...v, y })); setEditandoAnio(false); }
                    if (e.key === "Escape") setEditandoAnio(false);
                  }}
                  onBlur={() => { const y = parseInt(anioInput); if (y >= 1900 && y <= 2100) setVm(v => ({ ...v, y })); setEditandoAnio(false); }}
                  style={{ width: 44, fontSize: 12, fontWeight: 700, background: "transparent", border: "none", borderBottom: `1px solid ${C.accent}`, color: C.textPrimary, outline: "none", textAlign: "center", fontFamily: "inherit" }}
                />
              ) : (
                <span
                  onClick={() => { setAnioInput(String(vm.y)); setEditandoAnio(true); }}
                  title="Clic para cambiar el año"
                  style={{ fontSize: 12, fontWeight: 700, color: C.accent, cursor: "pointer", borderBottom: `1px dashed ${C.accent}` }}
                >
                  {vm.y}
                </span>
              )}
            </div>
            <button onClick={nextMes} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
            {DP_DIAS.map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: i === 0 || i === 6 ? C.textDisabled : C.textMuted, padding: "2px 0", opacity: i === 0 || i === 6 ? 0.5 : 1 }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
            {(() => {
              const hoyISO = new Date().toISOString().slice(0, 10);
              return Array.from({ length: total }, (_, idx) => {
                const d = idx - offset + 1;
                if (d < 1 || d > diasEnMes) return <div key={idx} />;
                const iso     = `${vm.y}-${String(vm.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const sel     = iso === value;
                const esHoy   = iso === hoyISO && !sel;
                const pasado  = minDate ? iso < minDate : false;
                const col     = idx % 7;
                const esFS    = col === 0 || col === 6;
                const disabled = pasado || esFS;
                return (
                  <div
                    key={idx}
                    onClick={() => !disabled && selDia(d)}
                    style={{
                      textAlign: "center", fontSize: 11, padding: "4px 2px",
                      borderRadius: RADIUS.sm,
                      cursor: disabled ? "default" : "pointer",
                      background: sel ? C.accent : esHoy ? "rgba(99,102,241,0.18)" : "transparent",
                      color: sel ? "#fff" : pasado ? C.textDisabled : esHoy ? C.accentText : esFS ? C.textDisabled : C.textPrimary,
                      opacity: disabled ? 0.35 : 1,
                      fontWeight: sel || esHoy ? 700 : 400,
                      outline: esHoy ? `1px solid ${C.accent}` : "none",
                      outlineOffset: -1,
                      textDecoration: pasado ? "line-through" : "none",
                    }}
                    onMouseEnter={e => { if (!sel && !disabled) e.currentTarget.style.background = C.bgPage; }}
                    onMouseLeave={e => { if (!sel && !disabled) e.currentTarget.style.background = esHoy ? "rgba(99,102,241,0.18)" : "transparent"; }}
                  >
                    {d}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}