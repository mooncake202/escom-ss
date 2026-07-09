import { RADIUS } from "@/themes/colors";

export function RecursoRow({ recurso, index, total, modo, recursoActivoId, onEditar, onEliminar, onCancelar, onConfirmarEliminar, C }) {
  const eliminandoEste = modo === "eliminar" && recursoActivoId === recurso.id;

  return (
    <div key={recurso.id}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 2fr 140px 148px",
        gap: "1rem", padding: "12px 1.25rem", alignItems: "center",
        borderBottom: index < total - 1 ? `1px solid ${C.borderDefault}` : "none",
        background: eliminandoEste ? "rgba(239,68,68,0.04)" : "transparent",
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{recurso.nombre}</span>
        <div style={{ overflow: "hidden" }}>
          <a
            href={recurso.url}
            target="_blank"
            rel="noopener noreferrer"
            title={recurso.url}
            style={{
              fontSize: 12, color: C.accentText,
              textDecoration: "none",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              display: "block",
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
          >
            {recurso.url}
          </a>
        </div>
        <span style={{ fontSize: 12, color: C.textDisabled }}>{recurso.ultimaActualizacion}</span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => onEditar(recurso)}
            disabled={modo !== null}
            style={{
              padding: "5px 10px", borderRadius: RADIUS.sm,
              fontSize: 12, fontWeight: 500, cursor: modo !== null ? "default" : "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: modo !== null ? C.textDisabled : C.textMuted, fontFamily: "inherit",
            }}
          >
            Editar
          </button>
          <button
            onClick={() => onEliminar(recurso)}
            disabled={modo !== null}
            style={{
              padding: "5px 10px", borderRadius: RADIUS.sm,
              fontSize: 12, fontWeight: 500, cursor: modo !== null ? "default" : "pointer",
              background: "transparent", border: `1px solid ${modo !== null ? C.borderDefault : C.danger}`,
              color: modo !== null ? C.textDisabled : C.danger, fontFamily: "inherit",
            }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Confirmación de eliminación inline */}
      {eliminandoEste && (
        <div style={{
          padding: "0.875rem 1.25rem",
          background: "rgba(239,68,68,0.06)", borderTop: `1px solid ${C.danger}`,
          borderBottom: index < total - 1 ? `1px solid ${C.borderDefault}` : "none",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: C.danger, fontWeight: 500 }}>
            ¿Eliminar <strong>"{recurso.nombre}"</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onCancelar}
              style={{ padding: "6px 14px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontFamily: "inherit" }}>
              Cancelar
            </button>
            <button onClick={onConfirmarEliminar}
              style={{ padding: "6px 14px", borderRadius: RADIUS.md, fontSize: 12, fontWeight: 700, cursor: "pointer", background: C.danger, border: "none", color: "#fff", fontFamily: "inherit" }}>
              Sí, eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
