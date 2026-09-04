import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { solicitarRecuperacion } from "@/services/passwordService";

// ── Tokens replicados de colors.js (modo oscuro = default) ────────
const BRAND = {
  blue900: "#001F5B", blue800: "#002F7A", blue700: "#003A8F",
  blue600: "#0A4DB5", blue500: "#0A66C2", blue400: "#2E86DE",
  blue300: "#6AAFF5", blue200: "#A8D0F7", blue100: "#D6EAFD", blue50: "#EDF5FF",
  gray950: "#0A0A0A", gray900: "#111111", gray850: "#161616",
  gray800: "#1C1C1C", gray750: "#242424", gray700: "#2E2E2E",
  gray600: "#cdcccc", gray500: "#555555", gray400: "#a1a0a0",
  gray300: "#9A9A9A", gray200: "#f4f4f4", gray100: "#DEDEDE", gray50: "#F4F4F4",
  white: "#FFFFFF",
  success: "#22C55E", successSoft: "rgba(34,197,94,0.12)",
  danger:  "#EF4444", dangerSoft:  "rgba(239,68,68,0.12)",
  warning: "#F59E0B", warningSoft: "rgba(245,158,11,0.12)",
};

const C = {
  bgPage:       BRAND.gray950,
  bgCard:       BRAND.gray900,
  bgInput:      BRAND.gray800,
  textPrimary:  BRAND.white,
  textSecondary:BRAND.gray200,
  textMuted:    BRAND.gray400,
  textDisabled: BRAND.gray600,
  borderSubtle: BRAND.gray800,
  borderDefault:BRAND.gray700,
  borderFocus:  BRAND.blue500,
  accentText:   BRAND.blue300,
  danger:       BRAND.danger,
  dangerSoft:   BRAND.dangerSoft,
  success:      BRAND.success,
  successSoft:  BRAND.successSoft,
  warning:      BRAND.warning,
  warningSoft:  BRAND.warningSoft,
};

const GRADIENTS = {
  primary: `linear-gradient(135deg, ${BRAND.blue900}, ${BRAND.blue500})`,
};

const SHADOWS = {
  xl:     "0 16px 64px rgba(0,0,0,0.5)",
  accent: "0 4px 20px rgba(0,58,143,0.35)",
};

const RADIUS = { sm:"6px", md:"8px", lg:"12px", xl:"16px", xxl:"24px" };

function InputField({ C, showToggle, ...props }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        {...props}
        type={props.type === "password" ? (visible ? "text" : "password") : props.type}
        style={{
          width: "100%", padding: "11px 14px",
          paddingRight: showToggle ? "60px" : "14px",
          background: C.bgInput,
          border: `1px solid ${focused ? C.borderFocus : C.borderDefault}`,
          borderRadius: RADIUS.md, color: C.textPrimary,
          fontSize: 14, outline: "none", boxSizing: "border-box",
          transition: "border-color 0.2s", fontFamily: "inherit",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: C.textDisabled, fontSize: 13, padding: 0, fontFamily: "inherit",
          }}
        >
          {visible ? "ocultar" : "ver"}
        </button>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{
        display: "block", fontSize: 13, fontWeight: 600,
        color: C.textMuted, letterSpacing: "0.06em",
        marginBottom: 6, textTransform: "uppercase",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bgPage,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{
            width: 42, height: 42, borderRadius: RADIUS.md,
            background: GRADIENTS.primary,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
              ESCOM — IPN
            </p>
            <h1 style={{ margin: 0, fontSize: 18, color: C.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>
              Sistema de Servicio Social
            </h1>
          </div>
        </div>

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderSubtle}`,
          padding: "2rem", boxShadow: SHADOWS.xl,
        }}>
          {children}
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 12, color: C.textDisabled }}>
          ESCOM — Sistema de Servicio Social Interno · IPN
        </p>
      </div>
    </div>
  );
}

function BtnPrimary({ children, onClick, disabled, loading, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "11px",
        borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
        cursor: loading || disabled ? "wait" : "pointer",
        background: loading || disabled ? C.borderDefault : GRADIENTS.primary,
        border: "none", color: "#fff", fontFamily: "inherit",
        boxShadow: loading || disabled ? "none" : SHADOWS.accent,
        transition: "opacity 0.2s",
      }}
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
// CU-CRED-02 — Paso 1-3: solicitar el enlace de restablecimiento
// ══════════════════════════════════════════════════════════════════
export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!correo.trim()) return setError("Ingresa tu correo institucional.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()))
      return setError("Ingresa un correo con formato válido.");

    setLoading(true);
    setError("");
    try {
      // El backend decide si el dominio/correo son válidos y si está
      // registrado (RF-CRED-09) — aquí solo checamos formato general.
      await solicitarRecuperacion(correo.trim());
      setEnviado(true);
    } catch (err) {
      // Cubre tanto el flujo alterno 2.1 (correo no registrado) como
      // cualquier error de conexión (Excepción E2).
      setError(err.message || "No se pudo procesar tu solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <Shell>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: BRAND.successSoft,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
          }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={BRAND.success} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>

          <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
            Revisa tu correo
          </h2>
          <p style={{ margin: "0 0 0.5rem", color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Si <span style={{ color: C.accentText, fontWeight: 600 }}>{correo}</span> está registrado,
            te enviamos un enlace de restablecimiento.
          </p>
          <p style={{ margin: "0 0 1.5rem", color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Revisa tu bandeja — el enlace es válido por <strong style={{ color: C.textSecondary }}>30 minutos</strong>.
          </p>

          <div style={{
            padding: "10px 14px", borderRadius: RADIUS.md, textAlign: "left",
            background: BRAND.warningSoft, border: `1px solid ${BRAND.warning}40`,
            marginBottom: "1.5rem",
          }}>
            <p style={{ margin: 0, fontSize: 13, color: BRAND.warning, lineHeight: 1.5 }}>
              Si no ves el correo en tu bandeja, revisa la carpeta de <strong>spam o correo no deseado</strong>.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: C.accentText, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
        ¿Olvidaste tu contraseña?
      </h2>
      <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
        Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={handleSubmit}>
        <Field label="Correo institucional">
          <InputField
            C={C}
            name="correo"
            type="email"
            placeholder="@alumno.ipn.mx"
            value={correo}
            onChange={e => { setCorreo(e.target.value); setError(""); }}
          />
        </Field>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: RADIUS.md,
            background: C.dangerSoft, border: `1px solid ${C.danger}`,
            color: C.danger, fontSize: 13, marginBottom: "1.25rem",
          }}>
            {error}
          </div>
        )}

        <BtnPrimary type="submit" loading={loading}>
          {loading ? "Verificando..." : "Enviar enlace de restablecimiento →"}
        </BtnPrimary>
      </form>

      <p style={{ margin: "1.25rem 0 0", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
        ¿Recuerdas tu contraseña?{" "}
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", color: C.accentText, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
        >
          Inicia sesión
        </button>
      </p>
    </Shell>
  );
}