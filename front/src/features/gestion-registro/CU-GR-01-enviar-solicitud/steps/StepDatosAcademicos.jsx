import { Field, InputField, SelectField, ErrorMsg } from "../../../../components/ui/FormFields";
import { RADIUS } from "../../../../themes/colors";
import { CARRERAS } from "../utils/constants";


export function StepDatosAcademicos({ form, errors, handleChange, C, periodos}) {
  return (
    <div>
      <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
        Datos académicos
      </h2>
      <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13 }}>
        Carrera, créditos y periodo de prestación
      </p>

      <Field label="Carrera" C={C}>
        <SelectField C={C} name="carrera" value={form.carrera} onChange={handleChange}>
          <option value="">Seleccionar carrera</option>
          {CARRERAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </SelectField>
        <ErrorMsg field="carrera" errors={errors} C={C} />
      </Field>

      <Field label="Porcentaje de créditos cubiertos" hint="Coloca el porcentaje exacto que muestra tu constancia" C={C}>
        <InputField C={C} name="creditos" type="number" placeholder="Necesitas mínimo el 70%" min="0" max="100" value={form.creditos} onChange={handleChange} />
        <ErrorMsg field="creditos" errors={errors} C={C} />

      <div style={{ padding: "12px 14px", background: C.bgInput, borderRadius: RADIUS.md, border: `1px solid ${C.borderSubtle}`, marginTop: "0.5rem" }}>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          🔗{" "}
          <a href="https://www.youtube.com/watch?v=U5akJxmjZ-s" target="_blank" rel="noopener noreferrer" style={{ color: C.accentText, fontWeight: 600 }}>
            Solicita tu constancia de créditos aquí GUARDA ESTE DOCUMENTO
          </a>
        </p>
      </div>

      </Field>

      


      <Field label="Periodo autorizado este semestre" C={C}>
        <SelectField C={C} name="periodo" value={form.periodo} onChange={handleChange}>
          <option value="">Seleccionar periodo</option>
          {periodos && periodos.map(p => {
  
  return (
    <option key={p.id} value={p.id}>
      {new Date(p.fechaInicio).toLocaleDateString("es-MX")} — {new Date(p.fechaFin).toLocaleDateString("es-MX")}
    </option>
  );
})}

        </SelectField>

        <ErrorMsg field="periodo" errors={errors} C={C} />
      </Field>
      
    </div>
  );
}
