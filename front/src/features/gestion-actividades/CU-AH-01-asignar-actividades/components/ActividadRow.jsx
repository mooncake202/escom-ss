import { RADIUS } from "@/themes/colors";
import { formatearFechaMexico } from "@/utils/fechas";

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

function inputStyleBase(C, error) {
  return {
    width: "100%", padding: "8px 10px", background: C.bgInput,
    border: `1px solid ${error ? C.danger : C.borderDefault}`, borderRadius: RADIUS.sm,
    color: C.textPrimary, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };
}

// Formulario inline — se muestra pegado debajo de la fila que se está
// editando/extendiendo (Ajuste 5), en vez de un formulario compartido en
// otra parte de la pantalla. Recibe el estado ya vivido en el hook
// (useAsignarActividades) como props — no duplica validación/guardado
// local, solo cambia DÓNDE se dibuja.
function FormularioInline({ modo, actividad, form, errores, handleChange, guardar, cerrarFormulario, loading, C }) {
  return (
    <div style={{ marginTop: 10, padding: "0.875rem", borderRadius: RADIUS.md, border: `1px solid ${C.accent}`, background: C.bgCard }}>
      {errores.general && (
        <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger }}>{errores.general}</p>
      )}

      {modo === "extender-fecha" ? (
        <>
          <p style={{ margin: "0 0 0.625rem", fontSize: 12, color: C.textMuted }}>
            Fecha límite actual: {new Date(actividad.fecha_limite).toLocaleDateString("es-MX", { timeZone: "UTC" })}
          </p>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
              Nueva fecha límite *
            </label>
            <input
              type="date"
              name="fecha_limite"
              value={form.fecha_limite}
              onChange={handleChange}
              style={inputStyleBase(C, errores.fecha_limite)}
            />
            {errores.fecha_limite && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.fecha_limite}</p>}
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: "0.625rem" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
              Título *
            </label>
            <input name="titulo" value={form.titulo} onChange={handleChange} style={inputStyleBase(C, errores.titulo)} />
            {errores.titulo && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.titulo}</p>}
          </div>
          <div style={{ marginBottom: "0.625rem" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
              Descripción *
            </label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3}
              style={{ ...inputStyleBase(C, errores.descripcion), resize: "vertical", lineHeight: 1.5 }} />
            {errores.descripcion && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.descripcion}</p>}
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
              Entregable esperado *
            </label>
            <input name="entregable_esperado" value={form.entregable_esperado} onChange={handleChange} style={inputStyleBase(C, errores.entregable_esperado)} />
            {errores.entregable_esperado && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.entregable_esperado}</p>}
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: "0.625rem" }}>
        <button
          onClick={cerrarFormulario}
          style={{ flex: 1, padding: "8px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: "inherit" }}
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={loading}
          style={{ flex: 2, padding: "8px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 600, cursor: loading ? "wait" : "pointer", background: loading ? C.borderDefault : C.accent, border: "none", color: "#fff", fontFamily: "inherit" }}
        >
          {loading ? "Guardando..." : modo === "extender-fecha" ? "Extender fecha" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

export function ActividadRow({ actividad, C, onEditar, onEliminar, onExtenderFecha, edicion }) {
  const estilo = ESTADO_STYLE[actividad.estado] ?? ESTADO_STYLE.sin_comenzar;
  const etiqueta = ESTADO_LABEL[actividad.estado] ?? actividad.estado;
  const fecha = formatearFechaMexico(actividad.fecha_asignacion, { day: "2-digit", month: "short", year: "numeric" });
  const esVencida = actividad.estado === "vencida";
  const esCompletada = actividad.estado === "completada_a_tiempo" || actividad.estado === "completada_tarde";

  const editandoEstaFila = edicion?.actividadEnEdicion?.id === actividad.id
    && (edicion.modoFormulario === "editar" || edicion.modoFormulario === "extender-fecha");

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

      {/* RN-AH-05/RF-AH-07: "Extender fecha límite" siempre disponible, sin
          importar si hay avance ni el estado (sin_comenzar/en_progreso/
          vencida). "Editar"/"Eliminar" solo si NO tiene avance. Una
          actividad completada es un registro histórico cerrado — nunca
          muestra ningún botón de acción. */}
      {!esCompletada && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onExtenderFecha(actividad)}
            style={{ padding: "5px 12px", borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", border: `1px solid ${C.accent}`, color: C.accentText, fontFamily: "inherit" }}
          >
            Extender fecha límite
          </button>
          {!actividad.tieneAvance && (
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
      )}

      {editandoEstaFila && (
        <FormularioInline
          modo={edicion.modoFormulario}
          actividad={actividad}
          form={edicion.form}
          errores={edicion.errores}
          handleChange={edicion.handleChange}
          guardar={edicion.guardar}
          cerrarFormulario={edicion.cerrarFormulario}
          loading={edicion.loading}
          C={C}
        />
      )}
    </div>
  );
}
