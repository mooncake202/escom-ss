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

export default function ContactoInstitucional({ rol = "alumno" }) {
  const { C } = useTheme();
  const { usuarios, tieneInfo, contacto } = useContactoInstitucional();
  const usuario = usuarios[rol] ?? usuarios.alumno;

  // ── Estado vacío ─────────────────────────────────────────────
  if (!tieneInfo) {
    return (
      <DashboardLayout titulo="Contacto institucional" subtitulo={`CU-ADM-08 · ${rol}`} rol={rol} usuario={usuario}>
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
    <DashboardLayout titulo="Contacto institucional" subtitulo={`CU-ADM-08 · ${rol}`} rol={rol} usuario={usuario}>
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
          {contacto.correos.map((c, i) => (
            <ContactoFila key={i} label={c.label} valor={c.valor} C={C} />
          ))}
        </SeccionCard>

        {/* Teléfonos */}
        <SeccionCard
          icono={<IconSVG path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5s1 2 3 3l1.113-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0119 13.72V17a2 2 0 01-2 2h-1C9.716 19 5 14.284 5 8.5V8a2 2 0 012-2h1" C={C} />}
          titulo="Teléfonos"
          C={C}
        >
          {contacto.telefonos.map((t, i) => (
            <ContactoFila key={i} label={t.label} valor={t.valor} C={C} />
          ))}
        </SeccionCard>

        {/* Ubicación */}
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
          {contacto.horarios.map((h, i) => (
            <ContactoFila key={i} label={h.dias} valor={h.horario} C={C} />
          ))}
        </SeccionCard>

        {/* Nota institucional */}
        <div style={{
          padding: "10px 14px", borderRadius: RADIUS.md,
          background: C.warningSoft, border: `1px solid ${C.warning}`,
          fontSize: 12, color: C.warning, lineHeight: 1.6,
        }}>
          <strong>Nota:</strong> {contacto.nota}
        </div>

      </div>
    </DashboardLayout>
  );
}
