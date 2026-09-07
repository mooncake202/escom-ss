import { RADIUS } from "../../../../themes/colors";

const CARRERA_LABEL = { ISC: "Ing. Sistemas Computacionales", IA: "Inteligencia Artificial", LCD: "Lic. Ciencia de Datos" };

export function SolicitudCard({ solicitud, onVer, C }) {
  const fecha = new Date(solicitud.fechaCreacion).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div style={{
      padding: "1.1rem 1.25rem", borderRadius: RADIUS.lg,
      background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", transition: "border-color 0.2s",
    }}>
      {/* Info alumno */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {solicitud.nombre}
        </p>
        <p style={{ margin: "0 0 3px", fontSize: 12, color: C.textMuted }}>
          {CARRERA_LABEL[solicitud.carrera] ?? solicitud.carrera}
        </p>

        <p style={{ margin: "0 0 3px", fontSize: 12, color: C.textMuted }}>
          Vacante: { solicitud.tituloOferta }
        </p>

        <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
          Enviada el {fecha}
        </p>
      </div>

      {/* Botón ver */}
      <button
        onClick={() => onVer(solicitud)}
        style={{
          padding: "8px 18px", borderRadius: RADIUS.md,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          background: C.accentSoft, border: `1px solid ${C.accent}`,
          color: C.accentText, fontFamily: "inherit", flexShrink: 0,
          transition: "opacity 0.15s",
        }}
      >
        Ver solicitud
      </button>
    </div>
  );
}