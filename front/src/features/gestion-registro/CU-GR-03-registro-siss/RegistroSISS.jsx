import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout } from "./components/ProcesoLayout";
import { useEstadoSolicitud } from "@/features/gestion-registro/hooks/useEstadoSolicitud";
import { SolicitudRechazadaDefinitivamente } from "@/features/gestion-registro/components/SolicitudRechazadaDefinitivamente";
import { getInfoSISS, confirmarRegistroSISS } from "@/services/estadoSolicitudService";

// URL real de la plataforma SISS del IPN.
const URL_SISS = "https://serviciosocial.ipn.mx/";

function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

export default function RegistroSISS() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { estado, cargando, error } = useEstadoSolicitud();

  const [info, setInfo] = useState(null);
  const [cargandoInfo, setCargandoInfo] = useState(true);
  const [errorInfo, setErrorInfo] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "";

  const estadoSolicitud = estado?.estado_solicitud;

  // RF-GR-39/41: se cargan los datos personalizados en cuanto se confirma
  // que la solicitud sí está en el paso de registro_SISS.
  useEffect(() => {
    if (estadoSolicitud !== "registro_SISS") {
      setCargandoInfo(false);
      return;
    }
    getInfoSISS()
      .then(setInfo)
      .catch((err) => setErrorInfo(err.message))
      .finally(() => setCargandoInfo(false));
  }, [estadoSolicitud]);

  if (cargando) return null;

  if (error) {
    return (
      <ProcesoLayout pasoActual={2} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem", color: C.danger }}>
          {error}
        </div>
      </ProcesoLayout>
    );
  }

  if (estadoSolicitud === "rechazada_definitivamente") {
    return (
      <ProcesoLayout pasoActual={2} usuario={nombre}>
        <SolicitudRechazadaDefinitivamente motivoRechazo={estado.motivo_rechazo} />
      </ProcesoLayout>
    );
  }

  const handleConfirmar = async () => {
    if (!confirmado) return;
    setEnviando(true);
    setErrorAccion("");
    try {
      const resultado = await confirmarRegistroSISS();
      // Sin esto, RutaProtegida rebota de vuelta a esta misma pantalla.
      actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: "registro_SISS" });
      navigate("/alumnoSinAsignar/documentacion");
    } catch (err) {
      setErrorAccion(err.message);
      setEnviando(false);
    }
  };

  const fechaInicioFormateada = info?.fechaInicio
    ? new Date(info.fechaInicio).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })
    : "—";

  return (
    <ProcesoLayout pasoActual={2} usuario={nombre}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Notificación de aceptación */}
        <div style={{
          padding: "14px 18px", borderRadius: RADIUS.md,
          background: C.successSoft, border: `1px solid ${C.success}`,
          display: "flex", alignItems: "flex-start", gap: 12,
          marginBottom: "2rem",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🎉</span>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: C.success }}>
              ¡Tu solicitud fue aceptada!
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
              Ahora debes completar tu registro en la plataforma externa SISS.
            </p>
          </div>
        </div>

        {/* Título */}
        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Registro en SISS
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          El Sistema Institucional de Seguimiento del Servicio Social (SISS) del IPN requiere que realices tu registro antes de continuar con el proceso.
        </p>

        {/* Instrucciones */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          padding: "1.5rem", marginBottom: "1.5rem",
        }}>
          <p style={{ margin: "0 0 1rem", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Instrucciones
          </p>

          {[
            { n: "1", texto: "Haz clic en el botón de abajo para acceder a la plataforma SISS del IPN." },
            { n: "2", texto: "Realiza el prerregistro como alumno" },
            { n: "3", texto: 'Acepta el acuerdo de privacidad y selecciona "Tradicional" en los tipos de servicio' },
            { n: "4", texto: 'Completa el formulario con tus datos personales y los datos de registro del paso anterior \n (tu correo debe ser el institucional)' },
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

          {/* RN-GR-25: datos personalizados reales, ya no hardcodeados */}
          <div style={{ margin: "1rem 0", padding: "12px 14px", background: C.bgPage, borderRadius: RADIUS.md, border: `1px solid ${C.borderSubtle}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: C.warning ?? "#F59E0B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Consideraciones
            </p>
            {cargandoInfo ? (
              <p style={{ fontSize: 13, color: C.textMuted }}>Cargando tus datos...</p>
            ) : errorInfo ? (
              <p style={{ fontSize: 13, color: C.danger }}>{errorInfo}</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
                <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>Tu correo electrónico debe ser el institucional</li>
                <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>El porcentaje de créditos debe ser igual al de la constancia de créditos</li>
                <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>En prestatario debes seleccionar ESCOM</li>
                <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                  En programa debes elegir "<strong>{info?.programa || "—"}</strong>"
                </li>
                <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                  En actividad debes elegir "<strong>{info?.actividad || "—"}</strong>"
                </li>
                <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                  Tu fecha de inicio seleccionada es <strong>{fechaInicioFormateada}</strong>
                </li>
              </ul>
            )}
          </div>

          {[
            { n: "5", texto: "Asegúrate de ingresar los datos correctos, ya que se validarán en el siguiente paso." },
            { n: "6", texto: "Regresa a esta página y marca la casilla de confirmación para continuar." },
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

          {/* Botón SISS — RN-GR-23 */}
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

        {/* Checkbox de confirmación — RN-GR-26 */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${confirmado ? C.accent : C.borderSubtle}`,
          padding: "1.25rem 1.5rem", marginBottom: "1.5rem",
          transition: "border-color 0.2s",
        }}>
          <label style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={confirmado}
              onChange={e => setConfirmado(e.target.checked)}
              style={{ marginTop: 2, accentColor: C.accent, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              Confirmo que he completado mi registro en la plataforma SISS del IPN y que la información proporcionada es correcta.
            </span>
          </label>
        </div>

        {/* Aviso — Flujo Alterno 6.1 */}
        {!confirmado && (
          <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
            Debes marcar la casilla para confirmar que completaste el registro en SISS antes de continuar.
          </p>
        )}

        {errorAccion && (
          <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.danger }}>{errorAccion}</p>
        )}

        {/* Botón continuar */}
        <button
          onClick={handleConfirmar}
          disabled={!confirmado || enviando}
          style={{
            width: "100%", padding: "12px",
            borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
            cursor: !confirmado || enviando ? "not-allowed" : "pointer",
            background: !confirmado || enviando ? C.borderDefault : GRADIENTS.primary,
            border: "none", color: "#fff", fontFamily: "inherit",
            boxShadow: !confirmado || enviando ? "none" : SHADOWS.accent,
            transition: "background 0.2s",
            opacity: !confirmado ? 0.5 : 1,
          }}
        >
          {enviando ? "Guardando..." : "Confirmar y continuar →"}
        </button>

      </div>
    </ProcesoLayout>
  );
}