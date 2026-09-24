import { useState } from "react";
import { useTheme, GRADIENTS, RADIUS } from "@/themes/colors";
import { iconoDeDocumento, etiquetaResponsable, formatFecha, porcentajeProgreso } from "../hooks/expedienteData";

// Piezas compartidas por la vista del alumno y la de coordinación (CU-ADM-13).
// SOLO CONSULTA: aquí no hay subir, aprobar, rechazar ni eliminar.
//
// Ni el número de documentos ni las etapas están cableados: ambos llegan del backend.

/**
 * Ficha del alumno. La usan las DOS vistas del CU (el alumno con su propio expediente y
 * Coordinación con el del alumno que seleccionó), así que muestran exactamente lo mismo.
 *
 * `oferta` y `profesor` llegan del backend; la pantalla no los deduce. Si alguno falta —la oferta es
 * opcional en el esquema— su renglón simplemente no se dibuja, sin texto inventado.
 *
 * No se muestra empresa ni institución: no es un dato de esta ficha.
 */
export function FichaAlumno({ alumno, C }) {
  const datos = [
    ["Oferta", alumno.oferta],
    ["Profesor", alumno.profesor],
  ].filter(([, valor]) => valor);

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1rem 1.25rem", marginBottom: "1.25rem",
    }}>
      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
        {alumno.nombreCompleto}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
        {alumno.boleta} · {alumno.carrera}
      </p>

      {datos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {datos.map(([etiqueta, valor]) => (
            <span key={etiqueta} style={{
              fontSize: 11, padding: "3px 10px", borderRadius: RADIUS.full,
              background: C.bgInput, border: `1px solid ${C.borderDefault}`,
              color: C.textMuted,
            }}>
              <strong style={{ fontWeight: 700, color: C.textPrimary }}>{etiqueta}:</strong> {valor}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BarraProgreso({ progreso, etapaActual = null, C }) {
  const pct = porcentajeProgreso(progreso);
  const completo = pct === 100;

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1rem 1.25rem", marginBottom: "1.25rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>Progreso del expediente</span>
        {/* Se mide en TIPOS del expediente, no en archivos: el número de reportes mensuales que le
            tocan a cada alumno depende de su servicio y no se puede saber desde aquí. */}
        <span style={{ fontSize: 13, fontWeight: 700, color: completo ? "#22C55E" : C.accentText }}>
          {progreso.disponibles} / {progreso.total} tipos de documento
        </span>
      </div>
      <div style={{ height: 8, background: C.borderSubtle, borderRadius: 4 }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 4,
          background: completo ? "#22C55E" : GRADIENTS.progress,
          transition: "width 0.4s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 11, color: C.textDisabled }}>
          {progreso.totalDocumentos} archivo{progreso.totalDocumentos !== 1 ? "s" : ""} disponible{progreso.totalDocumentos !== 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: completo ? "#22C55E" : C.accentText }}>{pct}%</span>
        {/* Siempre una de las tres etapas documentales. Llegar al 100% no crea una cuarta: un
            expediente completo sigue estando en Término. */}
        <span style={{ fontSize: 11, color: C.textDisabled }}>
          {etapaActual ? `Etapa: ${etapaActual}` : ""}
        </span>
      </div>
    </div>
  );
}

function DocumentoCard({ documento, onVer, onDescargar, descarga, cargandoPdf, C }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden", background: C.bgCard,
      border: `1px solid ${abierto ? C.accent : C.borderDefault}`,
      transition: "border-color 0.15s",
    }}>
      <div
        onClick={() => setAbierto((v) => !v)}
        style={{
          padding: "0.875rem 1.25rem", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
          background: "transparent",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: RADIUS.md, flexShrink: 0,
          background: C.bgInput, border: `1px solid ${C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
        }}>
          {iconoDeDocumento(documento.tipo)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: RADIUS.full,
              background: C.accentSoft, color: C.accentText, fontWeight: 700, letterSpacing: "0.04em",
            }}>
              {documento.etapa}
            </span>
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: RADIUS.full,
              background: C.bgInput, border: `1px solid ${C.borderDefault}`,
              color: C.textMuted, fontWeight: 600,
            }}>
              {etiquetaResponsable(documento.responsable)}
            </span>
            {/* El estado se identifica con un chip discreto; la tarjeta NO se pinta entera. */}
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: RADIUS.full,
              background: "transparent", border: "1px solid rgba(34,197,94,0.45)",
              color: "#22C55E", fontWeight: 700, whiteSpace: "nowrap",
            }}>
              ✓ Aprobado
            </span>
          </div>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {documento.nombre}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
            Disponible desde el {formatFecha(documento.fechaCreacion)}
          </p>
        </div>
      </div>

      {abierto && (
        <div style={{ padding: "0.875rem 1.25rem", borderTop: `1px solid ${C.borderSubtle}` }}>
          <p style={{ margin: "0 0 0.875rem", fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
            {documento.descripcion}
          </p>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => onVer(documento)}
              disabled={cargandoPdf}
              style={{
                padding: "6px 14px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 12, fontWeight: 700,
                cursor: cargandoPdf ? "default" : "pointer", fontFamily: "inherit",
              }}
            >
              {cargandoPdf ? "Abriendo..." : "Ver documento"}
            </button>
            <button
              onClick={() => onDescargar(documento)}
              disabled={descarga.estado === "cargando" && descarga.id === documento.id}
              style={{
                padding: "6px 14px", borderRadius: RADIUS.md,
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Descargar PDF
            </button>
          </div>

          {descarga.estado === "error" && descarga.id === documento.id && (
            <p style={{ margin: "0.625rem 0 0", fontSize: 12, color: C.danger }}>{descarga.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Lista por etapas. Las etapas y su orden vienen del backend; una etapa vacía se explica. */
export function ListaPorEtapas({ etapas, onVer, onDescargar, descarga, cargandoPdf, C }) {
  const sinDocumentos = etapas.every((e) => e.documentos.length === 0);

  if (sinDocumentos) {
    return (
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`, padding: "3rem 2rem", textAlign: "center",
      }}>
        <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📂</p>
        <p style={{ margin: "0 0 0.375rem", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
          Sin documentos disponibles
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Aquí aparecerán los documentos del servicio social conforme queden aprobados.
        </p>
      </div>
    );
  }

  return etapas.map(({ etapa, documentos }) => (
    <div key={etapa} style={{ marginBottom: "1.5rem" }}>
      <p style={{
        margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.textDisabled,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {etapa}
        <span style={{ marginLeft: 8, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
          {documentos.length} documento{documentos.length !== 1 ? "s" : ""}
        </span>
      </p>

      {documentos.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontStyle: "italic" }}>
          Todavía no hay documentos en esta etapa.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {documentos.map((d) => (
            <DocumentoCard
              key={d.id}
              documento={d}
              onVer={onVer}
              onDescargar={onDescargar}
              descarga={descarga}
              cargandoPdf={cargandoPdf}
              C={C}
            />
          ))}
        </div>
      )}
    </div>
  ));
}

/** Visor del PDF en una capa sobre la pantalla. */
export function VisorDocumento({ pdf, documento, onCerrar }) {
  const { C } = useTheme();
  if (pdf.estado === "inactivo") return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "2rem",
    }}>
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg, width: "100%", maxWidth: 900,
        height: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          padding: "0.875rem 1.25rem", borderBottom: `1px solid ${C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
            {documento?.nombre ?? "Documento"}
          </p>
          <button onClick={onCerrar} style={{
            background: "transparent", border: "none", color: C.textDisabled,
            fontSize: 20, lineHeight: 1, cursor: "pointer",
          }}>
            ×
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {pdf.estado === "cargando" && (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Abriendo el documento...</p>
          )}
          {pdf.estado === "error" && (
            <p style={{ margin: 0, fontSize: 13, color: C.danger }}>{pdf.error}</p>
          )}
          {pdf.estado === "listo" && (
            <iframe title="Documento" src={pdf.url} style={{ width: "100%", height: "100%", border: "none" }} />
          )}
        </div>
      </div>
    </div>
  );
}
