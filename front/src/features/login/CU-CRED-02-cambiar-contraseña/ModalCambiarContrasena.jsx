import { useState } from "react";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { cambiarContrasenaConActual } from "@/services/passwordService";

// RN-CRED-01, patrón B: cambio de contraseña desde sesión activa (sin
// correo ni token) — mismo criterio de validación en frontend que ya usa
// EstablecerContrasena.jsx (flujo de recuperación): misma regex de
// requisitos de seguridad para feedback inmediato, mismo mensaje genérico
// "Las contraseñas no coinciden." para la confirmación.
function passwordCumpleRequisitos(pass) {
  return pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass);
}

function CampoContrasena({ label, value, onChange, C, autoFocus }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, color: C.textMuted,
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          style={{
            width: "100%", padding: "10px 44px 10px 12px", boxSizing: "border-box",
            borderRadius: RADIUS.md, border: `1px solid ${C.borderDefault}`,
            background: C.bgInput, color: C.textPrimary, fontSize: 14,
            outline: "none", fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: C.textDisabled, fontSize: 12, fontFamily: "inherit",
          }}
        >
          {visible ? "ocultar" : "ver"}
        </button>
      </div>
    </div>
  );
}

function ChecklistRequisitos({ pass, C }) {
  if (!pass) return null;
  const checks = [
    { label: "8+ caracteres", ok: pass.length >= 8 },
    { label: "Mayúscula", ok: /[A-Z]/.test(pass) },
    { label: "Minúscula", ok: /[a-z]/.test(pass) },
    { label: "Número", ok: /[0-9]/.test(pass) },
    { label: "Carácter especial", ok: /[^A-Za-z0-9]/.test(pass) },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", marginTop: -6, marginBottom: "1rem" }}>
      {checks.map((c) => (
        <span key={c.label} style={{ fontSize: 11, color: c.ok ? C.success : C.textDisabled, display: "flex", alignItems: "center", gap: 3 }}>
          <span>{c.ok ? "✓" : "○"}</span>{c.label}
        </span>
      ))}
    </div>
  );
}

export function ModalCambiarContrasena({ onCerrar }) {
  const { C } = useTheme();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!actual || !nueva || !confirmar) {
      setError("Completa los 3 campos.");
      return;
    }
    if (!passwordCumpleRequisitos(nueva)) {
      setError("La contraseña no cumple los requisitos de seguridad.");
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await cambiarContrasenaConActual(actual, nueva);
      setExito(true);
    } catch (err) {
      setError(err.message || "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onCerrar}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10000, padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400, background: C.bgCard,
          borderRadius: RADIUS.xl, border: `1px solid ${C.borderDefault}`,
          boxShadow: SHADOWS.xl, padding: "1.5rem",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {exito ? (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", margin: "0 auto 1rem",
              background: C.successSoft, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 22 }}>✓</span>
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Contraseña actualizada
            </h3>
            <p style={{ margin: "0 0 1.25rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Tu contraseña se cambió correctamente. Puedes seguir usando el sistema con normalidad.
            </p>
            <button
              onClick={onCerrar}
              style={{
                width: "100%", padding: "10px", borderRadius: RADIUS.md, border: "none",
                background: GRADIENTS.primary, color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Cambiar contraseña
            </h3>
            <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textMuted }}>
              Escribe tu contraseña actual y la nueva que quieres usar.
            </p>

            <CampoContrasena label="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} C={C} autoFocus />
            <CampoContrasena label="Nueva contraseña" value={nueva} onChange={(e) => setNueva(e.target.value)} C={C} />
            <ChecklistRequisitos pass={nueva} C={C} />
            <CampoContrasena label="Confirmar nueva contraseña" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} C={C} />

            {error && (
              <div style={{
                padding: "10px 12px", borderRadius: RADIUS.md,
                background: C.dangerSoft, border: `1px solid ${C.danger}`,
                color: C.danger, fontSize: 12, marginBottom: "1rem",
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={onCerrar}
                disabled={loading}
                style={{
                  flex: 1, padding: "10px", borderRadius: RADIUS.md,
                  border: `1px solid ${C.borderDefault}`, background: "transparent",
                  color: C.textSecondary, fontSize: 13, fontWeight: 600,
                  cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2, padding: "10px", borderRadius: RADIUS.md, border: "none",
                  background: loading ? C.borderDefault : GRADIENTS.primary,
                  color: loading ? C.textDisabled : "#fff", fontSize: 13, fontWeight: 600,
                  cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
                  boxShadow: loading ? "none" : SHADOWS.accent,
                }}
              >
                {loading ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
