import { useTheme, RADIUS } from "@/themes/colors";
import { ContactRow }       from "./components/ContactRow";

// CU-ADM-01 — contacto del profesor responsable.
//
// Es el CONTENIDO de la pestaña "Profesor responsable" dentro de "Mi asignación": el layout, el
// encabezado y los estados de carga los pone la pantalla contenedora, que es quien consume
// `useContactoProfesor` (necesita `oferta.esProyecto` para decidir si existe la pestaña de equipo).
// Aquí no se llama a ningún endpoint: este componente solo pinta lo que ADM-01 ya devolvió.
//
// El botón "Ver a mi equipo" desapareció a propósito: esa navegación ahora son las pestañas.
export function PanelProfesor({ profesor, oferta, contactos }) {
  const { C } = useTheme();

  return (
    <>
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`,
        marginBottom: "0.75rem", overflow: "hidden",
      }}>
        {/* Encabezado */}
        <div style={{
          padding: "1.25rem 1rem", borderBottom: `1px solid ${C.borderDefault}`,
          background: C.bgInput,
          display: "flex", alignItems: "center", gap: "0.875rem",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: C.accentSoft, color: C.accentText,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>
            👨‍🏫
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
              {profesor.nombreCompleto}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
              Profesor responsable de tu servicio social
            </p>
          </div>
        </div>

        {/* Correo institucional: siempre existe */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          gap: "1rem", padding: "12px 16px",
          borderBottom: `1px solid ${C.borderDefault}`,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.textDisabled, flexShrink: 0, minWidth: 160 }}>
            Correo institucional
          </span>
          <a
            href={`mailto:${profesor.correoInstitucional}`}
            style={{ fontSize: 13, color: C.accentText, textDecoration: "none", fontFamily: "monospace", textAlign: "right" }}
          >
            {profesor.correoInstitucional}
          </a>
        </div>

        {profesor.departamento && (
          <ContactRow tipo="Departamento" valor={profesor.departamento} C={C} />
        )}

        {/* Cubículo, horario de atención y teléfono personal: el hook ya omite los vacíos */}
        {contactos.map((c) => (
          <ContactRow key={c.tipo} tipo={c.tipo} valor={c.valor} C={C} />
        ))}
      </div>

      <p style={{ margin: "0 0 1.5rem", fontSize: 11, color: C.textDisabled }}>
        Tu profesor mantiene actualizados su horario de atención y su teléfono desde su perfil, así
        que aquí solo aparecen los datos que ha registrado.
      </p>

      {/* Contexto de la oferta: de qué proyecto es responsable este profesor. */}
      {oferta && (
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "1.125rem 1.25rem",
        }}>
          <p style={{
            margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Tu proyecto
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
            {oferta.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
            {oferta.descripcion}
          </p>
        </div>
      )}
    </>
  );
}
