import { RADIUS, SHADOWS }        from "@/themes/colors";
import { BlobProvider }            from "@react-pdf/renderer";
import { ReportePDF } from "../../CU-REP-01-generar-reporte/components/ReportePDF";
import { EstatusBadge }            from "./EstatusBadge";
import { InfoRow }                 from "./InfoRow";
import { MODO, PROFESOR } from "../hooks/useRevisarReportes";

function SeccionTexto({ titulo, texto, C }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: C.textDisabled }}>{titulo}</p>
      <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{texto}</p>
    </div>
  );
}

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
  reporte, onCerrar,
  modo, irModo, resetModo,
  rubricaGuardada, firmaFile, firmaUrl, errorFirma,
  firmaConfirmada, handleFirmaChange, confirmarFirmaYVerPDF,
  comentario, onComentarioChange, errorComentario,
  loading, confirmarAprobacion, confirmarRechazo,
  blobRef, datosPDF,
  C,
}) {
  if (!reporte) return null;

  const esPendiente = reporte.estado === "pendiente_revision";
  const pdfDatos    = datosPDF(reporte);

  function handleVerPDF() {
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    window.open(url, "_blank");
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }}
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
              CU-REP-05 · {modo === MODO.APROBAR ? "Aprobar y firmar" : modo === MODO.RECHAZAR ? "Rechazar reporte" : "Revisión de reporte"}
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>
              {reporte.alumno}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>{reporte.periodo}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <EstatusBadge estado={reporte.estado} C={C} />
            <button
              onClick={onCerrar}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: 4 }}
            >✕</button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>

          {/* Título del reporte */}
          <p style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            Reporte mensual de actividades No. {reporte.numeroReporte}
          </p>

          {/* Datos del reporte */}
          <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Datos del reporte
          </p>
          <div style={{ marginBottom: "1.25rem" }}>
            <InfoRow label="Matrícula"        valor={reporte.matricula}               C={C} />
            <InfoRow label="Días laborados"   valor={`${reporte.diasLaborados} días`} C={C} />
            <InfoRow label="Horas reportadas" valor={`${reporte.horas} h`}            C={C} />
            <InfoRow label="Fecha de envío"   valor={reporte.fechaEnvio}              C={C} />
          </div>

          {/* Actividades realizadas */}
          <SeccionTexto titulo="Actividades realizadas" texto={reporte.actividades} C={C} />

          {/* Comentario si ya fue procesado */}
          {reporte.comentario && (
            <div style={{
              padding: "10px 14px", borderRadius: RADIUS.md, marginBottom: "1rem",
              background: reporte.estado === "rechazado_profesor" ? "rgba(239,68,68,0.05)" : C.successSoft,
              border: `1px solid ${reporte.estado === "rechazado_profesor" ? C.danger : C.success}`,
            }}>
              <p style={{
                margin: "0 0 4px", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.07em",
                color: reporte.estado === "rechazado_profesor" ? C.danger : C.success,
              }}>
                {reporte.estado === "rechazado_profesor" ? "Motivo de rechazo" : "Comentario de aprobación"}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.7 }}>
                {reporte.comentario}
              </p>
            </div>
          )}

          {/* ── Botón Ver PDF (modo NORMAL) y carga de blob (modo APROBAR) ── */}
          {esPendiente && pdfDatos && (
            <BlobProvider document={<ReportePDF datos={pdfDatos} />}>
              {({ blob, loading: pdfLoading, error: pdfError }) => {
                if (blob) blobRef.current = blob;
                // En modo NORMAL muestra el botón visible
                if (modo === MODO.NORMAL) return (
                  <button
                    onClick={handleVerPDF}
                    disabled={pdfLoading || !!pdfError}
                    style={{
                      width: "100%", padding: "10px", borderRadius: RADIUS.md,
                      marginBottom: "1rem", background: "transparent",
                      border: `1px solid ${pdfError ? C.danger : C.borderDefault}`,
                      color: pdfError ? C.danger : pdfLoading ? C.textDisabled : C.textPrimary,
                      fontSize: 13, fontWeight: 600,
                      cursor: pdfLoading || pdfError ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="9" y1="13" x2="15" y2="13"/>
                      <line x1="9" y1="17" x2="15" y2="17"/>
                    </svg>
                    {pdfLoading ? "Preparando PDF..." : pdfError ? "Error al generar PDF" : "Ver PDF completo ↗"}
                  </button>
                );
                // En modo APROBAR solo carga el blob en background, sin botón visible
                return null;
              }}
            </BlobProvider>
          )}

          {/* ── MODO APROBAR: firma del profesor ── */}
          {modo === MODO.APROBAR && esPendiente && (
            <div>
              {/* Si ya tiene rúbrica guardada */}
              {rubricaGuardada ? (
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
                    Firma digital registrada — {PROFESOR?.nombre ?? "Profesor"}
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
              )}

              {/* Aviso de qué pasará al firmar */}
              {!firmaConfirmada && (
                <div style={{
                  padding: "10px 14px", borderRadius: RADIUS.md, marginBottom: "1rem",
                  background: C.accentSoft, border: `1px solid ${C.accent}`,
                  fontSize: 12, color: C.accentText, lineHeight: 1.6,
                }}>
                  Al firmar y visualizar, se aplicará tu firma digital al reporte y podrás
                  ver la vista previa en PDF antes de enviarlo a coordinación.
                </div>
              )}

              {/* Si ya firmó y visualizó — aviso de confirmación */}
              {firmaConfirmada && (
                <div style={{
                  padding: "10px 14px", borderRadius: RADIUS.md, marginBottom: "1rem",
                  background: C.successSoft, border: `1px solid ${C.success}`,
                  fontSize: 12, color: C.success, lineHeight: 1.6,
                }}>
                  ✓ Firma aplicada y PDF revisado. Confirma para enviar a coordinación.
                </div>
              )}
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
              <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                La firma del alumno y el hash SHA-256 quedarán invalidados. El alumno deberá corregir y volver a firmar desde cero.
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
                {!firmaConfirmada ? (
                  /* Botón firmar y visualizar — usa el blobRef ya cargado */
                  <button
                    onClick={confirmarFirmaYVerPDF}
                    disabled={loading}
                    style={{
                      padding: "11px", borderRadius: RADIUS.md,
                      background: loading ? C.borderDefault : C.success,
                      border: "none", color: "#fff",
                      fontSize: 13, fontWeight: 700,
                      cursor: loading ? "wait" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Firmar y visualizar →
                  </button>
                ) : (
                  /* Botón confirmar envío a coordinación */
                  <button
                    onClick={confirmarAprobacion}
                    disabled={loading}
                    style={{
                      padding: "11px", borderRadius: RADIUS.md,
                      background: loading ? C.borderDefault : C.success,
                      border: "none", color: "#fff",
                      fontSize: 13, fontWeight: 700,
                      cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
                    }}
                  >
                    {loading ? "Enviando..." : "Confirmar y enviar a coordinación →"}
                  </button>
                )}

                <button
                  onClick={resetModo}
                  style={{
                    padding: "10px", borderRadius: RADIUS.md,
                    background: "transparent", border: `1px solid ${C.borderDefault}`,
                    color: C.textMuted, fontSize: 13, fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit",
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
                  style={{
                    padding: "10px", borderRadius: RADIUS.md,
                    background: "transparent", border: `1px solid ${C.borderDefault}`,
                    color: C.textMuted, fontSize: 13, fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit",
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