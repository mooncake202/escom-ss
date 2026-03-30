import { RADIUS } from "@/themes/colors";

export function RecursoForm({ modo, form, errores, onChange, onGuardar, onCancelar, C }) {
  const inputStyle = (hasError) => ({
    width: "100%", padding: "10px 14px", boxSizing: "border-box",
    background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary,
    fontSize: 13, outline: "none", fontFamily: "inherit",
  });

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.accent}`,
      padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
    }}>
      <p style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
        {modo === "agregar" ? "Agregar recurso" : "Editar recurso"}
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ flex: "2 1 220px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Título <span style={{ color: C.danger }}>*</span>
          </label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            placeholder="Ej. Formato de carta de presentación"
            style={inputStyle(!!errores.nombre)}
          />
          {errores.nombre && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.nombre}</p>}
        </div>

        <div style={{ flex: "2 1 220px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            URL <span style={{ color: C.danger }}>*</span>
          </label>
          <input
            name="url"
            value={form.url}
            onChange={onChange}
            placeholder="Ej. https://www.escom.ipn.mx/formatos/..."
            style={inputStyle(!!errores.url)}
          />
          {errores.url && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.url}</p>}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={onCancelar}
          style={{ flex: 1, padding: "9px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontFamily: "inherit" }}>
          Cancelar
        </button>
        <button onClick={onGuardar}
          style={{ flex: 2, padding: "9px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 700, cursor: "pointer", background: C.accent, border: "none", color: "#fff", fontFamily: "inherit" }}>
          {modo === "agregar" ? "Guardar recurso" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
