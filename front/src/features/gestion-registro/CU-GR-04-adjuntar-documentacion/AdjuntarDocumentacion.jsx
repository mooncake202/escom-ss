import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout }            from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { DocumentoUploader }        from "./components/DocumentoUploader";
import { useAdjuntarDocumentacion } from "./hooks/useAdjuntarDocumentacion";
import { useEstadoSolicitud } from "@/features/gestion-registro/hooks/useEstadoSolicitud";
import { SolicitudRechazadaDefinitivamente } from "@/features/gestion-registro/components/SolicitudRechazadaDefinitivamente";

// Cuánto tiempo se ve el mensaje de confirmación (RF-GR-58) antes de
// redirigir automáticamente (RF-GR-60).
const DURACION_MENSAJE_MS = 1800;

export default function AdjuntarDocumentacion() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const { docs, errores, loading, errorEnvio, todosObligatorios, agregarDoc, quitarDoc, enviar } = useAdjuntarDocumentacion();
  const { estado, cargando, error } = useEstadoSolicitud();
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "";

  if (cargando) return null;

  if (error) {
    return (
      <ProcesoLayout pasoActual={3} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem", color: C.danger }}>
          {error}
        </div>
      </ProcesoLayout>
    );
  }

  // Por si el plazo de expediente venció mientras el alumno seguía en este paso.
  if (estado?.estado_solicitud === "rechazada_definitivamente") {
    return (
      <ProcesoLayout pasoActual={3} usuario={nombre}>
        <SolicitudRechazadaDefinitivamente motivoRechazo={estado.motivo_rechazo} />
      </ProcesoLayout>
    );
  }

  // RF-GR-58: mensaje de confirmación visible un instante.
  // RF-GR-60: luego redirige a la vista de espera de validación (CU-GR-06).
  if (mostrarConfirmacion) {
    return (
      <ProcesoLayout pasoActual={3} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>✅</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
            Documentación enviada
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Tu documentación fue enviada correctamente y será revisada por Coordinación.
          </p>
        </div>
      </ProcesoLayout>
    );
  }

  const handleEnviar = async () => {
    const exito = await enviar();
    if (exito) {
      setMostrarConfirmacion(true);
      setTimeout(() => {
        navigate("/alumnoSinAsignar/esperando_validacion_docs");
      }, DURACION_MENSAJE_MS);
    }
  };

  return (
    <ProcesoLayout pasoActual={3} usuario={nombre}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Título */}
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Adjuntar documentación inicial
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Sube los documentos requeridos para continuar con tu proceso de registro. Coordinación los revisará antes de avanzar al siguiente paso.
        </p>

        {/* Card de documentos */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          padding: "1.5rem", marginBottom: "1.5rem",
        }}>
          <p style={{ margin: "0 0 1.25rem", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Documentos requeridos
          </p>

          {/* Carta de créditos — RN-GR-28 */}
          <DocumentoUploader
            label="Carta de créditos"
            descripcion="Constancia que acredita el porcentaje de créditos aprobados. Debe estar vigente al semestre actual."
            obligatorio
            archivo={docs.cartaCreditos}
            error={errores.cartaCreditos}
            onAgregar={archivo => agregarDoc("cartaCreditos", archivo)}
            onQuitar={() => quitarDoc("cartaCreditos")}
            C={C}
          />

          {/* Seguro social — RN-GR-29 */}
          <DocumentoUploader
            label="Constancia de vigencia del seguro social"
            descripcion="Documento que acredita que cuentas con seguro social vigente para realizar el servicio social."
            obligatorio
            archivo={docs.seguroSocial}
            error={errores.seguroSocial}
            onAgregar={archivo => agregarDoc("seguroSocial", archivo)}
            onQuitar={() => quitarDoc("seguroSocial")}
            C={C}
          />

          <div style={{ padding: "12px 14px", background: C.bgInput, borderRadius: RADIUS.md, border: `1px solid ${C.borderSubtle}`, marginTop: "0.5rem" }}>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted, textAlign: "center" }}>
              🔗{" "}
              <a href="https://serviciosdigitales.imss.gob.mx/gestionAsegurados-web-externo/vigencia" target="_blank" rel="noopener noreferrer" style={{ color: C.accentText, fontWeight: 600 }}>
                Solicita tu constancia de seguro social aquí
              </a>
            </p>
          </div>
        </div>

        {/* Aviso */}
        <div style={{
          padding: "12px 14px", borderRadius: RADIUS.md, marginBottom: "1.5rem",
          background: "rgba(245,158,11,0.08)", border: `1px solid ${C.warning ?? "#F59E0B"}`,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: C.warning ?? "#F59E0B", lineHeight: 1.5 }}>
            Solo se aceptan archivos en formato PDF de máximo 1.5 MB. Asegúrate de que los documentos sean legibles y estén vigentes antes de enviarlos.
          </p>
        </div>

        {errorEnvio && (
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.danger }}>{errorEnvio}</p>
        )}

        {/* Botón enviar — RN-GR-32 */}
        <button
          onClick={handleEnviar}
          disabled={!todosObligatorios || loading}
          style={{
            width: "100%", padding: "12px",
            borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
            cursor: !todosObligatorios || loading ? "not-allowed" : "pointer",
            background: !todosObligatorios || loading ? C.borderDefault : GRADIENTS.primary,
            border: "none", color: "#fff", fontFamily: "inherit",
            boxShadow: !todosObligatorios || loading ? "none" : SHADOWS.accent,
            opacity: !todosObligatorios ? 0.5 : 1,
            transition: "background 0.2s",
          }}
        >
          {loading ? "Enviando documentos..." : "Enviar documentación →"}
        </button>

      </div>
    </ProcesoLayout>
  );
}