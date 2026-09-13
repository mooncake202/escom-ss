import { RADIUS } from "@/themes/colors";
import { formatearFechaMexico } from "@/utils/fechas";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function SolicitudDocCard({ solicitud, onVer, C }) {
  const fecha = formatearFechaMexico(solicitud.fechaEnvio, {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div style={{
      padding: "1.1rem 1.25rem", borderRadius: RADIUS.lg,
      background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {solicitud.alumno.nombre}
        </p>
        <p style={{ margin: "0 0 3px", fontSize: 12, color: C.textMuted }}>
          {CARRERA_LABEL[solicitud.alumno.carrera] || solicitud.alumno.carrera} · Boleta {solicitud.alumno.boleta}
        </p>
        <p style={{ margin: "0 0 3px", fontSize: 12, color: C.textMuted }}>
          Profesor: {solicitud.profesor || "—"}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 20,
            background: solicitud.registroSISS ? C.successSoft : C.dangerSoft,
            color: solicitud.registroSISS ? C.success : C.danger, fontWeight: 600,
          }}>
            SISS {solicitud.registroSISS ? "✓" : "✕"}
          </span>
          <span style={{ fontSize: 12, color: C.textDisabled }}>Enviada el {fecha}</span>
        </div>
      </div>

      <button
        onClick={() => onVer(solicitud)}
        style={{
          padding: "8px 18px", borderRadius: RADIUS.md,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          background: C.accentSoft, border: `1px solid ${C.accent}`,
          color: C.accentText, fontFamily: "inherit", flexShrink: 0,
        }}
      >
        Revisar
      </button>
    </div>
  );
}