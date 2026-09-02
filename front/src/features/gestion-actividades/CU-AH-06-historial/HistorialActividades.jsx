import { useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HistorialRow }    from "./components/HistorialRow";
import { useHistorial, MOCK_PROFESORES } from "./hooks/useHistorial";


export const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

const TIPOS = [
  { key: "todos",     label: "Todos"       },
  { key: "bitacora",  label: "Bitácoras"   },
  { key: "actividad", label: "Actividades" },
];

const ESTADOS = [
  { key: "todos",             label: "Todos los estados" },
  { key: "Aprobada",          label: "Aprobada"          },
  { key: "Rechazada",         label: "Rechazada"         },
  { key: "PendienteRevision", label: "Pendiente"         },
  { key: "Completada",        label: "Completada"        },
  { key: "En progreso",       label: "En progreso"       },
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
function PanelHistorial({ registros, totales, tipoFiltro, setTipoFiltro, estadoFiltro, setEstadoFiltro, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta, C }) {
  const [expandido, setExpandido] = useState(null);

  const inputStyle = {
    padding: "7px 12px", background: C.bgInput,
    border: `1px solid ${C.borderDefault}`, borderRadius: RADIUS.md,
    color: C.textPrimary, fontSize: 12, outline: "none", fontFamily: "inherit", cursor: "pointer",
  };
  

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
          <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} style={inputStyle}>
            {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={inputStyle} title="Desde" />
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={inputStyle} title="Hasta" />
          {(tipoFiltro !== "todos" || estadoFiltro !== "todos" || fechaDesde || fechaHasta) && (
            <button onClick={() => { setTipoFiltro("todos"); setEstadoFiltro("todos"); setFechaDesde(""); setFechaHasta(""); }} style={{ padding: "5px 12px", borderRadius: RADIUS.full, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", border: `1px solid ${C.danger}`, color: C.danger, fontFamily: "inherit" }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {registros.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ fontSize: 28, margin: "0 0 0.5rem" }}>📋</p>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>No hay registros con los filtros seleccionados</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {registros.map(r => (
            <HistorialRow key={r.id} registro={r} expandido={expandido === r.id} onToggle={() => setExpandido(expandido === r.id ? null : r.id)} C={C} />
          ))}
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.textDisabled, textAlign: "right" }}>
            {registros.length} registro{registros.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function HistorialActividades({ rol = "alumno" }) {
  const { C } = useTheme();
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCarrera, setFiltroCarrera] = useState([]);
  const [nivelProf, setNivelProf] = useState("profesores");
  const [filtroProfesor, setFiltroProfesor] = useState("");

  const toggleCarrera = (c) => {
  setFiltroCarrera(prev =>
    prev.includes(c)
      ? prev.filter(x => x !== c)
      : [...prev, c]
  );
};

  const {
    registros, totales,
    tipoFiltro, setTipoFiltro, estadoFiltro, setEstadoFiltro,
    fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    profesores, profesorVisto, setProfesorVisto,
    alumnos, alumnoVisto, setAlumnoVisto,
  } = useHistorial(rol);

  const titulos = {
    alumno:       { titulo: "Mi historial",            sub: "CU-AH-06 · Alumno"        },
    profesor:     { titulo: "Historial de alumnos",    sub: "CU-AH-06 · Profesor"      },
    coordinacion: { titulo: "Historial de alumnos",    sub: "CU-AH-06 · Coordinación"  },
  };
  const { titulo, sub } = titulos[rol] ?? titulos.alumno;

  const panelProps = { registros, totales, tipoFiltro, setTipoFiltro, estadoFiltro, setEstadoFiltro, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta, C };

  

  const alumnosFiltrados = alumnos.filter(a => {
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
    <DashboardLayout titulo={titulo} subtitulo={sub} rol={rol} usuario={rol === "alumno" ? "García López Juan Carlos" : rol === "profesor" ? "Dr. Torres Vega" : "Coordinación ESCOM"}>

      {/* ── Vista alumno: solo su historial ── */}
      {rol === "alumno" && (
        <div style={{ maxWidth: 760 }}>
          <PanelHistorial {...panelProps} />
        </div>
      )}

      {/* ── Vista profesor: layout dos columnas ── */}
      {rol === "profesor" && (
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
                  key={a.id}
                  onClick={() => setAlumnoVisto(a)}
                  style={{ padding: "0.625rem 0.75rem", borderRadius: RADIUS.md, cursor: "pointer",
                    background: alumnoVisto?.id === a.id ? C.accentSoft : C.bgCard,
                    border: `1px solid ${alumnoVisto?.id === a.id ? C.accent : C.borderDefault}`,
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
                  Sin resultados
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
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                    Oferta: {alumnoVisto.oferta}
                  </p>
                </div>
                <PanelHistorial {...panelProps} />
              </div>
            )}
          </div>

        </div>
      )}


      {rol === "coordinacion" && (
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
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "1rem 0" }}>Sin resultados</p>
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
                  key={a.id}
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
                <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "1rem 0" }}>Sin resultados</p>
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
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>
              Oferta: {alumnoVisto.oferta}
            </p>
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
