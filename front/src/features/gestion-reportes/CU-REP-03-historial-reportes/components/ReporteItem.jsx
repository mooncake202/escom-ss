import { RADIUS } from "@/themes/colors";
import { EstatusBadge } from "./EstatusBadge";
import { estadoAlumnoDe, nombreEtapa } from "../../CU-REP-02-consultar-estatus-reporte/seguimientoReportes";
import { etiquetaReporte, textoPeriodo, textoFechaCorta, textoFechaEnvio } from "../../CU-REP-05-revisar-reportes-profesor/revisionReportes";

export function ReporteItem({ reporte: r, abierto, onToggle, onVerSeguimiento, onEditar, onVerPdf, onDescargar, pdf, C }) {
  const s = estadoAlumnoDe(r.estadoReporte);
  const esRechazado = r.puedeCorregir;

  return (
    <div
      style={{
        background: C.bgCard,
        borderRadius: RADIUS.xl,
        border: `1px solid ${abierto ? s.color(C) : C.borderDefault}`,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Fila del reporte — siempre visible */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "transparent", border: "none",
          padding: "1rem 1.25rem",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "1rem",
          fontFamily: "inherit",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {etiquetaReporte(r)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
            {textoPeriodo(r) ? `${textoPeriodo(r)} · ` : ""}Enviado el {textoFechaCorta(r.fechaEnvio)}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <EstatusBadge estado={r.estadoReporte} C={C} />
          <svg
            width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: abierto ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {/* Detalle expandido */}
      {abierto && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: "1rem 1.25rem" }}>
          {/* Métricas */}
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {[
              // El reporte global no guarda días ni horas (solo el mensual tiene ese snapshot).
              ...(r.diasLaborados != null ? [{ label: "Días laborados", valor: `${r.diasLaborados} días` }] : []),
              ...(r.horasReportadas != null ? [{ label: "Horas reportadas", valor: `${r.horasReportadas} h` }] : []),
              { label: "Revisor",          valor: r.revisor?.nombreCompleto ?? "—" },
            ].map(({ label, valor }) => (
              <div key={label}>
                <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
                <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, fontWeight: 600 }}>{valor}</p>
              </div>
            ))}
          </div>

          {/* Motivo del último rechazo (solo si el estado actual es rechazado) */}
          {esRechazado && (
            <div style={{
              padding: "10px 14px", borderRadius: RADIUS.md,
              background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}`,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Motivo del rechazo{r.ultimoRechazo ? ` · ${nombreEtapa(r.ultimoRechazo.etapa)}` : ""}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.65 }}>
                {r.ultimoRechazo?.motivo ?? "No se registró un motivo."}
              </p>
              {r.ultimoRechazo?.fecha && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: C.textDisabled }}>{textoFechaEnvio(r.ultimoRechazo.fecha)}</p>
              )}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginTop: "1rem" }}>

            {/* Ver seguimiento — todos los reportes */}
            <button
              onClick={onVerSeguimiento}
              style={{
                padding: "8px 16px", borderRadius: RADIUS.md,
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Ver seguimiento
            </button>

            {/* Editar — solo rechazados (por el profesor o por coordinación) */}
            {esRechazado && (
              <button
                onClick={onEditar}
                style={{
                  padding: "8px 16px", borderRadius: RADIUS.md,
                  background: C.danger, border: "none", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Editar y reenviar →
              </button>
            )}

            {/* Ver PDF: la última versión almacenada. Descargar: solo cuando ya está aprobado por coordinación */}
            <button
              onClick={onVerPdf}
              disabled={pdf.viendo}
              style={{
                padding: "8px 16px", borderRadius: RADIUS.md,
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontSize: 13, fontWeight: 600,
                cursor: pdf.viendo ? "wait" : "pointer", opacity: pdf.viendo ? 0.6 : 1, fontFamily: "inherit",
              }}
            >
              {pdf.viendo ? "Cargando PDF..." : "Ver PDF"}
            </button>
            {r.estadoReporte === "aprobado_coordinador" && (
              <button
                onClick={onDescargar}
                disabled={pdf.descargando}
                style={{
                  padding: "8px 16px", borderRadius: RADIUS.md,
                  background: "transparent", border: `1px solid ${C.success}`,
                  color: C.success, fontSize: 13, fontWeight: 700,
                  cursor: pdf.descargando ? "wait" : "pointer", opacity: pdf.descargando ? 0.6 : 1, fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {pdf.descargando ? "Descargando..." : "Descargar"}
              </button>
            )}

          </div>
          {pdf.error && <p role="alert" style={{ margin: "8px 0 0", fontSize: 12, color: C.danger }}>{pdf.error}</p>}
        </div>
      )}
    </div>
  );
}
