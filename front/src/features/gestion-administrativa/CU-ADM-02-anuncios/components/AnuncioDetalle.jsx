import { RADIUS } from "@/themes/colors";
import { OrigenBadge } from "./OrigenBadge";

export function AnuncioDetalle({ anuncio, onCerrar, formatFecha, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      borderTop: `3px solid ${anuncio.origen === "coordinacion" ? "#4A90D9" : "#a78bfa"}`,
      padding: "1.5rem",
      position: "sticky", top: 16,
    }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
          {anuncio.titulo}
        </h2>
        <button
          onClick={onCerrar}
          style={{ background: "transparent", border: "none", color: C.textDisabled, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
          title="Cerrar"
        >
          ×
        </button>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
        <OrigenBadge origen={anuncio.origen} />
        <span style={{ fontSize: 12, color: C.textMuted }}>{anuncio.autor}</span>
        <span style={{ fontSize: 11, color: C.textDisabled, fontFamily: "monospace", marginLeft: "auto" }}>
          {formatFecha(anuncio.fecha)}
        </span>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${C.borderDefault}`, margin: "0 0 1.25rem" }} />

      {/* Contenido */}
      <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
        {anuncio.contenido}
      </p>
    </div>
  );
}
