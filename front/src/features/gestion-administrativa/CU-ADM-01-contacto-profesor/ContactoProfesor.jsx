import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }      from "@/components/layout/DashboardLayout";
// import { PageContent }          from "@/components/layout/PageContent";
import { ProfesorHeader }       from "./components/ProfesorHeader";
import { ContactRow }           from "./components/ContactRow";
import { useContactoProfesor }  from "./hooks/useContactoProfesor";

export default function ContactoProfesor() {
  const { C } = useTheme();
  const { profesor, alumno } = useContactoProfesor();

  // — Estado vacío: sin profesor asignado —
  if (!profesor) {
    return (
      <DashboardLayout
        titulo="Información de contacto del profesor"
        subtitulo="CU-ADM-01 · Alumno"
        rol="alumno"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`,
            padding: "4rem 2rem", textAlign: "center",
          }}>
            <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>👨‍🏫</p>
            <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
              Sin profesor asignado
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              Aún no tienes un profesor asignado para tu servicio social.
              Consulta con coordinación para más información.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // — Estado vacío: profesor sin medios de contacto —
  if (profesor.contactos.length === 0) {
    return (
      <DashboardLayout
        titulo="Información de contacto del profesor"
        subtitulo="CU-ADM-01 · Alumno"
        rol="alumno"
        usuario={alumno.nombre}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
          <ProfesorHeader profesor={profesor} C={C} />
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            <p style={{ margin: "0 0 0.375rem", fontSize: 14, fontWeight: 600, color: C.textMuted }}>
              Sin medios de contacto disponibles
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>
              Tu profesor no tiene medios de contacto adicionales registrados en el sistema.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // — Flujo principal —
  return (
    <DashboardLayout
      titulo="Información de contacto del profesor"
      subtitulo="CU-ADM-01 · Alumno"
      rol="alumno"
      usuario={alumno.nombre}
    >
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>

        {/* Tarjeta principal del profesor */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          marginBottom: "1.25rem", overflow: "hidden",
        }}>
          {/* Encabezado */}
          <div style={{
            padding: "1.5rem", borderBottom: `1px solid ${C.borderDefault}`,
            display: "flex", alignItems: "center", gap: "1rem",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: RADIUS.full,
              background: "rgba(0,58,143,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              👨‍🏫
            </div>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
                {profesor.nombre}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                Profesor responsable de tu servicio social
              </p>
            </div>
          </div>

          {/* Correo institucional */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: "1rem", padding: "12px 16px",
            borderBottom: `1px solid ${C.borderDefault}`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.textDisabled, flexShrink: 0, minWidth: 160 }}>
              Correo institucional
            </span>
            <a
              href={`mailto:${profesor.correo}`}
              style={{
                fontSize: 13, color: C.accentText,
                textDecoration: "none", fontFamily: "monospace",
              }}
            >
              {profesor.correo}
            </a>
          </div>

          {/* Medios adicionales */}
          {profesor.contactos.map((c, i) => (
            <ContactRow key={i} tipo={c.tipo} valor={c.valor} C={C} />
          ))}

          {/* Quitar el borde inferior del último elemento */}
          <div style={{ height: 1, background: C.bgCard, marginTop: -1 }} />
        </div>

        <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
          Solo se muestran los medios de contacto habilitados por el profesor en el sistema.
        </p>

      </div>
    </DashboardLayout>
  );
}
