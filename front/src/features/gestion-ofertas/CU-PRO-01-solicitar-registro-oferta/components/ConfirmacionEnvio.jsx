import { useTheme, RADIUS } from "@/themes/colors";

export function ConfirmacionEnvio({ tipo = "proyecto", onVolver }) {
  const { C } = useTheme();
  const esProyecto = tipo === "proyecto";
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.xl,
      border: `1px solid ${C.success}`, padding: "2.5rem 2rem", textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", background: C.successSoft,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 1.25rem",
      }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
          stroke={C.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
        Solicitud enviada
      </h3>
      <p style={{ margin: "0 0 0.25rem", fontSize: 14, color: C.textMuted }}>
        {esProyecto
          ? "Tu solicitud de registro del proyecto quedó registrada con estado:"
          : "Tu solicitud de registro de la oferta individual quedó registrada con estado:"}
      </p>
      <span style={{
        display: "inline-block", margin: "0.5rem 0 1.25rem",
        padding: "4px 14px", borderRadius: RADIUS.full,
        background: C.warningSoft, color: C.warning, fontSize: 13, fontWeight: 700,
      }}>
        Pendiente de revisión
      </span>
      <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled }}>
        {esProyecto
          ? "Coordinación revisará la solicitud y recibirás una notificación. Los cupos indicados están sujetos a tus cupos disponibles."
          : "Coordinación revisará la solicitud y recibirás una notificación. La oferta no será visible para los alumnos hasta entonces."}
      </p>
      <button onClick={onVolver} style={{
        padding: "10px 28px", borderRadius: RADIUS.md,
        background: C.accent, border: "none",
        color: "#fff", fontSize: 13, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit",
      }}>
        Ver mis proyectos
      </button>
    </div>
  );
}