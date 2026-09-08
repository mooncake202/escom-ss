import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { useEstadoSolicitud } from "@/features/gestion-registro/hooks/useEstadoSolicitud";
import { SolicitudRechazadaDefinitivamente } from "@/features/gestion-registro/components/SolicitudRechazadaDefinitivamente";
import { corregirExpediente, continuarAlumnoAsignado } from "@/services/estadoSolicitudService";

function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

export default function EsperaRevisionExpediente() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { estado, cargando, error } = useEstadoSolicitud();

  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "";
  const estadoSolicitud = estado?.estado_solicitud;

  if (cargando) return null;

  // Excepción E1
  if (error) {
    return (
      <ProcesoLayout pasoActual={6} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem", color: C.danger }}>
          {error}
        </div>
      </ProcesoLayout>
    );
  }

  // RN-GR-68 / RF-GR-106: si el plazo (Reloj 2) venció mientras el alumno
  // estaba en expediente_con_correcciones, el polling ya lo movió aquí —
  // no hace falta código nuevo, es el mismo componente compartido de siempre.
  if (estadoSolicitud === "rechazada_definitivamente") {
    return (
      <ProcesoLayout pasoActual={6} usuario={nombre}>
        <SolicitudRechazadaDefinitivamente motivoRechazo={estado.motivo_rechazo} />
      </ProcesoLayout>
    );
  }

  // ── Flujo A — RN-GR-65: corregir y reenviar ──
  if (estadoSolicitud === "expediente_con_correcciones") {
    const handleCorregir = async () => {
      setEnviando(true);
      setErrorAccion("");
      try {
        const resultado = await corregirExpediente();
        actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: "expediente_con_correcciones" });
        navigate("/alumnoSinAsignar/expediente");
      } catch (err) {
        setErrorAccion(err.message);
        setEnviando(false);
      }
    };

    return (
      <ProcesoLayout pasoActual={6} usuario={nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <div style={{
            padding: "14px 18px", borderRadius: RADIUS.md,
            background: C.dangerSoft, border: `1px solid ${C.danger}`,
            display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "2rem",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.danger }}>
                Tu expediente requiere correcciones
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                Coordinación revisó tu expediente y encontró observaciones. Corrígelo y vuelve a enviarlo antes de la fecha de inicio de tu servicio social.
              </p>
            </div>
          </div>

          <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Observaciones de Coordinación
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              {estado.motivo_rechazo || "No se especificó una observación."}
            </p>
          </div>

          {errorAccion && (
            <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{errorAccion}</p>
          )}

          <button
            onClick={handleCorregir}
            disabled={enviando}
            style={{
              width: "100%", padding: "12px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: enviando ? "wait" : "pointer",
              background: enviando ? C.borderDefault : GRADIENTS.primary,
              border: "none", color: "#fff", fontFamily: "inherit", boxShadow: enviando ? "none" : SHADOWS.accent,
            }}
          >
            {enviando ? "Procesando..." : "Corregir y volver a enviar →"}
          </button>
        </div>
      </ProcesoLayout>
    );
  }

  // ── Flujo B — RN-GR-66/67: aprobado, pasa a Alumno Asignado ──
  if (estadoSolicitud === "expediente_aprobado") {
    const handleContinuar = async () => {
      setEnviando(true);
      setErrorAccion("");
      try {
        const resultado = await continuarAlumnoAsignado();
        // El rol cambió de verdad — hay que reemplazar el JWT completo, no
        // solo el objeto cosmético de localStorage (ver nota en el backend).
        localStorage.setItem("token", resultado.token);
        actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: "expediente_aprobado", rol: "alumno_asignado" });
        navigate("/dashboard");
      } catch (err) {
        setErrorAccion(err.message);
        setEnviando(false);
      }
    };

    return (
      <ProcesoLayout pasoActual={6} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>🎓</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
            ¡Expediente aprobado!
          </h2>
          <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Coordinación validó tu expediente. Ya eres Alumno Asignado y estás registrado formalmente en el programa de servicio social.
          </p>

          {errorAccion && (
            <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{errorAccion}</p>
          )}

          <button
            onClick={handleContinuar}
            disabled={enviando}
            style={{
              padding: "12px 32px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: enviando ? "wait" : "pointer",
              background: enviando ? C.borderDefault : GRADIENTS.primary,
              border: "none", color: "#fff", fontFamily: "inherit", boxShadow: enviando ? "none" : SHADOWS.accent,
            }}
          >
            {enviando ? "Avanzando..." : "Continuar →"}
          </button>
        </div>
      </ProcesoLayout>
    );
  }

  // ── RF-GR-99 — expediente_pendiente_revision (estado por defecto) ──
  return (
    <ProcesoLayout pasoActual={6} usuario={nombre}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

        <div style={{ fontSize: 52, marginBottom: "1rem" }}>🕐</div>

        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Expediente en revisión
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Tu expediente fue enviado correctamente y está pendiente de revisión por parte de Coordinación.
          Esta pantalla se actualiza sola cada par de minutos.
        </p>

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          padding: "1.5rem", marginBottom: "1.5rem",
          textAlign: "left",
        }}>
          <p style={{
            margin: "0 0 1.25rem", fontSize: 12, fontWeight: 700,
            color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Estado actual
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: "1rem", alignItems: "flex-start" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: C.successSoft, border: `1px solid ${C.success}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            }}>
              ✓
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, paddingTop: 2 }}>
              Expediente integrado y enviado correctamente a Coordinación.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: C.accentSoft, border: `1px solid ${C.accent}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: C.accentText,
            }}>
              2
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, paddingTop: 2 }}>
              Coordinación revisará tu expediente. Una vez aprobado, pasarás a ser Alumno Asignado.
            </p>
          </div>

          <div style={{
            margin: "1.25rem 0 0", padding: "12px 14px",
            background: C.bgPage, borderRadius: RADIUS.md,
            border: `1px solid ${C.borderSubtle}`,
          }}>
            <p style={{
              margin: "0 0 4px", fontSize: 12, fontWeight: 700,
              color: C.warning ?? "#F59E0B", letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Recuerda
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
              Tu expediente debe quedar aprobado antes de la fecha de inicio de tu periodo de servicio social.
            </p>
          </div>
        </div>

      </div>
    </ProcesoLayout>
  );
}