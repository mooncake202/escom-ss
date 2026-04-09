import { useTheme, RADIUS, GRADIENTS, SHADOWS } from "@/themes/colors";

export function VistaCoordinacion({ estado, onFirmar, onRechazar }) {
  const { C } = useTheme();

  // CASO: Profesor aún no ha firmado
  if (!estado.firmadoProfesor) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 280,
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px dashed ${C.borderDefault}`,
        padding: "3rem",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 32, marginBottom: "1rem" }}>⏳</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: "0.35rem" }}>
          Esperando firma del profesor
        </p>
        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
          El profesor aún no ha completado ni firmado la evaluación de este alumno.
          Podrás revisarla y firmarla una vez que él lo haga.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Banner PDF disponible */}
      <div style={{
        padding: "1rem 1.25rem",
        borderRadius: RADIUS.lg,
        background: "rgba(21,128,61,0.06)",
        border: "1px solid rgba(21,128,61,0.25)",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>
            Evaluación disponible para revisión
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
            El profesor ha firmado. Descarga el PDF antes de firmar.
          </p>
        </div>
        <button
          onClick={() => alert("Descargando PDF...")}
          style={{
            padding: "8px 16px",
            borderRadius: RADIUS.md,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: "rgba(21,128,61,0.10)",
            border: "1px solid rgba(21,128,61,0.3)",
            color: "#15803d",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Descargar PDF
        </button>
      </div>

      

      {/* CASO: Ya se tomó una decisión */}
      {(estado.firmadoCoordinacion || estado.rechazado) && (
        <div style={{
          padding: "1.25rem 1.5rem",
          borderRadius: RADIUS.lg,
          border: `1px solid ${estado.rechazado ? "rgba(185,28,28,0.3)" : "rgba(21,128,61,0.3)"}`,
          background: estado.rechazado ? "rgba(185,28,28,0.06)" : "rgba(21,128,61,0.06)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: estado.rechazado ? "rgba(185,28,28,0.12)" : "rgba(21,128,61,0.12)",
            border: `1px solid ${estado.rechazado ? "rgba(185,28,28,0.3)" : "rgba(21,128,61,0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}>
            {estado.rechazado ? "✖" : "✔"}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: estado.rechazado ? "#b91c1c" : "#15803d" }}>
              {estado.rechazado ? "Evaluación rechazada" : "Evaluación aprobada y firmada"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
              {estado.rechazado
                ? "Esta evaluación fue rechazada por coordinación."
                : "La firma de coordinación ha sido registrada correctamente."
              }
            </p>
          </div>
        </div>
      )}

      {/* CASO: Pendiente de decisión */}
      {!estado.firmadoCoordinacion && !estado.rechazado && (
        <div style={{
          padding: "1.5rem",
          borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          background: C.bgCard,
        }}>
          <p style={{
            margin: "0 0 0.35rem",
            fontSize: 12,
            fontWeight: 700,
            color: C.accentText,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Firma de coordinación
          </p>
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            Revisa la evaluación y decide si la apruebas o la rechazas. Esta acción no puede deshacerse.
          </p>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onRechazar}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: RADIUS.md,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                background: "rgba(185,28,28,0.06)",
                border: "1px solid rgba(185,28,28,0.3)",
                color: "#b91c1c",
                fontFamily: "inherit",
              }}
            >
              Rechazar
            </button>
            <button
              onClick={onFirmar}
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: RADIUS.md,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                background: GRADIENTS.primary,
                border: "none",
                color: "#fff",
                fontFamily: "inherit",
                boxShadow: SHADOWS.accent,
              }}
            >
              Aprobar y firmar →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
