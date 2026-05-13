import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTheme, GRADIENTS, RADIUS } from "@/themes/colors";

// ── Datos en duro ─────────────────────────────────────────────
const INCIDENCIAS = [
  {
    id: 1,
    alumno: { nombre: "García López Juan Carlos", boleta: "2021630412", carreraCorta: "ISC", oferta: "Sistema Web para Control Escolar", profesor: "Dr. Torres Vega" },
    tipo: "5_seguidas",
    faltasSeguidas: 5,
    faltasAcumuladas: 7,
    fechaGeneracion: "2026-03-15T09:00:00",
    estado: "pendiente",
    resolucion: null,
  },
  {
    id: 2,
    alumno: { nombre: "Ramírez Torres Ana Sofía", boleta: "2022630187", carreraCorta: "IA", oferta: "Modelo Predictivo con ML", profesor: "Dr. Torres Vega" },
    tipo: "18_acumuladas",
    faltasSeguidas: 2,
    faltasAcumuladas: 18,
    fechaGeneracion: "2026-03-20T11:30:00",
    estado: "pendiente",
    resolucion: null,
  },
  {
    id: 3,
    alumno: { nombre: "Mendoza Vargas Luis Alberto", boleta: "2020630098", carreraCorta: "ISC", oferta: "App móvil para logística", profesor: "Dra. Ruiz Méndez" },
    tipo: "5_seguidas",
    faltasSeguidas: 5,
    faltasAcumuladas: 11,
    fechaGeneracion: "2026-02-28T08:00:00",
    estado: "resuelta_amonestacion",
    resolucion: {
      tipo: "amonestacion",
      observaciones: "Se le recuerda al alumno que debe registrar su bitácora diariamente. Acumulación de más faltas puede resultar en baja del servicio.",
      fecha: "2026-03-01T10:00:00",
      alumnoVioAnuncio: true,
      fechaVisto: "2026-03-02T08:45:00",
    },
  },
  {
    id: 4,
    alumno: { nombre: "Herrera Sánchez Valeria", boleta: "2023630301", carreraCorta: "ISC", oferta: "Sistema de Inventario en la Nube", profesor: "Dra. Ruiz Méndez" },
    tipo: "18_acumuladas",
    faltasSeguidas: 0,
    faltasAcumuladas: 18,
    fechaGeneracion: "2026-04-01T14:00:00",
    estado: "resuelta_baja",
    resolucion: {
      tipo: "baja",
      observaciones: "El alumno ha acumulado 18 faltas a lo largo del periodo. Tras revisión de su historial de bitácoras, se determina la baja definitiva del servicio social.",
      fecha: "2026-04-02T09:00:00",
      alumnoVioAnuncio: false,
      fechaVisto: null,
    },
  },
  {
    id: 5,
    alumno: { nombre: "Cruz Domínguez Pedro Emmanuel", boleta: "2021630577", carreraCorta: "IA", oferta: "Chatbot de atención al cliente", profesor: "M.C. Herrera López" },
    tipo: "5_seguidas",
    faltasSeguidas: 5,
    faltasAcumuladas: 5,
    fechaGeneracion: "2026-04-08T10:00:00",
    estado: "pendiente",
    resolucion: null,
  },
];

// ── Helpers ───────────────────────────────────────────────────
function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

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
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  warning:  "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  bell:     "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  ban:      "M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636",
  check:    "M20 6 9 17l-5-5",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  send:     "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
};

// ── Badge tipo incidencia ─────────────────────────────────────
function TipoBadge({ tipo }) {
  const cfg = tipo === "5_seguidas"
    ? { label: "5 seguidas", bg: "rgba(245,158,11,0.12)", color: "#F59E0B" }
    : { label: "18 acumuladas", bg: "rgba(239,68,68,0.12)", color: "#EF4444" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: RADIUS.full, background: cfg.bg, color: cfg.color,
      letterSpacing: "0.03em",
    }}>
      {cfg.label}
    </span>
  );
}

// ── Badge estado incidencia ───────────────────────────────────
function EstadoBadge({ estado }) {
  const cfg = {
    pendiente:              { label: "Pendiente",     bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
    resuelta_amonestacion:  { label: "Amonestación",  bg: "rgba(34,197,94,0.12)",  color: "#22C55E" },
    resuelta_baja:          { label: "Baja emitida",  bg: "rgba(239,68,68,0.12)",  color: "#EF4444" },
  }[estado] ?? { label: estado, bg: "transparent", color: "#888" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: RADIUS.full, background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Item de lista ─────────────────────────────────────────────
function IncidenciaItem({ inc, activo, onClick, C }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        padding: "10px 12px", borderRadius: RADIUS.md,
        background: activo ? "rgba(0,58,143,0.20)" : hover ? C.bgCardHover : "transparent",
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
        fontSize: 12, fontWeight: 700,
        color: activo ? "#fff" : C.textMuted,
      }}>
        {inc.alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: activo ? 600 : 500,
          color: activo ? C.accentText : C.textPrimary,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {inc.alumno.nombre.split(" ").slice(0, 2).join(" ")}
        </p>
        <p style={{ margin: "1px 0 4px", fontSize: 11, color: C.textDisabled }}>
          {inc.alumno.boleta} · {inc.alumno.carreraCorta}
        </p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <TipoBadge tipo={inc.tipo} />
          <EstadoBadge estado={inc.estado} />
        </div>
      </div>
    </button>
  );
}

// ── Panel de detalle + acciones ───────────────────────────────
function PanelDetalle({ inc, onResolver, C }) {
  const [accion, setAccion] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  const esPendiente = inc.estado === "pendiente";

  function handleConfirmar() {
    if (!observaciones.trim()) return;
    setEnviando(true);
    setTimeout(() => {
      onResolver(inc.id, accion, observaciones);
      setEnviando(false);
      setAccion(null);
      setObservaciones("");
    }, 1000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Info alumno */}
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`, padding: "1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: "1rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: GRADIENTS.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#fff",
          }}>
            {inc.alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{inc.alumno.nombre}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textDisabled }}>{inc.alumno.boleta}</p>
          </div>
          <EstadoBadge estado={inc.estado} />
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1.5rem",
          paddingTop: "1rem", borderTop: `1px solid ${C.borderSubtle}`,
        }}>
          {[
            { label: "Oferta", value: inc.alumno.oferta },
            { label: "Profesor", value: inc.alumno.profesor },
            { label: "Faltas seguidas", value: inc.faltasSeguidas },
            { label: "Faltas acumuladas", value: inc.faltasAcumuladas },
            { label: "Tipo de incidencia", value: inc.tipo === "5_seguidas" ? "5 faltas consecutivas" : "18 faltas acumuladas" },
            { label: "Fecha de generación", value: formatFecha(inc.fechaGeneracion) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resolución ya registrada */}
      {!esPendiente && inc.resolucion && (
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "1.25rem",
        }}>
          <p style={{ margin: "0 0 0.875rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Resolución registrada
          </p>

          <div style={{
            padding: "10px 14px", borderRadius: RADIUS.md, marginBottom: "0.75rem",
            background: inc.resolucion.tipo === "amonestacion"
              ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
            border: `1px solid ${inc.resolucion.tipo === "amonestacion" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              color: inc.resolucion.tipo === "amonestacion" ? "#22C55E" : "#EF4444" }}>
              {inc.resolucion.tipo === "amonestacion" ? "Amonestación emitida" : "Baja emitida"}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
              {inc.resolucion.observaciones}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: C.textDisabled }}>
              {formatFecha(inc.resolucion.fecha)}
            </p>
          </div>

          {/* Estado de lectura del anuncio */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: RADIUS.md,
            background: C.bgInput, border: `1px solid ${C.borderDefault}`,
          }}>
            <Icon
              d={inc.resolucion.alumnoVioAnuncio ? ICONS.eye : ICONS.bell}
              size={15}
              stroke={inc.resolucion.alumnoVioAnuncio ? "#22C55E" : C.textDisabled}
            />
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: inc.resolucion.alumnoVioAnuncio ? "#22C55E" : C.textMuted }}>
                {inc.resolucion.alumnoVioAnuncio ? "El alumno vio el anuncio" : "El alumno aún no ha visto el anuncio"}
              </p>
              {inc.resolucion.alumnoVioAnuncio && inc.resolucion.fechaVisto && (
                <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
                  Visto el {formatFecha(inc.resolucion.fechaVisto)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Acciones (solo si está pendiente) */}
      {esPendiente && (
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "1.25rem",
        }}>
          <p style={{ margin: "0 0 0.875rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Acción a tomar
          </p>

          {/* Selector de acción */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            {[
              { key: "amonestacion", label: "Emitir amonestación", icon: ICONS.bell, color: "#22C55E", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.30)" },
              { key: "baja", label: "Dar de baja", icon: ICONS.ban, color: "#EF4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.30)" },
            ].map(({ key, label, icon, color, bg, border }) => (
              <button
                key={key}
                onClick={() => setAccion(prev => prev === key ? null : key)}
                style={{
                  flex: 1, padding: "12px", borderRadius: RADIUS.md, cursor: "pointer",
                  border: `1.5px solid ${accion === key ? color : C.borderDefault}`,
                  background: accion === key ? bg : "transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  transition: "all 0.15s", fontFamily: "inherit",
                }}
              >
                <Icon d={icon} size={18} stroke={accion === key ? color : C.textMuted} />
                <span style={{ fontSize: 12, fontWeight: 600, color: accion === key ? color : C.textMuted }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Textbox de observaciones */}
          {accion && (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Observaciones {accion === "amonestacion" ? "(se publicarán como anuncio al alumno)" : "(motivo de baja para el alumno)"}
              </p>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder={accion === "amonestacion"
                  ? "Escribe las observaciones que verá el alumno en su sección de anuncios…"
                  : "Escribe el motivo de baja que verá el alumno en su dashboard…"}
                rows={4}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: RADIUS.md,
                  border: `1px solid ${C.borderDefault}`,
                  background: C.bgInput, color: C.textPrimary,
                  fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif",
                  resize: "vertical", outline: "none", lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
              />

              <button
                onClick={handleConfirmar}
                disabled={!observaciones.trim() || enviando}
                style={{
                  marginTop: "0.875rem",
                  width: "100%", padding: "11px",
                  borderRadius: RADIUS.md, border: "none", cursor: observaciones.trim() ? "pointer" : "not-allowed",
                  background: accion === "amonestacion"
                    ? (observaciones.trim() ? "#22C55E" : "rgba(34,197,94,0.30)")
                    : (observaciones.trim() ? "#EF4444" : "rgba(239,68,68,0.30)"),
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  fontFamily: "inherit", transition: "opacity 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {enviando ? (
                  <span style={{
                    width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.7s linear infinite",
                  }} />
                ) : (
                  <Icon d={accion === "amonestacion" ? ICONS.send : ICONS.ban} size={14} stroke="#fff" />
                )}
                {enviando ? "Procesando…" : accion === "amonestacion" ? "Confirmar amonestación" : "Confirmar baja"}
              </button>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────
export default function GestionIncidencias() {
  const { C } = useTheme();
  const [incidencias, setIncidencias] = useState(INCIDENCIAS);
  const [seleccionada, setSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const filtradas = useMemo(() => {
    return incidencias.filter(inc => {
      const matchBusqueda =
        inc.alumno.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        inc.alumno.boleta.includes(busqueda);
      const matchEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "pendiente" && inc.estado === "pendiente") ||
        (filtroEstado === "resuelta" && inc.estado !== "pendiente");
      return matchBusqueda && matchEstado;
    });
  }, [incidencias, busqueda, filtroEstado]);

  const totales = useMemo(() => ({
    total: incidencias.length,
    pendientes: incidencias.filter(i => i.estado === "pendiente").length,
    amonestaciones: incidencias.filter(i => i.estado === "resuelta_amonestacion").length,
    bajas: incidencias.filter(i => i.estado === "resuelta_baja").length,
  }), [incidencias]);

  function handleResolver(id, accion, observaciones) {
    const nuevoEstado = accion === "amonestacion" ? "resuelta_amonestacion" : "resuelta_baja";
    setIncidencias(prev => prev.map(inc =>
      inc.id !== id ? inc : {
        ...inc,
        estado: nuevoEstado,
        faltasSeguidas: accion === "amonestacion" ? 0 : inc.faltasSeguidas,
        faltasAcumuladas: accion === "amonestacion" ? 0 : inc.faltasAcumuladas,
        resolucion: {
          tipo: accion,
          observaciones,
          fecha: new Date().toISOString(),
          alumnoVioAnuncio: false,
          fechaVisto: null,
        },
      }
    ));
    setSeleccionada(prev =>
      prev?.id === id ? { ...prev, estado: nuevoEstado,
        faltasSeguidas: accion === "amonestacion" ? 0 : prev.faltasSeguidas,
        faltasAcumuladas: accion === "amonestacion" ? 0 : prev.faltasAcumuladas,
        resolucion: { tipo: accion, observaciones, fecha: new Date().toISOString(), alumnoVioAnuncio: false, fechaVisto: null }
      } : prev
    );
  }

  return (
    <DashboardLayout
      titulo="Gestión de incidencias"
      subtitulo="CU-ADM-XX · Coordinación"
      rol="profesor"
      usuario="Coord. María Esquivel"
    >
      {/* Métricas */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total incidencias", value: totales.total,        color: C.accentText,  bg: C.accentSoft },
          { label: "Pendientes",        value: totales.pendientes,   color: "#F59E0B",     bg: "rgba(245,158,11,0.10)" },
          { label: "Amonestaciones",    value: totales.amonestaciones, color: "#22C55E",   bg: "rgba(34,197,94,0.10)" },
          { label: "Bajas emitidas",    value: totales.bajas,        color: "#EF4444",     bg: "rgba(239,68,68,0.10)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            flex: 1, padding: "12px 16px", borderRadius: RADIUS.lg,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: RADIUS.md, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Layout 2 columnas */}
      <div style={{ display: "flex", gap: "1rem", height: "calc(100vh - 220px)", minHeight: 0 }}>

        {/* Columna izquierda */}
        <div style={{
          width: 310, flexShrink: 0,
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "12px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.bgInput, borderRadius: RADIUS.md,
              border: `1px solid ${C.borderDefault}`, padding: "7px 10px",
            }}>
              <Icon d={ICONS.search} size={14} stroke={C.textDisabled} />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o boleta…"
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontSize: 13, color: C.textPrimary, outline: "none",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { key: "todos",     label: "Todas" },
                { key: "pendiente", label: "Pendientes" },
                { key: "resuelta",  label: "Resueltas" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFiltroEstado(key)} style={{
                  flex: 1, padding: "5px 4px", borderRadius: RADIUS.sm,
                  border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: filtroEstado === key ? 700 : 500,
                  fontFamily: "inherit",
                  background: filtroEstado === key ? C.accentSoft : "transparent",
                  color: filtroEstado === key ? C.accentText : C.textMuted,
                  transition: "all 0.15s",
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {filtradas.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: C.textDisabled, margin: 0 }}>Sin resultados</p>
              </div>
            ) : filtradas.map(inc => (
              <IncidenciaItem
                key={inc.id}
                inc={inc}
                activo={seleccionada?.id === inc.id}
                onClick={() => setSeleccionada({ ...inc })}
                C={C}
              />
            ))}
          </div>

          <div style={{
            padding: "8px 12px", borderTop: `1px solid ${C.borderSubtle}`,
            fontSize: 11, color: C.textDisabled,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {filtradas.length} incidencia{filtradas.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {seleccionada ? (
            <PanelDetalle
              key={seleccionada.id}
              inc={seleccionada}
              onResolver={handleResolver}
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
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>
                ⚠️
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Selecciona una incidencia
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontFamily: "'DM Sans', system-ui, sans-serif", textAlign: "center", maxWidth: 280 }}>
                Elige una incidencia de la lista para revisar los detalles y tomar una acción.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
