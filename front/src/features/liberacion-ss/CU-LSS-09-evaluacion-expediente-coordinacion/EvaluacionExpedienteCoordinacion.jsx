import { useState } from "react";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEvaluacionExpedienteCoordinacion } from "./hooks/useEvaluacionExpedienteCoordinacion";

// ——— Badge de estado ————————————————————————————————
function EstadoBadge({ estado, C }) {
  const map = {
    en_revision: { label: "En revisión", color: "#b45309", bg: "rgba(234,179,8,0.10)",  border: "rgba(234,179,8,0.25)"  },
    aprobado:    { label: "Aprobado",    color: "#15803d", bg: "rgba(21,128,61,0.10)",  border: "rgba(21,128,61,0.25)"  },
    rechazado:   { label: "Rechazado",   color: "#dc2626", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)"  },
  };
  const s = map[estado] ?? map.en_revision;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 9px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ——— Sidebar: lista de alumnos ————————————————————————
function ListaAlumnos({ alumnos, seleccionado, onSeleccionar, C }) {
  const [filtro, setFiltro] = useState("");

  const filtrados = alumnos.filter(a =>
    a.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ width: 280, flexShrink: 0 }}>
      <p style={{
        margin: "0 0 0.75rem",
        fontSize: 11,
        fontWeight: 700,
        color: C.accentText,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Alumnos
      </p>

      <input
        placeholder="Buscar alumno..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "0.75rem",
          padding: "8px 12px",
          borderRadius: RADIUS.md,
          border: `1px solid ${C.borderDefault}`,
          background: C.bgInput,
          color: C.textPrimary,
          fontSize: 13,
          fontFamily: "inherit",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <div style={{
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
        overflow: "hidden",
      }}>
        {filtrados.length === 0 && (
          <p style={{ padding: "1rem", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            Sin resultados
          </p>
        )}

        {filtrados.map((a, i) => {
          const esSel = seleccionado?.id === a.id;
          return (
            <div
              key={a.id}
              onClick={() => onSeleccionar(a)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: i < filtrados.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
                background: esSel ? "rgba(59,130,246,0.08)" : "transparent",
                borderLeft: esSel ? `3px solid ${C.accentText}` : "3px solid transparent",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <p style={{
                margin: 0,
                fontSize: 13,
                fontWeight: esSel ? 600 : 400,
                color: esSel ? C.accentText : C.textPrimary,
                lineHeight: 1.3,
              }}>
                {a.nombre}
              </p>
              <EstadoBadge estado={a.estado} C={C} />
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

// ——— Documentos del expediente ————————————————————————
function ResumenDocumentos({ alumno, C }) {
  return (
    <div style={{
      background: C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderSubtle}`,
      padding: "1.25rem 1.5rem",
      marginBottom: "1.25rem",
    }}>
      <p style={{
        margin: "0 0 1rem",
        fontSize: 12,
        fontWeight: 700,
        color: C.accentText,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Documentos del expediente
      </p>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: RADIUS.md,
        background: C.bgInput,
        border: `1px solid ${C.borderSubtle}`,
      }}>
        <span style={{ fontSize: 16 }}>📄</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
            Expediente
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
            {alumno.expediente}
          </p>
        </div>
      </div>
    </div>
  );
}

// ——— Contenido principal según estado del alumno ————
function VistaEvaluacion({ alumno, estadoAlumno, observaciones, loading, onObservaciones, onAprobar, onRechazar, C }) {

  // Sin alumno seleccionado
  if (!alumno) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px dashed ${C.borderDefault}`,
        padding: "3rem",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 32, marginBottom: "1rem" }}>👈</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: "0.35rem" }}>
          Selecciona un alumno
        </p>
        <p style={{ fontSize: 13, color: C.textMuted }}>
          Elige un alumno de la lista para revisar su expediente y emitir una resolución.
        </p>
      </div>
    );
  }

  // Estado: en revisión → puede aprobar o rechazar
  if (estadoAlumno === "en_revision") {
    const puedeRechazar = observaciones.trim().length > 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <ResumenDocumentos alumno={alumno} C={C} />

        {/* Observaciones */}
        <div style={{
          background: C.bgCard,
          borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          padding: "1.25rem 1.5rem",
        }}>
          <p style={{
            margin: "0 0 0.75rem",
            fontSize: 12,
            fontWeight: 700,
            color: C.accentText,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Observaciones (requeridas para rechazar)
          </p>
          <textarea
            value={observaciones}
            onChange={e => onObservaciones(e.target.value)}
            placeholder="Describe las correcciones que debe realizar el alumno..."
            style={{
              width: "100%",
              height: 110,
              padding: "10px 12px",
              borderRadius: RADIUS.md,
              border: `1px solid ${C.borderDefault}`,
              background: C.bgInput,
              color: C.textPrimary,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Botones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <button
            onClick={onRechazar}
            disabled={!puedeRechazar || loading}
            style={{
              padding: "12px",
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              cursor: !puedeRechazar || loading ? "not-allowed" : "pointer",
              background: !puedeRechazar || loading ? C.borderDefault : "rgba(239,68,68,0.1)",
              border: `1px solid ${!puedeRechazar ? C.borderDefault : C.danger}`,
              color: !puedeRechazar ? C.textDisabled : C.danger,
              fontFamily: "inherit",
              opacity: !puedeRechazar ? 0.5 : 1,
            }}
          >
            {loading ? "..." : "✕ Rechazar"}
          </button>

          <button
            onClick={onAprobar}
            disabled={loading}
            style={{
              padding: "12px",
              borderRadius: RADIUS.md,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              background: loading ? C.borderDefault : GRADIENTS.primary,
              border: "none",
              color: "#fff",
              fontFamily: "inherit",
              boxShadow: loading ? "none" : SHADOWS.accent,
            }}
          >
            {loading ? "..." : "✔ Aprobar expediente"}
          </button>
        </div>
      </div>
    );
  }

  // Estado: aprobado
  if (estadoAlumno === "aprobado") {
    return (
      <div style={{
        padding: "1.25rem 1.5rem",
        borderRadius: RADIUS.lg,
        background: "rgba(21,128,61,0.06)",
        border: "1px solid rgba(21,128,61,0.25)",
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: "rgba(21,128,61,0.12)",
          border: "1px solid rgba(21,128,61,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          🎓
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>
            Expediente aprobado
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            El expediente fue aprobado correctamente. El alumno ha sido notificado.
          </p>
        </div>
      </div>
    );
  }

  // Estado: rechazado
  if (estadoAlumno === "rechazado") {
    return (
      <div style={{
        padding: "1.25rem 1.5rem",
        borderRadius: RADIUS.lg,
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.25)",
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          ⚠️
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
            Expediente rechazado
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
            El expediente fue rechazado. El alumno ha sido notificado y deberá corregir y reenviar.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ——— Página principal ————————————————————————————————
export default function EvaluacionExpedienteCoordinacion() {
  const { C } = useTheme();

  const {
    alumnos,
    alumnoSeleccionado,
    estadoAlumno,
    observaciones,
    loading,
    seleccionarAlumno,
    setObservaciones,
    aprobar,
    rechazar,
  } = useEvaluacionExpedienteCoordinacion();

  return (
    <DashboardLayout
      titulo="Evaluación de expediente"
      subtitulo="CU-LSS-09"
      rol="coordinacion"
      usuario="Coordinación"
    >
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>

        {/* SIDEBAR */}
        <ListaAlumnos
          alumnos={alumnos}
          seleccionado={alumnoSeleccionado}
          onSeleccionar={seleccionarAlumno}
          C={C}
        />

        {/* CONTENIDO */}
        <div style={{ 
        flex: 1,
        display: "flex",
        justifyContent: "center"
        }}>
          <div style={{
              width: "100%",
              maxWidth: 680
          }}>

          {/* Header alumno seleccionado */}
          {alumnoSeleccionado && (
            <div style={{
              background: C.bgCard,
              borderRadius: RADIUS.lg,
              border: `1px solid ${C.borderSubtle}`,
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <p style={{
                  margin: "0 0 0.35rem",
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.accentText,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Solicitud recibida
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600, color: C.textPrimary }}>
                  {alumnoSeleccionado.nombre}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Profesor: {alumnoSeleccionado.profesor}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Proyecto: {alumnoSeleccionado.proyecto}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Fecha de solicitud: {alumnoSeleccionado.fechaSolicitud}
                  </p>
                  {alumnoSeleccionado?.fechaEnvio != null &&(
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Fecha de envío: {alumnoSeleccionado.fechaEnvio}
                  </p>
                  )}
                  





              </div>
              <EstadoBadge estado={estadoAlumno} C={C} />
            </div>
          )}

          {/* Vista principal */}
          <VistaEvaluacion
            alumno={alumnoSeleccionado}
            estadoAlumno={estadoAlumno}
            observaciones={observaciones}
            loading={loading}
            onObservaciones={setObservaciones}
            onAprobar={aprobar}
            onRechazar={rechazar}
            C={C}
          />

        </div>
      </div>
      </div>

    </DashboardLayout>
  );
}
