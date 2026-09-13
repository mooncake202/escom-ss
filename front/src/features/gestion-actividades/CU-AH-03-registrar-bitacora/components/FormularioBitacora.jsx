import { GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";

export function FormularioBitacora({
  errores, actividades, horasTrabajadas, pendienteDatos,
  avances, onAgregarAvance, onQuitarAvance, onCambiarAvance,
  onRegistrar, loading, C
}) {

  // Actividades que aún no fueron seleccionadas
  const disponibles = actividades.filter(
    a => !avances.some(av => av.actividadId === String(a.id))
  );

  return (
    <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.5rem" }}>

      <p style={{ margin: "0 0 0.25rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
        Completa tu bitácora del día
      </p>
      <p style={{ margin: "0 0 1.5rem", fontSize: 13, color: C.textMuted }}>
        {pendienteDatos ? "Horas ya contabilizadas: " : "Jornada registrada: "}
        <strong style={{ color: C.textPrimary }}>{horasTrabajadas} hora{horasTrabajadas !== 1 ? "s" : ""}</strong>
      </p>

      {/* ── Actividades con avance ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Actividades trabajadas *
          </label>
          {/* Botón agregar — solo si quedan actividades disponibles */}
          {disponibles.length > 0 && (
            <button
              onClick={onAgregarAvance}
              style={{ fontSize: 12, fontWeight: 600, color: C.accentText, background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: RADIUS.md, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
            >
              + Agregar actividad
            </button>
          )}
        </div>

        {/* Lista de avances */}
        {avances.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, padding: "10px 14px", background: C.bgInput, borderRadius: RADIUS.md }}>
            Agrega al menos una actividad en la que trabajaste hoy.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {avances.map((av, idx) => (
              <div key={idx} style={{ padding: "0.875rem 1rem", background: C.bgInput, borderRadius: RADIUS.md, border: `1px solid ${errores[`avance_${idx}_actividad`] || errores[`avance_${idx}_descripcion`] || errores[`avance_${idx}_evidencia`] ? C.danger : C.borderSubtle}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>

                  {/* Select de actividad */}
                  <select
                    value={av.actividadId}
                    onChange={e => onCambiarAvance(idx, "actividadId", e.target.value)}
                    style={{ flex: 1, padding: "8px 12px", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", fontFamily: "inherit", appearance: "none", cursor: "pointer", marginRight: 8 }}
                  >
                    <option value="">Seleccionar actividad</option>
                    {/* Muestra la propia + las disponibles */}
                    {actividades
                      .filter(a => String(a.id) === av.actividadId || !avances.some((x, i) => i !== idx && x.actividadId === String(a.id)))
                      .map(a => (
                        <option key={a.id} value={String(a.id)}>{a.titulo}{a.estado === "vencida" ? " (vencida)" : ""}</option>
                      ))
                    }
                  </select>

                  {/* Quitar */}
                  {avances.length > 1 && (
                    <button
                      onClick={() => onQuitarAvance(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.textDisabled, fontSize: 16, padding: 4, lineHeight: 1, flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {errores[`avance_${idx}_actividad`] && (
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: C.danger }}>{errores[`avance_${idx}_actividad`]}</p>
                )}

                {/* Descripción de la actividad seleccionada (la que puso el profesor al asignarla) */}
                {(() => {
                  const seleccionada = actividades.find(a => String(a.id) === av.actividadId);
                  return seleccionada ? (
                    <p style={{ margin: "0 0 8px", fontSize: 12, color: C.textDisabled, lineHeight: 1.5 }}>
                      {seleccionada.descripcion}
                    </p>
                  ) : null;
                })()}

                {/* Slider de progreso */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: C.textDisabled, whiteSpace: "nowrap" }}>Avance</span>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={av.progreso}
                    onChange={e => onCambiarAvance(idx, "progreso", Number(e.target.value))}
                    style={{ flex: 1, accentColor: C.accent }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, minWidth: 36, textAlign: "right" }}>
                    {av.progreso}%
                  </span>
                </div>

                {/* Descripción individual de esta actividad */}
                <div style={{ marginBottom: 8 }}>
                  <textarea
                    value={av.descripcion}
                    onChange={e => onCambiarAvance(idx, "descripcion", e.target.value)}
                    placeholder="¿Qué hiciste hoy en esta actividad? *"
                    rows={2}
                    style={{ width: "100%", padding: "8px 12px", background: C.bgCard, border: `1px solid ${errores[`avance_${idx}_descripcion`] ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }}
                  />
                  {errores[`avance_${idx}_descripcion`] && (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores[`avance_${idx}_descripcion`]}</p>
                  )}
                </div>

                {/* Evidencia individual de esta actividad */}
                <div>
                  <input
                    value={av.evidencia}
                    onChange={e => onCambiarAvance(idx, "evidencia", e.target.value)}
                    placeholder="Evidencia: URL del documento, repositorio, o descripción de la entrega *"
                    style={{ width: "100%", padding: "8px 12px", background: C.bgCard, border: `1px solid ${errores[`avance_${idx}_evidencia`] ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  />
                  {errores[`avance_${idx}_evidencia`] && (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores[`avance_${idx}_evidencia`]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {errores.avances && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{errores.avances}</p>}
      </div>

      <button
        onClick={onRegistrar}
        disabled={loading}
        style={{ width: "100%", padding: "12px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer", background: loading ? C.borderDefault : GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: loading ? "none" : SHADOWS.accent, transition: "background 0.2s" }}
      >
        {loading ? "Guardando bitácora..." : "Registrar bitácora del día ✓"}
      </button>
    </div>
  );
}