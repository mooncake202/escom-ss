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

export function DetalleExpediente({ item, loading, comentario, setComentario, modoRechazo, setModoRechazo, onDecidir, onVerPdf, errorDescarga, onCerrar, C }) {
  if (!item) return null;

  const fmtFecha = (iso) => iso ? new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "—";

  return (
    <>
      <div onClick={onCerrar} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
        background: C.bgCard, borderLeft: `1px solid ${C.borderDefault}`,
        boxShadow: SHADOWS.xl, zIndex: 50,
        display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>

        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}></p>
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>Revisar expediente</h2>
          </div>
          <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>

          <p style={{ margin: "0 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Datos del alumno</p>
          <InfoRow label="Nombre"    value={item.alumno.nombre}                                        C={C} />
          <InfoRow label="Boleta"    value={item.alumno.boleta}                                        C={C} />
          <InfoRow label="Carrera"   value={CARRERA_LABEL[item.alumno.carrera] || item.alumno.carrera} C={C} />
          <InfoRow label="Créditos"  value={`${item.alumno.creditos}%`}                                C={C} />
          <InfoRow label="Correo"    value={item.alumno.correoInst}                                    C={C} />
          <InfoRow label="Profesor"  value={item.profesor || "—"}                                      C={C} />
          <InfoRow label="Periodo"   value={`${fmtFecha(item.periodoInicio)} — ${fmtFecha(item.periodoFin)}`} C={C} />

          {/* Expediente — RF-GR-107 */}
          <p style={{ margin: "1.25rem 0 10px", fontSize: 11, color: C.accentText, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Expediente</p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: RADIUS.md, background: C.bgInput, border: `1px solid ${C.borderDefault}`, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.accentText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
              </svg>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.expediente.nombreArchivo || "Expediente"}
              </p>
            </div>
            <button
              onClick={() => onVerPdf(item.expediente.documentoId)}
              style={{ padding: "5px 12px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 600, cursor: "pointer", background: C.accentSoft, border: `1px solid ${C.accent}`, color: C.accentText, fontFamily: "inherit", flexShrink: 0 }}
            >
              Ver PDF
            </button>
          </div>
          {errorDescarga && <p style={{ margin: "0 0 12px", fontSize: 12, color: C.danger }}>{errorDescarga}</p>}

          {/* RN-GR-69: la verificación de contenido es visual, el sistema
              solo puede indicar si DEBE incluir dictamen o no. */}
          <div style={{ padding: "10px 14px", borderRadius: RADIUS.md, background: C.bgPage, border: `1px solid ${C.borderSubtle}` }}>
            <p style={{ margin: 0, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
              {item.requiereDictamen
                ? <>Este alumno declaró <strong>{item.dictamenLabel}</strong> — verifica que el PDF incluya carta compromiso, CURP, constancia de créditos y el dictamen.</>
                : <>Este alumno no declaró dictamen — el PDF debe incluir solo carta compromiso, CURP y constancia de créditos.</>
              }
            </p>
          </div>

          <div style={{ marginTop: "1.25rem", padding: "12px 14px", borderRadius: RADIUS.md, background: C.accentSoft, border: `1px solid ${C.accent}` }}>
            <p style={{ margin: 0, fontSize: 12, color: C.accentText, lineHeight: 1.5 }}>
              Al aprobar el expediente, el alumno pasará a ser <strong>Alumno Asignado</strong>, habilitando el módulo de actividades y horas.
            </p>
          </div>

          {modoRechazo && (
            <div style={{ marginTop: "1.25rem" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Motivo del rechazo *
              </label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Indica qué documentos faltan, qué formato es incorrecto o qué debe corregir el alumno..."
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

        <div style={{ padding: "1.25rem 1.5rem", borderTop: `1px solid ${C.borderSubtle}`, flexShrink: 0 }}>
          {!modoRechazo ? (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setModoRechazo(true)}
                style={{ flex: 1, padding: "11px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600, cursor: "pointer", background: "transparent", border: `1px solid ${C.danger}`, color: C.danger, fontFamily: "inherit" }}
              >
                Rechazar
              </button>
              <button
                onClick={() => onDecidir(item.id, "aprobar")}
                disabled={loading}
                style={{ flex: 1, padding: "11px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer", background: loading ? C.borderDefault : GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: loading ? "none" : SHADOWS.accent }}
              >
                {loading ? "Procesando..." : "Aprobar expediente"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => onDecidir(item.id, "rechazar")}
                disabled={!comentario.trim() || loading}
                style={{ padding: "11px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600, cursor: !comentario.trim() || loading ? "not-allowed" : "pointer", background: !comentario.trim() || loading ? C.borderDefault : C.danger, border: "none", color: "#fff", fontFamily: "inherit", opacity: !comentario.trim() ? 0.5 : 1 }}
              >
                {loading ? "Procesando..." : "Confirmar rechazo"}
              </button>
              <button
                onClick={() => { setModoRechazo(false); setComentario(""); }}
                style={{ padding: "11px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: "inherit" }}
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