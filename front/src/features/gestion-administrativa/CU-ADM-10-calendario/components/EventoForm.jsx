import { RADIUS } from "@/themes/colors";
import { DatePicker } from "./DatePicker";

const TIPOS = ["Periodo de prestación", "Día inhábil", "Periodo vacacional"];
const HORAS = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

export function EventoForm({ modo, form, errores, hoy, onChange, onGuardar, onCancelar, C }) {
  const inputStyle = (err) => ({
    width: "100%", padding: "10px 14px", boxSizing: "border-box",
    background: C.bgInput,
    border: `1px solid ${err ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary,
    fontSize: 13, outline: "none", fontFamily: "inherit",
  });

  const labelStyle = {
    display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
  };

  const errStyle = { margin: "4px 0 0", fontSize: 12, color: C.danger };

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.accent}`,
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
    }}>
      <p style={{ margin: "0 0 0.25rem", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
        {modo === "agregar" ? "Agregar evento" : "Editar evento"}
      </p>
      {modo === "agregar" && form.tipo === "Día inhábil" && (
        <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textMuted }}>
          Puedes dar clic en cualquier día hábil del calendario para cambiar la fecha.
        </p>
      )}
      {modo === "agregar" && !form.tipo && (
        <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textMuted }}>
          Selecciona el tipo de evento para continuar.
        </p>
      )}

      {errores.conflicto && (
        <div style={{
          marginBottom: "1rem", padding: "9px 14px", borderRadius: RADIUS.md,
          background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b",
          fontSize: 12, color: "#f59e0b", fontWeight: 500,
        }}>
          ⚠ {errores.conflicto}
        </div>
      )}

      {/* Nombre + Tipo */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ flex: "3 1 220px" }}>
          <label style={labelStyle}>Nombre <span style={{ color: C.danger }}>*</span></label>
          <input
            name="nombre" value={form.nombre} onChange={onChange}
            placeholder={form.tipo === "Periodo de prestación" ? "Ej. Periodo Ene–Jun 2026" : "Ej. Semana Santa"}
            style={inputStyle(!!errores.nombre)}
          />
          {errores.nombre && <p style={errStyle}>{errores.nombre}</p>}
        </div>
        <div style={{ flex: "1 1 180px" }}>
          <label style={labelStyle}>Tipo <span style={{ color: C.danger }}>*</span></label>
          <select name="tipo" value={form.tipo} onChange={onChange}
            style={{ ...inputStyle(!!errores.tipo), cursor: "pointer" }}>
            <option value="">Seleccionar...</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errores.tipo && <p style={errStyle}>{errores.tipo}</p>}
        </div>
      </div>

      {/* Día inhábil */}
      {form.tipo === "Día inhábil" && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Fecha <span style={{ color: C.danger }}>*</span></label>
            <DatePicker
              value={form.fecha}
              onChange={v => onChange({ target: { name: "fecha", value: v } })}
              hasError={!!errores.fecha} minDate={hoy}
            />
            {errores.fecha && <p style={errStyle}>{errores.fecha}</p>}
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label style={labelStyle}>Hora <span style={{ color: C.danger }}>*</span></label>
            <select name="hora" value={form.hora} onChange={onChange}
              style={{ ...inputStyle(!!errores.hora), cursor: "pointer" }}>
              <option value="" disabled>Seleccionar...</option>
              {HORAS.map(h => <option key={h} value={h}>A partir de las {h} hrs</option>)}
            </select>
            {errores.hora && <p style={errStyle}>{errores.hora}</p>}
          </div>
        </div>
      )}

      {/* Periodo vacacional */}
      {form.tipo === "Periodo vacacional" && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Fecha de inicio <span style={{ color: C.danger }}>*</span></label>
            <DatePicker
              value={form.fechaInicioVac}
              onChange={v => onChange({ target: { name: "fechaInicioVac", value: v } })}
              hasError={!!errores.fechaInicioVac} minDate={hoy}
            />
            {errores.fechaInicioVac && <p style={errStyle}>{errores.fechaInicioVac}</p>}
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Fecha de fin <span style={{ color: C.danger }}>*</span></label>
            <DatePicker
              value={form.fechaFinVac}
              onChange={v => onChange({ target: { name: "fechaFinVac", value: v } })}
              hasError={!!errores.fechaFinVac} minDate={hoy}
            />
            {errores.fechaFinVac && <p style={errStyle}>{errores.fechaFinVac}</p>}
          </div>
        </div>
      )}

      {/* Periodo de prestación */}
      {form.tipo === "Periodo de prestación" && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ flex: "1 1 140px" }}>
            <label style={labelStyle}>Semestre <span style={{ color: C.danger }}>*</span></label>
            <input
              name="semestre" value={form.semestre}
              onChange={e => {
                const raw  = e.target.value.replace(/\D/g, "").slice(0, 6);
                const fmtd = raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
                onChange({ target: { name: "semestre", value: fmtd } });
              }}
              placeholder="AAAA-01" maxLength={7}
              style={inputStyle(!!errores.semestre)}
            />
            {errores.semestre
              ? <p style={errStyle}>{errores.semestre}</p>
              : form.semestre && /^\d{4}-(01|02)$/.test(form.semestre) && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textDisabled }}>
                  {form.semestre.endsWith("-01")
                    ? `Ene–Jul ${form.semestre.slice(0, 4)}`
                    : `Ago ${form.semestre.slice(0, 4)}–Ene ${parseInt(form.semestre.slice(0, 4)) + 1}`}
                </p>
              )
            }
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Fecha de inicio <span style={{ color: C.danger }}>*</span></label>
            <DatePicker
              value={form.fechaInicio}
              onChange={v => onChange({ target: { name: "fechaInicio", value: v } })}
              hasError={!!errores.fechaInicio} minDate={hoy}
            />
            {errores.fechaInicio && <p style={errStyle}>{errores.fechaInicio}</p>}
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Fecha de término <span style={{ color: C.danger }}>*</span></label>
            <DatePicker
              value={form.fechaTermino}
              onChange={v => onChange({ target: { name: "fechaTermino", value: v } })}
              hasError={!!errores.fechaTermino} minDate={hoy}
            />
            {errores.fechaTermino && <p style={errStyle}>{errores.fechaTermino}</p>}
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Límite entrega expediente</label>
            <DatePicker
              value={form.fechaLimiteExpediente}
              onChange={v => onChange({ target: { name: "fechaLimiteExpediente", value: v } })}
              minDate={hoy}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={onCancelar} style={{
          flex: 1, padding: "9px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 500,
          cursor: "pointer", background: "transparent",
          border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontFamily: "inherit",
        }}>Cancelar</button>
        <button onClick={onGuardar} style={{
          flex: 2, padding: "9px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 700,
          cursor: "pointer", background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
        }}>
          {modo === "agregar" ? "Guardar evento" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );