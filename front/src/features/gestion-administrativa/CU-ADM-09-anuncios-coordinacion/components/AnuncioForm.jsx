import { RADIUS } from "@/themes/colors";

export function AnuncioForm({ modo, form, errores, onChange, onGuardar, onCancelar, C }) {
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
        {modo === "nuevo" ? "Nuevo anuncio" : "Editar anuncio"}
      </p>

      {/* Título */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{
          display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
        }}>
          Título <span style={{ color: C.danger }}>*</span>
        </label>
        <input
          name="titulo"
          value={form.titulo}
          onChange={onChange}
          placeholder="Ej. Recordatorio: fecha límite de reportes"
          style={inputStyle(!!errores.titulo)}
        />
        {errores.titulo && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.titulo}</p>
        )}
      </div>

      {/* Contenido */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{
          display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
        }}>
          Contenido <span style={{ color: C.danger }}>*</span>
        </label>
        <textarea
          name="contenido"
          value={form.contenido}
          onChange={onChange}
          placeholder="Redacta el contenido del anuncio institucional..."
          rows={5}
          style={{ ...inputStyle(!!errores.contenido), resize: "vertical", lineHeight: 1.6 }}
        />
        {errores.contenido && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.contenido}</p>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={onCancelar}
          style={{
            flex: 1, padding: "9px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "transparent", border: `1px solid ${C.borderDefault}`,
            color: C.textMuted, fontFamily: "inherit",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onGuardar}
          style={{
            flex: 2, padding: "9px", borderRadius: RADIUS.md,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
          }}
        >
          {modo === "nuevo" ? "Publicar anuncio" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
