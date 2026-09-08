import { RADIUS } from "@/themes/colors";

const ESTADO_LABEL = {
  sin_comenzar: "Sin comenzar",
  en_progreso: "En progreso",
  vencida: "Vencida",
  completada_a_tiempo: "Completada a tiempo",
  completada_tarde: "Completada fuera de tiempo",
};

const ESTADO_STYLE = {
  sin_comenzar:         { bg: "rgba(85,85,85,0.12)",  color: "#9A9A9A" },
  en_progreso:          { bg: "rgba(10,102,194,0.12)", color: "#2E86DE" },
  // RN-AH-10: vencida debe distinguirse visualmente — tono de alerta.
  vencida:              { bg: "rgba(239,68,68,0.14)",  color: "#EF4444", borde: "#EF4444" },
  completada_a_tiempo:  { bg: "rgba(34,197,94,0.12)",  color: "#22C55E" },
  completada_tarde:     { bg: "rgba(245,158,11,0.14)", color: "#F59E0B" },
};

export function ActividadRow({ actividad, C, onEditar, onEliminar, onExtenderFecha }) {
  const estilo = ESTADO_STYLE[actividad.estado] ?? ESTADO_STYLE.sin_comenzar;
  const etiqueta = ESTADO_LABEL[actividad.estado] ?? actividad.estado;
  const fecha = new Date(actividad.fecha_asignacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  const esVencida = actividad.estado === "vencida";

  const handleEliminar = () => {
    if (window.confirm(`¿Eliminar la actividad "${actividad.titulo}"? Esta acción no se puede deshacer.`)) {
      onEliminar(actividad.id);
    }
  };

  return (
    <div
      style={{
        padding: "0.875rem", marginBottom: 8, borderRadius: RADIUS.md,
        border: `1px solid ${esVencida ? estilo.borde : C.borderSubtle}`,
        background: esVencida ? estilo.bg : "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{actividad.titulo}</p>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: estilo.bg, color: estilo.color, fontWeight: 600, flexShrink: 0 }}>
          {etiqueta}
        </span>
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{actividad.descripcion}</p>
      <p style={{ margin: "0 0 4px", fontSize: 12, color: C.textMuted }}>
        Fecha límite: {
          actividad.fecha_limite
            ? new Date(actividad.fecha_limite).toLocaleDateString("es-MX", { timeZone: "UTC" })
            : "Sin definir"
        }
        {actividad.fecha_limite_original && (
          <span style={{ color: C.textDisabled }}>
            {" "}(original: {new Date(actividad.fecha_limite_original).toLocaleDateString("es-MX", { timeZone: "UTC" })})
          </span>
        )}
      </p>
      {actividad.entregable_esperado && (
        <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textDisabled }}>
          Entregable: {actividad.entregable_esperado}
        </p>
      )}
      {/* Barra de progreso */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 4, background: C.borderSubtle, borderRadius: 2 }}>
          <div style={{ width: `${actividad.porcentaje_progreso}%`, height: "100%", borderRadius: 2, background: actividad.porcentaje_progreso === 100 ? "#22C55E" : "#2E86DE", transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 11, color: C.textDisabled, minWidth: 30, textAlign: "right" }}>{actividad.porcentaje_progreso}%</span>
        <span style={{ fontSize: 11, color: C.textDisabled }}>{fecha}</span>
      </div>

      {/* RN-AH-05/RF-AH-07: acciones según si ya tiene avance en bitácora */}
      <div style={{ display: "flex", gap: 8 }}>
        {actividad.tieneAvance ? (
          <button
            onClick={() => onExtenderFecha(actividad)}
            style={{ padding: "5px 12px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", border: `1px solid ${C.accent}`, color: C.accentText, fontFamily: "inherit" }}
          >
            Extender fecha límite
          </button>
        ) : (
          <>
            <button
              onClick={() => onEditar(actividad)}
              style={{ padding: "5px 12px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: "inherit" }}
            >
              Editar
            </button>
            <button
              onClick={handleEliminar}
              style={{ padding: "5px 12px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", border: `1px solid ${C.danger}`, color: C.danger, fontFamily: "inherit" }}
            >
              Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
