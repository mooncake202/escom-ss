import { RADIUS } from "@/themes/colors";
import { formatearFechaUTC } from "@/utils/fechas";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function BitacoraCard({ bitacora, onVer, C }) {
  const fecha = formatearFechaUTC(bitacora.fecha, {
    weekday: "long", day: "2-digit", month: "long",
  });

  return (
    <div style={{
      padding: "1rem 1.25rem", borderRadius: RADIUS.lg,
      background: C.bgCard, border: `1px solid ${C.borderDefault}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {bitacora.alumno.nombre}
          </p>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 12, color: C.textMuted }}>
          {CARRERA_LABEL[bitacora.alumno.carrera]} · {fecha}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: C.accentSoft, color: C.accentText, fontWeight: 600 }}>
            {bitacora.horasTrabajadas}h trabajadas
          </span>
          <span style={{ fontSize: 12, color: C.textDisabled }}>
            {bitacora.horaInicio} – {bitacora.horaFin}
          </span>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            {bitacora.actividad}
          </span>
        </div>
      </div>

      <button
        onClick={() => onVer(bitacora)}
        style={{ padding: "8px 18px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600, cursor: "pointer", background: C.accentSoft, border: `1px solid ${C.accent}`, color: C.accentText, fontFamily: "inherit", flexShrink: 0 }}
      >
        Revisar
      </button>
    </div>
  );
}
