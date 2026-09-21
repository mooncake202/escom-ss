import { RADIUS } from "@/themes/colors";

// Botón "Ver PDF" (la etiqueta se puede cambiar por pantalla) y visor del PDF almacenado de un reporte (Blob del servidor, mostrado con su object URL).
// Lo usan las pantallas de revisión de Profesor (CU-REP-05) y Coordinación (CU-REP-06).

export function BotonVerPdf({ pdf, onVerPdf, C, etiqueta = "Ver PDF completo ↗" }) {
  const cargando = pdf.estado === "cargando";
  return (
    <div style={{ marginBottom: "1rem" }}>
      <button
        onClick={onVerPdf}
        disabled={cargando}
        style={{
          width: "100%", padding: "10px", borderRadius: RADIUS.md,
          background: "transparent",
          border: `1px solid ${C.borderDefault}`,
          color: C.textPrimary, fontSize: 13, fontWeight: 600,
          cursor: cargando ? "wait" : "pointer", opacity: cargando ? 0.6 : 1, fontFamily: "inherit",
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
        {cargando ? "Cargando PDF..." : etiqueta}
      </button>
      {pdf.estado === "error" && (
        <p role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{pdf.error}</p>
      )}
    </div>
  );
}

export function VisorPdf({ pdf, titulo, tituloIframe, onCerrar, C }) {
  if (pdf.estado !== "listo") return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{
        width: "min(900px, 100%)", height: "100%", display: "flex", flexDirection: "column",
        background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`, overflow: "hidden",
      }}>
        <div style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", borderBottom: `1px solid ${C.borderDefault}` }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>{titulo}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <a href={pdf.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>
              Abrir en otra pestaña ↗
            </a>
            <button
              onClick={onCerrar}
              aria-label="Cerrar PDF"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: 4 }}
            >✕</button>
          </div>
        </div>
        <iframe src={pdf.url} title={tituloIframe} style={{ flex: 1, width: "100%", border: "none" }} />
      </div>
    </div>
  );
}
