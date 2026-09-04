import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postLogin } from "../../services/loginService";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "../../themes/colors";
 
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
          paddingRight: showToggle ? "42px" : "14px",
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
 
function Field({ label, children, C }) {
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
 
export default function LoginPage() {
  const { C } = useTheme();
  const navigate = useNavigate();
 
  const [form, setForm] = useState({ correoInst: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
 
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setError("");
  };
 
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.correoInst) return setError("Ingresa tu correo institucional");
    if (!form.password)   return setError("Ingresa tu contraseña");
 
    setLoading(true);
    try {
      const res = await postLogin(form);
      const { rol, estatus, tipoRechazo, estatusAnterior, registroSISSConfirmado, cartaCompromisoConfirmada, numDocumentos } = res.usuario;

      // Antes solo se guardaba "usuario" — el token nunca se persistía,
      // así que ninguna petición futura podía autenticarse.
      localStorage.setItem("token", res.token);
      localStorage.setItem("usuario", JSON.stringify(res.usuario));
      
      if (rol === "profesor") {
        navigate("/profesor/dashboard");
      } 
      
      else if (rol === "coordinador") {
      navigate("/coordinacion/dashboard");
      } 
      
      else if (rol === "alumno_asignado") {
        navigate("/alumno/dashboard");
      }


      else if (rol === "alumno_sin_asignar") {
        const estatusEfectivo =
        tipoRechazo && tipoRechazo !== "ninguno"
          ? estatusAnterior
          : estatus;

      if (estatusEfectivo === "espera_respuesta_de_profesor") {
        navigate("/alumnoSinAsignar/esperando_profesor");
      }
      
      
      else {
        console.log("estatus no manejado:", estatusEfectivo);
      }









      } 






      






    } catch (err) {
      setError(err.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div style={{
      minHeight: "100vh", background: C.bgPage,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
 
      <div style={{ width: "100%", maxWidth: 420 }}>
 
        {/* Header */}
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
 
        {/* Card */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderSubtle}`,
          padding: "2rem", boxShadow: SHADOWS.xl,
        }}>
          <h2 style={{ margin: "0 0 0.25rem", color: C.textPrimary, fontSize: 20, fontWeight: 700 }}>
            Iniciar sesión
          </h2>
          <p style={{ margin: "0 0 1.75rem", color: C.textMuted, fontSize: 13 }}>
            Ingresa con tu correo institucional del IPN
          </p>
 
          <form onSubmit={handleSubmit}>
            <Field label="Correo institucional" C={C}>
              <InputField
                C={C}
                name="correoInst"
                type="email"
                placeholder="@alumno.ipn.mx"
                value={form.correoInst}
                onChange={handleChange}
              />
            </Field>
 
            <Field label="Contraseña" C={C}>
              <InputField
                C={C}
                name="password"
                type="password"
                placeholder="Tu contraseña"
                value={form.password}
                onChange={handleChange}
                showToggle
              />
            </Field>
            <p style={{ margin: "1.25rem 0 0", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            
            <a
              href="/recuperar-contrasena"
              style={{ color: C.accentText, textDecoration: "none", fontWeight: 600 }}
            >
              ¿Olvidaste tu contraseña?{" "}
            </a>
          </p>
 
            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: RADIUS.md,
                background: C.dangerSoft, border: `1px solid ${C.danger}`,
                color: C.danger, fontSize: 13, marginBottom: "1.25rem",
              }}>
                {error}
              </div>
            )}
 
            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px",
                borderRadius: RADIUS.md, fontSize: 14, fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                background: loading ? C.borderDefault : GRADIENTS.primary,
                border: "none", color: "#fff", fontFamily: "inherit",
                boxShadow: loading ? "none" : SHADOWS.accent,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Verificando..." : "Entrar →"}
            </button>
          </form>
 
          {/* Enlace a registro */}
          <p style={{ margin: "1.25rem 0 0", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            ¿Aún no tienes cuenta?{" "}
            <a
              href="/registro"
              style={{ color: C.accentText, textDecoration: "none", fontWeight: 600 }}
            >
              Regístrate aquí
            </a>
          </p>
        </div>
 
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 12, color: C.textDisabled }}>
          ESCOM — Sistema de Servicio Social Interno · IPN
        </p>
      </div>
    </div>
  );
}