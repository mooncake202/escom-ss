import { useTheme, RADIUS }             from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { SeccionCard }                   from "./components/SeccionCard";
import { ContactoFila }                  from "./components/SeccionFila";
import { useContactoInstitucional }      from "./hooks/useContactoInstitucional";

function IconSVG({ path, C }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={C.accentText} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function InputEditable({ value, onChange, placeholder, C }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        flex: 1, padding: "6px 10px", borderRadius: RADIUS.md,
        background: C.bgInput, border: `1px solid ${C.borderDefault}`,
        color: C.textPrimary, fontSize: 13, outline: "none",
        fontFamily: "inherit", minWidth: 0,
      }}
    />
  );
}

function BtnIcono({ onClick, title, C, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: "transparent", border: "none", cursor: "pointer",
      color: C.textDisabled, padding: "4px", display: "flex",
      alignItems: "center", flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

function FilaEditable({ labelValue, valorValue, onLabelChange, onValorChange, onEliminar, labelPlaceholder, valorPlaceholder, C }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.borderDefault}` }}>
      <InputEditable value={labelValue} onChange={onLabelChange} placeholder={labelPlaceholder} C={C} />
      <InputEditable value={valorValue} onChange={onValorChange} placeholder={valorPlaceholder} C={C} />
      <BtnIcono onClick={onEliminar} title="Eliminar" C={C}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </BtnIcono>
    </div>
  );
}

function BtnAgregar({ onClick, label, C }) {
  return (
    <button onClick={onClick} style={{
      marginTop: "0.5rem", padding: "5px 12px", borderRadius: RADIUS.md,
      background: "transparent", border: `1px dashed ${C.borderDefault}`,
      color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
      display: "flex", alignItems: "center", gap: "0.375rem",
    }}>
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {label}
    </button>
  );
}

export default function ContactoInstitucional({ rol = "alumno" }) {
  const { C } = useTheme();
  const {
    usuarios, tieneInfo, contacto, guardado,
    handleCorreoChange,   handleAgregarCorreo,   handleEliminarCorreo,
    handleTelefonoChange, handleAgregarTelefono, handleEliminarTelefono,
    handleHorarioChange,  handleAgregarHorario,  handleEliminarHorario,
    handleGuardar,
  } = useContactoInstitucional();
  const usuario = usuarios[rol] ?? usuarios.alumno;
  const esCoord = rol === "coordinacion";

  // ── Estado vacío ─────────────────────────────────────────────
  if (!tieneInfo) {
    return (
      <DashboardLayout titulo="Contacto institucional" subtitulo={`CU-ADM-06 · ${rol}`} rol={rol} usuario={usuario}>
        <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.borderDefault}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: C.bgInput,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
                stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5s1 2 3 3l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0119 13.72V17a2 2 0 01-2 2h-1C9.716 19 5 14.284 5 8.5V8a2 2 0 012-2h1" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Sin información disponible
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Coordinación aún no ha registrado información de contacto institucional en el sistema.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Flujo principal ───────────────────────────────────────────
  return (
    <DashboardLayout titulo="Contacto institucional" subtitulo={`CU-ADM-06 · ${rol}`} rol={rol} usuario={usuario}>
      <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>

        {/* Encabezado del departamento */}
        <div style={{
          marginBottom: "1.25rem", padding: "12px 16px",
          borderRadius: RADIUS.lg, background: C.bgCard,
          border: `1px solid ${C.borderDefault}`,
          display: "flex", alignItems: "center", gap: "0.875rem",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: RADIUS.md, background: C.accentSoft,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke={C.accentText} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 7a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
            {contacto.departamento}
          </p>
        </div>

        {/* Correos */}
        <SeccionCard
          icono={<IconSVG path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" C={C} />}
          titulo="Correos institucionales"
          C={C}
        >
          {esCoord ? (
            <>
              {contacto.correos.map((c, i) => (
                <FilaEditable
                  key={i}
                  labelValue={c.label}
                  valorValue={c.valor}
                  onLabelChange={v => handleCorreoChange(i, "label", v)}
                  onValorChange={v => handleCorreoChange(i, "valor", v)}
                  onEliminar={() => handleEliminarCorreo(i)}
                  labelPlaceholder="Etiqueta"
                  valorPlaceholder="correo@ejemplo.mx"
                  C={C}
                />
              ))}
              <BtnAgregar onClick={handleAgregarCorreo} label="Agregar correo" C={C} />
            </>
          ) : (
            contacto.correos.map((c, i) => (
              <ContactoFila key={i} label={c.label} valor={c.valor} C={C} />
            ))
          )}
        </SeccionCard>

        {/* Teléfonos */}
        <SeccionCard
          icono={<IconSVG path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5s1 2 3 3l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0119 13.72V17a2 2 0 01-2 2h-1C9.716 19 5 14.284 5 8.5V8a2 2 0 012-2h1" C={C} />}
          titulo="Teléfonos"
          C={C}
        >
          {esCoord ? (
            <>
              {contacto.telefonos.map((t, i) => (
                <FilaEditable
                  key={i}
                  labelValue={t.label}
                  valorValue={t.valor}
                  onLabelChange={v => handleTelefonoChange(i, "label", v)}
                  onValorChange={v => handleTelefonoChange(i, "valor", v)}
                  onEliminar={() => handleEliminarTelefono(i)}
                  labelPlaceholder="Etiqueta"
                  valorPlaceholder="55 0000 0000 ext. 000"
                  C={C}
                />
              ))}
            </>
          ) : (
            contacto.telefonos.map((t, i) => (
              <ContactoFila key={i} label={t.label} valor={t.valor} C={C} />
            ))
          )}
        </SeccionCard>

        {/* Ubicación (solo lectura para todos) */}
        <SeccionCard
          icono={<IconSVG path="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" C={C} />}
          titulo="Ubicación"
          C={C}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "4px 0" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{contacto.ubicacion.edificio}</span>
            <span style={{ fontSize: 13, color: C.textMuted }}>{contacto.ubicacion.campus}</span>
            <span style={{ fontSize: 12, color: C.textDisabled }}>{contacto.ubicacion.ciudad}</span>
          </div>
        </SeccionCard>

        {/* Horarios */}
        <SeccionCard
          icono={<IconSVG path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" C={C} />}
          titulo="Horarios de atención"
          C={C}
        >
          {esCoord ? (
            <>
              {contacto.horarios.map((h, i) => (
                <FilaEditable
                  key={i}
                  labelValue={h.dias}
                  valorValue={h.horario}
                  onLabelChange={v => handleHorarioChange(i, "dias", v)}
                  onValorChange={v => handleHorarioChange(i, "horario", v)}
                  onEliminar={() => handleEliminarHorario(i)}
                  labelPlaceholder="Días (ej: Lunes a viernes)"
                  valorPlaceholder="Horario (ej: 9:00 – 15:00)"
                  C={C}
                />
              ))}
            </>
          ) : (
            contacto.horarios.map((h, i) => (
              <ContactoFila key={i} label={h.dias} valor={h.horario} C={C} />
            ))
          )}
        </SeccionCard>

        {/* Botón guardar (solo coordinación) */}
        {esCoord && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", justifyContent: "flex-end" }}>
            {guardado && (
              <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>
                Cambios guardados
              </span>
            )}
            <button
              onClick={handleGuardar}
              style={{
                padding: "10px 28px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Guardar cambios
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
