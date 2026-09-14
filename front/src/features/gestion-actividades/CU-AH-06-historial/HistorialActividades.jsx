import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HistorialRow }    from "./components/HistorialRow";
import { RangoFechasPicker } from "./components/RangoFechasPicker";
import { useHistorial } from "./hooks/useHistorial";
import { formatearFechaUTC } from "@/utils/fechas";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import { marcarLeidasPorRuta } from "@/services/notificacionesService";


export const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

// Rol REAL de sesión → clave interna que decide qué vista renderizar —
// mismo patrón ya aplicado en AcumuladoHoras.jsx (AH-05).
const ROL_INTERNO = { alumno_asignado: "alumno", profesor: "profesor", coordinador: "coordinacion" };

const TIPOS = [
  { key: "todos",     label: "Todos"       },
  { key: "bitacora",  label: "Bitácoras"   },
  { key: "actividad", label: "Actividades" },
];

// Filtro de estado dinámico según tipoFiltro (RF-AH-06): los dos espacios
// de estado no comparten significado, así que nunca se mezclan en una sola
// lista. Cuando tipoFiltro==='todos' el selector se oculta por completo
// (criterio elegido: evita inventar una "unión" ambigua entre ambos).
const ESTADOS_ACTIVIDAD = [
  { key: "todos",              label: "Todos los estados"    },
  { key: "sin_comenzar",       label: "Sin comenzar"         },
  { key: "en_progreso",        label: "En progreso"          },
  { key: "vencida",            label: "Vencida"              },
  { key: "completada_a_tiempo",label: "Completada a tiempo"  },
  { key: "completada_tarde",   label: "Completada fuera de tiempo" },
];
const ESTADOS_BITACORA = [
  { key: "todos",              label: "Todos los estados"    },
  { key: "en_curso",           label: "En curso"             },
  { key: "pendiente_datos",    label: "Pendiente de datos"   },
  { key: "pendiente_revision", label: "Pendiente de revisión"},
  { key: "aprobada",           label: "Aprobada"             },
  { key: "rechazada",          label: "Rechazada"            },
];

function Breadcrumb({ items, C }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: "1.25rem", flexWrap: "wrap" }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {isLast ? (
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, padding: "3px 7px" }}>
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                style={{ fontSize: 12, fontWeight: 500, color: C.accent, background: "none", border: "none",
                  padding: "3px 7px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                  transition: "background .15s" }}
                onMouseEnter={e => e.target.style.background = "rgba(46,134,222,0.1)"}
                onMouseLeave={e => e.target.style.background = "none"}
              >
                {item.label}
              </button>
            )}
            {!isLast && <span style={{ fontSize: 11, color: C.textDisabled }}>›</span>}
          </span>
        );
      })}
    </div>
  );
}
// ── Panel de historial (filtros + lista) ─────────────────────
function PanelHistorial({ registros, totales, cargando, tipoFiltro, setTipoFiltro, estadoFiltro, setEstadoFiltro, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta, C, highlightId, onAprobar, onExtenderFecha }) {
  const [expandido, setExpandido] = useState(null);

  const inputStyle = {
    padding: "7px 12px", background: C.bgInput,
    border: `1px solid ${C.borderDefault}`, borderRadius: RADIUS.md,
    color: C.textPrimary, fontSize: 12, outline: "none", fontFamily: "inherit", cursor: "pointer",
  };

  const opcionesEstado = tipoFiltro === "actividad" ? ESTADOS_ACTIVIDAD : tipoFiltro === "bitacora" ? ESTADOS_BITACORA : null;

  return (
    <div>
      {/* Resumen */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[
          { label: "Bitácoras",   valor: totales.bitacoras,   color: "#2E86DE", bg: "rgba(10,102,194,0.1)" },
          { label: "Actividades", valor: totales.actividades, color: "#22C55E", bg: "rgba(34,197,94,0.1)"  },
        ].map(({ label, valor, color, bg }) => (
          <div key={label} style={{ padding: "0.625rem 1rem", borderRadius: RADIUS.lg, background: bg, border: `1px solid ${C.borderSubtle}` }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color }}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "0.875rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center" }}>
          {TIPOS.map(t => (
            <button key={t.key} onClick={() => setTipoFiltro(t.key)} style={{ padding: "5px 12px", borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: tipoFiltro === t.key ? C.accent : C.bgInput, border: `1px solid ${tipoFiltro === t.key ? C.accent : C.borderDefault}`, color: tipoFiltro === t.key ? "#fff" : C.textMuted }}>
              {t.label}
            </button>
          ))}
          {opcionesEstado && (
            <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} style={inputStyle}>
              {opcionesEstado.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          )}
          <RangoFechasPicker
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onChange={(desde, hasta) => { setFechaDesde(desde); setFechaHasta(hasta); }}
            C={C}
          />
          {(tipoFiltro !== "todos" || estadoFiltro !== "todos" || fechaDesde || fechaHasta) && (
            <button onClick={() => { setTipoFiltro("todos"); setEstadoFiltro("todos"); setFechaDesde(""); setFechaHasta(""); }} style={{ padding: "5px 12px", borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", border: `1px solid ${C.danger}`, color: C.danger, fontFamily: "inherit" }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {cargando ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Cargando...</p>
        </div>
      ) : registros.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ fontSize: 28, margin: "0 0 0.5rem" }}>📋</p>
          {/* RF-AH-54: distingue "no hay nada en absoluto" de "el filtro no encontró nada" */}
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>
            {totales.bitacoras + totales.actividades === 0
              ? "Aún no hay actividades ni bitácoras registradas."
              : "No hay registros con los filtros seleccionados."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {registros.map(r => {
            // actividad e bitácora vienen de tablas distintas — sus ids
            // pueden colisionar (ambas empiezan en 1), de ahí la clave
            // compuesta en key/expandido/scroll — nunca comparar solo por id.
            const claveCompuesta = `${r.tipo}-${r.id}`;
            return (
              <HistorialRow
                key={claveCompuesta}
                registro={r}
                expandido={expandido === claveCompuesta}
                onToggle={() => setExpandido(expandido === claveCompuesta ? null : claveCompuesta)}
                destacado={highlightId != null && r.tipo === "actividad" && r.id === highlightId}
                onAprobar={onAprobar}
                onExtenderFecha={onExtenderFecha}
                C={C}
              />
            );
          })}
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.textDisabled, textAlign: "right" }}>
            {registros.length} registro{registros.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function HistorialActividades() {
  const { C } = useTheme();
  const { usuario: sesion } = useSesion();
  const location = useLocation();
  const rolInterno = ROL_INTERNO[sesion?.rol] ?? "alumno";

  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCarrera, setFiltroCarrera] = useState([]);
  const [filtroProfesor, setFiltroProfesor] = useState("");

  const actividadId = new URLSearchParams(location.search).get("actividad");

  // Al entrar a su propio historial, el alumno "ve" cualquier bitácora
  // recién revisada (CU-AH-04) — marca esa notificación como leída
  // automáticamente, sin que tenga que hacer clic en ella. Fail-safe: si
  // falla, solo se registra en consola, la pantalla sigue funcionando igual.
  useEffect(() => {
    if (rolInterno !== "alumno") return;
    marcarLeidasPorRuta("/alumno/historial").catch((err) => {
      console.error("No se pudo marcar como leída la notificación de historial:", err);
    });
  }, [rolInterno]);

  // RN-AH-28: si se llegó desde la notificación de "fecha límite ampliada"
  // (?actividad=<id>), marca ESA notificación específica como leída — ruta
  // exacta distinta de la plana de arriba, no interfiere entre sí.
  useEffect(() => {
    if (rolInterno !== "alumno" || !actividadId) return;
    marcarLeidasPorRuta(`/alumno/historial?actividad=${actividadId}`).catch((err) => {
      console.error("No se pudo marcar como leída la notificación de fecha extendida:", err);
    });
  }, [rolInterno, actividadId]);

  const toggleCarrera = (c) => {
    setFiltroCarrera(prev =>
      prev.includes(c)
        ? prev.filter(x => x !== c)
        : [...prev, c]
    );
  };

  const {
    registros, totales, cargando,
    tipoFiltro, setTipoFiltro, estadoFiltro, setEstadoFiltro,
    fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    profesores, profesorVisto, setProfesorVisto,
    alumnos, alumnoVisto, setAlumnoVisto,
    alumnoDetalle,
    aprobarBitacoraRechazada, extenderFechaActividad,
  } = useHistorial(rolInterno);

  const titulos = {
    alumno:       { titulo: "Mi historial",                    },
    profesor:     { titulo: "Historial de alumnos",          },
    coordinacion: { titulo: "Historial de alumnos",      },
  };
  const { titulo, sub } = titulos[rolInterno];

  // Scroll + resaltado (sin expandir) hasta la actividad referenciada por
  // la notificación — se limpia el resaltado a los pocos segundos.
  const [highlightId, setHighlightId] = useState(null);
  const yaHizoScroll = useRef(false);
  useEffect(() => {
    if (!actividadId || cargando || registros.length === 0 || yaHizoScroll.current) return;
    const id = Number(actividadId);
    if (!registros.some(r => r.tipo === "actividad" && r.id === id)) return;
    yaHizoScroll.current = true;
    setHighlightId(id);
    document.getElementById(`registro-actividad-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(() => setHighlightId(null), 4000);
    return () => clearTimeout(timeout);
  }, [actividadId, cargando, registros]);

  const panelProps = {
    registros, totales, cargando,
    tipoFiltro, setTipoFiltro, estadoFiltro, setEstadoFiltro,
    fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    C, highlightId,
    // Las 2 acciones reales (aprobar bitácora rechazada, extender fecha)
    // son EXCLUSIVAS del profesor — el backend solo expone esas rutas bajo
    // requireRole('profesor'). Coordinación es de solo lectura aquí.
    onAprobar: rolInterno === "profesor" ? aprobarBitacoraRechazada : null,
    onExtenderFecha: rolInterno === "profesor" ? extenderFechaActividad : null,
  };

  // Para profesor, la lista viene directo del hook (getAcumuladoAlumnos);
  // para coordinación, viene anidada dentro del profesor seleccionado
  // (getAcumuladoProfesores) — el estado `alumnos` del hook solo se puebla
  // en el rol profesor.
  const alumnosBase = rolInterno === "coordinacion" ? (profesorVisto?.alumnos ?? []) : alumnos;

  const alumnosFiltrados = alumnosBase.filter(a => {
    const matchNombre =
      filtroNombre === "" ||
      a.nombre.toLowerCase().includes(filtroNombre.toLowerCase());

    const matchCarrera =
      filtroCarrera.length === 0 ||
      filtroCarrera.includes(a.carrera);

    return matchNombre && matchCarrera;
  });

  const profesoresFiltrados = profesores.filter(p =>
    filtroProfesor === "" ||
    p.nombre.toLowerCase().includes(filtroProfesor.toLowerCase()) ||
    p.dept.toLowerCase().includes(filtroProfesor.toLowerCase())
  );

  return (
    <DashboardLayout titulo={titulo} subtitulo={sub} rol={sesion?.rol} usuario={nombreCompletoSesion(sesion)}>

      {/* ── Vista alumno: solo su historial ── */}
      {rolInterno === "alumno" && (
        <div style={{ maxWidth: 760 }}>
          <PanelHistorial {...panelProps} />
        </div>
      )}

      {/* ── Vista profesor: layout dos columnas ── */}
      {rolInterno === "profesor" && (
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", maxWidth: 900 }}>

          {/* COLUMNA IZQUIERDA: lista de alumnos fija */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <input
              placeholder="Buscar alumno..."
              value={filtroNombre}
              onChange={e => setFiltroNombre(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", marginBottom: "0.5rem",
                borderRadius: RADIUS.md, background: C.bgInput, boxSizing: "border-box",
                border: `1px solid ${C.borderDefault}`, color: C.textPrimary,
                fontSize: 12, outline: "none" }}
            />
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.625rem" }}>
              {["ISC", "IA", "LCD"].map(c => (
                <button key={c} onClick={() => toggleCarrera(c)} style={{
                  padding: "3px 10px", borderRadius: "999px", fontSize: 11,
                  cursor: "pointer", fontFamily: "inherit",
                  border: `1px solid ${filtroCarrera.includes(c) ? C.accent : C.borderDefault}`,
                  background: filtroCarrera.includes(c) ? C.accent : "transparent",
                  color: filtroCarrera.includes(c) ? "#fff" : C.textMuted,
                }}>
                  {c}
                </button>
              ))}
            </div>
            <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700,
              color: C.textDisabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Mis alumnos ({alumnosFiltrados.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {alumnosFiltrados.map(a => (
                <div
                  key={a.boleta}
                  onClick={() => setAlumnoVisto(a)}
                  style={{ padding: "0.625rem 0.75rem", borderRadius: RADIUS.md, cursor: "pointer",
                    background: alumnoVisto?.boleta === a.boleta ? C.accentSoft : C.bgCard,
                    border: `1px solid ${alumnoVisto?.boleta === a.boleta ? C.accent : C.borderDefault}`,
                    display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: C.accentSoft, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.accentText }}>
                    {a.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 600, color: C.textPrimary,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {a.nombre.split(" ").slice(0, 2).join(" ")}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: C.textDisabled }}>
                      {CARRERA_LABEL[a.carrera]}
                    </p>
                  </div>
                  <svg style={{ marginLeft: "auto" }} width={12} height={12} viewBox="0 0 24 24"
                    fill="none" stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
              {alumnosFiltrados.length === 0 && (
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "1rem 0" }}>
                  {alumnos.length === 0 ? "No tienes alumnos bajo tu supervisión" : "Sin resultados"}
                </p>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: detalle del alumno */}
          <div style={{ flex: 1, borderLeft: `1px solid ${C.borderSubtle}`, paddingLeft: "1.5rem", minWidth: 0 }}>
            {!alumnoVisto ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "5rem 1rem", color: C.textDisabled }}>
                <p style={{ fontSize: 32, margin: "0 0 0.5rem" }}>📋</p>
                <p style={{ fontSize: 13, margin: 0 }}>Selecciona un alumno para ver su historial</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <h2 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
                    {alumnoVisto.nombre}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                    {CARRERA_LABEL[alumnoVisto.carrera]} · Boleta {alumnoVisto.boleta}
                  </p>
                  {/* RF-AH-49: "Oferta" ya se mostraba para ambos roles — se
                      mantiene. El nombre del profesor NO aplica aquí (el
                      profesor viendo a su propio alumno no necesita verse a
                      sí mismo) — solo se agrega en la vista Coordinación. */}
                  {alumnoDetalle && (
                    <>
                      <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                        Oferta: {alumnoDetalle.oferta}
                      </p>
                      {alumnoDetalle.fechaInicioPeriodo && (
                        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                          Periodo: {formatearFechaUTC(alumnoDetalle.fechaInicioPeriodo)}
                          {alumnoDetalle.fechaFinPeriodo ? ` – ${formatearFechaUTC(alumnoDetalle.fechaFinPeriodo)}` : ""}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <PanelHistorial {...panelProps} />
              </div>
            )}
          </div>

        </div>
      )}


      {rolInterno === "coordinacion" && (
        <div>
          {/* Breadcrumb */}
          <Breadcrumb C={C} items={[
            profesorVisto
              ? { label: "Profesores", onClick: () => { setProfesorVisto(null); setAlumnoVisto(null); setFiltroProfesor(""); setFiltroNombre(""); setFiltroCarrera([]); } }
              : { label: "Profesores" },
            ...(profesorVisto && !alumnoVisto ? [{ label: profesorVisto.nombre }] : []),
            ...(profesorVisto && alumnoVisto  ? [
              { label: profesorVisto.nombre, onClick: () => { setAlumnoVisto(null); setFiltroNombre(""); setFiltroCarrera([]); } },
              { label: alumnoVisto.nombre.split(" ").slice(0, 2).join(" ") },
            ] : []),
          ]} />

          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

            {/* COLUMNA IZQUIERDA: lista del nivel actual */}
            <div style={{ width: 240, flexShrink: 0 }}>

              {/* Nivel 1: Profesores */}
              {!profesorVisto && (
                <>
                  <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700,
                    color: C.textDisabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Profesores ({profesoresFiltrados.length})
                  </p>
                  <input
                    placeholder="Buscar profesor..."
                    value={filtroProfesor}
                    onChange={e => setFiltroProfesor(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", marginBottom: "0.5rem",
                      borderRadius: RADIUS.md, background: C.bgInput, boxSizing: "border-box",
                      border: `1px solid ${C.borderDefault}`, color: C.textPrimary,
                      fontSize: 12, outline: "none" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {profesoresFiltrados.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setProfesorVisto(p); setAlumnoVisto(null); }}
                        style={{ padding: "0.625rem 0.75rem", borderRadius: RADIUS.md, cursor: "pointer",
                          background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                          display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>
                          {p.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
                        </div>
                        <div>
                          <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{p.nombre}</p>
                          <p style={{ margin: 0, fontSize: 10, color: C.textDisabled }}>{p.dept}</p>
                        </div>
                        <svg style={{ marginLeft: "auto" }} width={12} height={12} viewBox="0 0 24 24"
                          fill="none" stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    ))}
                    {profesoresFiltrados.length === 0 && (
                      <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "1rem 0" }}>
                        {profesores.length === 0 ? "No hay profesores registrados" : "Sin resultados"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Nivel 2: Alumnos del profesor */}
              {profesorVisto && !alumnoVisto && (
                <>
                  <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700,
                    color: C.textDisabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Alumnos ({alumnosFiltrados.length})
                  </p>
                  <input
                    placeholder="Buscar alumno..."
                    value={filtroNombre}
                    onChange={e => setFiltroNombre(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", marginBottom: "0.375rem",
                      borderRadius: RADIUS.md, background: C.bgInput, boxSizing: "border-box",
                      border: `1px solid ${C.borderDefault}`, color: C.textPrimary,
                      fontSize: 12, outline: "none" }}
                  />
                  <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    {["ISC", "IA", "LCD"].map(c => (
                      <button key={c} onClick={() => toggleCarrera(c)} style={{
                        padding: "3px 10px", borderRadius: "999px", fontSize: 11,
                        cursor: "pointer", fontFamily: "inherit",
                        border: `1px solid ${filtroCarrera.includes(c) ? C.accent : C.borderDefault}`,
                        background: filtroCarrera.includes(c) ? C.accent : "transparent",
                        color: filtroCarrera.includes(c) ? "#fff" : C.textMuted,
                      }}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {alumnosFiltrados.map(a => (
                      <div
                        key={a.boleta}
                        onClick={() => setAlumnoVisto(a)}
                        style={{ padding: "0.625rem 0.75rem", borderRadius: RADIUS.md, cursor: "pointer",
                          background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                          display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: C.accentSoft, display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.accentText }}>
                          {a.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 600, color: C.textPrimary,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {a.nombre.split(" ").slice(0, 2).join(" ")}
                          </p>
                          <p style={{ margin: 0, fontSize: 10, color: C.textDisabled }}>{CARRERA_LABEL[a.carrera]}</p>
                        </div>
                        <svg style={{ marginLeft: "auto" }} width={12} height={12} viewBox="0 0 24 24"
                          fill="none" stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    ))}
                    {alumnosFiltrados.length === 0 && (
                      <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "1rem 0" }}>
                        {alumnosBase.length === 0 ? "Este profesor no tiene alumnos bajo su supervisión" : "Sin resultados"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Nivel 3: en historial — muestra mini-info del alumno en columna izq */}
              {alumnoVisto && (
                <div style={{ padding: "0.75rem", background: C.bgCard, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.borderSubtle}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.accentSoft,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: C.accentText, marginBottom: "0.5rem" }}>
                    {alumnoVisto.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                    {alumnoVisto.nombre.split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p style={{ margin: "0 0 1px", fontSize: 11, color: C.textMuted }}>
                    {CARRERA_LABEL[alumnoVisto.carrera]}
                  </p>
                  <p style={{ margin: "0 0 1px", fontSize: 11, color: C.textMuted }}>
                    Boleta: {alumnoVisto.boleta}
                  </p>
                  {alumnoDetalle && (
                    <>
                      <p style={{ margin: "0 0 1px", fontSize: 11, color: C.textMuted }}>
                        Oferta: {alumnoDetalle.oferta}
                      </p>
                      {/* RF-AH-49: profesor supervisor SOLO en vista Coordinación */}
                      {alumnoDetalle.profesorNombre && (
                        <p style={{ margin: "0 0 1px", fontSize: 11, color: C.textMuted }}>
                          Profesor: {alumnoDetalle.profesorNombre}
                        </p>
                      )}
                      {alumnoDetalle.fechaInicioPeriodo && (
                        <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
                          Periodo: {formatearFechaUTC(alumnoDetalle.fechaInicioPeriodo)}
                          {alumnoDetalle.fechaFinPeriodo ? ` – ${formatearFechaUTC(alumnoDetalle.fechaFinPeriodo)}` : ""}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: detalle / historial */}
            <div style={{ flex: 1, borderLeft: `1px solid ${C.borderSubtle}`, paddingLeft: "1.5rem", minWidth: 0 }}>
              {!profesorVisto && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "5rem 1rem", color: C.textDisabled }}>
                  <p style={{ fontSize: 32, margin: "0 0 0.5rem" }}>👥</p>
                  <p style={{ fontSize: 13, margin: 0 }}>Selecciona un profesor para ver sus alumnos</p>
                </div>
              )}

              {profesorVisto && !alumnoVisto && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "5rem 1rem", color: C.textDisabled }}>
                  <p style={{ fontSize: 32, margin: "0 0 0.5rem" }}>📋</p>
                  <p style={{ fontSize: 13, margin: 0 }}>Selecciona un alumno para ver su historial</p>
                </div>
              )}

              {alumnoVisto && <PanelHistorial {...panelProps} />}
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
