import { RADIUS } from "@/themes/colors";

// Cuerpo de la tarjeta expandida. A propósito NO repite título, autor, badge de origen ni la fecha
// corta: todo eso ya está en el encabezado, justo encima.
//
// Solo dos cosas: el contenido completo y, al pie, la fecha de publicación en formato largo.
// Tampoco hay botón de "marcar como leído": expandir ya lo marca.
export function AnuncioDetalle({ anuncio, onCerrar, formatFechaHora, C }) {
  return (
    <div style={{
      padding: "0 1.25rem 1.125rem",
      borderTop: `1px solid ${C.borderDefault}`,
      marginTop: -1,
    }}>
      <p style={{
        margin: "1.125rem 0 1rem", fontSize: 13, color: C.textMuted,
        lineHeight: 1.7, whiteSpace: "pre-wrap",
      }}>
        {anuncio.contenido}
      </p>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: "0.75rem", flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 11, color: C.textDisabled }}>
          Publicado: {formatFechaHora(anuncio.fechaPublicacion)}
        </span>
        {/* Se puede contraer también volviendo a pulsar el encabezado; esto es el atajo discreto. */}
        <button
          onClick={onCerrar}
          style={{
            background: "transparent", border: `1px solid ${C.borderDefault}`,
            borderRadius: RADIUS.sm, padding: "3px 10px",
            fontSize: 11, color: C.textMuted, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
