import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { ProcesoLSSLayout } from "../CU-LSS-01-Iniciar-proceso-evaluacion-desempeño/components/ProcesoLSSLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { useRevisionResolucion } from "./hooks/useRevisionResolucion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


const MOCK = {
  usuario: "Admin Coordinación",
  
};

// ——— Sub-componentes ————————————————————————————

function ResumenDocumentos({ C }) {
  const docs = [
    { label: "Expediente", nombre: "LAGARZA_ORTEGA_ANA_KAREN_2022630667.pdf" }
    
  ];

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

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {docs.map(doc => (
          <div key={doc.nombre} style={{
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
                {doc.label}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
                {doc.nombre}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Vista coordinación: revisar y resolver
function VistaCoordinacion({ estado, observaciones, loading, onObservaciones, onAprobar, onRechazar, C }) {
  if (estado !== "en_revision") return null;

  const puedeRechazar = observaciones.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <ResumenDocumentos C={C} />

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

// Vista resolución final: aprobado
function VistaAprobado({ rol, C }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>
      <div style={{ fontSize: 52, marginBottom: "1rem" }}>🎓</div>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.success }}>
        {rol === "coordinacion" ? "Expediente aprobado" : "¡Felicidades! Liberación aprobada"}
      </h2>
      <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
        {rol === "coordinacion"
          ? "El expediente fue aprobado correctamente. El alumno ha sido notificado."
          : "Tu expediente fue revisado y aprobado. Has completado exitosamente tu servicio social."}
      </p>
      {rol === "alumno" && (
        <button
          style={{
            padding: "12px 32px",
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            background: GRADIENTS.primary,
            border: "none",
            color: "#fff",
            fontFamily: "inherit",
            boxShadow: SHADOWS.accent,
          }}
        >
          Ir al inicio
        </button>
      )}
    </div>
  );
}

// Vista resolución final: rechazado
function VistaRechazado({ observacionesGuardadas, rol, C, navigate}) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: "2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: 52, marginBottom: "1rem" }}>⚠️</div>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, color: C.danger }}>
          Expediente rechazado
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          {rol === "alumno"
            ? "Tu expediente requiere correcciones. Revisa las observaciones y vuelve a enviarlo."
            : "El expediente fue rechazado. El alumno ha sido notificado."}
        </p>
      </div>

      {observacionesGuardadas && (
        <div style={{
          padding: "1.25rem",
          borderRadius: RADIUS.lg,
          background: "rgba(239,68,68,0.06)",
          border: `1px solid ${C.danger}`,
          marginBottom: "1.5rem",
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: 12, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Observaciones
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>
            {observacionesGuardadas}
          </p>
        </div>
      )}

      {rol === "alumno" && (
        <button
        onClick={() => navigate("/alumno/integracion-expediente")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            background: GRADIENTS.primary,
            border: "none",
            color: "#fff",
            fontFamily: "inherit",
            boxShadow: SHADOWS.accent,
            
          }}
        >
          
          Corregir y reenviar expediente →
        </button>
      )}
    </div>
  );
}

// Vista alumno: en revisión
function VistaAlumnoEnRevision({ C }) {
  return (
    <div style={{
      background: C.bgCard,
      borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderSubtle}`,
      padding: "2rem 1.5rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 44, marginBottom: "1rem" }}>🔍</div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
        Tu expediente está en revisión
      </h3>
      <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
        Coordinación está revisando los documentos de tu expediente.
        Recibirás una notificación cuando haya una resolución.
      </p>
    </div>
  );
}

// ——— Página principal ——————————————————————————————

export default function RevisionResolucion({ rol }) {
  const { C } = useTheme();
  const navigate = useNavigate();
  const {
    estado,
    observaciones,
    observacionesGuardadas,
    loading,
    setObservaciones,
    aprobar,
    rechazar,
  } = useRevisionResolucion();

  const Layout = rol === "alumno"
  ? ProcesoLSSLayout
  : DashboardLayout;

  // Pantallas de resolución final
  if (estado === "aprobado") {
    return (
      <Layout pasoActual={5} titulo="Revisión y resolución" subtitulo="CU-LSS-05" rol={rol} usuario={MOCK.usuario}>
        <VistaAprobado rol={rol} C={C} />
      </Layout>
    );
  }

  if (estado === "rechazado") {
    return (
      <Layout pasoActual={5} titulo="Revisión y resolución" subtitulo="CU-LSS-05" rol={rol} usuario={MOCK.usuario}>
        <VistaRechazado observacionesGuardadas={observacionesGuardadas} rol={rol} C={C} navigate={navigate} />
      </Layout>
    );
  }

  return (
    <Layout
      pasoActual={5}
      titulo="Revisión y resolución"
      subtitulo="CU-LSS-05"
      rol={rol}
      usuario={MOCK.usuario}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>

        <h2 style={{ margin: "0 0 0.35rem", fontSize: 22, fontWeight: 700, color: C.textPrimary }}>
          Revisión del expediente
        </h2>
        <p style={{ margin: "0 0 2rem", fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
          {rol === "coordinacion"
            ? "Revisa los documentos del expediente y emite una resolución. Si hay observaciones, el alumno deberá corregirlas."
            : "Tu expediente está siendo revisado por coordinación."}
        </p>

        {rol === "coordinacion" && (
          <VistaCoordinacion
            estado={estado}
            observaciones={observaciones}
            loading={loading}
            onObservaciones={setObservaciones}
            onAprobar={aprobar}
            onRechazar={rechazar}
            C={C}
          />
        )}

        {rol === "alumno" && <VistaAlumnoEnRevision C={C} />}

      </div>
    </Layout>
  );
}
