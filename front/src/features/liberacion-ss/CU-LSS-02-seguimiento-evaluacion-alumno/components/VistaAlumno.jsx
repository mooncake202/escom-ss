import { useTheme, RADIUS } from "@/themes/colors";
import { useState } from "react";

export function VistaAlumno({ estado }) {
const { C } = useTheme();
const [confirmadoSISS, setConfirmadoSISS] = useState(false);

const pasos = [
    {
    label: "Evaluación del profesor",
    hecho: estado.firmadoProfesor,
    pendienteLabel: "Tu profesor aún no ha firmado la evaluación",
    },
    {
    label: "Revisión de coordinación",
    hecho: estado.firmadoCoordinacion,
    pendienteLabel: "Coordinación revisará y firmará después del profesor",
    bloqueado: !estado.firmadoProfesor,
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
            {/* Indicador */}
            <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                background: paso.hecho ? C.successSoft : paso.bloqueado ? C.bgInput : "rgba(59,130,246,0.08)",
                border: `2px solid ${paso.hecho ? C.success : paso.bloqueado ? C.borderDefault : C.borderDefault}`,
            }}>
            {paso.hecho ? "✔" : paso.bloqueado ? "🔒" : "⏳"}
            </div>

            <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                {paso.label}
            </p>
            {!paso.hecho && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
                    {paso.pendienteLabel}
                </p>
            )}
            {paso.hecho && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.success, fontWeight: 600 }}>
                    Completado
                </p>
            )}
            </div>
    </div>
        ))}
    </div>
      {/* 🔥 BLOQUE FINAL */}
        {estado.firmadoProfesor && estado.firmadoCoordinacion && (
        <div style={{
            marginTop: "2rem",
            padding: "1.5rem",
            borderRadius: RADIUS.lg,
            background: C.bgCard,
            border: `1px solid ${C.success}`,
        }}>

            {/* TÍTULO */}
            <p style={{
            margin: "0 0 0.75rem",
            fontSize: 12,
            fontWeight: 700,
            color: C.success,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            }}>
            Evaluación final disponible
            </p>

            <p style={{
            margin: "0 0 1rem",
            fontSize: 13,
            color: C.textMuted,
            lineHeight: 1.5
            }}>
            Tu evaluación ha sido firmada por el profesor y coordinación. 
            
            </p>

            {/* BOTÓN PDF */}
            <button style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            background: C.success,
            border: "none",
            color: "#fff",
            marginBottom: "1rem"
            }}>
            Descargar evaluación (PDF)
            </button>

            {/* LINK SISS */}
            <a
            href="https://serviciosocial.ipn.mx"
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: "block",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
                color: C.accentText,
                marginBottom: "1rem",
                textDecoration: "none"
            }}
            >
            Descárgala y súbela en el sistema SISS para continuar con tu proceso. 
            </a>

            {/* CHECK FINAL */}
            <label style={{
            display: "flex",
            gap: 10,
            cursor: "pointer",
            fontSize: 13,
            color: C.textPrimary
            }}>
            <input
            type="checkbox"
            checked={confirmadoSISS}
            onChange={() => setConfirmadoSISS(prev => !prev)}
            />
            Confirmo que ya subí mi evaluación en el SISS


            
            </label>


            <button
  disabled={!confirmadoSISS}
  style={{
    marginTop: "1rem",
    width: "100%",
    padding: "12px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: confirmadoSISS ? "pointer" : "not-allowed",
    background: confirmadoSISS ? C.accent : C.borderDefault,
    border: "none",
    color: "#fff",
    opacity: confirmadoSISS ? 1 : 0.6
  }}
>
  Solicitar carta de término →
</button>

        </div>
        )}
    </div>
  );
}