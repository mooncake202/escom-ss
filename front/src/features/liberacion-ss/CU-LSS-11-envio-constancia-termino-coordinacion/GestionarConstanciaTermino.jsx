import { useEffect, useState } from "react";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGestionarConstanciaTermino } from "./hooks/useGestionarConstanciaTermino";
import { TextoConEnlaces } from "@/components/ui/TextoConEnlaces";

// ——— Badge de estado ————————————————————————————————
function EstadoBadge({ estado }) {
  const map = {
    solicitada: { label: "Solicitada", color: "#b45309", bg: "rgba(234,179,8,0.10)", border: "rgba(234,179,8,0.25)" },
    emitida:    { label: "Emitida",    color: "#15803d", bg: "rgba(21,128,61,0.10)", border: "rgba(21,128,61,0.25)" },
  };
  const s = map[estado] ?? map.solicitada;
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
      border: `1px solid ${s.border}`, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ——— Sidebar: lista de alumnos ————————————————————————
function ListaAlumnos({ alumnos, seleccionado, onSeleccionar, C }) {
  const [filtro, setFiltro] = useState("");
  const filtrados = alumnos.filter(a => a.nombre.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div style={{ width: 280, flexShrink: 0 }}>
      <p style={{ margin: "0 0 0.75rem", fontSize: 11, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Alumnos
      </p>
      <input
        placeholder="Buscar alumno..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        style={{
          width: "100%", marginBottom: "0.75rem", padding: "8px 12px",
          borderRadius: RADIUS.md, border: `1px solid ${C.borderDefault}`,
          background: C.bgInput, color: C.textPrimary, fontSize: 13,
          fontFamily: "inherit", boxSizing: "border-box", outline: "none",
        }}
      />
      <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, overflow: "hidden" }}>
        {filtrados.length === 0 && (
          <p style={{ padding: "1rem", fontSize: 13, color: C.textMuted, textAlign: "center" }}>Sin resultados</p>
        )}
        {filtrados.map((a, i) => {
          const esSel = seleccionado?.id === a.id;
          return (
            <div
              key={a.id}
              onClick={() => onSeleccionar(a)}
              style={{
                padding: "10px 14px", cursor: "pointer",
                borderBottom: i < filtrados.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
                background: esSel ? "rgba(59,130,246,0.08)" : "transparent",
                borderLeft: esSel ? `3px solid ${C.accentText}` : "3px solid transparent",
                transition: "background 0.15s", display: "flex",
                alignItems: "center", justifyContent: "space-between", gap: 8,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, fontWeight: esSel ? 600 : 400, color: esSel ? C.accentText : C.textPrimary, lineHeight: 1.3 }}>
                {a.nombre}
              </p>
              <EstadoBadge estado={a.estado} />
            </div>
          );
        })}
      </div>
      <p style={{ marginTop: "0.5rem", fontSize: 11, color: C.textDisabled, textAlign: "right" }}>
        {filtrados.length} alumno{filtrados.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

const textareaStyle = (C) => ({
  width: "100%", minHeight: 140, padding: "12px 14px", borderRadius: RADIUS.md,
  border: `1px solid ${C.borderDefault}`, background: C.bgInput, color: C.textPrimary,
  fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
  resize: "vertical", lineHeight: 1.5,
});

// ——— Contenido principal según estado ————————————————
function VistaGestion({ alumno, estadoAlumno, loading, error, onEnviar, C }) {
  const [texto, setTexto] = useState("");
  const [corrigiendo, setCorrigiendo] = useState(false);

  // Al cambiar de alumno (o al llegar uno ya emitido), resetea el
  // formulario — si ya existe un mensaje previo, pre-carga el textarea de
  // corrección con el texto actual para que coordinación pueda editarlo.
  useEffect(() => {
    setTexto("");
    setCorrigiendo(false);
  }, [alumno?.id]);

  if (!alumno) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: 300, background: C.bgCard,
        borderRadius: RADIUS.lg, border: `1px dashed ${C.borderDefault}`,
        padding: "3rem", textAlign: "center",
      }}>
        <p style={{ fontSize: 32, marginBottom: "1rem" }}>👈</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: "0.35rem" }}>Selecciona un alumno</p>
        <p style={{ fontSize: 13, color: C.textMuted }}>Elige un alumno de la lista para gestionar su constancia de término.</p>
      </div>
    );
  }

  if (estadoAlumno === "solicitada") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{
          padding: "10px 14px", borderRadius: RADIUS.md,
          background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)",
          fontSize: 12, color: "#b45309", lineHeight: 1.5,
        }}>
          ⏳ Pendiente de envío por coordinación
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
          Este alumno completó su servicio social y solicita su constancia de término.
          Escribe el mensaje que recibirá, incluyendo el enlace a la plataforma donde puede descargarla.
        </p>
        <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.25rem 1.5rem" }}>
          <p style={{ margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Mensaje para el alumno
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej: Tu constancia ya está lista. Descárgala en https://serviciosocialconstancias.ipn.mx usando tu boleta y CURP."
            style={textareaStyle(C)}
          />
          {error && <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.danger }}>{error}</p>}
        </div>
        <button
          onClick={() => onEnviar(texto)}
          disabled={!texto.trim() || loading}
          style={{
            width: "100%", padding: "12px", borderRadius: RADIUS.md,
            fontSize: 14, fontWeight: 600,
            cursor: !texto.trim() || loading ? "not-allowed" : "pointer",
            background: !texto.trim() || loading ? C.borderDefault : GRADIENTS.primary,
            border: "none", color: !texto.trim() || loading ? C.textDisabled : "#fff",
            fontFamily: "inherit", boxShadow: !texto.trim() || loading ? "none" : SHADOWS.accent,
            transition: "background 0.2s",
          }}
        >
          {loading ? "Enviando..." : "Enviar mensaje al alumno →"}
        </button>
      </div>
    );
  }

  if (estadoAlumno === "emitida") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Banner éxito */}
        <div style={{
          padding: "1.25rem 1.5rem", borderRadius: RADIUS.lg,
          background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.25)",
          display: "flex", alignItems: "flex-start", gap: "1rem",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "rgba(21,128,61,0.12)", border: "1px solid rgba(21,128,61,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>✔</div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>Mensaje enviado correctamente</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
              El alumno ya puede ver este mensaje desde su portal.
            </p>
          </div>
        </div>

        {/* Mensaje actual */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`, padding: "1rem 1.25rem",
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Mensaje actual
          </p>
          <TextoConEnlaces texto={alumno.mensajeActual} style={{ fontSize: 13, color: C.textPrimary }} />
        </div>

        {/* Botón corregir / zona de reenvío */}
        {!corrigiendo ? (
          <button
            onClick={() => { setTexto(alumno.mensajeActual || ""); setCorrigiendo(true); }}
            style={{
              width: "100%", padding: "12px", borderRadius: RADIUS.md,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textSecondary, fontFamily: "inherit",
            }}
          >
            Corregir mensaje
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              style={textareaStyle(C)}
            />
            {error && <p style={{ margin: 0, fontSize: 12, color: C.danger }}>{error}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setCorrigiendo(false); setTexto(""); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: RADIUS.md,
                  border: `1px solid ${C.borderDefault}`, background: "transparent",
                  color: C.textSecondary, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => { await onEnviar(texto); setCorrigiendo(false); }}
                disabled={!texto.trim() || loading}
                style={{
                  flex: 2, padding: "10px", borderRadius: RADIUS.md, border: "none",
                  background: texto.trim() && !loading ? GRADIENTS.primary : C.borderDefault,
                  color: texto.trim() && !loading ? "#fff" : C.textDisabled,
                  cursor: texto.trim() && !loading ? "pointer" : "not-allowed",
                  fontWeight: 600, fontFamily: "inherit",
                  boxShadow: texto.trim() && !loading ? SHADOWS.accent : "none",
                }}
              >
                {loading ? "Reenviando..." : "Volver a enviar →"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ——— Página principal ————————————————————————————————
export default function GestionarConstanciaTermino() {
  const { C } = useTheme();
  const {
    alumnos, alumnoSeleccionado, estadoAlumno,
    loading, error, seleccionarAlumno, enviarMensaje,
  } = useGestionarConstanciaTermino();

  return (
    <DashboardLayout titulo="Constancia de término" subtitulo="Vista de coordinación" rol="coordinacion" usuario="Coordinación">
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>

        <ListaAlumnos alumnos={alumnos} seleccionado={alumnoSeleccionado} onSeleccionar={seleccionarAlumno} C={C} />

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 680 }}>

            {alumnoSeleccionado && (
              <div style={{
                background: C.bgCard, borderRadius: RADIUS.lg,
                border: `1px solid ${C.borderSubtle}`, padding: "1rem 1.25rem",
                marginBottom: "1.5rem", display: "flex",
                alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ margin: "0 0 0.35rem", fontSize: 12, fontWeight: 700, color: C.accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Solicitud recibida
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600, color: C.textPrimary }}>{alumnoSeleccionado.nombre}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>Profesor: {alumnoSeleccionado.profesor}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>Proyecto: {alumnoSeleccionado.proyecto}</p>
                </div>
                <EstadoBadge estado={estadoAlumno} />
              </div>
            )}

            <VistaGestion
              alumno={alumnoSeleccionado}
              estadoAlumno={estadoAlumno}
              loading={loading}
              error={error}
              onEnviar={enviarMensaje}
              C={C}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
