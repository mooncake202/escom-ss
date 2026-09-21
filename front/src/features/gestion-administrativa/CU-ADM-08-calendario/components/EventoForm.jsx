import { RADIUS } from "@/themes/colors";
import { DatePicker } from "./DatePicker";
import { formatFechaDisplay } from "./EventoRow";
import { ventanaInicioPeriodo, rangoSemestre } from "../hooks/useCalendarioInstitucional";
import { diaSiguiente } from "../hooks/calendarioAdaptador";

const TIPOS = ["Periodo de prestación", "Día inhábil", "Periodo vacacional"];
const HORAS = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

export function EventoForm({ modo, form, errores, hoy, minFechaFutura, guardando, confirmando, ciclosDisponibles, onChange, onGuardar, onCancelar, onVolver, C }) {
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
          <select name="tipo" value={form.tipo} onChange={onChange} disabled={modo === "editar"}
            style={{ ...inputStyle(!!errores.tipo), cursor: modo === "editar" ? "default" : "pointer" }}>
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
              hasError={!!errores.fecha} minDate={hoy} hoy={hoy}
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
            <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textDisabled }}>
              A partir de las 07:00 se considera todo el día laboral.
            </p>
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
              hasError={!!errores.fechaInicioVac} minDate={minFechaFutura} hoy={hoy}
            />
            {errores.fechaInicioVac && <p style={errStyle}>{errores.fechaInicioVac}</p>}
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Fecha de fin <span style={{ color: C.danger }}>*</span></label>
            <DatePicker
              value={form.fechaFinVac}
              onChange={v => onChange({ target: { name: "fechaFinVac", value: v } })}
              hasError={!!errores.fechaFinVac} minDate={minFechaFutura} hoy={hoy}
            />
            {errores.fechaFinVac && <p style={errStyle}>{errores.fechaFinVac}</p>}
          </div>
        </div>
      )}

      {/* Periodo de prestación */}
      {form.tipo === "Periodo de prestación" && (
        <>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div style={{ flex: "1 1 160px" }}>
              <label style={labelStyle}>Ciclo <span style={{ color: C.danger }}>*</span></label>
              <select name="anio" value={form.anio} onChange={onChange}
                style={{ ...inputStyle(!!errores.anio), cursor: "pointer" }}>
                <option value="">Seleccionar...</option>
                {ciclosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errores.anio && <p style={errStyle}>{errores.anio}</p>}
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={labelStyle}>Semestre <span style={{ color: C.danger }}>*</span></label>
              <select name="semestre" value={form.semestre} onChange={onChange}
                style={{ ...inputStyle(!!errores.semestre), cursor: "pointer" }}>
                <option value="">Seleccionar...</option>
                <option value="01">01 · Ago–Ene</option>
                <option value="02">02 · Ene–Jul</option>
              </select>
              {errores.semestre && <p style={errStyle}>{errores.semestre}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div style={{ flex: "1 1 160px" }}>
              <label style={labelStyle}>Fecha de inicio <span style={{ color: C.danger }}>*</span></label>
              {(() => {
                const ventana = ventanaInicioPeriodo({ anio: form.anio, semestre: form.semestre, minFechaFutura });
                return (
                  <>
                    <DatePicker
                      value={form.fechaInicio}
                      onChange={v => onChange({ target: { name: "fechaInicio", value: v } })}
                      hasError={!!errores.fechaInicio} hoy={hoy}
                      minDate={ventana?.minDate ?? minFechaFutura} maxDate={ventana?.maxDate}
                      vistaInicial={ventana?.vistaInicial ?? minFechaFutura}
                    />
                    {ventana && (
                      ventana.minDate > ventana.maxDate ? (
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f59e0b" }}>
                          ⚠ El ciclo {form.anio}/{form.semestre} ({rangoSemestre(Number(form.anio), form.semestre).label}) ya terminó:
                          no hay fechas de inicio disponibles. Elige un ciclo o semestre vigente.
                        </p>
                      ) : (
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: C.textDisabled }}>
                          Ciclo {form.anio}/{form.semestre}: {rangoSemestre(Number(form.anio), form.semestre).label}
                        </p>
                      )
                    )}
                  </>
                );
              })()}
              {errores.fechaInicio && <p style={errStyle}>{errores.fechaInicio}</p>}
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={labelStyle}>Fecha de término <span style={{ color: C.danger }}>*</span></label>
              {/* El término va después del inicio: el selector abre en el mes del inicio y no admite fechas anteriores. */}
              <DatePicker
                value={form.fechaTermino}
                onChange={v => onChange({ target: { name: "fechaTermino", value: v } })}
                hasError={!!errores.fechaTermino} hoy={hoy}
                minDate={form.fechaInicio ? diaSiguiente(form.fechaInicio) : minFechaFutura}
                vistaInicial={form.fechaInicio ? diaSiguiente(form.fechaInicio) : minFechaFutura}
              />
              {errores.fechaTermino && <p style={errStyle}>{errores.fechaTermino}</p>}
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={labelStyle}>Límite entrega expediente <span style={{ color: C.danger }}>*</span></label>
              <DatePicker
                value={form.fechaLimiteExpediente}
                onChange={v => onChange({ target: { name: "fechaLimiteExpediente", value: v } })}
                hasError={!!errores.fechaLimiteExpediente} minDate={minFechaFutura} hoy={hoy}
              />
              {errores.fechaLimiteExpediente && <p style={errStyle}>{errores.fechaLimiteExpediente}</p>}
            </div>
          </div>
        </>
      )}

      {/* Confirmación previa a publicar (periodo y vacacional son inmutables) */}
      {confirmando && (
        <div style={{
          marginBottom: "1rem", padding: "12px 14px", borderRadius: RADIUS.md,
          background: "rgba(245,158,11,0.08)", border: "1px solid #f59e0b",
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
            Confirma la publicación
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", fontSize: 12, color: C.textMuted }}>
            <span>Tipo</span><strong style={{ color: C.textPrimary }}>{form.tipo}</strong>
            <span>Nombre</span><strong style={{ color: C.textPrimary }}>{form.nombre.trim()}</strong>
            {form.tipo === "Periodo de prestación" ? (
              <>
                <span>Ciclo</span><strong style={{ color: C.textPrimary }}>{form.anio}/{form.semestre}</strong>
                <span>Inicio</span><strong style={{ color: C.textPrimary }}>{formatFechaDisplay(form.fechaInicio)}</strong>
                <span>Término</span><strong style={{ color: C.textPrimary }}>{formatFechaDisplay(form.fechaTermino)}</strong>
                <span>Límite expediente</span><strong style={{ color: C.textPrimary }}>{formatFechaDisplay(form.fechaLimiteExpediente)}</strong>
              </>
            ) : (
              <>
                <span>Inicio</span><strong style={{ color: C.textPrimary }}>{formatFechaDisplay(form.fechaInicioVac)}</strong>
                <span>Fin</span><strong style={{ color: C.textPrimary }}>{formatFechaDisplay(form.fechaFinVac)}</strong>
              </>
            )}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#f59e0b", fontWeight: 500 }}>
            ⚠ Una vez publicado, no podrá editarse ni eliminarse.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={confirmando ? onVolver : onCancelar} disabled={guardando} style={{
          flex: 1, padding: "9px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 500,
          cursor: guardando ? "default" : "pointer", background: "transparent",
          border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontFamily: "inherit",
        }}>{confirmando ? "Volver a editar" : "Cancelar"}</button>
        <button onClick={onGuardar} disabled={guardando} style={{
          flex: 2, padding: "9px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 700,
          cursor: guardando ? "default" : "pointer", background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
          opacity: guardando ? 0.6 : 1,
        }}>
          {guardando ? "Guardando…"
            : confirmando ? "Confirmar y publicar"
            : modo === "agregar" ? "Guardar evento" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
