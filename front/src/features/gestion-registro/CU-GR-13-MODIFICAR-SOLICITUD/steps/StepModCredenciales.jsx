import { Field, InputField, ErrorMsg } from "@/components/ui/FormFields";
import { RADIUS } from "@/themes/colors";
import { formatearFechaUTC } from "@/utils/fechas";

export function StepModCredenciales({
  form,
  errors,
  aceptaCreditos,
  setAcepta,
  ofertas,
  periodos,
  C,
}) {
  const ofertaSeleccionada = ofertas?.find(
    (o) => String(o.id) === String(form.oferta)
  )?.titulo;

  const periodoSeleccionado = periodos?.find(
    (p) => String(p.id) === String(form.periodo)
  );

  const inicioFormateado = periodoSeleccionado
    ? formatearFechaUTC(periodoSeleccionado.fechaInicio)
    : "";
  const finFormateado = periodoSeleccionado
    ? formatearFechaUTC(periodoSeleccionado.fechaFin)
    : "";

  return (
    <div>
      <h2
        style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}
      >
        Confirmar solicitud
      </h2>
      <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13 }}>
        Revisa el resumen y confirma el reenvío de tu solicitud
      </p>

      {/* Aviso contraseña bloqueada */}
      <div
        style={{
          background: C.warningSoft ?? "#FAEEDA",
          border: `1px solid #FAC775`,
          borderRadius: RADIUS.md,
          padding: "0.875rem 1rem",
          marginBottom: "1.25rem",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: C.warning ?? "#854F0B", lineHeight: 1.5 }}>
          🔒 <strong>Contraseña no modificable.</strong> Para cambiar tu contraseña
          comunícate con el área de soporte de Servicio Social.
        </p>
      </div>

      {/* Campo contraseña deshabilitado solo como referencia visual */}
      <Field label="Contraseña actual" C={C}>
        <InputField
          C={C}
          type="password"
          name="password"
          value="••••••••••"
          disabled
          readOnly
        />
      </Field>

      {/* Checkbox declaración */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.25rem",
          background: C.bgInput,
          border: `1px solid ${C.borderSubtle}`,
          borderRadius: RADIUS.md,
        }}
      >
        <label
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={aceptaCreditos}
            onChange={(e) => setAcepta(e.target.checked)}
            style={{
              marginTop: 2,
              accentColor: C.accent,
              width: 16,
              height: 16,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
            Declaro que la información proporcionada en este formulario es congruente
            con mis documentos de validación oficiales.
          </span>
        </label>
        <ErrorMsg field="acepta" errors={errors} C={C} />
      </div>

      {/* Resumen de solicitud actualizada */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.25rem",
          background: C.bgPage,
          borderRadius: RADIUS.md,
          border: `1px solid ${C.borderSubtle}`,
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            color: C.textDisabled,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Resumen de solicitud actualizada
        </p>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}
        >
          {[
            ["Nombres",              form.nombres],
            ["Apellidos",            form.apellidos],
            ["Correo personal",      form.correoPersonal],
            ["Correo institucional", form.correoInst],
            ["Celular",              form.telefono],
            ["Boleta",               form.boleta],
            ["Carrera",              form.carrera],
            ["Créditos",             form.creditos ? form.creditos + "%" : ""],
            ["Inicio periodo",       inicioFormateado],
            ["Fin periodo",          finFormateado],
            ["Oferta",               ofertaSeleccionada],
            ["Semestre",             form.semestre],
          ].map(([k, v]) => (
            <div key={k} style={{ fontSize: 13 }}>
              <span style={{ color: C.textDisabled }}>{k}: </span>
              <span style={{ color: C.textSecondary, fontWeight: 500 }}>{v || "—"}</span>
            </div>
          ))}
        </div>

        {/* Motivación */}
        <div style={{ marginTop: "12px" }}>
          <span style={{ color: C.textDisabled, fontSize: 13 }}>Motivación:</span>
          <div
            style={{
              marginTop: "4px",
              padding: "8px 10px",
              background: C.bgInput,
              borderRadius: RADIUS.sm,
              fontSize: 13,
              color: C.textSecondary,
              lineHeight: 1.5,
            }}
          >
            {form.motivacion || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
