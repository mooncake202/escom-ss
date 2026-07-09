import { RADIUS, SHADOWS }       from "@/themes/colors";
import { BlobProvider }           from "@react-pdf/renderer";
import { ReportePDF }             from "../../CU-REP-01-generar-reporte/components/ReportePDF";
import { EstatusBadge }           from "./EstatusBadge";
import { InfoRow }                from "./InfoRow";
import { MODO }                   from "../hooks/useValidarReportes";


export function ReporteDetalle({
  reporte, onCerrar,
  modo, irModo, resetModo,
  comentario, onComentarioChange, errorComentario,
  loading, confirmarAprobacion, confirmarRechazo,
  blobRef, datosPDF,
  C,
}) {
  if (!reporte) return null;

  const esPendiente = reporte.estado === "pendiente_validacion";
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
        width: "min(580px, 100vw)",
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
              CU-REP-06 · {modo === MODO.APROBAR ? "Aprobar reporte" : modo === MODO.RECHAZAR ? "Rechazar reporte" : "Revisión de reporte"}
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>
              {reporte.alumno}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
              {reporte.periodo} · {reporte.profesor}
            </p>
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
            <InfoRow label="Matrícula"             valor={reporte.matricula}               C={C} />
            <InfoRow label="Días laborados"        valor={`${reporte.diasLaborados} días`} C={C} />
            <InfoRow label="Horas reportadas"      valor={`${reporte.horas} h`}            C={C} />
            <InfoRow label="Aprobado por profesor" valor={reporte.fechaAprobacion}         C={C} />
          </div>

          {/* Actividades */}
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: C.textDisabled }}>
              Actividades realizadas
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
              {reporte.actividades}
            </p>
          </div>



          {/* Botón Ver PDF — siempre visible, carga blob en background */}
          {pdfDatos && (
            <BlobProvider document={<ReportePDF datos={pdfDatos} />}>
              {({ blob, loading: pdfLoading, error: pdfError }) => {
                if (blob) blobRef.current = blob;
                if (modo !== MODO.NORMAL) return null;
                return (
                  <button
                    onClick={handleVerPDF}
                    disabled={pdfLoading || !!pdfError}
                    style={{
                      width: "100%", padding: "10px", borderRadius: RADIUS.md,
                      marginTop: "0.75rem",
                      background: "transparent",
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
              }}
            </BlobProvider>
          )}

          {/* ── MODO APROBAR ── */}
          {modo === MODO.APROBAR && esPendiente && (
            <div style={{
              marginTop: "1rem", padding: "1rem 1.25rem", borderRadius: RADIUS.md,
              background: C.successSoft, border: `1px solid ${C.success}`,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: C.success, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Aprobar reporte
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                Al confirmar, el sistema aplicará automáticamente el sello institucional precargado y generará la versión final del PDF con todas las firmas. El alumno y el profesor recibirán una notificación.
              </p>
            </div>
          )}

          {/* ── MODO RECHAZAR ── */}
          {modo === MODO.RECHAZAR && esPendiente && (
            <div style={{
              marginTop: "1rem", padding: "1rem 1.25rem", borderRadius: RADIUS.md,
              background: "rgba(239,68,68,0.04)", border: `1px solid ${C.danger}`,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Motivo del rechazo <span style={{ color: C.danger }}>*</span>
              </p>
              <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                Todas las firmas y el hash SHA-256 quedarán invalidados. El alumno deberá corregir y volver a firmar desde cero.
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
                  Aprobar →
                </button>
              </div>
            )}

            {/* MODO APROBAR */}
            {modo === MODO.APROBAR && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
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
                  {loading ? "Procesando..." : "Confirmar aprobación →"}
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