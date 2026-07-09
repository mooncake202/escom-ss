import { useTheme, RADIUS } from "@/themes/colors";

const CARRERAS = [
  { key: "ISC", label: "ISC — Ingeniería en Sistemas Computacionales" },
  { key: "LCD", label: "LCD — Licenciatura en Ciencia de Datos" },
  { key: "IIA", label: "IIA — Ingeniería en Inteligencia Artificial" },
];

export function FormCorreccion({ oferta, form, errores, onChange, onToggleCarrera, onCancelar, onSubmit }) {
  const { C } = useTheme();

  const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted,
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
  };

  const inputStyle = (hasError) => ({
    width: "100%", padding: "9px 12px", boxSizing: "border-box",
    background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary,
    fontSize: 13, outline: "none", fontFamily: "inherit",
  });

  return (
    <>
      <div>
        <label style={labelStyle}>Nombre de la oferta <span style={{ color: C.danger }}>*</span></label>
        <input name="nombre" value={form.nombre} onChange={onChange} style={inputStyle(!!errores.nombre)} />
        {errores.nombre && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.nombre}</p>}
      </div>

      <div>
        <label style={labelStyle}>Título para plataforma SISS <span style={{ color: C.danger }}>*</span></label>
        <input name="tituloSISS" value={form.tituloSISS} onChange={onChange} style={inputStyle(!!errores.tituloSISS)} />
        {errores.tituloSISS && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.tituloSISS}</p>}
      </div>

      <div>
        <label style={labelStyle}>Descripción y actividades <span style={{ color: C.danger }}>*</span></label>
        <textarea
          name="descripcion" value={form.descripcion} onChange={onChange}
          rows={5} style={{ ...inputStyle(!!errores.descripcion), resize: "vertical", lineHeight: 1.6 }}
        />
        {errores.descripcion && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.descripcion}</p>}
      </div>

      {oferta.tipo === "proyecto" && (
        <div>
          <label style={labelStyle}>Cupos <span style={{ color: C.danger }}>*</span></label>
          <input
            name="cupos" type="number" min={1}
            value={form.cupos} onChange={onChange}
            style={inputStyle(!!errores.cupos)}
          />
          {errores.cupos && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.cupos}</p>}
        </div>
      )}

      <div style={{ padding: "0.875rem", borderRadius: RADIUS.md, background: C.bgInput, border: `1px solid ${C.borderDefault}` }}>
        <p style={{ ...labelStyle, marginBottom: 8 }}>Perfil de carrera deseado</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {CARRERAS.map(({ key, label }) => {
            const checked = form.carreras?.includes(key);
            return (
              <label key={key} style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                padding: "6px 8px", borderRadius: RADIUS.md,
                background: checked ? C.accentSoft : "transparent",
                border: `1px solid ${checked ? C.accent : "transparent"}`,
              }}>
                <input
                  type="checkbox" checked={checked} onChange={() => onToggleCarrera(key)}
                  style={{ accentColor: C.accent, width: 14, height: 14, cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: checked ? C.textPrimary : C.textMuted }}>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.625rem" }}>
        <button onClick={onCancelar} style={{
          flex: 1, padding: "9px", borderRadius: RADIUS.md,
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          background: "transparent", border: `1px solid ${C.borderDefault}`,
          color: C.textMuted, fontFamily: "inherit",
        }}>Cancelar</button>
        <button onClick={onSubmit} style={{
          flex: 2, padding: "9px", borderRadius: RADIUS.md,
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
        }}>Reenviar oferta</button>
      </div>
    </>
  );
}