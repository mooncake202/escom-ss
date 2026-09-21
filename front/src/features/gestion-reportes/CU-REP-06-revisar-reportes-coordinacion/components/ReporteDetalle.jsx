import { RADIUS, SHADOWS }       from "@/themes/colors";
import { EstatusBadge }           from "./EstatusBadge";
import { InfoRow }                from "./InfoRow";
import { BotonVerPdf, VisorPdf }  from "../../compartido/VisorPdf";
import { MODO }                   from "../hooks/useValidarReportes";
import { etiquetaReporte, textoPeriodo, textoFechaEnvio } from "../../CU-REP-05-revisar-reportes-profesor/revisionReportes";

export function ReporteDetalle({
  reporte, detalle, onReintentar, onCerrar,
  pdf, onVerPdf, onCerrarPdf,
  modo, irModo, resetModo,
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
        tituloIframe="PDF del reporte almacenado"
        onCerrar={onCerrarPdf}
        C={C}
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
              {modo === MODO.APROBAR ? "Aprobar reporte" : modo === MODO.RECHAZAR ? "Rechazar reporte" : "Revisión de reporte"}
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: 17, color: C.textPrimary, fontWeight: 700 }}>
              {reporte.alumno.nombreCompleto}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
              {etiquetaReporte(reporte)} · {reporte.profesor?.nombreCompleto ?? "Profesor no disponible"}
            </p>
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
                <InfoRow label="Boleta"                valor={datos.alumno.boleta}                   C={C} />
                {datos.alumno.carrera && <InfoRow label="Carrera" valor={datos.alumno.carrera}      C={C} />}
                {textoPeriodo(datos) && <InfoRow label="Periodo" valor={textoPeriodo(datos)}       C={C} />}
                {datos.diasLaborados != null && <InfoRow label="Días laborados" valor={`${datos.diasLaborados} días`} C={C} />}
                {datos.horasReportadas != null && <InfoRow label="Horas reportadas" valor={`${datos.horasReportadas} h`} C={C} />}
                <InfoRow label="Aprobado por profesor" valor={textoFechaEnvio(datos.fechaAprobacionProfesor)} C={C} />
                {datos.revisionCoordinacion && (
                  <InfoRow
                    label={datos.revisionCoordinacion.estado === "aprobado" ? "Validado por coordinación" : "Rechazado por coordinación"}
                    valor={textoFechaEnvio(datos.revisionCoordinacion.fecha)}
                    C={C}
                  />
                )}
                {datos.revisionCoordinacion?.comentario && (
                  <InfoRow label="Motivo del rechazo" valor={datos.revisionCoordinacion.comentario} C={C} />
                )}
              </div>
            </>
          )}

          {/* Ver PDF: el vigente almacenado (alumno + profesor, y el sello si ya se validó), también antes de aprobar o rechazar */}
          <BotonVerPdf pdf={pdf} onVerPdf={onVerPdf} C={C} />

          {errorAccion && (
            <div role="alert" style={{ padding: "12px 14px", borderRadius: RADIUS.md, marginBottom: "1rem", background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}` }}>
              <p style={{ margin: 0, fontSize: 13, color: C.danger, lineHeight: 1.5 }}>{errorAccion}</p>
            </div>
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
                Al confirmar, se aplicará el sello de validación y el reporte quedará aprobado.
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
                El alumno deberá corregir y volver a firmar el reporte. El alumno y el profesor recibirán una notificación con este motivo.
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
                  {loading ? "Validando y sellando..." : "Confirmar aprobación →"}
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