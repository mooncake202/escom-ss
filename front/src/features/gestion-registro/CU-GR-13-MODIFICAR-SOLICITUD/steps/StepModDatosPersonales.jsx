import { Field, InputField, ErrorMsg } from "@/components/ui/FormFields";
import { RADIUS } from "@/themes/colors";

export function StepModDatosPersonales({ form, errors, handleChange, C }) {
  return (
    <div>
      <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
        Datos personales
      </h2>
      <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13 }}>
        Revisa y actualiza tu información de contacto
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Correo institucional — NO EDITABLE */}
        <Field label="Correo institucional" C={C}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: C.textMuted,
              marginBottom: "0.375rem",
              padding: "2px 8px",
              background: C.bgInput,
              borderRadius: RADIUS.sm,
              border: `1px solid ${C.borderSubtle}`,
              width: "fit-content",
            }}
          >
            🔒 No modificable en este flujo
          </div>
          <InputField
            C={C}
            name="correoInst"
            type="email"
            value={form.correoInst}
            disabled
            readOnly
          />
        </Field>

        {/* Correo personal — SÍ EDITABLE */}
        <Field label="Correo personal" C={C}>
          <InputField
            C={C}
            name="correoPersonal"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={form.correoPersonal}
            onChange={handleChange}
          />
          <ErrorMsg field="correoPersonal" errors={errors} C={C} />
        </Field>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        <Field label="Nombre(s)" C={C}>
          <InputField
            C={C}
            name="nombres"
            placeholder="Ej. David"
            value={form.nombres}
            onChange={handleChange}
            style={{ textTransform: "uppercase" }}
          />
          <ErrorMsg field="nombres" errors={errors} C={C} />
        </Field>

        <Field label="Apellidos" C={C}>
          <InputField
            C={C}
            name="apellidos"
            placeholder="Ej. Sixtos Hernández"
            value={form.apellidos}
            onChange={handleChange}
            style={{ textTransform: "uppercase" }}
          />
          <ErrorMsg field="apellidos" errors={errors} C={C} />
        </Field>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        <Field label="Número de celular" C={C}>
          <InputField
            C={C}
            name="telefono"
            placeholder="XX XXXX XXXX"
            value={form.telefono}
            onChange={handleChange}
          />
          <ErrorMsg field="telefono" errors={errors} C={C} />
        </Field>

        <Field label="Número de boleta" C={C}>
          <InputField
            C={C}
            name="boleta"
            placeholder="XXXX63XXXX"
            value={form.boleta}
            onChange={handleChange}
          />
          <ErrorMsg field="boleta" errors={errors} C={C} />
        </Field>

      </div>
    </div>
  );
}
