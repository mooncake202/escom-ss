import { RADIUS } from "@/themes/colors";
import { OrigenBadge } from "./OrigenBadge";

export function AnuncioCard({ anuncio, seleccionado, onSeleccionar, formatFecha, C }) {
  const isCoord = anuncio.origen === "coordinacion";

  return (
    <button
      onClick={() => onSeleccionar(seleccionado ? null : anuncio)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: seleccionado ? C.accentSoft : C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${seleccionado ? C.accent : C.borderDefault}`,
        borderLeft: `3px solid ${isCoord ? "#4A90D9" : "#a78bfa"}`,
        padding: "1rem 1.25rem",
        fontFamily: "inherit", outline: "none",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
          {anuncio.titulo}
        </p>
        <OrigenBadge origen={anuncio.origen} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>{anuncio.autor}</span>
        <span style={{ fontSize: 11, color: C.textDisabled, fontFamily: "monospace" }}>
          {formatFecha(anuncio.fecha)}
        </span>
      </div>
    </button>
  );
}
