import { useState } from "react";
import { RADIUS } from "../../themes/colors";

// ── Wrapper de campo con label y hint ────────────────────────
export function Field({ label, hint, children, C }) {
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
      {hint && <p style={{ fontSize: 12, color: C.textDisabled, marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

// ── Input con foco ────────────────────────────────────────────
export function InputField({ C, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "11px 14px",
        background: C.bgInput,
        border: `1px solid ${focused ? C.borderFocus : C.borderDefault}`,
        borderRadius: RADIUS.md, color: C.textPrimary,
        fontSize: 14, outline: "none", boxSizing: "border-box",
        transition: "border-color 0.2s", fontFamily: "inherit",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ── Select con foco ───────────────────────────────────────────
export function SelectField({ children, C, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        width: "100%", padding: "11px 14px",
        background: C.bgInput,
        border: `1px solid ${focused ? C.borderFocus : C.borderDefault}`,
        borderRadius: RADIUS.md, color: C.textPrimary,
        fontSize: 14, outline: "none", boxSizing: "border-box",
        transition: "border-color 0.2s", fontFamily: "inherit",
        cursor: "pointer", appearance: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

// ── Mensaje de error inline ───────────────────────────────────
export function ErrorMsg({ field, errors, C }) {
  if (!errors[field]) return null;
  return <p style={{ color: C.danger, fontSize: 12, margin: "4px 0 0" }}>{errors[field]}</p>;
}
