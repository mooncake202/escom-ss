
import { Field, InputField, ErrorMsg } from "@/components/ui/FormFields";

export function StepDatosPersonales({ form, errors, handleChange, C }) {
  return (
    <div>
      <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
        Datos personales
      </h2>
      <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13 }}>
        Información de contacto del alumno solicitante
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        <Field label="Correo institucional" C={C}>
        <InputField C={C} name="correoInst" type="email" placeholder="@alumno.ipn.mx" value={form.correoInst} onChange={handleChange} />
        <ErrorMsg field="correoInst" errors={errors} C={C} />
        </Field>

        <Field label="Correo personal" C={C}>
        <InputField C={C} name="correoPersonal" placeholder="tucorreo@ejemplo.com" value={form.correoPersonal} onChange={handleChange} />
        <ErrorMsg field="correoPersonal" errors={errors} C={C} />
        </Field>

      </div>

      

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      

        <Field label="Nombre(s)" C={C}>
          <InputField C={C} name="nombres" placeholder="Ej. David" value={form.nombres} onChange={handleChange} style={{textTransform: "uppercase"}} />
          <ErrorMsg field="nombres" errors={errors} C={C} />
        </Field>

        <Field label="Apellidos" C={C}>
          <InputField C={C} name="apellidos" placeholder="Ej. Sixtos Hernández" value={form.apellidos} onChange={handleChange} style={{textTransform: "uppercase"}} />
          <ErrorMsg field="apellidos" errors={errors} C={C} />
        </Field>
      </div>
        

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}> 
        <Field label="Número de celular" C={C}>
        <InputField C={C} name="telefono" placeholder="XX XXXX XXXX" value={form.telefono} onChange={handleChange} />
        <ErrorMsg field="telefono" errors={errors} C={C} />
        </Field>

        <Field label="Número de boleta" C={C}>
          <InputField C={C} name="boleta" placeholder="XXXX63XXXX" value={form.boleta} onChange={handleChange} />
          <ErrorMsg field="boleta" errors={errors} C={C} />
        </Field>
        
      </div>
      
    </div>
  );
}
