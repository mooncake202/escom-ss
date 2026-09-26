import { useTheme, RADIUS } from "@/themes/colors";
import { CarreraSelector } from "@/features/gestion-ofertas/components/CarreraSelector";

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
      {errores.general && (
        <div style={{
          padding: "10px 14px", borderRadius: RADIUS.md,
          background: C.dangerSoft, border: `1px solid ${C.danger}`,
          fontSize: 13, color: C.danger, fontWeight: 500,
        }}>
          {errores.general}
        </div>
      )}

      <div>
        <label style={labelStyle}>Nombre de la oferta <span style={{ color: C.danger }}>*</span></label>
        <input name="nombre" value={form.nombre} onChange={onChange} style={inputStyle(!!errores.nombre)} />
        {errores.nombre && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.nombre}</p>}
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
            name="cupos" type="number" min={2} max={6}
            value={form.cupos} onChange={onChange}
            style={inputStyle(!!errores.cupos)}
          />
          {errores.cupos && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.cupos}</p>}
        </div>
      )}

      <div style={{ padding: "0.875rem", borderRadius: RADIUS.md, background: C.bgInput, border: `1px solid ${C.borderDefault}` }}>
        <p style={{ ...labelStyle, marginBottom: 8 }}>Perfil de carrera deseado</p>
        <CarreraSelector
          value={form.carreras ?? []}
          onToggle={onToggleCarrera}
          error={errores.carreras}
        />
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