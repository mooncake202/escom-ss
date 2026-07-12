import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTheme, GRADIENTS, RADIUS, SHADOWS } from "@/themes/colors";
import { ALUMNOS_EXPEDIENTE, DOCUMENTOS_PROCESO, getProgreso, getEtapaActual } from "./hooks/expedienteData";
import { PanelExpedienteAlumno } from "./ExpedienteAlumno";

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
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  chevron: "M9 18l6-6-6-6",
  back:    "M19 12H5M12 19l-7-7 7-7",
  check:   "M20 6 9 17l-5-5",
  clock:   "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-6v-4l2-2",
  x:       "M18 6 6 18M6 6l12 12",
  filter:  "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

// ── Mini barra de progreso ────────────────────────────────────
function MiniProgreso({ pct, C }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: C.borderSubtle, borderRadius: 2 }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 2,
          background: pct === 100 ? "#22C55E" : GRADIENTS.progress,
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: pct === 100 ? "#22C55E" : C.accentText, minWidth: 28 }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Item de alumno en la lista ────────────────────────────────
function AlumnoItem({ alumno, activo, onClick, C }) {
  const [hover, setHover] = useState(false);
  const { pct, completados, total } = getProgreso(alumno.documentos);
  const etapa = getEtapaActual(alumno.documentos);

  const etapaColor = {
    "Inicio":      { color: "#2E86DE", bg: "rgba(10,102,194,0.10)" },
    "Desarrollo":  { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
    "Término":     { color: "#A855F7", bg: "rgba(168,85,247,0.10)" },
    "Completado":  { color: "#22C55E", bg: "rgba(34,197,94,0.10)"  },
  }[etapa] ?? { color: C.textDisabled, bg: C.bgInput };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        padding: "10px 12px", borderRadius: RADIUS.md,
        background: activo
          ? "rgba(0,58,143,0.18)"
          : hover ? C.bgCardHover : "transparent",
        borderLeft: activo ? `3px solid #0A4DB5` : "3px solid transparent",
        transition: "all 0.15s",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: activo ? GRADIENTS.primary : C.bgInput,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700,
          color: activo ? "#fff" : C.textMuted,
        }}>
          {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 2 }}>
            <p style={{
              margin: 0, fontSize: 13, fontWeight: activo ? 600 : 500,
              color: activo ? C.accentText : C.textPrimary,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {alumno.nombre.split(" ").slice(0, 2).join(" ")}
            </p>
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: RADIUS.full,
              background: etapaColor.bg, color: etapaColor.color,
              fontWeight: 700, letterSpacing: "0.03em", flexShrink: 0,
            }}>
              {etapa}
            </span>
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: C.textDisabled }}>
            {alumno.boleta} · {alumno.carreraCorta}
          </p>
          <MiniProgreso pct={pct} C={C} />
        </div>
      </div>
    </button>
  );
}

// ── Vista principal coordinación ─────────────────────────────
export default function ExpedienteCoordinacion() {
  const { C } = useTheme();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("todos");
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const alumnosFiltrados = useMemo(() => {
    return ALUMNOS_EXPEDIENTE.filter(a => {
      const matchNombre =
        a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.boleta.includes(busqueda);
      const etapa = getEtapaActual(a.documentos);
      const matchEtapa =
        filtroEtapa === "todos" ||
        etapa.toLowerCase() === filtroEtapa.toLowerCase();
      return matchNombre && matchEtapa;
    });
  }, [busqueda, filtroEtapa]);

  // Métricas generales
  const metricas = useMemo(() => {
    const total = ALUMNOS_EXPEDIENTE.length;
    const completados = ALUMNOS_EXPEDIENTE.filter(a => getEtapaActual(a.documentos) === "Completado").length;
    const enDesarrollo = ALUMNOS_EXPEDIENTE.filter(a => ["Desarrollo", "Término"].includes(getEtapaActual(a.documentos))).length;
    const enInicio = ALUMNOS_EXPEDIENTE.filter(a => getEtapaActual(a.documentos) === "Inicio").length;
    return { total, completados, enDesarrollo, enInicio };
  }, []);

  const ETAPAS_FILTRO = [
    { key: "todos",      label: "Todos" },
    { key: "inicio",     label: "Inicio" },
    { key: "desarrollo", label: "Desarrollo" },
    { key: "término",    label: "Término" },
    { key: "completado", label: "Completados" },
  ];

  return (
    <DashboardLayout
      titulo="Expedientes de alumnos"
      subtitulo="CU-CO-13 · Coordinación"
      rol="coordinacion"
      usuario="Coord. María Esquivel"
    >
      {/* Métricas */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[
          { label: "Total alumnos",  value: metricas.total,        color: C.accentText,  bg: C.accentSoft },
          { label: "En inicio",      value: metricas.enInicio,     color: "#2E86DE",     bg: "rgba(10,102,194,0.10)" },
          { label: "En desarrollo",  value: metricas.enDesarrollo, color: "#F59E0B",     bg: "rgba(245,158,11,0.10)" },
          { label: "Completados",    value: metricas.completados,  color: "#22C55E",     bg: "rgba(34,197,94,0.10)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            flex: 1, minWidth: 120,
            padding: "10px 14px", borderRadius: RADIUS.lg,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: RADIUS.md,
              background: bg, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Layout 2 columnas */}
      <div style={{ display: "flex", gap: "1rem", height: "calc(100vh - 218px)", minHeight: 0 }}>

        {/* ── Columna izquierda ── */}
        <div style={{
          width: 300, flexShrink: 0,
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Búsqueda */}
          <div style={{ padding: "10px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.bgInput, borderRadius: RADIUS.md,
              border: `1px solid ${C.borderDefault}`,
              padding: "7px 10px",
            }}>
              <Icon d={ICONS.search} size={14} stroke={C.textDisabled} />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Nombre o boleta…"
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontSize: 13, color: C.textPrimary, outline: "none",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              />
            </div>

            {/* Filtro etapa */}
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {ETAPAS_FILTRO.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltroEtapa(key)}
                  style={{
                    padding: "3px 9px", borderRadius: RADIUS.full,
                    border: "none", cursor: "pointer",
                    fontSize: 11, fontWeight: filtroEtapa === key ? 700 : 500,
                    fontFamily: "inherit",
                    background: filtroEtapa === key ? C.accentSoft : "transparent",
                    color: filtroEtapa === key ? C.accentText : C.textMuted,
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
            {alumnosFiltrados.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: C.textDisabled, margin: 0 }}>Sin resultados</p>
              </div>
            ) : (
              alumnosFiltrados.map(alumno => (
                <AlumnoItem
                  key={alumno.id}
                  alumno={alumno}
                  activo={alumnoSeleccionado?.id === alumno.id}
                  onClick={() => setAlumnoSeleccionado(alumno)}
                  C={C}
                />
              ))
            )}
          </div>

          {/* Footer de lista */}
          <div style={{
            padding: "8px 12px",
            borderTop: `1px solid ${C.borderSubtle}`,
            fontSize: 11, color: C.textDisabled,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {alumnosFiltrados.length} alumno{alumnosFiltrados.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {alumnoSeleccionado ? (
            <div>
              {/* Breadcrumb */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: "1rem",
              }}>
                <button
                  onClick={() => setAlumnoSeleccionado(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 10px", borderRadius: RADIUS.md,
                    border: `1px solid ${C.borderDefault}`,
                    background: "transparent", color: C.textMuted,
                    fontSize: 12, fontWeight: 500, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bgCardHover; e.currentTarget.style.color = C.textPrimary; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
                >
                  <Icon d={ICONS.back} size={13} />
                  Alumnos
                </button>
                <span style={{ fontSize: 12, color: C.textDisabled }}>›</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>
                  {alumnoSeleccionado.nombre.split(" ").slice(0, 2).join(" ")}
                </span>
              </div>

              <PanelExpedienteAlumno alumno={alumnoSeleccionado} C={C} />
            </div>
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
                🗂️
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Selecciona un alumno
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontFamily: "'DM Sans', system-ui, sans-serif", textAlign: "center", maxWidth: 280 }}>
                Elige un alumno de la lista para revisar su expediente completo de servicio social.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
