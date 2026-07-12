import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTheme, GRADIENTS, RADIUS, SHADOWS } from "@/themes/colors";
import { DOCUMENTOS_PROCESO, ALUMNOS_EXPEDIENTE, getProgreso, getEtapaActual } from "./hooks/expedienteData";

// ── Helpers ──────────────────────────────────────────────────
function formatFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Icono SVG inline ─────────────────────────────────────────
function Icon({ d, size = 16, stroke, strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke || "currentColor"} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  check:   "M20 6 9 17l-5-5",
  clock:   "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-6v-4l2-2",
  x:       "M18 6 6 18M6 6l12 12",
  chevron: "M9 18l6-6-6-6",
  lock:    "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  file:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  warning: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  back:    "M19 12H5M12 19l-7-7 7-7",
};

// ── Config de estado visual ──────────────────────────────────
const ESTADO_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color: C => C.textDisabled,
    bg:    C => C.bgInput,
    border:C => C.borderDefault,
    icon:  ICONS.clock,
    iconColor: C => C.textDisabled,
  },
  enviado: {
    label: "En revisión",
    color: () => "#F59E0B",
    bg:    () => "rgba(245,158,11,0.10)",
    border:() => "rgba(245,158,11,0.25)",
    icon:  ICONS.clock,
    iconColor: () => "#F59E0B",
  },
  aprobado: {
    label: "Aprobado",
    color: () => "#22C55E",
    bg:    () => "rgba(34,197,94,0.10)",
    border:() => "rgba(34,197,94,0.25)",
    icon:  ICONS.check,
    iconColor: () => "#22C55E",
  },
  rechazado: {
    label: "Rechazado",
    color: () => "#EF4444",
    bg:    () => "rgba(239,68,68,0.10)",
    border:() => "rgba(239,68,68,0.25)",
    icon:  ICONS.x,
    iconColor: () => "#EF4444",
  },
};

// ── Barra de progreso del expediente ─────────────────────────
function BarraProgreso({ pct, completados, total, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "1rem 1.25rem",
      marginBottom: "1.25rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>
          Progreso del expediente
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? "#22C55E" : C.accentText }}>
          {completados} / {total} documentos aprobados
        </span>
      </div>
      <div style={{ height: 8, background: C.borderSubtle, borderRadius: 4 }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 4,
          background: pct === 100 ? "#22C55E" : GRADIENTS.progress,
          transition: "width 0.4s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 11, color: C.textDisabled }}>Inicio</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "#22C55E" : C.accentText }}>{pct}%</span>
        <span style={{ fontSize: 11, color: C.textDisabled }}>Término</span>
      </div>
    </div>
  );
}

// ── Tarjeta de documento ─────────────────────────────────────
function DocumentoCard({ def, docData, expandido, onToggle, C }) {
  const cfg = ESTADO_CONFIG[docData.estado] ?? ESTADO_CONFIG.pendiente;
  const esPendiente = docData.estado === "pendiente";

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden",
      border: `1px solid ${expandido ? C.borderFocus : cfg.border(C)}`,
      background: C.bgCard,
      transition: "border-color 0.15s, box-shadow 0.15s",
      boxShadow: expandido ? SHADOWS.sm : "none",
    }}>
      {/* Header de la tarjeta */}
      <div
        onClick={onToggle}
        style={{
          padding: "0.875rem 1.25rem",
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
          background: esPendiente ? "transparent" : cfg.bg(C),
          transition: "background 0.15s",
        }}
      >
        {/* Icono tipo doc */}
        <div style={{
          width: 36, height: 36, borderRadius: RADIUS.md, flexShrink: 0,
          background: esPendiente ? C.bgInput : cfg.bg(C),
          border: `1px solid ${cfg.border(C)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17,
          opacity: esPendiente ? 0.5 : 1,
        }}>
          {def.icono}
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
            {/* Etapa badge */}
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: RADIUS.full,
              background: C.accentSoft, color: C.accentText, fontWeight: 700,
              letterSpacing: "0.04em",
            }}>
              {def.etapa}
            </span>
            {/* Responsable badge */}
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: RADIUS.full,
              background: def.responsable === "coordinacion"
                ? "rgba(245,158,11,0.10)" : "rgba(10,102,194,0.10)",
              color: def.responsable === "coordinacion" ? "#F59E0B" : "#2E86DE",
              fontWeight: 600,
            }}>
              {def.responsable === "coordinacion" ? "Coordinación" : "Alumno"}
            </span>
          </div>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 600,
            color: esPendiente ? C.textMuted : C.textPrimary,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {def.nombre}
          </p>
          {docData.fechaModificacion && (
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
              {docData.estado === "aprobado" ? "Aprobado" : "Actualizado"} el {formatFecha(docData.fechaModificacion)}
            </p>
          )}
          {esPendiente && (
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>Sin documentar aún</p>
          )}
        </div>

        {/* Estado badge + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: RADIUS.full,
            background: cfg.bg(C),
            color: cfg.color(C),
            fontSize: 11, fontWeight: 700,
          }}>
            <Icon d={cfg.icon} size={11} stroke={cfg.iconColor(C)} strokeWidth={2.5} />
            {cfg.label}
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round"
            style={{ transform: expandido ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d={ICONS.chevron} />
          </svg>
        </div>
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div style={{
          padding: "1rem 1.25rem 1.25rem",
          borderTop: `1px solid ${C.borderSubtle}`,
          display: "flex", flexDirection: "column", gap: "0.875rem",
        }}>
          {/* Descripción */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Descripción
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              {def.descripcion}
            </p>
          </div>

          {/* Archivo */}
          {docData.nombreArchivo && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Archivo
              </p>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: RADIUS.md,
                background: C.bgInput, border: `1px solid ${C.borderDefault}`,
              }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <span style={{ fontSize: 13, color: C.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {docData.nombreArchivo}
                </span>
              </div>
            </div>
          )}

          {/* Comentario de rechazo */}
          {docData.estado === "rechazado" && docData.comentario && (
            <div style={{
              padding: "10px 14px", borderRadius: RADIUS.md,
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Motivo del rechazo
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
                {docData.comentario}
              </p>
            </div>
          )}

          {/* Estado "pendiente" — aviso */}
          {esPendiente && (
            <div style={{
              padding: "10px 14px", borderRadius: RADIUS.md,
              background: C.bgInput, border: `1px dashed ${C.borderDefault}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Icon d={ICONS.lock} size={14} stroke={C.textDisabled} />
              <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, lineHeight: 1.5 }}>
                Este documento aún no ha sido generado. Estará disponible cuando avances en el proceso.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel de documentos del alumno (vista compartida) ────────
export function PanelExpedienteAlumno({ alumno, C }) {
  const [expandido, setExpandido] = useState(null);
  const progreso = getProgreso(alumno.documentos);

  // Agrupar por etapa
  const etapas = ["Inicio", "Desarrollo", "Término"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Info del alumno */}
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`,
        padding: "1.25rem",
        display: "flex", alignItems: "flex-start", gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: GRADIENTS.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "#fff",
        }}>
          {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{alumno.nombre}</h2>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: C.textDisabled }}>{alumno.boleta} · {alumno.carrera}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Oferta", value: alumno.oferta },
              { label: "Empresa", value: alumno.empresa },
              { label: "Profesor", value: alumno.profesor },
            ].map(({ label, value }) => (
              <span key={label} style={{
                fontSize: 11, color: C.textMuted,
                background: C.bgInput, padding: "2px 8px",
                borderRadius: RADIUS.full, border: `1px solid ${C.borderDefault}`,
              }}>
                <strong style={{ color: C.textSecondary }}>{label}:</strong> {value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <BarraProgreso {...progreso} C={C} />

      {/* Lista de documentos por etapa */}
      {etapas.map(etapa => {
        const docsEtapa = DOCUMENTOS_PROCESO.filter(d => d.etapa === etapa);
        return (
          <div key={etapa}>
            <p style={{
              margin: "0 0 0.625rem",
              fontSize: 11, fontWeight: 700, color: C.textDisabled,
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {etapa}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {docsEtapa.map(def => (
                <DocumentoCard
                  key={def.key}
                  def={def}
                  docData={alumno.documentos[def.key]}
                  expandido={expandido === def.key}
                  onToggle={() => setExpandido(expandido === def.key ? null : def.key)}
                  C={C}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Vista alumno (standalone) ────────────────────────────────
export default function ExpedienteAlumno() {
  const { C } = useTheme();
  // En producción vendría del contexto de auth; aquí usamos el alumno id=1
  const alumno = ALUMNOS_EXPEDIENTE.find(a => a.id === 1);

  return (
    <DashboardLayout
      titulo="Mi expediente"
      subtitulo="CU-AL-03 · Alumno"
      rol="alumno"
      usuario="García López Juan Carlos"
    >
      <PanelExpedienteAlumno alumno={alumno} C={C} />
    </DashboardLayout>
  );
}
