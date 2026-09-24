import { RADIUS } from "@/themes/colors";
import { OrigenBadge } from "./OrigenBadge";
import { colorOrigen } from "./origen";
import { AnuncioDetalle } from "./AnuncioDetalle";

// Tarjeta acordeón: una sola tarjeta que CRECE hacia abajo al expandirse, no una tarjeta más un
// panel aparte.
//
// El encabezado es el único lugar donde viven título, autor y origen; el cuerpo expandido nunca
// los repite. La fecha aparece UNA sola vez: corta en el encabezado cuando está cerrada, y completa
// con hora al pie cuando está abierta.
//
// `anuncio.visto` viene del backend (registro_anuncio_visto): sin leer se ve destacado y con la
// etiqueta "Nuevo"; ya leído se atenúa.
export function AnuncioCard({ anuncio, expandido, onAlternar, formatFecha, formatFechaHora, C }) {
  const leido = anuncio.visto;

  return (
    <div style={{
      background: expandido ? C.bgCard : C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${expandido ? C.accent : C.borderDefault}`,
      borderLeft: `3px solid ${leido && !expandido ? C.borderDefault : colorOrigen(anuncio.origen)}`,
      overflow: "hidden",
      opacity: leido && !expandido ? 0.6 : 1,
      transition: "border-color 0.15s, opacity 0.2s",
    }}>
      {/* Encabezado: siempre visible, y es el que abre y cierra. */}
      <button
        onClick={() => onAlternar(anuncio)}
        aria-expanded={expandido}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "transparent", border: "none",
          padding: "1rem 1.25rem",
          fontFamily: "inherit", outline: "none",
          display: "block",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: 6 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: leido && !expandido ? 400 : 700, color: leido && !expandido ? C.textMuted : C.textPrimary, lineHeight: 1.4 }}>
            {anuncio.titulo}
          </p>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {!leido && (
              <span style={{
                padding: "2px 8px", borderRadius: RADIUS.full,
                fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                background: C.accent, color: "#fff",
              }}>
                Nuevo
              </span>
            )}
            <OrigenBadge origen={anuncio.origen} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>{anuncio.autor}</span>
          {/* Al expandirse se oculta: la fecha completa pasa al pie del contenido. */}
          {!expandido && (
            <span style={{ fontSize: 11, color: C.textDisabled, fontFamily: "monospace" }}>
              {formatFecha(anuncio.fechaPublicacion)}
            </span>
          )}
        </div>
      </button>

      {/* Cuerpo: solo contenido y fecha de publicación. Nada de lo de arriba se repite. */}
      {expandido && (
        <AnuncioDetalle
          anuncio={anuncio}
          onCerrar={() => onAlternar(anuncio)}
          formatFechaHora={formatFechaHora}
          C={C}
        />
      )}
    </div>
  );
}
