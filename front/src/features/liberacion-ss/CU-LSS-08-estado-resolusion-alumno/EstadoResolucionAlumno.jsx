import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";
import { useEstadoResolucionAlumno } from "./hooks/useEstadoResolucionAlumno";
import { useNavigate } from "react-router-dom";

const MOCK = {
  usuario: "Ana Karen Lagarza Ortega",
};

// ——— Vista: expediente en revisión ————————————————————
function VistaEnRevision({ C }) {
  return (
    <div style={{
      background: C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderSubtle}`,
      padding: "2rem 1.5rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 44, marginBottom: "1rem" }}>🔍</div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
        Tu expediente está en revisión
      </h3>
      <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
        Coordinación está revisando los documentos de tu expediente.
        Recibirás una notificación cuando haya una resolución.
      </p>
    </div>
  );
}

// ——— Vista: expediente aprobado ————————————————————
function VistaAprobado({ C }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
      <div style={{ fontSize: 52, marginBottom: "1rem" }}>🎓</div>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
        ¡Felicidades! Liberación aprobada
      </h2>
      <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
        Tu expediente fue revisado y aprobado. Has completado exitosamente tu servicio social.
      </p>
      <button
        style={{
          padding: "12px 32px",
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
        Solicitar constancia de término
      </button>
    </div>
  );
}

// ——— Vista: expediente rechazado ——————————————————————
function VistaRechazado({ observacionesGuardadas, C, navigate }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: "2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: 52, marginBottom: "1rem" }}>⚠️</div>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.danger }}>
          Expediente rechazado
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Tu expediente requiere correcciones. Revisa las observaciones y vuelve a enviarlo.
        </p>
      </div>

      {observacionesGuardadas && (
        <div style={{
          padding: "1.25rem",
          borderRadius: RADIUS.lg,
          background: "rgba(239,68,68,0.06)",
          border: `1px solid ${C.danger}`,
          marginBottom: "1.5rem",
        }}>
          <p style={{
            margin: "0 0 0.5rem",
            fontSize: 12,
            fontWeight: 700,
            color: C.danger,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Observaciones
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>
            {observacionesGuardadas}
          </p>
        </div>
      )}

      <button
        onClick={() => navigate("/alumno/integracion-expediente")}
        style={{
          width: "100%",
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
        Corregir y reenviar expediente →
      </button>
    </div>
  );
}

// ——— Página principal ——————————————————————————————————
export default function EstadoResolucionAlumno() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { estado, observacionesGuardadas } = useEstadoResolucionAlumno();

  if (estado === "aprobado") {
    return (
      <ProcesoLSSLayout pasoActual={5} titulo="Revisión y resolución" subtitulo="CU-LSS-08" rol="alumno" usuario={MOCK.usuario}>
        <VistaAprobado C={C} />
      </ProcesoLSSLayout>
    );
  }

  if (estado === "rechazado") {
    return (
      <ProcesoLSSLayout pasoActual={5} titulo="Revisión y resolución" subtitulo="CU-LSS-08" rol="alumno" usuario={MOCK.usuario}>
        <VistaRechazado observacionesGuardadas={observacionesGuardadas} C={C} navigate={navigate} />
      </ProcesoLSSLayout>
    );
  }

  return (
    <ProcesoLSSLayout
      pasoActual={5}
      titulo="Revisión y resolución"
      subtitulo="CU-LSS-08"
      rol="alumno"
      usuario={MOCK.usuario}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Estado de tu expediente
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Tu expediente está siendo revisado por coordinación.
        </p>

        <VistaEnRevision C={C} />
      </div>
    </ProcesoLSSLayout>
  );
}
