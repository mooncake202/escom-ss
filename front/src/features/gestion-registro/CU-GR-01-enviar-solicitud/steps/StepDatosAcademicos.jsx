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

      <Field label="Semestre actual" hint="Coloca el semestre exacto que muestra tu constancia" C={C}>
        <InputField C={C} name="semestre" type="number" placeholder="Ej. 7" min="0" max="100" value={form.semestre} onChange={handleChange} />
        <ErrorMsg field="semestre" errors={errors} C={C} />

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

      <Field label="Solicitud de dictamen" hint="Selecciona una opción para ver las instrucciones" C={C}>
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

    {[
      {
        value: "creditos",
        label: "Dictamen por créditos menores a 70%",
        desc: "Este dictamen es para poder realizar el servicio social aunque no hayas cubierto el 70% de créditos."
      },
      {
        value: "estancia",
        label: "Dictamen por estancia profesional",
        desc: "Este dictamen es para poder realizar el servicio social cuando solo te falta tu estancia profesional."
      },
      {
        value: "electiva",
        label: "Dictamen por electiva",
        desc: "Este dictamen es para poder realizar el servicio social cuando solo te falta una electiva."
      }
    ].map(opt => (
      <div key={opt.value}>

        {/* OPCIÓN */}
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: RADIUS.md,
          border: `1px solid ${form.tipoLiberacion === opt.value ? C.accent : C.borderSubtle}`,
          background: form.tipoLiberacion === opt.value ? C.accentSoft : C.bgCard,
          cursor: "pointer"
        }}>
          <input
            type="radio"
            name="tipoLiberacion"
            value={opt.value}
            checked={form.tipoLiberacion === opt.value}
            onChange={handleChange}
          />

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              {opt.desc}
            </div>
          </div>
        </label>

        {/* INSTRUCCIONES */}
        {form.tipoLiberacion === opt.value && (
          <div style={{
            marginTop: 6,
            padding: "12px 14px",
            background: C.bgInput,
            borderRadius: RADIUS.md,
            border: `1px solid ${C.borderSubtle}`
          }}>
            {opt.value === "creditos" && (
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                REQUISITOS PARA SOLICITAR DICTAMEN CUANDO NO TIENES EL 70% DE CREDITOS CUBIERTOS  <br />
                1. ESTAR INSCRITO <br />
                2. SER REGULAR (sin adeudos de materias) <br />
                3. HABER CURSADO DESDE EL 1er AL 5to SEMESTRE COMPLETO<br />
                4. TENER EL 60% O MAS DE CREDITOS CURSADOS.<br /><br />
                Si cumples con los 4 requisitos anteriores podrás solicitar tu dictamen para iniciar el servicio social,
                solo debes enviar al siguiente correo servicio_social_escom@ipn.mx la siguiente información para que
                elaboren tu dictamen.<br /><br />
                En un solo pdf debes incluir los siguientes documentos:<br />
                • Escrito simple dirigido a la Comisión de Servicio Social, donde expongas el motivo del por qué
                quieres iniciar tu servicio y solicitar que te permitan hacerlo; fírmalo y pon tu nombre completo<br />
                • Constancia de créditos vigente para tramite de servicio social<br />
                • Boleta global vigente<br />
                • Constancia de servicio medico vigente<br /><br />
                Te haremos un dictamen con el cual se te permitirá realizarlo, al final de tu servicio debes 
                comprobar mediante una constancia de créditos para servicio social actual o carta pasante 
                donde demuestres que ya cuentas con el 100% de créditos cursados, de lo contrario no se 
                liberará.<br /><br />
                Tiempo de respuesta aproximadamente entre 3 a 5 días hábiles <br />
              </p>
            )}

            {opt.value === "estancia" && (
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                REQUISITOS PARA SOLICITAR DICTAMEN POR ESTANCIA PROFESIONAL<br />
                1. HABER CUBIERTO TODAS TUS MATERIAS ACADEMICAS<br />
                2. QUE SOLO TE FALTE LA ESTANCIA PROFESIONAL
                EN CASO QUE TE FALTE OTRA MATERIA NO APLICA ESTE DCITAMEN<br /><br />
                Si cumples con los 2 requisitos anteriores podrás solicitar tu dictamen para iniciar el servicio social,
                solo debes enviar al siguiente correo servicio_social_escom@ipn.mx la siguiente información para que
                elaboren tu dictamen.<br /><br />
                En un solo pdf debes incluir los siguientes documentos:<br />
                • Escrito simple dirigido a la Comisión de Servicio Social, donde expongas el motivo del por qué
                quieres iniciar tu servicio y solicitar que te permitan hacerlo; fírmalo y pon tu nombre completo<br />
                • Constancia de créditos vigente para tramite de servicio social<br /><br />
                Te haremos un dictamen con el cual se te permitirá realizarlo, al final de tu servicio debes 
                comprobar mediante una constancia de créditos para servicio social actual o carta pasante 
                donde demuestres que ya cuentas con el 100% de créditos cursados, de lo contrario no se 
                liberará.<br /><br />
                Tiempo de respuesta aproximadamente entre 3 a 5 días hábiles
              </p>
            )}

            {opt.value === "electiva" && (
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                REQUISITOS PARA SOLICITAR DICTAMEN POR ELECTIVA<br />
                1. TENER EL 96.01% DE CREDITOS CURSADOS<br />
                2. QUE SOLO TE FALTE LA ELECTIVA, EN CASO QUE TE FALTE OTRA MATERIA NO APLICA ESTE 
                DCITAMEN<br /><br />
                Si cumples con los 2 requisitos anteriores podrás solicitar tu dictamen para iniciar el servicio social,
                solo debes enviar al siguiente correo servicio_social_escom@ipn.mx la siguiente información para que
                elaboren tu dictamen<br /><br />
                En un solo pdf debes incluir los siguientes documentos:<br />
                • Escrito simple dirigido a la Comisión de Servicio Social, donde expongas el motivo del por qué
                quieres iniciar tu servicio y solicitar que te permitan hacerlo; fírmalo y pon tu nombre completo<br />
                • Constancia de créditos vigente para tramite de servicio social<br /><br />
                Te haremos un dictamen con el cual se te permitirá realizarlo, al final de tu servicio debes 
                comprobar mediante una constancia de créditos para servicio social actual o carta pasante 
                donde demuestres que ya cuentas con el 100% de créditos cursados, de lo contrario no se 
                liberará.<br /><br />
                Tiempo de respuesta aproximadamente entre 3 a 5 días hábiles
              </p>
            )}
          </div>
        )}

      </div>
    ))}

  </div>

  <ErrorMsg field="tipoLiberacion" errors={errors} C={C} />
</Field>
      
    </div>
  );
}
