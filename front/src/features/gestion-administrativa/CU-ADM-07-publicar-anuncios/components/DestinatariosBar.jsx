import { RADIUS } from "@/themes/colors";

// Informativa: muestra el alcance REAL del anuncio, no un selector. Los destinatarios no se eligen
// — el backend los deriva de las asignaciones vigentes.
//
// `alumnos` viene de /directorio/mis-alumnos (CU-ADM-17). `total` es el conteo que devuelve el
// propio endpoint de anuncios: si la lista no cargó, el número sigue siendo correcto.
export function DestinatariosBar({ alumnos, total, C }) {
  const n = total ?? alumnos.length;

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "0.875rem 1.25rem", marginBottom: "1.25rem",
      display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
    }}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0,
      }}>
        Visible para {n} alumno{n !== 1 ? "s" : ""}:
      </span>
      {alumnos.map((al) => (
        <span key={al.boleta} style={{
          padding: "3px 10px", borderRadius: RADIUS.full,
          fontSize: 12, fontWeight: 500,
          background: "rgba(99,102,241,0.1)", color: "#818cf8",
        }}>
          {al.nombreCompleto}
        </span>
      ))}
    </div>
  );
}

// Coordinación no tiene lista de destinatarios: su alcance es global por definición.
export function AlcanceGlobalBar({ C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "0.875rem 1.25rem", marginBottom: "1.25rem",
    }}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        Visible para todos los alumnos asignados
      </span>
    </div>
  );
}
