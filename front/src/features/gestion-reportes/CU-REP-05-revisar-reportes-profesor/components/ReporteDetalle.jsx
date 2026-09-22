import { RADIUS, SHADOWS }        from "@/themes/colors";
import { EstatusBadge }            from "./EstatusBadge";
import { InfoRow }                 from "./InfoRow";
import { BotonVerPdf, VisorPdf }   from "../../compartido/VisorPdf";
import { MODO } from "../hooks/useRevisarReportes";
import { etiquetaReporte, textoPeriodo, textoFechaEnvio } from "../revisionReportes";

function FirmaUploadInline({ firmaFile, firmaUrl, errorFirma, onChange, C }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
        Firma digital
      </p>
      <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
        Sube una imagen de tu firma en formato PNG o JPG. Se guardará y se usará automáticamente en aprobaciones posteriores.
      </p>

      {/* Preview */}
      {firmaUrl && (
        <div style={{
          marginBottom: "0.75rem", padding: "1rem",
          background: "#fff", borderRadius: RADIUS.md,
          border: `1px solid ${C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 70,
        }}>
          <img
            src={firmaUrl}
            alt="Vista previa de firma"
            style={{ maxHeight: 70, maxWidth: "100%", objectFit: "contain" }}
          />
        </div>
      )}

      {/* Input */}
      <label style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "10px 14px", borderRadius: RADIUS.md, cursor: "pointer",
        background: C.bgInput,
        border: `1px solid ${errorFirma ? C.danger : firmaFile ? C.success : C.borderDefault}`,
        transition: "border-color 0.15s",
      }}>
        <input type="file" accept=".png,.jpg,.jpeg" onChange={onChange} style={{ display: "none" }} />
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
          stroke={firmaFile ? C.success : C.textDisabled} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span style={{ fontSize: 13, color: firmaFile ? C.success : C.textDisabled, flex: 1 }}>
          {firmaFile ? firmaFile.name : "Seleccionar imagen de firma (PNG o JPG)..."}
        </span>
        {firmaFile && (
          <span style={{ fontSize: 11, color: C.textDisabled }}>
            {(firmaFile.size / 1024).toFixed(0)} KB
          </span>
        )}
      </label>

      {errorFirma && (
        <p style={{ margin: "5px 0 0", fontSize: 12, color: C.danger }}>{errorFirma}</p>
      )}
      {!errorFirma && firmaFile && (
        <p style={{ margin: "5px 0 0", fontSize: 12, color: C.success }}>
          Firma cargada correctamente.
        </p>
      )}
    </div>
  );
}

export function ReporteDetalle({
  reporte, detalle, onReintentar, onCerrar,
  pdf, onVerPdf, onCerrarPdf,
  modo, irModo, resetModo,
  rubricaGuardada, rubrica, onReintentarRubrica, firmaFile, firmaUrl, errorFirma, handleFirmaChange,
  comentario, onComentarioChange, errorComentario,
  loading, errorAccion, confirmarAprobacion, confirmarRechazo,
  C,
}) {
  if (!reporte) return null;

  const esPendiente = reporte.puedeRevisar;
  const datos       = detalle.estado === "listo" ? detalle.datos : null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={loading ? undefined : onCerrar}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }}
      />

      {/* Visor del PDF almacenado (object URL del Blob; se libera al cerrar) */}
      <VisorPdf
        pdf={pdf}
        titulo={`${etiquetaReporte(reporte)} — ${reporte.alumno.nombreCompleto}`}
        tituloIframe="PDF del reporte enviado por el alumno"
        onCerrar={onCerrarPdf}
        C={C}
      />

      {/* Panel lateral */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(560px, 100vw)",
        background: C.bgCard, borderLeft: `1px solid ${C.borderDefault}`,
        boxShadow: SHADOWS.xl, zIndex: 50,
        display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem", borderBottom: `1px solid ${C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {modo === MODO.APROBAR ? "Aprobar y firmar" : modo === MODO.RECHAZAR ? "Rechazar reporte" : "Revisión de reporte"}
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>
              {reporte.alumno.nombreCompleto}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <EstatusBadge estado={reporte.estadoReporte} C={C} />
            <button
              onClick={onCerrar}
              disabled={loading}
              style={{ background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", color: C.textMuted, fontSize: 20, padding: 4 }}
            >✕</button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>

          {detalle.estado === "cargando" && (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>Cargando el detalle del reporte...</p>
          )}

          {detalle.estado === "error" && (
            <div style={{ padding: "12px 14px", borderRadius: RADIUS.md, background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}` }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: C.danger }}>{detalle.error}</p>
              <button
                onClick={onReintentar}
                style={{
                  padding: "6px 14px", borderRadius: RADIUS.md, background: "transparent",
                  border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {datos && (
            <>
              {/* Título del reporte */}
              <p style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
                {datos.titulo}
              </p>

              {/* Datos del reporte */}
              <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Datos del reporte
              </p>
              <div style={{ marginBottom: "1.25rem" }}>
                <InfoRow label="Boleta"           valor={datos.alumno.boleta}                     C={C} />
                {textoPeriodo(datos) && <InfoRow label="Periodo" valor={textoPeriodo(datos)}     C={C} />}
                {datos.diasLaborados != null && <InfoRow label="Días laborados"   valor={`${datos.diasLaborados} días`} C={C} />}
                {datos.horasReportadas != null && <InfoRow label="Horas reportadas" valor={`${datos.horasReportadas} h`} C={C} />}
                <InfoRow label="Fecha de envío"   valor={textoFechaEnvio(datos.fechaEnvio)}       C={C} />
              </div>
            </>
          )}

          {/* ── Ver PDF: el almacenado del alumno, en cualquier estado del reporte y también antes de aprobar o rechazar ── */}
          <BotonVerPdf pdf={pdf} onVerPdf={onVerPdf} C={C} etiqueta="Ver PDF ↗" />

          {errorAccion && (
            <div role="alert" style={{ padding: "12px 14px", borderRadius: RADIUS.md, marginBottom: "1rem", background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}` }}>
              <p style={{ margin: 0, fontSize: 13, color: C.danger, lineHeight: 1.5 }}>{errorAccion}</p>
            </div>
          )}

          {/* ── MODO APROBAR: firma del profesor ── */}
          {modo === MODO.APROBAR && esPendiente && (
            <div>
              {/* Estado de la rúbrica del profesor (solo si existe; nunca la imagen) */}
              {rubrica.estado === "cargando" && (
                <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>Verificando tu firma digital...</p>
              )}
              {rubrica.estado === "error" && (
                <div style={{ padding: "12px 14px", borderRadius: RADIUS.md, marginBottom: "1rem", background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}` }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: C.danger }}>{rubrica.error}</p>
                  <button
                    onClick={onReintentarRubrica}
                    style={{
                      padding: "6px 14px", borderRadius: RADIUS.md, background: "transparent",
                      border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              )}
              {rubrica.estado === "listo" && (rubricaGuardada ? (
                <div style={{
                  padding: "10px 14px", borderRadius: RADIUS.md, marginBottom: "1rem",
                  background: C.successSoft, border: `1px solid ${C.success}`,
                  display: "flex", alignItems: "center", gap: "0.75rem",
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke={C.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>
                    Firma digital registrada
                  </span>
                </div>
              ) : (
                /* Primera vez — subir rúbrica */
                <FirmaUploadInline
                  firmaFile={firmaFile}
                  firmaUrl={firmaUrl}
                  errorFirma={errorFirma}
                  onChange={handleFirmaChange}
                  C={C}
                />
              ))}

              {/* Aviso de qué pasará al confirmar (una sola acción; no hay segunda vista previa) */}
              <div style={{
                padding: "10px 14px", borderRadius: RADIUS.md, marginBottom: "1rem",
                background: C.accentSoft, border: `1px solid ${C.accent}`,
                fontSize: 12, color: C.accentText, lineHeight: 1.6,
              }}>
                Al confirmar, tu firma se agregará al reporte y se enviará a Coordinación para su validación.
              </div>
            </div>
          )}

          {/* ── MODO RECHAZAR: comentarios ── */}
          {modo === MODO.RECHAZAR && esPendiente && (
            <div style={{
              padding: "1rem 1.25rem", borderRadius: RADIUS.md,
              background: "rgba(239,68,68,0.04)", border: `1px solid ${C.danger}`,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Motivo del rechazo <span style={{ color: C.danger }}>*</span>
              </p>
              <textarea
                value={comentario}
                onChange={onComentarioChange}
                placeholder="Explica el motivo para que el alumno pueda corregir su reporte..."
                rows={4}
                style={{
                  width: "100%", padding: "10px 14px", boxSizing: "border-box",
                  background: C.bgInput,
                  border: `1px solid ${errorComentario ? C.danger : C.borderDefault}`,
                  borderRadius: RADIUS.md, color: C.textPrimary,
                  fontSize: 13, outline: "none", fontFamily: "inherit",
                  resize: "vertical", lineHeight: 1.6,
                }}
              />
              {errorComentario && (
                <p style={{ margin: "5px 0 0", fontSize: 12, color: C.danger }}>
                  El motivo del rechazo es obligatorio.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer con botones ── */}
        {esPendiente && (
          <div style={{
            padding: "1.25rem 1.5rem", borderTop: `1px solid ${C.borderDefault}`,
            flexShrink: 0,
          }}>

            {/* MODO NORMAL */}
            {modo === MODO.NORMAL && (
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button
                  onClick={() => irModo(MODO.RECHAZAR)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: RADIUS.md,
                    background: "transparent", border: `1px solid ${C.danger}`,
                    color: C.danger, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Rechazar →
                </button>
                <button
                  onClick={() => irModo(MODO.APROBAR)}
                  style={{
                    flex: 2, padding: "10px", borderRadius: RADIUS.md,
                    background: C.success, border: "none", color: "#fff",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Aprobar y firmar →
                </button>
              </div>
            )}

            {/* MODO APROBAR */}
            {modo === MODO.APROBAR && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {/* Única acción: el servidor firma, sella y envía a coordinación */}
                <button
                  onClick={confirmarAprobacion}
                  disabled={loading || rubrica.estado !== "listo"}
                  style={{
                    padding: "11px", borderRadius: RADIUS.md,
                    background: loading || rubrica.estado !== "listo" ? C.borderDefault : C.success,
                    border: "none", color: "#fff",
                    fontSize: 13, fontWeight: 700,
                    cursor: loading ? "wait" : rubrica.estado !== "listo" ? "not-allowed" : "pointer", fontFamily: "inherit",
                  }}
                >
                  {loading ? "Firmando y enviando..." : "Confirmar y enviar a coordinación →"}
                </button>

                <button
                  onClick={resetModo}
                  disabled={loading}
                  style={{
                    padding: "10px", borderRadius: RADIUS.md,
                    background: "transparent", border: `1px solid ${C.borderDefault}`,
                    color: C.textMuted, fontSize: 13, fontWeight: 500,
                    cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* MODO RECHAZAR */}
            {modo === MODO.RECHAZAR && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <button
                  onClick={confirmarRechazo}
                  disabled={loading}
                  style={{
                    padding: "11px", borderRadius: RADIUS.md,
                    background: loading ? C.borderDefault : C.danger,
                    border: "none", color: "#fff",
                    fontSize: 13, fontWeight: 700,
                    cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
                  }}
                >
                  {loading ? "Procesando..." : "Confirmar rechazo"}
                </button>
                <button
                  onClick={resetModo}
                  disabled={loading}
                  style={{
                    padding: "10px", borderRadius: RADIUS.md,
                    background: "transparent", border: `1px solid ${C.borderDefault}`,
                    color: C.textMuted, fontSize: 13, fontWeight: 500,
                    cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}