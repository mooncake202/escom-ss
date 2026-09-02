import { useState } from "react";

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

// ── InputField — igual que LoginPage ─────────────────────────────
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

// ── Field — igual que LoginPage ───────────────────────────────────
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

// ── Shell — misma estructura que LoginPage ───────────────────────
function Shell({ children }) {
  return (
    <div style={{
      minHeight: "100vh", background: C.bgPage,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Header — idéntico a LoginPage */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{
            width: 42, height: 42, borderRadius: RADIUS.md,
            background: GRADIENTS.primary,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
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

        {/* Card */}
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

// ── Botón principal — igual que LoginPage ────────────────────────
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

// ── Indicador de fortaleza ────────────────────────────────────────
function StrengthBar({ password }) {
  if (!password) return null;
  const checks = [
    { label: "8+ caracteres",   ok: password.length >= 8 },
    { label: "Mayúscula",       ok: /[A-Z]/.test(password) },
    { label: "Minúscula",       ok: /[a-z]/.test(password) },
    { label: "Número",          ok: /[0-9]/.test(password) },
    { label: "Carácter especial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const barColor = score <= 1 ? BRAND.danger : score <= 3 ? BRAND.warning : BRAND.success;
  const label    = ["", "Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"][score];

  return (
    <div style={{ marginTop: -12, marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= score ? barColor : C.borderDefault,
            transition: "background 0.3s",
          }}/>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px" }}>
          {checks.map(ch => (
            <span key={ch.label} style={{ fontSize: 11, color: ch.ok ? BRAND.success : C.textDisabled, display: "flex", alignItems: "center", gap: 3 }}>
              <span>{ch.ok ? "✓" : "○"}</span>{ch.label}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: barColor, whiteSpace: "nowrap", marginLeft: 8 }}>{label}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PASO 1 — Solicitar restablecimiento
// ══════════════════════════════════════════════════════════════════
function PasoSolicitar({ onEnviado, onVolverLogin }) {
  const [correo, setCorreo]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!correo) return setError("Ingresa tu correo institucional.");
    if (!correo.includes("@") || (!correo.endsWith(".ipn.mx")))
      return setError("Ingresa un correo válido del IPN, si cree que esto es un error y el correo no está registrado en el sistema, vaya al área de Servicio Social en la ESCOM”. No permite avanzar.");

    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 1100));
    setLoading(false);
    setEnviado(true);
  };

  // Estado: correo enviado / registrado
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
            El correo <span style={{ color: C.accentText, fontWeight: 600 }}>{correo}</span> está registrado en el sistema.
          </p>
          <p style={{ margin: "0 0 1.5rem", color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Te enviamos un enlace de restablecimiento. Revisa tu bandeja — el enlace es válido por <strong style={{ color: C.textSecondary }}>30 minutos</strong>.
          </p>

          {/* Aviso de spam */}
          <div style={{
            padding: "10px 14px", borderRadius: RADIUS.md, textAlign: "left",
            background: BRAND.warningSoft, border: `1px solid ${BRAND.warning}40`,
            marginBottom: "1.5rem",
          }}>
            <p style={{ margin: 0, fontSize: 13, color: BRAND.warning, lineHeight: 1.5 }}>
              Si no ves el correo en tu bandeja, revisa la carpeta de <strong>spam o correo no deseado</strong>.
            </p>
          </div>

          {/* Botones de demo — los 2 que pidió */}
          <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.textDisabled, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
            Simular enlace recibido
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.25rem" }}>
            <button
              onClick={() => onEnviado("valido")}
              style={{
                width: "100%", padding: "11px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
                background: GRADIENTS.primary, border: "none", color: "#fff",
                cursor: "pointer", fontFamily: "inherit", boxShadow: SHADOWS.accent,
              }}
            >
              Acceder al enlace válido →
            </button>
            <button
              onClick={() => onEnviado("invalido")}
              style={{
                width: "100%", padding: "11px", borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
                background: "none", border: `1px solid ${C.borderDefault}`, color: C.textMuted,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Enlace inválido / expirado
            </button>
          </div>

          <button
            onClick={onVolverLogin}
            style={{ background: "none", border: "none", color: C.accentText, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </Shell>
    );
  }

  // Estado inicial — formulario
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
          onClick={onVolverLogin}
          style={{ background: "none", border: "none", color: C.accentText, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
        >
          Inicia sesión
        </button>
      </p>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════
// PASO 2A — Nueva contraseña (enlace válido)
// ══════════════════════════════════════════════════════════════════
function PasoNuevaContrasena({ onExito }) {
  const [pass, setPass]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const passOk = pass.length>=8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass);

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!passOk)          errs.pass    = "La contraseña no cumple los requisitos de seguridad.";
    if (pass !== confirm) errs.confirm = "Las contraseñas no coinciden.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onExito();
  };

  return (
    <Shell>
      <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
        Crea tu nueva contraseña
      </h2>
      <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
        Elige una contraseña segura. Una vez actualizada podrás iniciar sesión con ella.
      </p>

      <form onSubmit={handleSubmit}>
        <Field label="Nueva contraseña">
          <InputField
            C={C}
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={pass}
            onChange={e => { setPass(e.target.value); setErrors(p => ({ ...p, pass: null })); }}
            showToggle
          />
        </Field>

        <StrengthBar password={pass} />

        {errors.pass && (
          <div style={{
            padding: "10px 14px", borderRadius: RADIUS.md,
            background: C.dangerSoft, border: `1px solid ${C.danger}`,
            color: C.danger, fontSize: 13, marginBottom: "1.25rem", marginTop: -8,
          }}>
            {errors.pass}
          </div>
        )}

        <Field label="Confirmar nueva contraseña">
          <InputField
            C={C}
            name="confirm"
            type="password"
            placeholder="Repite tu nueva contraseña"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: null })); }}
            showToggle
          />
        </Field>

        {errors.confirm && (
          <div style={{
            padding: "10px 14px", borderRadius: RADIUS.md,
            background: C.dangerSoft, border: `1px solid ${C.danger}`,
            color: C.danger, fontSize: 13, marginBottom: "1.25rem", marginTop: -8,
          }}>
            {errors.confirm}
          </div>
        )}

        <BtnPrimary type="submit" loading={loading} disabled={!pass || !confirm}>
          {loading ? "Actualizando contraseña..." : "Actualizar contraseña →"}
        </BtnPrimary>
      </form>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════
// PASO 2B — Enlace inválido / expirado (flujo alterno 5.1)
// ══════════════════════════════════════════════════════════════════
function PasoEnlaceInvalido({ onSolicitarNuevo }) {
  const [loading, setLoading] = useState(false);
  const [solicitado, setSolicitado] = useState(false);

  const handleSolicitar = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSolicitado(true);
  };

  return (
    <Shell>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: C.dangerSoft,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
        }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={C.danger} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>

        <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
          Enlace no válido
        </h2>
        <p style={{ margin: "0 0 1.5rem", color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
          El enlace de restablecimiento ha <strong style={{ color: C.textSecondary }}>expirado</strong> o ya fue utilizado. Los enlaces son válidos por 30 minutos y son de un solo uso.
        </p>

        {solicitado ? (
          <div style={{
            padding: "10px 14px", borderRadius: RADIUS.md,
            background: BRAND.successSoft, border: `1px solid ${BRAND.success}40`,
            color: BRAND.success, fontSize: 13, marginBottom: "1.25rem", textAlign: "left",
          }}>
            Nuevo enlace enviado. Revisa tu correo institucional.
          </div>
        ) : (
          <BtnPrimary onClick={handleSolicitar} loading={loading}>
            {loading ? "Enviando..." : "Solicitar nuevo enlace →"}
          </BtnPrimary>
        )}

        <p style={{ margin: "1.25rem 0 0", fontSize: 13, color: C.textMuted }}>
          <button
            onClick={onSolicitarNuevo}
            style={{ background: "none", border: "none", color: C.accentText, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
          >
            ← Volver al inicio de sesión
          </button>
        </p>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════
// PASO 3 — Contraseña actualizada con éxito
// ══════════════════════════════════════════════════════════════════
function PasoExito({ onLogin }) {
  return (
    <Shell>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: BRAND.successSoft,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
        }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={BRAND.success} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
          ¡Contraseña actualizada!
        </h2>
        <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
          Tu contraseña fue actualizada correctamente. Inicia sesión con tu nueva contraseña.
        </p>

        <BtnPrimary onClick={onLogin}>
          Ir al inicio de sesión →
        </BtnPrimary>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════════════
// VISTA DE LOGIN simulada (destino final)
// ══════════════════════════════════════════════════════════════════
function LoginSimulado({ onRecuperar }) {
  const [form, setForm] = useState({ correoInst: "", password: "" });
  const [error] = useState("");

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
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>ESCOM — IPN</p>
            <h1 style={{ margin: 0, fontSize: 18, color: C.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>Sistema de Servicio Social</h1>
          </div>
        </div>

        <div style={{ background: C.bgCard, borderRadius: RADIUS.xl, border: `1px solid ${C.borderSubtle}`, padding: "2rem", boxShadow: SHADOWS.xl }}>
          <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>Iniciar sesión</h2>
          <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13 }}>Ingresa con tu correo institucional del IPN</p>

          <Field label="Correo institucional">
            <InputField C={C} name="correoInst" type="email" placeholder="@alumno.ipn.mx" value={form.correoInst} onChange={e => setForm(p => ({ ...p, correoInst: e.target.value }))} />
          </Field>
          <Field label="Contraseña">
            <InputField C={C} name="password" type="password" placeholder="Tu contraseña" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} showToggle />
          </Field>

          <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.textMuted, textAlign: "right" }}>
            <button onClick={onRecuperar} style={{ background: "none", border: "none", color: C.accentText, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              ¿Olvidaste tu contraseña?
            </button>
          </p>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: RADIUS.md, background: C.dangerSoft, border: `1px solid ${C.danger}`, color: C.danger, fontSize: 13, marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <BtnPrimary>Entrar →</BtnPrimary>

          <p style={{ margin: "1.25rem 0 0", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            ¿Aún no tienes cuenta?{" "}
            <span style={{ color: C.accentText, fontWeight: 600, cursor: "pointer" }}>Regístrate aquí</span>
          </p>
        </div>
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 12, color: C.textDisabled }}>ESCOM — Sistema de Servicio Social Interno · IPN</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// NAVEGADOR PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function RecuperarContrasena() {
  const [paso, setPaso] = useState("solicitar");

  if (paso === "login")          return <LoginSimulado onRecuperar={() => setPaso("solicitar")} />;
  if (paso === "solicitar")      return <PasoSolicitar onEnviado={tipo => setPaso(tipo === "valido" ? "nueva" : "invalido")} onVolverLogin={() => setPaso("login")} />;
  if (paso === "nueva")          return <PasoNuevaContrasena onExito={() => setPaso("exito")} />;
  if (paso === "invalido")       return <PasoEnlaceInvalido onSolicitarNuevo={() => setPaso("login")} />;
  if (paso === "exito")          return <PasoExito onLogin={() => setPaso("login")} />;
}
