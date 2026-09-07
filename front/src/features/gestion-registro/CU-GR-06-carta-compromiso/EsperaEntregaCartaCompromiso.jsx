import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { useEstadoSolicitud } from "@/features/gestion-registro/hooks/useEstadoSolicitud";
import { SolicitudRechazadaDefinitivamente } from "@/features/gestion-registro/components/SolicitudRechazadaDefinitivamente";
import { continuarAExpediente } from "@/services/estadoSolicitudService";

const URL_SISS = "https://serviciosocial.ipn.mx/";

function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

export default function EsperaEntregaCartaCompromiso() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { estado, cargando, error } = useEstadoSolicitud();

  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "";
  const estadoSolicitud = estado?.estado_solicitud;

  if (cargando) return null;

  if (error) {
    return (
      <ProcesoLayout pasoActual={4} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem", color: C.danger }}>
          {error}
        </div>
      </ProcesoLayout>
    );
  }

  if (estadoSolicitud === "rechazada_definitivamente") {
    return (
      <ProcesoLayout pasoActual={4} usuario={nombre}>
        <SolicitudRechazadaDefinitivamente motivoRechazo={estado.motivo_rechazo} />
      </ProcesoLayout>
    );
  }

  const handleContinuar = async () => {
    setEnviando(true);
    setErrorAccion("");
    try {
      const resultado = await continuarAExpediente();
      actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: "carta_compromiso_confirmada" });
      navigate("/alumnoSinAsignar/expediente");
    } catch (err) {
      setErrorAccion(err.message);
      setEnviando(false);
    }
  };

  // ── Flujo A — RN-GR-49: Coordinación ya confirmó la recepción ──
  if (estadoSolicitud === "carta_compromiso_confirmada") {
    return (
      <ProcesoLayout pasoActual={5} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>✅</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
            Entrega confirmada por Coordinación
          </h2>
          <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Coordinación registró la recepción de tu carta compromiso. Ya puedes continuar con la carga de tu expediente.
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
              border: "none", color: "#fff", fontFamily: "inherit",
              boxShadow: enviando ? "none" : SHADOWS.accent,
            }}
          >
            {enviando ? "Avanzando..." : "Continuar con mi expediente →"}
          </button>
        </div>
      </ProcesoLayout>
    );
  }

  // ── RN-GR-47/48 — espera_confirmacion_carta_compromiso ──
  return (
    <ProcesoLayout pasoActual={4} usuario={nombre}>
      <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

        <div style={{ fontSize: 52, marginBottom: "1rem" }}>🕐</div>

        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Esperando confirmación de entrega
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Una vez que entregues tu carta compromiso presencialmente y Coordinación registre la
          recepción, podrás continuar con la carga de tu expediente. Esta pantalla se actualiza
          sola cada par de minutos.
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
              Confirmaste que descargaste, imprimiste y firmaste tu carta compromiso.
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
              Entrega tu carta firmada presencialmente en las oficinas de Coordinación de ESCOM.
              Coordinación registrará la recepción en el sistema.
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
              El horario de atención de Coordinación es de lunes a viernes de 10:00 a 18:00 hrs.
            </p>
          </div>
        </div>

        {/* ── Instrucciones — repetidas aquí para que el alumno pueda
             repasarlas mientras espera, tal como estaban en CartaCompromiso.jsx.
             Solo se muestran en este estado de espera, no una vez confirmada
             la recepción (ya no le sirven de nada en ese punto). ── */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          padding: "1.5rem", marginBottom: "1.5rem",
          textAlign: "left",
        }}>
          <p style={{ margin: "0 0 1.25rem", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Pasos a seguir
          </p>

          {[
            { n: "1", texto: 'Accede a la plataforma SISS con el botón de abajo.' },
            { n: "2", texto: 'Busca la sección "Carta compromiso" dentro de tu trámite de servicio social.' },
            { n: "3", texto: 'Descarga el documento en formato PDF.' },
            { n: "4", texto: 'Imprímelo a color y fírmalo con tinta azul en las áreas de PRESTADOR.' },
            { n: "5", texto: 'Llévalo a firmar con tu profesor en AVAL DE ACEPTACIÓN E INICIO.' },
            { n: "6", texto: 'Entrega la carta firmada presencialmente en las oficinas de Coordinación de ESCOM.' },
          ].map(({ n, texto }) => (
            <div key={n} style={{ display: "flex", gap: 12, marginBottom: "0.875rem", alignItems: "flex-start" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: C.accentSoft, border: `1px solid ${C.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: C.accentText,
              }}>
                {n}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6, paddingTop: 2 }}>
                {texto}
              </p>
            </div>
          ))}

          <div style={{ margin: "1rem 0", padding: "12px 14px", background: C.bgPage, borderRadius: RADIUS.md, border: `1px solid ${C.borderSubtle}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: C.warning ?? "#F59E0B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Consideraciones importantes
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>La carta debe estar firmada antes de entregarla, sin firma no será aceptada.</li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>No modifiques el documento descargado del SISS.</li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>El horario de atención de Coordinación es de lunes a viernes de 10:00 a 18:00 hrs.</li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>También debes firmar en el costado de la hoja que dice NOTAS IMPORTANTES.</li>
            </ul>
          </div>

          <a
            href={URL_SISS}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              marginTop: "0.5rem", padding: "10px 20px",
              borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600,
              background: GRADIENTS.primary, color: "#fff",
              textDecoration: "none", boxShadow: SHADOWS.accent,
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            Ir a la plataforma SISS
          </a>
        </div>

      </div>
    </ProcesoLayout>
  );
}