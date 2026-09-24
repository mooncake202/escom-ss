// Fila del historial. Es SOLO lectura: un anuncio publicado no se edita ni se elimina, queda como
// registro histórico. Por eso ya no hay botones de acción.
export function AnuncioItem({ anuncio, index, total, formatFechaHora, C }) {
  return (
    <div style={{
      padding: "1rem 1.25rem",
      borderBottom: index < total - 1 ? `1px solid ${C.borderDefault}` : "none",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
        {anuncio.titulo}
      </p>
      <p style={{
        margin: "0 0 6px", fontSize: 13, color: C.textMuted,
        lineHeight: 1.55,
        display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {anuncio.contenido}
      </p>
      <span style={{ fontSize: 11, color: C.textDisabled }}>
        Publicado: {formatFechaHora(anuncio.fechaPublicacion)}
      </span>
    </div>
  );
}
