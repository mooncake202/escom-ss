import { Field, InputField, ErrorMsg } from "../../../../components/ui/FormFields";
import { RADIUS } from "../../../../themes/colors";
import { formatearFechaUTC } from "@/utils/fechas";

export function StepCredenciales({ form, errors, handleChange, aceptaCreditos, setAcepta, ofertas, periodos, C }) {
  const ofertaSeleccionada =  ofertas?.find(o => String(o.id) === String(form.oferta))?.titulo;

  const inicioSeleccionado = periodos?.find(p => String(p.id) === String(form.periodo))?.fechaInicio;
  const finSeleccionado = periodos?.find(p => String(p.id) === String(form.periodo))?.fechaFin;

  const inicioFormateado = formatearFechaUTC(inicioSeleccionado);
  const finFormateado = formatearFechaUTC(finSeleccionado);

  return (
    <div>
      <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
        Credenciales de acceso
      </h2>
      <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13 }}>
        Crea tu contraseña para dar seguimiento a tu solicitud
      </p>

      <Field label="Contraseña" C={C}>
        <InputField C={C} type="password" name="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={handleChange} />
        <ErrorMsg field="password" errors={errors} C={C} />
      </Field>

      <Field label="Confirmar contraseña" C={C}>
        <InputField C={C} type="password" name="confirmarPassword" placeholder="Repite tu contraseña" value={form.confirmarPassword} onChange={handleChange} />
        <ErrorMsg field="confirmarPassword" errors={errors} C={C} />
      </Field>

      {/* Checkbox declaración */}
      <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: C.bgInput, border: `1px solid ${C.borderSubtle}`, borderRadius: RADIUS.md }}>
        <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", cursor: "pointer" }}>
          <input
            type="checkbox" checked={aceptaCreditos}
            onChange={e => setAcepta(e.target.checked)}
            style={{ marginTop: 2, accentColor: C.accent, width: 16, height: 16, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
            Declaro que la información proporcionada en este formulario es congruente con mis documentos de validación oficiales.
          </span>
        </label>
        {errors.acepta && <p style={{ color: C.danger, fontSize: 12, margin: "8px 0 0" }}>{errors.acepta}</p>}
      </div>

      {/* Resumen */}
      <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: C.bgPage, borderRadius: RADIUS.md, border: `1px solid ${C.borderSubtle}` }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, color: C.textDisabled, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
          Resumen de solicitud
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
          {[
            ["Nombres",   form.nombres],
            ["Apellidos", form.apellidos],
            ["Correo Personal", form.correoPersonal],
            ["Correo Institucional", form.correoInst],
            ["Número", form.telefono],
            ["Boleta",   form.boleta],
            ["Carrera",  form.carrera],
            ["Créditos", form.creditos ? form.creditos + "%" : ""],
            ["Inicio seleccionado", inicioFormateado],
            ["Oferta", ofertaSeleccionada],
            ["Fin seleccionado", finFormateado],
            ["Semestre", form.semestre]
            

            
          ].map(([k, v]) => (
            <div key={k} style={{ fontSize: 13 }}>
              <span style={{ color: C.textDisabled }}>{k}: </span>
              <span style={{ color: C.textSecondary, fontWeight: 500 }}>{v || "—"}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "12px" }}>
            <span style={{ color: C.textDisabled, fontSize: 13 }}>
              Motivación:
            </span>

            <div
              style={{
                marginTop: "4px",
                padding: "8px 10px",
                background: C.bgInput,
                borderRadius: RADIUS.sm,
                fontSize: 13,
                color: C.textSecondary
              }}
            >
              {form.motivacion || "—"}
            </div>
        </div>
      </div>
    </div>
  );
}