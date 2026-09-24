import { useTheme, RADIUS } from "@/themes/colors";
import { useState } from "react";

export function VistaAlumno({ estado, error, accionEnCurso, onReenviar, onDescargar, onConfirmarSiss, onSolicitarCartaTermino }) {
  const { C } = useTheme();
  const [checkReportesSiss, setCheckReportesSiss] = useState(false);
  const [checkSubidaSiss, setCheckSubidaSiss] = useState(false);

  if (!estado) return null;

  const { alterno, firmadoProfesor, firmadoCoordinacion, motivoRechazo, evaluacionDescargada, evaluacionSubidaSiss } = estado;

  const pasos = [
    {
      label: "Evaluación del profesor",
      hecho: firmadoProfesor,
      pendienteLabel: alterno === "C" ? "Tu profesor rechazó tu solicitud — revisa el motivo abajo" : "Tu profesor aún no ha firmado la evaluación",
    },
    {
      label: "Revisión de coordinación",
      hecho: firmadoCoordinacion,
      pendienteLabel: "Coordinación revisará y firmará después del profesor",
      bloqueado: !firmadoProfesor,
    },
  ];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
        Estado de tu evaluación
      </h2>
      <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
        Tu proceso de evaluación está en curso. Aquí puedes ver el avance de cada etapa.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {pasos.map((paso, i) => (
          <div key={i} style={{
            background: C.bgCard,
            borderRadius: RADIUS.lg,
            border: `1px solid ${paso.hecho ? C.success : C.borderSubtle}`,
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              background: paso.hecho ? C.successSoft : paso.bloqueado ? C.bgInput : "rgba(59,130,246,0.08)",
              border: `2px solid ${paso.hecho ? C.success : C.borderDefault}`,
            }}>
              {paso.hecho ? "✔" : paso.bloqueado ? "🔒" : "⏳"}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{paso.label}</p>
              {!paso.hecho && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>{paso.pendienteLabel}</p>
              )}
              {paso.hecho && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.success, fontWeight: 600 }}>Completado</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Alterno C — profesor rechazó */}
      {alterno === "C" && (
        <div style={{
          marginTop: "1.5rem", padding: "1.25rem", borderRadius: RADIUS.lg,
          background: C.dangerSoft, border: `1px solid ${C.danger}`,
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: 12, fontWeight: 700, color: C.danger, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Solicitud rechazada
          </p>
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
            {motivoRechazo || "Tu profesor rechazó la solicitud."}
          </p>

          <label style={{ display: "flex", gap: 10, cursor: "pointer", fontSize: 13, color: C.textPrimary, marginBottom: "1rem" }}>
            <input type="checkbox" checked={checkReportesSiss} onChange={() => setCheckReportesSiss((p) => !p)} />
            Confirmo que ya subí y validé mis reportes en la plataforma SISS
          </label>

          <button
            disabled={!checkReportesSiss || accionEnCurso}
            onClick={() => onReenviar(true)}
            style={{
              width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: checkReportesSiss && !accionEnCurso ? "pointer" : "not-allowed",
              background: checkReportesSiss ? C.accent : C.borderDefault,
              border: "none", color: "#fff", opacity: checkReportesSiss ? 1 : 0.6,
            }}
          >
            {accionEnCurso ? "Enviando..." : "Reenviar solicitud"}
          </button>
        </div>
      )}

      {/* Alterno E — coordinación devolvió la evaluación al profesor para
          corrección (CU-LSS-04, Camino A) — el alumno no hace nada aquí,
          solo informativo, sin ningún botón de acción. */}
      {alterno === "E" && (
        <div style={{
          marginTop: "1.5rem", padding: "1.25rem", borderRadius: RADIUS.lg,
          background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.35)",
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: 12, fontWeight: 700, color: "#b45309", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            En corrección
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
            Tu evaluación fue devuelta para corrección por coordinación. Tu profesor la está ajustando.
          </p>
        </div>
      )}

      {/* Alterno D — ambas firmas completas */}
      {alterno === "D" && (
        <div style={{
          marginTop: "2rem", padding: "1.5rem", borderRadius: RADIUS.lg,
          background: C.bgCard, border: `1px solid ${C.success}`,
        }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.success, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Evaluación final disponible
          </p>
          <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            Tu evaluación ha sido firmada por el profesor y coordinación.
          </p>

          <button
            onClick={onDescargar}
            disabled={accionEnCurso}
            style={{
              width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: accionEnCurso ? "wait" : "pointer",
              background: C.success, border: "none", color: "#fff", marginBottom: "1rem",
            }}
          >
            {accionEnCurso ? "Procesando..." : "Descargar evaluación (PDF)"}
          </button>

          <a
            href="https://serviciosocial.ipn.mx"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", fontSize: 13, fontWeight: 600, color: C.accentText, marginBottom: "1rem", textDecoration: "none" }}
          >
            Descárgala y súbela en el sistema SISS para continuar con tu proceso.
          </a>

          {/* RN orden obligatorio: el check de SISS solo se puede marcar
              DESPUÉS de haber descargado — deshabilitado con mensaje si no. */}
          {!evaluacionDescargada && (
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.textDisabled }}>
              Primero descarga tu evaluación para poder confirmar que ya la subiste al SISS.
            </p>
          )}
          <label style={{
            display: "flex", gap: 10, fontSize: 13, color: C.textPrimary,
            cursor: evaluacionDescargada && !evaluacionSubidaSiss ? "pointer" : "not-allowed",
            opacity: evaluacionDescargada ? 1 : 0.5,
          }}>
            <input
              type="checkbox"
              checked={evaluacionSubidaSiss || checkSubidaSiss}
              disabled={!evaluacionDescargada || evaluacionSubidaSiss || accionEnCurso}
              onChange={() => {
                setCheckSubidaSiss(true);
                onConfirmarSiss();
              }}
            />
            Confirmo que ya subí mi evaluación en el SISS
          </label>

          <button
            disabled={!(evaluacionDescargada && evaluacionSubidaSiss) || accionEnCurso}
            onClick={onSolicitarCartaTermino}
            style={{
              marginTop: "1rem", width: "100%", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: evaluacionDescargada && evaluacionSubidaSiss && !accionEnCurso ? "pointer" : "not-allowed",
              background: evaluacionDescargada && evaluacionSubidaSiss ? C.accent : C.borderDefault,
              border: "none", color: "#fff", opacity: evaluacionDescargada && evaluacionSubidaSiss ? 1 : 0.6,
            }}
          >
            Solicitar carta de término →
          </button>
        </div>
      )}

      {error && (
        <p style={{ marginTop: "1rem", fontSize: 12, color: C.danger }}>{error}</p>
      )}
    </div>
  );
}
