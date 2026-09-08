import { useState, useMemo, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTheme, GRADIENTS, RADIUS, SHADOWS } from "@/themes/colors";
import { DEPARTAMENTOS, ROLES, CUPOS_BASE } from "./hooks/profesoresData";
import { useSesion, nombreCompletoSesion } from "./hooks/useSesion";
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  reenviarCorreoBienvenida,
  listarCaracteristicas,
} from "@/services/usuariosService";

// ── Mapeos frontend (etiqueta) <-> backend (enum) ────────────
// La BD usa minúsculas ("profesor"/"coordinador") y identificadores de
// característica con guión bajo ("Presidente_de_academia"). El resto de este
// archivo sigue usando las etiquetas bonitas ("Profesor", "Presidente de
// academia") para no tener que reescribir todo el render — la conversión
// pasa solo por estas funciones.
const ROL_DB_A_ETIQUETA = { profesor: "Profesor", coordinador: "Coordinador" };
const ROL_ETIQUETA_A_DB = { Profesor: "profesor", Coordinador: "coordinador" };

function formatearCaracteristica(identificador) {
  return identificador.replace(/_/g, " ");
}

// ── Helpers ──────────────────────────────────────────────────
function iniciales(nombre, apellidos) {
  const partes = [nombre, apellidos].filter(Boolean).join(" ").split(" ");
  return partes
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function nombreCompleto(usuario) {
  return `${usuario.nombre} ${usuario.apellidos}`.trim();
}

// Preview de cupos mientras se llena el formulario (antes de guardar).
// `catalogo` es el array crudo que regresa GET /caracteristicas.
function calcularCuposPreview(seleccionadas = [], catalogo = []) {
  return (
    CUPOS_BASE +
    seleccionadas.reduce((sum, nombre) => {
      const c = catalogo.find((x) => x.nombre === nombre);
      return sum + (c ? c.incremento_cupos : 0);
    }, 0)
  );
}

// ── Icono SVG inline ─────────────────────────────────────────
function Icon({ d, size = 16, stroke, strokeWidth = 1.8 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke || "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  plus:     "M12 5v14M5 12h14",
  edit:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  save:     "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  x:        "M18 6 6 18M6 6l12 12",
  phone:    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.12 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  clock:    "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-6v-4l3-3",
  door:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  building: "M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  alert:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  check:    "M20 6 9 17l-5-5",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

// ── Badge de característica ──────────────────────────────────
const CARACTERISTICA_STYLES = {
  "Presidente de academia":         { bg: "rgba(10,77,181,0.12)",  color: "#0A4DB5" },
  "Coordinador":                    { bg: "rgba(124,58,237,0.12)", color: "#7C3AED" },
  "Jefe de departamento":           { bg: "rgba(245,158,11,0.12)", color: "#D97706" },
  "Funcionario":                    { bg: "rgba(239,68,68,0.12)",  color: "#DC2626" },
  "Profesor coordinador de clubes": { bg: "rgba(20,184,166,0.12)", color: "#0D9488" },
  "Investigador":                   { bg: "rgba(34,197,94,0.12)",  color: "#16A34A" },
};

const ROL_STYLES = {
  Profesor:     { bg: "rgba(10,77,181,0.10)",  color: "#0A4DB5" },
  Coordinador:  { bg: "rgba(124,58,237,0.10)", color: "#7C3AED" },
};

function CaracteristicaBadge({ value }) {
  if (!value) return null;
  const s = CARACTERISTICA_STYLES[value] || { bg: "rgba(100,100,100,0.12)", color: "#555" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      padding: "2px 9px", borderRadius: RADIUS.full,
      background: s.bg, color: s.color,
    }}>
      {value}
    </span>
  );
}

function RolBadge({ value }) {
  if (!value) return null;
  const s = ROL_STYLES[value] || { bg: "rgba(100,100,100,0.12)", color: "#555" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      padding: "2px 9px", borderRadius: RADIUS.full,
      background: s.bg, color: s.color,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <Icon d={ICONS.shield} size={10} stroke={s.color} strokeWidth={2.2} />
      {value}
    </span>
  );
}

// ── Campo de formulario ──────────────────────────────────────
function Campo({ label, required, error, children }) {
  return (
    <div>
      <p style={{
        margin: "0 0 4px", fontSize: 10, fontWeight: 700,
        color: error ? "#A32D2D" : "#888",
        textTransform: "uppercase", letterSpacing: "0.06em",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {label}{required && " *"}
      </p>
      {children}
      {error && (
        <p style={{
          margin: "4px 0 0", fontSize: 11, color: "#A32D2D",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputStyle = (C, hasError) => ({
  width: "100%", padding: "7px 10px", borderRadius: RADIUS.md,
  border: `1px solid ${hasError ? "#E24B4A" : C.borderDefault}`,
  background: C.bgInput, color: C.textPrimary,
  fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none", transition: "border 0.15s",
  boxSizing: "border-box",
});

const selectStyle = (C, hasError) => ({
  ...inputStyle(C, hasError),
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 28,
});

// ── Item de la lista ─────────────────────────────────────────
function UsuarioItem({ usuario, activo, onClick, C }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        padding: "10px 12px", borderRadius: RADIUS.md, marginBottom: 2,
        background: activo
          ? "rgba(0,58,143,0.20)"
          : hover ? C.bgCardHover : "transparent",
        borderLeft: activo ? `3px solid #0A4DB5` : "3px solid transparent",
        transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 10,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: activo ? GRADIENTS.primary : C.bgInput,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700,
        color: activo ? "#fff" : C.textMuted,
      }}>
        {iniciales(usuario.nombre, usuario.apellidos)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: activo ? 600 : 500,
          color: activo ? C.accentText : C.textPrimary,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {nombreCompleto(usuario)}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
          {usuario.rol === "Coordinador"
            ? "Coordinador"
            : (usuario.departamento || "Sin departamento").substring(0, 22)}
        </p>
      </div>

      <RolBadge value={usuario.rol} />
    </button>
  );
}

// ── Panel de detalle ─────────────────────────────────────────
function PanelDetalle({ usuario, onEditar, C }) {
  const esProfesor = usuario.rol === "Profesor";

  const campos = [
    ...(esProfesor ? [
      { icon: ICONS.building, label: "Departamento",        value: usuario.departamento },
    ] : []),
    { icon: ICONS.mail,      label: "Correo institucional", value: usuario.correo_institucional },
    ...(esProfesor ? [
      { icon: ICONS.phone,   label: "Teléfono",             value: usuario.telefono_personal },
      { icon: ICONS.clock,   label: "Horario de atención",  value: usuario.horario_atencion },
      { icon: ICONS.door,    label: "Cubículo",             value: usuario.cubiculo },
      { icon: ICONS.users,   label: "Cupos totales",        value: usuario.cupos_totales },
    ] : []),
    
  ];

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "1.25rem",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: "1rem" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: GRADIENTS.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "#fff",
        }}>
          {iniciales(usuario.nombre, usuario.apellidos)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            margin: "0 0 2px", fontSize: 15, fontWeight: 700,
            color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {nombreCompleto(usuario)}
          </h2>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textDisabled }}>
            {usuario.correo_institucional}
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <RolBadge value={usuario.rol} />
            {esProfesor && (usuario.caracteristicas ?? []).map((c) => (
              <CaracteristicaBadge key={c} value={formatearCaracteristica(c)} />
            ))}
          </div>
        </div>

        <button
          onClick={onEditar}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: RADIUS.md,
            border: `1px solid ${C.borderDefault}`,
            background: "transparent", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: C.textPrimary,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            transition: "background 0.15s",
          }}
        >
          <Icon d={ICONS.edit} size={13} /> Editar
        </button>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "0.75rem 1.5rem",
        paddingTop: "1rem",
        borderTop: `1px solid ${C.borderSubtle}`,
      }}>
        {campos.map(({ icon, label, value }) => (
          <div key={label}>
            <p style={{
              margin: "0 0 3px", fontSize: 10, fontWeight: 700,
              color: C.textDisabled, textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {label}
            </p>
            <p style={{
              margin: 0, fontSize: 13, color: C.textSecondary,
              display: "flex", alignItems: "center", gap: 5,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              <Icon d={icon} size={13} stroke={C.textDisabled} />
              {value ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pantalla de confirmación (flujo principal paso 6 + excepción E1) ──
function PantallaConfirmacion({ correo, falloCorreo, onReenviar, onCerrar, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "2rem",
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "1rem", textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: falloCorreo ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon
          d={falloCorreo ? ICONS.alert : ICONS.check}
          size={28}
          stroke={falloCorreo ? "#D97706" : "#16A34A"}
          strokeWidth={2}
        />
      </div>

      <div>
        <h3 style={{
          margin: "0 0 8px", fontSize: 15, fontWeight: 700,
          color: C.textPrimary,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {falloCorreo
            ? "Usuario creado con advertencia"
            : "Usuario creado correctamente"}
        </h3>

        {falloCorreo ? (
          <p style={{
            margin: 0, fontSize: 13, color: C.textMuted,
            fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 380,
          }}>
            El usuario fue creado, pero no se pudo enviar el correo de notificación a{" "}
            <strong>{correo}</strong>.
          </p>
        ) : (
          <p style={{
            margin: 0, fontSize: 13, color: C.textMuted,
            fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 380,
          }}>
            Se ha enviado un correo a <strong>{correo}</strong> para que establezca su contraseña.
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {falloCorreo && (
          <button
            onClick={onReenviar}
            style={{
              padding: "8px 18px", borderRadius: RADIUS.md,
              border: "none",
              background: "rgba(245,158,11,0.15)",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: "#D97706",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Icon d={ICONS.mail} size={14} stroke="#D97706" />
            Reenviar correo
          </button>
        )}
        <button
          onClick={onCerrar}
          style={{
            padding: "8px 20px", borderRadius: RADIUS.md,
            border: "none", background: GRADIENTS.primary,
            cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#fff",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

// ── Formulario de alta / edición ─────────────────────────────
// Alta (nuevo): nombre, apellidos, correo_institucional, rol, departamento (si Profesor)
// Edición: NOTA — todavía no hay endpoint de edición en el backend (fuera del
// alcance de CU-CRED-03). Por ahora la edición solo actualiza el estado local
// y NO persiste — ver aviso en el toast al guardar.
function FormularioUsuario({
  usuarioInicial,
  catalogoCaracteristicas,
  onGuardar,
  onCancelar,
  C,
}) {
  const esEditar = !!usuarioInicial;

  const [form, setForm] = useState({
    nombre:               usuarioInicial?.nombre               ?? "",
    apellidos:            usuarioInicial?.apellidos            ?? "",
    correo_institucional: usuarioInicial?.correo_institucional ?? "",
    rol:                  usuarioInicial?.rol                  ?? "",
    departamento:         usuarioInicial?.departamento         ?? "",
    telefono_personal:    usuarioInicial?.telefono_personal    ?? "",
    horario_atencion:     usuarioInicial?.horario_atencion     ?? "",
    cubiculo:             usuarioInicial?.cubiculo             ?? "",
    caracteristicas:      usuarioInicial?.caracteristicas      ?? [],
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrores((prev) => ({ ...prev, [field]: "" }));
  }

  const esProfesor = form.rol === "Profesor";

  function validar() {
    const e = {};

    const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ' -]{2,50}$/;
    const TELEFONO_REGEX = /^\d{10}$/;
    const CORREO_REGEX = /^[^\s@]+@ipn\.mx$/i;

    if (!form.nombre.trim())
      e.nombre = "El nombre es obligatorio.";
    else if (!NOMBRE_REGEX.test(form.nombre.trim()))
      e.nombre = "Solo letras y espacios.";

    if (!form.apellidos.trim())
      e.apellidos = "Los apellidos son obligatorios.";
    else if (!NOMBRE_REGEX.test(form.apellidos.trim()))
      e.apellidos = "Solo letras y espacios.";

    if (!form.correo_institucional.trim())
      e.correo_institucional = "El correo institucional es obligatorio.";
    else if (!CORREO_REGEX.test(form.correo_institucional.trim()))
    e.correo_institucional = "El correo debe terminar en @ipn.mx.";

    if (!form.rol)
      e.rol = "Debes seleccionar un rol.";

    if (form.rol === "Profesor" && !form.departamento) {
      e.departamento = "El departamento es obligatorio para profesores.";
    }

    if (form.telefono_personal && !TELEFONO_REGEX.test(form.telefono_personal)) {
      e.telefono_personal = "Debe tener exactamente 10 dígitos.";
    }

    return e;
  }

  async function handleGuardar() {
    const e = validar();
    if (Object.keys(e).length > 0) {
      setErrores(e);
      return;
    }

    setEnviando(true);
    try {
      await onGuardar(form);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("correo")) {
        setErrores((prev) => ({ ...prev, correo_institucional: err.message }));
      } else {
        setErrores((prev) => ({ ...prev, _general: err.message }));
      }
    } finally {
      setEnviando(false);
    }
  }

  const cuposPreview = calcularCuposPreview(form.caracteristicas, catalogoCaracteristicas);

  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`, padding: "1.25rem",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: "1.25rem", paddingBottom: "1rem",
        borderBottom: `1px solid ${C.borderSubtle}`,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: RADIUS.md,
          background: "rgba(10,77,181,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon d={ICONS.user} size={18} stroke="#0A4DB5" />
        </div>
        <div>
          <h3 style={{
            margin: 0, fontSize: 14, fontWeight: 700,
            color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {esEditar ? "Editar usuario" : "Crear usuario"}
          </h3>
          <p style={{
            margin: 0, fontSize: 11, color: C.textDisabled,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {esEditar
              ? `Editando: ${nombreCompleto(usuarioInicial)}`
              : "CU-CRED-03 · Solo Profesor o Coordinador"}
          </p>
        </div>
      </div>

      {errores._general && (
        <div style={{
          padding: "10px 14px", borderRadius: RADIUS.md,
          background: "rgba(226,75,74,0.10)", border: "1px solid #E24B4A",
          color: "#A32D2D", fontSize: 12, marginBottom: "1rem",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {errores._general}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>

        <Campo label="Nombre(s)" required error={errores.nombre}>
          <input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Ej. Luis"
            style={inputStyle(C, !!errores.nombre)}
          />
        </Campo>

        <Campo label="Apellidos" required error={errores.apellidos}>
          <input
            value={form.apellidos}
            onChange={(e) => set("apellidos", e.target.value)}
            placeholder="Ej. Ramírez Ortega"
            style={inputStyle(C, !!errores.apellidos)}
          />
        </Campo>

        <div style={{ gridColumn: "span 2" }}>
          <Campo label="Correo institucional" required error={errores.correo_institucional}>
            <input
              type="email"
              value={form.correo_institucional}
              onChange={(e) => set("correo_institucional", e.target.value)}
              placeholder="nombre@ipn.mx"
              style={inputStyle(C, !!errores.correo_institucional)}
            />
          </Campo>
        </div>

        <Campo label="Rol" required error={errores.rol}>
          <select
            value={form.rol}
            onChange={(e) => set("rol", e.target.value)}
            style={selectStyle(C, !!errores.rol)}
          >
            <option value="">Seleccionar…</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Campo>

        {esProfesor && (
          <Campo label="Departamento" required error={errores.departamento}>
            <select
              value={form.departamento}
              onChange={(e) => set("departamento", e.target.value)}
              style={selectStyle(C, !!errores.departamento)}
            >
              <option value="">Seleccionar…</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Campo>
        )}

        {esProfesor && (
          <>
            <Campo label="Teléfono personal">
              <input
                value={form.telefono_personal}
                onChange={(e) => set("telefono_personal", e.target.value)}
                placeholder="10 dígitos"
                maxLength={10}
                disabled={esEditar}
                style={inputStyle(C, false)}
              />
            </Campo>

            <Campo label="Cubículo">
              <input
                value={form.cubiculo}
                onChange={(e) => set("cubiculo", e.target.value)}
                placeholder="Ej. A-204"
                style={inputStyle(C, false)}
              />
            </Campo>

            <div style={{ gridColumn: "span 2" }}>
              <Campo label="Horario de atención">
                <input
                  value={form.horario_atencion}
                  onChange={(e) => set("horario_atencion", e.target.value)}
                  placeholder="Ej. Lunes a viernes 10:00–12:00"
                  disabled={esEditar}
                  style={inputStyle(C, false)}
                />
              </Campo>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <Campo label="Característica">
                <div style={{
                  border: `1px solid ${C.borderDefault}`,
                  borderRadius: RADIUS.md,
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "8px 12px",
                    background: "rgba(10,77,181,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderBottom: `1px solid ${C.borderSubtle}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: 4,
                        background: "#0A4DB5",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon d={ICONS.check} size={10} stroke="#fff" strokeWidth={3} />
                      </span>
                      <span style={{ fontSize: 13, color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                        Profesor de base
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "#0A4DB5", fontWeight: 700 }}>
                      +{CUPOS_BASE} cupos base
                    </span>
                  </div>

                  {catalogoCaracteristicas.map(({ nombre, incremento_cupos }) => {
                    const activa = form.caracteristicas.includes(nombre);
                    const label = formatearCaracteristica(nombre);
                    return (
                      <div
                        key={nombre}
                        onClick={() => {
                          const nuevas = activa
                            ? form.caracteristicas.filter((c) => c !== nombre)
                            : [...form.caracteristicas, nombre];
                          set("caracteristicas", nuevas);
                        }}
                        style={{
                          padding: "8px 12px", cursor: "pointer",
                          background: activa ? "rgba(10,77,181,0.05)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          borderBottom: `1px solid ${C.borderSubtle}`,
                          transition: "background 0.12s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                            border: `2px solid ${activa ? "#0A4DB5" : C.borderDefault}`,
                            background: activa ? "#0A4DB5" : "transparent",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.12s",
                          }}>
                            {activa && <Icon d={ICONS.check} size={10} stroke="#fff" strokeWidth={3} />}
                          </span>
                          <span style={{
                            fontSize: 13,
                            color: activa ? C.textPrimary : C.textMuted,
                            fontFamily: "'DM Sans', system-ui, sans-serif",
                          }}>
                            {label}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: incremento_cupos > 0 ? "#16A34A" : C.textDisabled,
                        }}>
                          {incremento_cupos > 0 ? `+${incremento_cupos} cupos` : "Sin cupos extra"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Campo>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <p style={{
                margin: 0, fontSize: 10, fontWeight: 700, color: "#888",
                textTransform: "uppercase", letterSpacing: "0.06em",
                fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 4,
              }}>
                Cupos totales (calculado)
              </p>
              <div style={{
                padding: "8px 12px", borderRadius: RADIUS.md,
                background: "rgba(34,197,94,0.08)",
                border: `1px solid rgba(34,197,94,0.25)`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{
                  fontSize: 13, color: C.textMuted,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}>
                  Base ({CUPOS_BASE}) + características seleccionadas
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#16A34A" }}>
                  {cuposPreview}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{
        display: "flex", gap: 10, marginTop: "1.25rem",
        paddingTop: "1rem", borderTop: `1px solid ${C.borderSubtle}`,
      }}>
        <button
          onClick={onCancelar}
          disabled={enviando}
          style={{
            padding: "8px 18px", borderRadius: RADIUS.md,
            border: `1px solid ${C.borderDefault}`,
            background: "transparent", cursor: enviando ? "wait" : "pointer",
            fontSize: 13, fontWeight: 600, color: C.textSecondary,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Cancelar
        </button>

        <button
          onClick={handleGuardar}
          disabled={enviando}
          style={{
            marginLeft: "auto",
            padding: "8px 20px", borderRadius: RADIUS.md,
            border: "none", background: GRADIENTS.primary,
            cursor: enviando ? "wait" : "pointer", fontSize: 13, fontWeight: 600, color: "#fff",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            display: "flex", alignItems: "center", gap: 6,
            opacity: enviando ? 0.7 : 1,
          }}
        >
          <Icon d={ICONS.save} size={14} stroke="#fff" />
          {enviando ? "Guardando…" : esEditar ? "Guardar cambios" : "Crear usuario"}
        </button>
      </div>
    </div>
  );
}

// ── Vista principal ──────────────────────────────────────────
export default function RegistroProfesores() {
  const { C } = useTheme();
  const { usuario: sesion } = useSesion();

  const [usuarios, setUsuarios] = useState([]);
  const [catalogoCaracteristicas, setCatalogoCaracteristicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const [seleccionado, setSeleccionado] = useState(null);
  const [modoFormulario, setModoFormulario] = useState(false); // "nuevo" | "editar" | false
  const [confirmacion, setConfirmacion] = useState(null); // { usuarioId, correo, falloCorreo }

  const [busqueda, setBusqueda] = useState("");
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setErrorCarga("");
      try {
        const [usuariosData, caracteristicasData] = await Promise.all([
          listarUsuarios(),
          listarCaracteristicas(),
        ]);
        setUsuarios(
          usuariosData.map((u) => ({ ...u, rol: ROL_DB_A_ETIQUETA[u.rol] ?? u.rol }))
        );
        setCatalogoCaracteristicas(caracteristicasData);
      } catch (err) {
        setErrorCarga(err.message || "No se pudieron cargar los usuarios.");
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const usuariosFiltrados = useMemo(() =>
    usuarios.filter((u) =>
      nombreCompleto(u).toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo_institucional.toLowerCase().includes(busqueda.toLowerCase())
    ), [usuarios, busqueda]);

  const stats = useMemo(() => ({
    total:        usuarios.length,
    profesores:   usuarios.filter((u) => u.rol === "Profesor").length,
    coordinadores: usuarios.filter((u) => u.rol === "Coordinador").length,
  }), [usuarios]);

  function mostrarToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleSeleccionar(usuario) {
    setSeleccionado(usuario);
    setModoFormulario(false);
    setConfirmacion(null);
  }

  function handleNuevo() {
    setSeleccionado(null);
    setModoFormulario("nuevo");
    setConfirmacion(null);
  }

  function handleEditar() {
    setModoFormulario("editar");
    setConfirmacion(null);
  }

  function handleCancelar() {
    setModoFormulario(false);
  }

  async function handleGuardar(formData) {
    if (modoFormulario === "editar" && seleccionado) {
      const payload = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        correo_institucional: formData.correo_institucional,
        ...(formData.rol === "Profesor"
          ? {
              departamento: formData.departamento,
              telefono_personal: formData.telefono_personal,
              horario_atencion: formData.horario_atencion,
              cubiculo: formData.cubiculo,
              caracteristicas: formData.caracteristicas,
            }
          : {}),
      };

      await actualizarUsuario(seleccionado.id, payload); // si truena, lo atrapa el formulario

      const usuariosActualizados = await listarUsuarios();
      const mapeados = usuariosActualizados.map((u) => ({
        ...u,
        rol: ROL_DB_A_ETIQUETA[u.rol] ?? u.rol,
      }));
      setUsuarios(mapeados);
      setSeleccionado(mapeados.find((u) => u.id === seleccionado.id) ?? null);
      mostrarToast("Usuario actualizado correctamente");
      setModoFormulario(false);
      return;
    }

    const payload = {
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      correo_institucional: formData.correo_institucional,
      rol: ROL_ETIQUETA_A_DB[formData.rol],
      ...(formData.rol === "Profesor"
        ? {
            departamento: formData.departamento,
            telefono_personal: formData.telefono_personal,
            horario_atencion: formData.horario_atencion,
            cubiculo: formData.cubiculo,
            caracteristicas: formData.caracteristicas,
          }
        : {}),
    };

    const resultado = await crearUsuario(payload);

    // La respuesta de creación solo trae los campos básicos (id, nombre,
    // apellidos, correo, rol) — no departamento/cupos/características.
    // Se refresca la lista completa para que el panel de detalle muestre
    // todo sin necesitar un reload manual de la página.
    const usuariosActualizados = await listarUsuarios();
    const mapeados = usuariosActualizados.map((u) => ({
      ...u,
      rol: ROL_DB_A_ETIQUETA[u.rol] ?? u.rol,
    }));
    setUsuarios(mapeados);
    setSeleccionado(mapeados.find((u) => u.id === resultado.usuario.id) ?? null);
    setModoFormulario(false);
    setConfirmacion({
      usuarioId: resultado.usuario.id,
      correo: resultado.usuario.correo_institucional,
      falloCorreo: !resultado.correoEnviado,
    });
  }

  async function handleReenviarCorreo() {
    try {
      await reenviarCorreoBienvenida(confirmacion.usuarioId);
      mostrarToast(`Correo reenviado a ${confirmacion.correo}`);
      setConfirmacion((prev) => ({ ...prev, falloCorreo: false }));
    } catch (err) {
      mostrarToast(err.message || "No se pudo reenviar el correo.");
    }
  }

  function handleCerrarConfirmacion() {
    setConfirmacion(null);
  }

  return (
    <DashboardLayout
      titulo="Gestión de Usuarios"
      subtitulo="CU-CRED-03 · FINALIZADO"
      rol={sesion?.rol || "coordinador"}
      usuario={nombreCompletoSesion(sesion)}
    >
      {errorCarga && (
        <div style={{
          padding: "10px 14px", borderRadius: RADIUS.md,
          background: "rgba(226,75,74,0.10)", border: "1px solid #E24B4A",
          color: "#A32D2D", fontSize: 13, marginBottom: "1rem",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {errorCarga}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
        {[
          {
            label: "Usuarios registrados",
            value: stats.total,
            color: C.accentText,
            bg: C.accentSoft,
          },
          {
            label: "Profesores",
            value: stats.profesores,
            color: "#22C55E",
            bg: "rgba(34,197,94,0.10)",
          },
          {
            label: "Coordinadores",
            value: stats.coordinadores,
            color: "#7C3AED",
            bg: "rgba(124,58,237,0.10)",
          },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            flex: 1, padding: "12px 16px", borderRadius: RADIUS.lg,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: RADIUS.md, background: bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
            </div>
            <p style={{
              margin: 0, fontSize: 12, color: C.textMuted,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", height: "calc(100vh - 220px)", minHeight: 0 }}>

        <div style={{
          width: 310, flexShrink: 0,
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "12px", borderBottom: `1px solid ${C.borderSubtle}` }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.bgInput, borderRadius: RADIUS.md,
              border: `1px solid ${C.borderDefault}`, padding: "7px 10px",
            }}>
              <Icon d={ICONS.search} size={14} stroke={C.textDisabled} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o correo…"
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontSize: 13, color: C.textPrimary, outline: "none",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {cargando ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: C.textDisabled, margin: 0 }}>Cargando…</p>
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: C.textDisabled, margin: 0 }}>Sin resultados</p>
              </div>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <UsuarioItem
                  key={usuario.id}
                  usuario={usuario}
                  activo={seleccionado?.id === usuario.id && !modoFormulario && !confirmacion}
                  onClick={() => handleSeleccionar(usuario)}
                  C={C}
                />
              ))
            )}
          </div>

          <div style={{ padding: "10px", borderTop: `1px solid ${C.borderSubtle}` }}>
            <button
              onClick={handleNuevo}
              style={{
                width: "100%", padding: "8px", borderRadius: RADIUS.md,
                border: `1.5px dashed ${C.borderDefault}`,
                background: "transparent", cursor: "pointer",
                color: "#0A4DB5", fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "background 0.15s",
              }}
            >
              <Icon d={ICONS.plus} size={15} stroke="#0A4DB5" />
              Crear usuario
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {confirmacion ? (
            <PantallaConfirmacion
              correo={confirmacion.correo}
              falloCorreo={confirmacion.falloCorreo}
              onReenviar={handleReenviarCorreo}
              onCerrar={handleCerrarConfirmacion}
              C={C}
            />
          ) : modoFormulario ? (
            <FormularioUsuario
              key={modoFormulario === "editar" ? `editar-${seleccionado?.id}` : "nuevo"}
              usuarioInicial={modoFormulario === "editar" ? seleccionado : null}
              catalogoCaracteristicas={catalogoCaracteristicas}
              onGuardar={handleGuardar}
              onCancelar={handleCancelar}
              C={C}
            />
          ) : seleccionado ? (
            <PanelDetalle
              key={seleccionado.id}
              usuario={seleccionado}
              onEditar={handleEditar}
              C={C}
            />
          ) : (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              background: C.bgCard, borderRadius: RADIUS.lg,
              border: `1px solid ${C.borderDefault}`,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: RADIUS.xl,
                background: C.accentSoft,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}>
                👤
              </div>
              <p style={{
                margin: 0, fontSize: 14, fontWeight: 600,
                color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                Selecciona un usuario
              </p>
              <p style={{
                margin: 0, fontSize: 12, color: C.textDisabled,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                Elige un usuario de la lista o crea uno nuevo.
              </p>
            </div>
          )}
        </div>
      </div>

      {toastMsg && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: "#1a1a2e", color: "#fff",
          padding: "10px 18px", borderRadius: RADIUS.lg,
          fontSize: 13, display: "flex", alignItems: "center", gap: 8,
          zIndex: 9999, boxShadow: SHADOWS.lg,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          <Icon d={ICONS.check} size={15} stroke="#22C55E" />
          {toastMsg}
        </div>
      )}

      <style>{`
        input:focus, select:focus {
          border-color: #0A4DB5 !important;
          box-shadow: 0 0 0 3px rgba(10,77,181,0.10);
        }
      `}</style>
    </DashboardLayout>
  );
}