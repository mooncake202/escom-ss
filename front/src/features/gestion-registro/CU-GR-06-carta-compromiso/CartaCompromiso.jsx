import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { useEstadoSolicitud } from "@/features/gestion-registro/hooks/useEstadoSolicitud";
import { SolicitudRechazadaDefinitivamente } from "@/features/gestion-registro/components/SolicitudRechazadaDefinitivamente";
import { confirmarCartaCompromiso } from "@/services/estadoSolicitudService";

const URL_SISS = "https://serviciosocial.ipn.mx/";

function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

export default function CartaCompromiso() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { estado, cargando, error } = useEstadoSolicitud();

  const [accedioSISS, setAccedioSISS] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "";

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

  // Por si el plazo de expediente venció mientras el alumno seguía en este paso.
  if (estado?.estado_solicitud === "rechazada_definitivamente") {
    return (
      <ProcesoLayout pasoActual={4} usuario={nombre}>
        <SolicitudRechazadaDefinitivamente motivoRechazo={estado.motivo_rechazo} />
      </ProcesoLayout>
    );
  }

  const handleConfirmar = async () => {
    if (!accedioSISS) return;
    setEnviando(true);
    setErrorAccion("");
    try {
      const resultado = await confirmarCartaCompromiso();
      // Sin esto, RutaProtegida rebota de vuelta aquí mismo.
      actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: "descargar_carta_compromiso" });
      navigate("/alumnoSinAsignar/esperando-validacion");
    } catch (err) {
      setErrorAccion(err.message);
      setEnviando(false);
    }
  };

  return (
    <ProcesoLayout pasoActual={4} usuario={nombre}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Notificación validación */}
        <div style={{
          padding: "14px 18px", borderRadius: RADIUS.md,
          background: C.successSoft, border: `1px solid ${C.success}`,
          display: "flex", alignItems: "flex-start", gap: 12,
          marginBottom: "2rem",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>✅</span>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.success }}>
              Documentación validada
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
              Coordinación revisó y aprobó tus documentos. Puedes continuar con el proceso.
            </p>
          </div>
        </div>

        {/* Título */}
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Carta compromiso SISS
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          Tu documentación inicial fue validada por Coordinación. Ahora debes obtener tu carta compromiso desde la plataforma SISS, imprimirla, firmarla y entregarla presencialmente.
        </p>

        {/* Instrucciones — RN-GR-44 */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          padding: "1.5rem", marginBottom: "1.5rem",
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

          {/* Aviso importante */}
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

          {/* Botón SISS — RN-GR-44 / RF-GR-76 */}
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

        {/* Checkbox confirmación — RN-GR-45, texto exacto de la ficha */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${accedioSISS ? C.accent : C.borderSubtle}`,
          padding: "1.25rem 1.5rem", marginBottom: "1.5rem",
          transition: "border-color 0.2s",
        }}>
          <label style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={accedioSISS}
              onChange={e => setAccedioSISS(e.target.checked)}
              style={{ marginTop: 2, accentColor: C.accent, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              Confirmo que descargué mi carta compromiso desde SISS, la imprimí y la firmé. Estoy listo para entregarla presencialmente a coordinación de extensión de apoyos educativos.
            </span>
          </label>
        </div>

        {!accedioSISS && (
          <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
            Marca la casilla para confirmar que tienes tu carta lista para entregar.
          </p>
        )}

        {errorAccion && (
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.danger }}>{errorAccion}</p>
        )}

        {/* Botón continuar — RN-GR-45/46/47 */}
        <button
          onClick={handleConfirmar}
          disabled={!accedioSISS || enviando}
          style={{
            width: "100%", padding: "12px",
            borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
            cursor: !accedioSISS || enviando ? "not-allowed" : "pointer",
            background: !accedioSISS || enviando ? C.borderDefault : GRADIENTS.primary,
            border: "none", color: "#fff", fontFamily: "inherit",
            boxShadow: !accedioSISS || enviando ? "none" : SHADOWS.accent,
            opacity: !accedioSISS ? 0.5 : 1,
            transition: "background 0.2s",
          }}
        >
          {enviando ? "Guardando..." : "Confirmar y continuar →"}
        </button>

      </div>
    </ProcesoLayout>
  );
}