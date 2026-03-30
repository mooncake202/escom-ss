import { RADIUS } from "@/themes/colors";

export function AnuncioItem({ anuncio, index, total, modo, anuncioActivoId, onEditar, onEliminar, onCancelar, onConfirmarEliminar, C }) {
  const eliminandoEste = modo === "eliminar" && anuncioActivoId === anuncio.id;
  const modoActivo     = modo !== null;

  return (
    <div>
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: index < total - 1 || eliminandoEste
          ? `1px solid ${C.borderDefault}`
          : "none",
        background: eliminandoEste ? "rgba(239,68,68,0.04)" : "transparent",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
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
              Publicado: {anuncio.fechaHora}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={() => onEditar(anuncio)}
              disabled={modoActivo}
              style={{
                padding: "5px 10px", borderRadius: RADIUS.sm,
                fontSize: 12, fontWeight: 500,
                cursor: modoActivo ? "default" : "pointer",
                background: "transparent",
                border: `1px solid ${C.borderDefault}`,
                color: modoActivo ? C.textDisabled : C.textMuted,
                fontFamily: "inherit",
              }}
            >
              Editar
            </button>
            <button
              onClick={() => onEliminar(anuncio)}
              disabled={modoActivo}
              style={{
                padding: "5px 10px", borderRadius: RADIUS.sm,
                fontSize: 12, fontWeight: 500,
                cursor: modoActivo ? "default" : "pointer",
                background: "transparent",
                border: `1px solid ${modoActivo ? C.borderDefault : C.danger}`,
                color: modoActivo ? C.textDisabled : C.danger,
                fontFamily: "inherit",
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmación de eliminación inline */}
      {eliminandoEste && (
        <div style={{
          padding: "0.875rem 1.25rem",
          background: "rgba(239,68,68,0.06)",
          borderTop: `1px solid ${C.danger}`,
          borderBottom: index < total - 1 ? `1px solid ${C.borderDefault}` : "none",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: C.danger, fontWeight: 500 }}>
            ¿Eliminar <strong>"{anuncio.titulo}"</strong>?
            Los alumnos dejarán de verlo de inmediato.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={onCancelar}
              style={{
                padding: "6px 14px", borderRadius: RADIUS.md,
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmarEliminar}
              style={{
                padding: "6px 14px", borderRadius: RADIUS.md,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: C.danger, border: "none",
                color: "#fff", fontFamily: "inherit",
              }}
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
