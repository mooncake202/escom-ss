import { useNavigate } from "react-router-dom";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLayout }   from "./components/ProcesoLayout";
import { useRegistroSISS } from "./hooks/useRegistroSISS";

// URL real del SISS — cámbiala cuando la tengas
const URL_SISS = "https://serviciosocial.ipn.mx/";

// Datos mock del alumno y su solicitud aceptada
const MOCK_ALUMNO = {
  nombre:   "García López Juan Carlos",
  profesor: "Dr. Torres Vega",
  vacante:  "Desarrollo de plataforma web institucional",
};

export default function RegistroSISS() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const { confirmado, setConfirmado, loading, completado, confirmarRegistro } = useRegistroSISS();

  if (completado) {
    return (
      <ProcesoLayout pasoActual={3} usuario={MOCK_ALUMNO.nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>✅</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
            Registro en SISS confirmado
          </h2>
          <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            Ahora debes adjuntar tu documentación inicial. Prepara tu carta de créditos y constancia de vigencia del seguro social en formato PDF.
          </p>
          <button
            onClick={() => navigate("/alumnoSinAsignar/documentacion")}
            style={{
              padding: "12px 32px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              background: GRADIENTS.primary, border: "none",
              color: "#fff", fontFamily: "inherit",
              boxShadow: SHADOWS.accent,
            }}
          >
            Continuar al paso 3 →
          </button>
        </div>
      </ProcesoLayout>
    );
  }

  return (
    <ProcesoLayout pasoActual={2} usuario={MOCK_ALUMNO.nombre}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        {/* Notificación de aceptación — RN-GR-15 */}
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
              <strong>{MOCK_ALUMNO.profesor}</strong> aceptó tu solicitud para la vacante <strong>{MOCK_ALUMNO.vacante}</strong>. Ahora debes completar tu registro en la plataforma externa SISS.
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


          {/* Consideraciones */}
          <div style={{ margin: "1rem 0", padding: "12px 14px", background: C.bgPage, borderRadius: RADIUS.md, border: `1px solid ${C.borderSubtle}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: C.warning ?? "#F59E0B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Consideraciones
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>Tu correo electrónico debe ser el institucional</li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>El porcentaje de créditos debe ser igual al de la constancia de créditos</li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>En prestatario debes selccionar ESCOM</li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>En programa debes elegir "******"</li>
              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>En actividad debes elegir "******"</li>

              <li style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>Escogiste fecha de inicio *****</li>
              
            </ul>
          </div>  


          {[
            { n: "5", texto: "Asegurate de ingresar los datos correctos, ya que se se validarán en el siguiente paso." },
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


          

          {/* Botón SISS — RN-GR-18 */}
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

        {/* Checkbox de confirmación — RN-GR-19 */}
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

        {/* Aviso — RN-GR-19 */}
        {!confirmado && (
          <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
            Debes marcar la casilla para confirmar que completaste el registro en SISS antes de continuar.
          </p>
        )}

        {/* Botón continuar */}
        <button
          onClick={confirmarRegistro}
          disabled={!confirmado || loading}
          style={{
            width: "100%", padding: "12px",
            borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
            cursor: !confirmado || loading ? "not-allowed" : "pointer",
            background: !confirmado || loading ? C.borderDefault : GRADIENTS.primary,
            border: "none", color: "#fff", fontFamily: "inherit",
            boxShadow: !confirmado || loading ? "none" : SHADOWS.accent,
            transition: "background 0.2s",
            opacity: !confirmado ? 0.5 : 1,
          }}
        >
          {loading ? "Guardando..." : "Confirmar y continuar →"}
        </button>

      </div>
    </ProcesoLayout>
  );
}
