import { useTheme, RADIUS } from "@/themes/colors";

export function ProyectoCard({ proyecto }) {
  const { C } = useTheme();

  return (
    <div style={{
      background: C.bgInput, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1rem 1.1rem", marginBottom: "1.5rem",
    }}>
      <h4 style={{ margin: "0 0 0.4rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
        {proyecto.nombre}
      </h4>
      <p style={{ margin: "0 0 0.4rem", fontSize: 13, color: C.textMuted }}>
        Profesor responsable: {proyecto.profesor}
      </p>
      <p style={{ margin: "0 0 0.8rem", fontSize: 13, color: C.textMuted }}>
        Fecha de asignación: {proyecto.fechaAsignacion}
      </p>
      <span style={{
        display: "inline-block", padding: "4px 12px", borderRadius: RADIUS.full,
        background: C.successSoft, color: C.success, fontSize: 12, fontWeight: 700,
      }}>
        {proyecto.estado}
      </span>

      <div style={{ marginTop: "1rem" }}>
        <p style={{
          margin: "0 0 0.5rem", fontSize: 12, fontWeight: 700, color: C.textMuted,
          textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          Actividades asociadas
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {proyecto.actividades.map(actividad => (
            <span key={actividad} style={{
              padding: "6px 10px", borderRadius: RADIUS.full,
              background: C.bgPage, border: `1px solid ${C.borderDefault}`,
              color: C.textPrimary, fontSize: 12,
            }}>
              {actividad}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
