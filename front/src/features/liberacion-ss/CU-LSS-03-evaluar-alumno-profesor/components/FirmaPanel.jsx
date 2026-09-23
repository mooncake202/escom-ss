import { useState } from "react";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";

export function FirmaPanel({ tipo, estado, onFirmar, onRechazar }) {
  const { C } = useTheme();
  // Cuadro de texto PROPIO para el motivo del rechazo — visualmente
  // separado del "Observaciones" de FormEvaluacion (mismo campo de BD por
  // detrás, observaciones_profesor, pero son dos flujos mutuamente
  // excluyentes con etiquetas e interfaz distintas).
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const bloqueado =
    (tipo === "coordinacion" && !estado.firmadoProfesor) ||
    (tipo === "profesor" && estado.requiereValidacion);

  const yaFirmado =
    tipo === "profesor" ? estado.firmadoProfesor : estado.firmadoCoordinacion;

  // Si ya está firmado
  if (yaFirmado) {
    return (
      <div style={{
        marginTop: "1.5rem",
        padding: "1.25rem 1.5rem",
        borderRadius: RADIUS.lg,
        border: "1px solid rgba(21,128,61,0.3)",
        background: "rgba(21,128,61,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(21,128,61,0.12)",
          border: "1px solid rgba(21,128,61,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}>
          ✔
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>
            Evaluación firmada
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
            La firma {tipo === "profesor" ? "del profesor" : "de coordinación"} ha sido registrada correctamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: "1.5rem",
      padding: "1.5rem",
      borderRadius: RADIUS.lg,
      border: `1px solid ${bloqueado ? C.borderDefault : C.borderSubtle}`,
      background: C.bgCard,
    }}>

      <p style={{
        margin: "0 0 0.35rem",
        fontSize: 12,
        fontWeight: 700,
        color: bloqueado ? C.textDisabled : C.accentText,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Firma {tipo === "profesor" ? "del profesor" : "de coordinación"}
      </p>

      <p style={{
        margin: "0 0 1.25rem",
        fontSize: 13,
        color: C.textMuted,
        lineHeight: 1.5,
      }}>
        {bloqueado
          ? tipo === "coordinacion"
            ? "El profesor debe firmar primero antes de que coordinación pueda hacerlo."
            : "Debes validar los reportes en SISS antes de poder firmar la evaluación."
          : "Al firmar, confirmas que la evaluación es correcta. Esta acción no puede deshacerse."
        }
      </p>

      {bloqueado && (
        <div style={{
          padding: "10px 12px",
          borderRadius: RADIUS.md,
          background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.25)",
          marginBottom: "1.25rem",
          fontSize: 12,
          color: "#b45309",
          lineHeight: 1.5,
        }}>
          {tipo === "coordinacion"
            ? "⏳ Esperando firma del profesor"
            : "⚠️ Validación en SISS pendiente"
          }
        </div>
      )}

      <button
        onClick={onFirmar}
        disabled={bloqueado}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 600,
          cursor: bloqueado ? "not-allowed" : "pointer",
          background: bloqueado ? C.borderDefault : GRADIENTS.primary,
          border: "none",
          color: "#fff",
          fontFamily: "inherit",
          boxShadow: bloqueado ? "none" : SHADOWS.accent,
          opacity: bloqueado ? 0.5 : 1,
          transition: "opacity 0.2s",
          marginBottom: "0.75rem",
        }}
      >
        Firmar evaluación →
      </button>

      {/* Rechazar por SISS es exclusivo del profesor y, a propósito, NO se
          bloquea por `bloqueado` — esa bandera solo cubre "reportes sin
          validar", que es precisamente el motivo para rechazar. */}
      {tipo === "profesor" && (
        <div style={{ marginTop: "0.5rem", paddingTop: "1rem", borderTop: `1px solid ${C.borderSubtle}` }}>
          <p style={{
            margin: "0 0 0.5rem",
            fontSize: 11,
            fontWeight: 700,
            color: "#b91c1c",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Motivo del rechazo
          </p>
          <textarea
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Explica por qué rechazas: por ejemplo, los reportes del alumno no aparecen validados en SISS..."
            style={{
              width: "100%",
              height: 70,
              padding: "10px 12px",
              borderRadius: RADIUS.md,
              border: `1px solid ${C.borderDefault}`,
              background: C.bgInput,
              color: C.textPrimary,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
              outline: "none",
              lineHeight: 1.5,
              marginBottom: "0.75rem",
            }}
          />
          <button
            onClick={() => onRechazar?.(motivoRechazo)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: "transparent",
              border: `1px solid ${C.borderDefault}`,
              color: "#b91c1c",
              fontFamily: "inherit",
              transition: "opacity 0.2s",
            }}
          >
            Rechazar por SISS →
          </button>
        </div>
      )}
    </div>
  );
}