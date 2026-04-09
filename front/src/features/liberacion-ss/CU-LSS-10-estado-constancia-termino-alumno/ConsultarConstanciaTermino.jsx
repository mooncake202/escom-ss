import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";
import { useConsultarConstanciaTermino } from "./hooks/useConsultarConstanciaTermino";

const MOCK = {
  usuario: "Ana Karen Lagarza Ortega",
};

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
        Recibirás una notificación cuando esté lista para descargar.
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

// ——— Vista: constancia disponible ————————————————————
function VistaDisponible({ archivoConstancia, onDescargar, C }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", paddingTop: "0rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: 40, marginBottom: "1rem" }}>🎉</div>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
          ¡Tu constancia está lista!
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Coordinación ha emitido tu constancia de término de servicio social.
          Ya puedes descargarla.
        </p>
      </div>

      {/* Tarjeta del archivo */}
      <div style={{
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
        padding: "1.25rem 1.5rem",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: RADIUS.md,
          background: "rgba(37,99,235,0.10)",
          border: "1px solid rgba(37,99,235,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}>
          📄
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
            Constancia de término
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textDisabled, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {archivoConstancia?.nombre ?? "CONSTANCIA_TERMINO_SS.pdf"}
          </p>
        </div>
        <div style={{
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          color: "#15803d",
          background: "rgba(21,128,61,0.10)",
          border: "1px solid rgba(21,128,61,0.25)",
          whiteSpace: "nowrap",
        }}>
          Disponible
        </div>
      </div>

      <button
        onClick={onDescargar}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          background: GRADIENTS.primary,
          border: "none",
          color: "#fff",
          fontFamily: "inherit",
          boxShadow: SHADOWS.accent,
          marginBottom: "1.5rem",
        }}
      >
        ⬇ Descargar constancia de término
      </button>

      <p style={{ margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.6, marginBottom: "0.5rem" }}>
          Además se muestran aquí los otros documentos enviados por coordinación durante el proceso de liberación, para que puedas consultarlos cuando quieras.
        </p>
      
      <div style={{
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
        padding: "1.25rem 1.5rem",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: RADIUS.md,
          background: "rgba(37,99,235,0.10)",
          border: "1px solid rgba(37,99,235,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}>
          📄
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
            Evaluacion de Rendimiento
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textDisabled, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {archivoConstancia?.nombre ?? "Evaluacion_Rendimiento.pdf"}
          </p>
        </div>
        <div style={{
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          color: "#15803d",
          background: "rgba(21,128,61,0.10)",
          border: "1px solid rgba(21,128,61,0.25)",
          whiteSpace: "nowrap",
        }}>
          Disponible
        </div>
      </div>

      <button
        onClick={onDescargar}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: RADIUS.md,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          background: GRADIENTS.primary,
          border: "none",
          color: "#fff",
          fontFamily: "inherit",
          boxShadow: SHADOWS.accent,
          marginBottom: "1.5rem",
        }}
      >
        ⬇ Descargar 
      </button>
    </div>
  );
}

// ——— Página principal ——————————————————————————————————
export default function ConsultarConstanciaTermino() {
  const { C } = useTheme();
  const { estado, archivoConstancia, descargar } = useConsultarConstanciaTermino();

  return (
    <ProcesoLSSLayout
      pasoActual={6}
      titulo="Constancia de término"
      subtitulo="CU-LSS-09"
      rol="alumno"
      usuario={MOCK.usuario}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Constancia de término de servicio social
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Aquí podrás descargar tu constancia oficial una vez que coordinación la haya emitido.
        </p>

        {estado === "pendiente" && <VistaPendiente C={C} />}
        {estado === "disponible" && (
          <VistaDisponible
            archivoConstancia={archivoConstancia}
            onDescargar={descargar}
            C={C}
          />
        )}
      </div>
    </ProcesoLSSLayout>
  );
}
