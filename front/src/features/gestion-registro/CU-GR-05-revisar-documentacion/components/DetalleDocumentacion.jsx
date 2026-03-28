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

function DocRow({ label, doc, C }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={doc ? C.success : C.textDisabled} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: doc ? C.textPrimary : C.textDisabled, fontWeight: 500 }}>
            {label}
          </p>
          {doc && <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{doc.nombre} · {doc.tamaño}</p>}
          {!doc && <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>No adjuntado</p>}
        </div>
      </div>
      {doc && (
        <button style={{
          padding: "5px 12px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 600,
          cursor: "pointer", background: C.accentSoft,
          border: `1px solid ${C.accent}`, color: C.accentText, fontFamily: "inherit",
        }}>
          Ver PDF
        </button>
      )}
    </div>
  );
}

export function DetalleDocumentacion({ solicitud, loading, comentario, setComentario, modoRechazo, setModoRechazo, onDecidir, onCerrar, C }) {
  if (!solicitud) return null;

  const fmtFecha = (iso) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <div onClick={onCerrar} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
        background: C.bgCard, borderLeft: `1px solid ${C.borderDefault}`,
        boxShadow: SHADOWS.xl, zIndex: 50,
        display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflowY: "auto",
      }}>

        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>CU-GR-05 · Revisión de documentación</p>
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>Revisar documentación inicial</h2>
          </div>
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {/* Contenido */}
        <div style={{ padding: "1.25rem 1.5rem", flex: 1, overflowY: "auto" }}>

          {/* Datos alumno */}
          <p style={{ margin: "0 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Datos del alumno</p>
          <InfoRow label="Nombre"    value={solicitud.alumno.nombre}                              C={C} />
          <InfoRow label="Boleta"    value={solicitud.alumno.boleta}                              C={C} />
          <InfoRow label="Carrera"   value={CARRERA_LABEL[solicitud.alumno.carrera]}              C={C} />
          <InfoRow label="Créditos"  value={`${solicitud.alumno.creditos}%`}                      C={C} />
          <InfoRow label="Profesor"  value={solicitud.profesor}                                   C={C} />
          <InfoRow label="Enviado"   value={fmtFecha(solicitud.fechaEnvio)}                       C={C} />

          {/* Registro SISS — RN-GR-26 */}
          <p style={{ margin: "1.25rem 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Registro SISS</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid ${C.borderSubtle}` }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: solicitud.registroSISS ? C.successSoft : C.dangerSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11 }}>{solicitud.registroSISS ? "✓" : "✕"}</span>
            </div>
            <span style={{ fontSize: 13, color: solicitud.registroSISS ? C.success : C.danger, fontWeight: 500 }}>
              {solicitud.registroSISS ? "Alumno confirmó registro en SISS" : "Alumno no ha confirmado registro en SISS"}
            </span>
          </div>

          {/* Documentos — RN-GR-29 */}
          <p style={{ margin: "1.25rem 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Documentos adjuntos</p>
          <DocRow label="Carta de créditos"                       doc={solicitud.documentos.cartaCreditos} C={C} />
          <DocRow label="Constancia de vigencia del seguro social" doc={solicitud.documentos.seguroSocial}  C={C} />
          <DocRow label="Dictamen (opcional)"                      doc={solicitud.documentos.dictamen}      C={C} />

          {/* Campo comentario rechazo — RN-GR-32 */}
          {modoRechazo && (
            <div style={{ marginTop: "1.25rem" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Motivo del rechazo *
              </label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Describe el motivo del rechazo para que el alumno pueda corregir su documentación..."
                rows={4}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: C.bgInput, border: `1px solid ${comentario.trim() ? C.borderFocus : C.borderDefault}`,
                  borderRadius: RADIUS.md, color: C.textPrimary,
                  fontSize: 13, fontFamily: "inherit", resize: "vertical",
                  outline: "none", boxSizing: "border-box", lineHeight: 1.5,
                }}
              />
              {!comentario.trim() && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>Debes ingresar el motivo del rechazo</p>
              )}
            </div>
          )}
        </div>

        {/* Botones — RN-GR-30 */}
        <div style={{ padding: "1.25rem 1.5rem", borderTop: `1px solid ${C.borderSubtle}`, flexShrink: 0 }}>
          {!modoRechazo ? (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setModoRechazo(true)}
                style={{
                  flex: 1, padding: "11px", borderRadius: RADIUS.md,
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  background: "transparent", border: `1px solid ${C.danger}`,
                  color: C.danger, fontFamily: "inherit",
                }}
              >
                Rechazar
              </button>
              <button
                onClick={() => onDecidir(solicitud.id, "aceptar")}
                disabled={loading}
                style={{
                  flex: 1, padding: "11px", borderRadius: RADIUS.md,
                  fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
                  background: loading ? C.borderDefault : GRADIENTS.primary,
                  border: "none", color: "#fff", fontFamily: "inherit",
                  boxShadow: loading ? "none" : SHADOWS.accent,
                }}
              >
                {loading ? "Procesando..." : "Aceptar documentación"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => onDecidir(solicitud.id, "rechazar")}
                disabled={!comentario.trim() || loading}
                style={{
                  padding: "11px", borderRadius: RADIUS.md,
                  fontSize: 14, fontWeight: 600,
                  cursor: !comentario.trim() || loading ? "not-allowed" : "pointer",
                  background: !comentario.trim() || loading ? C.borderDefault : C.danger,
                  border: "none", color: "#fff", fontFamily: "inherit",
                  opacity: !comentario.trim() ? 0.5 : 1,
                }}
              >
                {loading ? "Procesando..." : "Confirmar rechazo"}
              </button>
              <button
                onClick={() => { setModoRechazo(false); setComentario(""); }}
                style={{
                  padding: "11px", borderRadius: RADIUS.md,
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                  background: "transparent", border: `1px solid ${C.borderDefault}`,
                  color: C.textSecondary, fontFamily: "inherit",
                }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
