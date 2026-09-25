import { useTheme, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";
import { useConsultarConstanciaTermino } from "./hooks/useConsultarConstanciaTermino";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import { TextoConEnlaces } from "@/components/ui/TextoConEnlaces";

// ——— Vista: constancia pendiente ——————————————————————
function VistaPendiente({ C }) {
  return (
    <div style={{
      background: C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderSubtle}`,
      padding: "2.5rem 1.5rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: "1rem" }}>⏳</div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: 17, fontWeight: 700, color: C.textPrimary }}>
        Tu constancia está siendo elaborada
      </h3>
      <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6, maxWidth: 400, marginInline: "auto" }}>
        Coordinación está generando tu constancia de término de servicio social.
        Recibirás una notificación cuando esté lista.
      </p>

      <div style={{
        marginTop: "1.5rem",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 999,
        background: "rgba(234,179,8,0.08)",
        border: "1px solid rgba(234,179,8,0.25)",
        fontSize: 12,
        fontWeight: 600,
        color: "#b45309",
      }}>
        ⏳ En espera de coordinación
      </div>
    </div>
  );
}

// ——— Vista: mensaje de la constancia disponible ————————————————
// CORRECCIÓN ARQUITECTÓNICA: ya no hay ningún archivo que descargar de
// nuestro sistema — coordinación redacta un mensaje de texto libre (con
// un enlace a una plataforma externa embebido). El mensaje ES el
// contenido principal de esta pantalla, no un botón de descarga.
function VistaMensaje({ mensaje, C }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 40, marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
          ¡Tu constancia está lista!
        </h2>
      </div>

      <div style={{
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
        padding: "1.5rem",
      }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Mensaje de coordinación
        </p>
        <TextoConEnlaces texto={mensaje} style={{ fontSize: 14, color: C.textPrimary, lineHeight: 1.6 }} />
      </div>
    </div>
  );
}

// ——— Página principal ——————————————————————————————————
export default function ConsultarConstanciaTermino() {
  const { C } = useTheme();
  const { usuario: sesion } = useSesion();
  const nombreAlumno = nombreCompletoSesion(sesion);
  const { cargando, estado, mensaje, error } = useConsultarConstanciaTermino();

  if (cargando) {
    return (
      <ProcesoLSSLayout pasoActual={6} titulo="Constancia de término" rol="alumno" usuario={nombreAlumno}>
        <p style={{ textAlign: "center", color: C.textMuted, fontSize: 13, paddingTop: "3rem" }}>Cargando...</p>
      </ProcesoLSSLayout>
    );
  }

  return (
    <ProcesoLSSLayout
      pasoActual={6}
      titulo="Constancia de término"
      rol="alumno"
      usuario={nombreAlumno}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Constancia de término de servicio social
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Aquí verás el mensaje de coordinación una vez que tu constancia esté lista.
        </p>

        {estado === "pendiente" && <VistaPendiente C={C} />}
        {estado === "disponible" && <VistaMensaje mensaje={mensaje} C={C} />}
        {error && <p style={{ marginTop: "1rem", fontSize: 12, color: C.danger, textAlign: "center" }}>{error}</p>}
      </div>
    </ProcesoLSSLayout>
  );
}
