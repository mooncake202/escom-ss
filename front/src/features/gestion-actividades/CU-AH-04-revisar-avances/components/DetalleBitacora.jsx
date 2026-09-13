import { useState } from "react";
import { GRADIENTS, RADIUS, SHADOWS } from "@/themes/colors";
import { formatearFechaUTC } from "@/utils/fechas";

// Modos del panel: normal | rechazo | trabajo-adicional
const MODO = { NORMAL: "normal", RECHAZO: "rechazo", ADICIONAL: "adicional" };

function InfoRow({ label, value, C }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
      <span style={{ fontSize: 12, color: C.textDisabled, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500, textAlign: "right", maxWidth: "65%" }}>{value}</span>
    </div>
  );
}

export function DetalleBitacora({ bitacora, loading, comentario, setComentario, modoRechazo, setModoRechazo, onDecidir, onCerrar, C }) {
  if (!bitacora) return null;

  const [modo, setModo]                     = useState(MODO.NORMAL);
  const [actTitulo, setActTitulo]           = useState("");
  const [actDescripcion, setActDescripcion] = useState("");
  const [actEntregable, setActEntregable]   = useState("");
  const [actErrores, setActErrores]         = useState({});

  const resetModo = () => {
    setModo(MODO.NORMAL);
    setModoRechazo(false);
    setComentario("");
    setActTitulo(""); setActDescripcion(""); setActEntregable("");
    setActErrores({});
  };

  const validarActividad = () => {
    const errs = {};
    if (!actTitulo.trim())      errs.titulo      = "El título es obligatorio";
    if (!actDescripcion.trim()) errs.descripcion = "La descripción es obligatoria";
    setActErrores(errs);
    return Object.keys(errs).length === 0;
  };

  // RN-AH-43 y RN-AH-44: aprueba bitácora + registra nueva actividad
  const confirmarAdicional = () => {
    if (!validarActividad()) return;
    onDecidir(bitacora.id, "aprobar-adicional", {
      titulo: actTitulo.trim(),
      descripcion: actDescripcion.trim(),
      entregable: actEntregable.trim() || null,
    });
  };

  const fecha   = formatearFechaUTC(bitacora.fecha, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const esUrl   = bitacora.evidencia.startsWith("http");

  return (
    <>
      <div onClick={onCerrar} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
        background: C.bgCard, borderLeft: `1px solid ${C.borderDefault}`,
        boxShadow: SHADOWS.xl, zIndex: 50, display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>CU-AH-04 · Revisión de bitácora</p>
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>Revisar avances y horas</h2>
          </div>
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>

          {/* Datos jornada — RN-AH-33 */}
          <p style={{ margin: "0 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Jornada</p>
          <InfoRow label="Alumno"      value={bitacora.alumno.nombre}  C={C} />
          <InfoRow label="Oferta"      value={bitacora.alumno.oferta}  C={C} />

          <InfoRow label="Fecha"       value={fecha}                   C={C} />
          <InfoRow label="Hora inicio" value={bitacora.horaInicio}     C={C} />
          <InfoRow label="Hora fin"    value={bitacora.horaFin}        C={C} />
          <InfoRow label="Horas"       value={`${bitacora.horasTrabajadas}h trabajadas`} C={C} />

          {/* Actividades y avances — múltiples */}
          <p style={{ margin: "1.25rem 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Actividades reportadas ({bitacora.avances.length})
          </p>
          {bitacora.avances.map((av, idx) => (
            <div key={idx} style={{ padding: "10px 12px", marginBottom: 8, background: C.bgInput, borderRadius: RADIUS.md, border: `1px solid ${C.borderSubtle}` }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{av.actividad}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: C.borderSubtle, borderRadius: 2 }}>
                  <div style={{ width: `${av.progreso}%`, height: "100%", borderRadius: 2, background: av.progreso === 100 ? "#22C55E" : "#2E86DE" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, minWidth: 34, textAlign: "right" }}>{av.progreso}%</span>
              </div>
            </div>
          ))}

          {/* Descripción */}
          <p style={{ margin: "1.25rem 0 8px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Descripción del trabajo</p>
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.textSecondary, lineHeight: 1.6, padding: "10px 14px", background: C.bgInput, borderRadius: RADIUS.md }}>
            {bitacora.descripcion}
          </p>

          {/* Evidencia — RN-AH-32 */}
          <p style={{ margin: "0 0 8px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Evidencia</p>
          <div style={{ padding: "10px 14px", background: C.bgInput, borderRadius: RADIUS.md, marginBottom: "1.25rem" }}>
            {esUrl
              ? <a href={bitacora.evidencia} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.accentText, wordBreak: "break-all" }}>{bitacora.evidencia}</a>
              : <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>{bitacora.evidencia}</p>
            }
          </div>

          {/* Aviso — RN-AH-42 */}
          <div style={{ padding: "10px 14px", borderRadius: RADIUS.md, background: C.accentSoft, border: `1px solid ${C.accent}` }}>
            <p style={{ margin: 0, fontSize: 12, color: C.accentText, lineHeight: 1.5 }}>
              Solo rechaza si la evidencia es inexistente o no corresponde al avance. Si el avance necesita continuación pero la evidencia es válida, usa <strong>Trabajo adicional</strong>.
            </p>
          </div>

          {/* ── Formulario rechazo ── */}
          {modo === MODO.RECHAZO && (
            <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: C.dangerSoft, borderRadius: RADIUS.md, border: `1px solid ${C.danger}` }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Motivo del rechazo *
              </p>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Indica por qué la evidencia es inexistente o inconsistente con el avance reportado..."
                rows={4}
                style={{ width: "100%", padding: "10px 14px", background: C.bgInput, border: `1px solid ${comentario.trim() ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
              />
              {!comentario.trim() && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>Campo obligatorio</p>}
            </div>
          )}

          {/* ── Formulario trabajo adicional — RN-AH-43 y RN-AH-44 ── */}
          {modo === MODO.ADICIONAL && (
            <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "rgba(245,158,11,0.08)", borderRadius: RADIUS.md, border: `1px solid ${C.warning ?? "#F59E0B"}` }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: C.warning ?? "#F59E0B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Nueva actividad adicional
              </p>
              <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                La bitácora será aprobada y se asignará esta nueva actividad al alumno para continuar o corregir el trabajo.
              </p>

              {/* Título */}
              <div style={{ marginBottom: "0.875rem" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Título *</label>
                <input
                  value={actTitulo}
                  onChange={e => { setActTitulo(e.target.value); setActErrores(p => ({ ...p, titulo: null })); }}
                  placeholder="Ej. Corrección del análisis de requerimientos"
                  style={{ width: "100%", padding: "9px 12px", background: C.bgInput, border: `1px solid ${actErrores.titulo ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
                {actErrores.titulo && <p style={{ margin: "3px 0 0", fontSize: 12, color: C.danger }}>{actErrores.titulo}</p>}
              </div>

              {/* Descripción */}
              <div style={{ marginBottom: "0.875rem" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Descripción *</label>
                <textarea
                  value={actDescripcion}
                  onChange={e => { setActDescripcion(e.target.value); setActErrores(p => ({ ...p, descripcion: null })); }}
                  placeholder="Describe qué debe hacer el alumno para continuar o corregir..."
                  rows={3}
                  style={{ width: "100%", padding: "9px 12px", background: C.bgInput, border: `1px solid ${actErrores.descripcion ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }}
                />
                {actErrores.descripcion && <p style={{ margin: "3px 0 0", fontSize: 12, color: C.danger }}>{actErrores.descripcion}</p>}
              </div>

              {/* Entregable opcional */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                  Entregable <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span>
                </label>
                <input
                  value={actEntregable}
                  onChange={e => setActEntregable(e.target.value)}
                  placeholder="Ej. Documento corregido en PDF"
                  style={{ width: "100%", padding: "9px 12px", background: C.bgInput, border: `1px solid ${C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Botones ── */}
        <div style={{ padding: "1.25rem 1.5rem", borderTop: `1px solid ${C.borderSubtle}`, flexShrink: 0 }}>

          {/* Modo normal: tres botones */}
          {modo === MODO.NORMAL && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button
                  onClick={() => setModo(MODO.RECHAZO)}
                  style={{ flex: 1, padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: `1px solid ${C.danger}`, color: C.danger, fontFamily: "inherit" }}
                >
                  Rechazar
                </button>
                <button
                  onClick={() => onDecidir(bitacora.id, "aprobar")}
                  disabled={loading}
                  style={{ flex: 1, padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", background: loading ? C.borderDefault : GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: loading ? "none" : SHADOWS.accent }}
                >
                  {loading ? "Procesando..." : "Aprobar"}
                </button>
              </div>
              {/* Trabajo adicional — RN-AH-43 */}
              <button
                onClick={() => setModo(MODO.ADICIONAL)}
                style={{ width: "100%", padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "rgba(245,158,11,0.08)", border: `1px solid ${C.warning ?? "#F59E0B"}`, color: C.warning ?? "#F59E0B", fontFamily: "inherit" }}
              >
                Aprobar + asignar trabajo adicional
              </button>
            </div>
          )}

          {/* Modo rechazo */}
          {modo === MODO.RECHAZO && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <button
                onClick={() => onDecidir(bitacora.id, "rechazar")}
                disabled={!comentario.trim() || loading}
                style={{ padding: "11px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600, cursor: !comentario.trim() || loading ? "not-allowed" : "pointer", background: !comentario.trim() || loading ? C.borderDefault : C.danger, border: "none", color: "#fff", fontFamily: "inherit", opacity: !comentario.trim() ? 0.5 : 1 }}
              >
                {loading ? "Procesando..." : "Confirmar rechazo"}
              </button>
              <button onClick={resetModo} style={{ padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: "inherit" }}>
                Cancelar
              </button>
            </div>
          )}

          {/* Modo trabajo adicional */}
          {modo === MODO.ADICIONAL && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <button
                onClick={confirmarAdicional}
                disabled={loading}
                style={{ padding: "11px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer", background: loading ? C.borderDefault : GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: loading ? "none" : SHADOWS.accent }}
              >
                {loading ? "Procesando..." : "Aprobar y asignar actividad"}
              </button>
              <button onClick={resetModo} style={{ padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: "inherit" }}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}