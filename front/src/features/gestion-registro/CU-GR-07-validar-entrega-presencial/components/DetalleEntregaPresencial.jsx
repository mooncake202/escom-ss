import { GRADIENTS, RADIUS, SHADOWS } from "@/themes/colors";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

function InfoRow({ label, value, C }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
      <span style={{ fontSize: 12, color: C.textDisabled, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

export function DetalleEntregaPresencial({ item, loading, onRegistrar, onCerrar, C }) {
  if (!item) return null;

  const fmtFecha = (iso) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <div onClick={onCerrar} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)",
        background: C.bgCard, borderLeft: `1px solid ${C.borderDefault}`,
        boxShadow: SHADOWS.xl, zIndex: 50,
        display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              CU-GR-07 · Validación presencial
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>
              Registrar recepción de carta
            </h2>
          </div>
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {/* Contenido */}
        <div style={{ padding: "1.25rem 1.5rem", flex: 1, overflowY: "auto" }}>

          {/* Datos alumno */}
          <p style={{ margin: "0 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Datos del alumno
          </p>
          <InfoRow label="Nombre"   value={item.alumno.nombre}                         C={C} />
          <InfoRow label="Boleta"   value={item.alumno.boleta}                         C={C} />
          <InfoRow label="Carrera"  value={CARRERA_LABEL[item.alumno.carrera]}         C={C} />
          <InfoRow label="Correo"   value={item.alumno.correoInst}                     C={C} />
          <InfoRow label="Profesor" value={item.profesor}                              C={C} />
          <InfoRow label="Periodo"  value={`${fmtFecha(item.periodoInicio)} — ${fmtFecha(item.periodoFin)}`} C={C} />

          {/* Aviso verificación — RN-GR-38 */}
          <div style={{
            marginTop: "1.5rem", padding: "14px 16px", borderRadius: RADIUS.md,
            background: "rgba(245,158,11,0.08)", border: `1px solid ${C.warning ?? "#F59E0B"}`,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: C.warning ?? "#F59E0B" }}>
              Antes de registrar la recepción, verifica:
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 5 }}>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                La carta está firmada por el alumno
              </li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                La carta está firmada por el profesor
              </li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                La carta está firmada por parte de atrás en el costado
              </li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                El documento corresponde al formato original del SISS
              </li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                Los datos del alumno en la carta coinciden con los del sistema
              </li>
            </ul>
          </div>

          {/* Info fecha registro — RN-GR-39 */}
          <p style={{ margin: "1.25rem 0 0", fontSize: 12, color: C.textDisabled, lineHeight: 1.5 }}>
            Al confirmar, el sistema registrará automáticamente la fecha y hora de recepción y notificará al alumno para que proceda con la carga de su expediente.
          </p>
        </div>

        {/* Botones — RN-GR-40 */}
        <div style={{ padding: "1.25rem 1.5rem", borderTop: `1px solid ${C.borderSubtle}`, display: "flex", gap: "0.75rem", flexShrink: 0 }}>
          <button
            onClick={onCerrar}
            style={{
              flex: 1, padding: "11px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textSecondary, fontFamily: "inherit",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onRegistrar(item.id)}
            disabled={loading}
            style={{
              flex: 2, padding: "11px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
              background: loading ? C.borderDefault : GRADIENTS.primary,
              border: "none", color: "#fff", fontFamily: "inherit",
              boxShadow: loading ? "none" : SHADOWS.accent,
            }}
          >
            {loading ? "Registrando..." : "Confirmar recepción ✓"}
          </button>
        </div>
      </div>
    </>
  );
}
