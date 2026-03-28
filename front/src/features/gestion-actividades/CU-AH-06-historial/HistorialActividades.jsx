import { useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HistorialRow }    from "./components/HistorialRow";
import { useHistorial }    from "./hooks/useHistorial";

const CARRERA_LABEL = {
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
  const {
    registros, totales,
    tipoFiltro, setTipoFiltro, estadoFiltro, setEstadoFiltro,
    fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    alumnos, alumnoVisto, setAlumnoVisto,
  } = useHistorial(rol);

  const titulos = {
    alumno:       { titulo: "Mi historial",            sub: "CU-AH-06 · Alumno"        },
    profesor:     { titulo: "Historial de alumnos",    sub: "CU-AH-06 · Profesor"      },
    coordinacion: { titulo: "Historial de alumnos",    sub: "CU-AH-06 · Coordinación"  },
  };
  const { titulo, sub } = titulos[rol] ?? titulos.alumno;

  const panelProps = { registros, totales, tipoFiltro, setTipoFiltro, estadoFiltro, setEstadoFiltro, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta, C };

  return (
    <DashboardLayout titulo={titulo} subtitulo={sub} rol={rol} usuario={rol === "alumno" ? "García López Juan Carlos" : rol === "profesor" ? "Dr. Torres Vega" : "Coordinación ESCOM"}>

      {/* ── Vista alumno: solo su historial ── */}
      {rol === "alumno" && (
        <div style={{ maxWidth: 760 }}>
          <PanelHistorial {...panelProps} />
        </div>
      )}

      {/* ── Vista profesor/coordinación: lista alumnos + historial ── */}
      {rol !== "alumno" && (
        <div style={{ display: "grid", gridTemplateColumns: "500px 1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* Lista de alumnos */}
          <div>
            <p style={{ margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.textDisabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Alumnos ({alumnos.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {alumnos.map(a => {
                const activo = alumnoVisto?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setAlumnoVisto(a)}
                    style={{ padding: "0.875rem 1rem", borderRadius: RADIUS.lg, cursor: "pointer", background: activo ? C.navItemActive : C.bgCard, border: `1px solid ${activo ? C.accent : C.borderDefault}`, transition: "all 0.15s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: activo ? C.accent : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: activo ? "#fff" : C.accentText, flexShrink: 0 }}>
                        {a.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.nombre.split(" ").slice(0, 2).join(" ")}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>{CARRERA_LABEL[a.carrera]}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historial del alumno seleccionado */}
          <div>
            {alumnoVisto && (
              <>
                <div style={{ marginBottom: "1.25rem" }}>
                  <h2 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{alumnoVisto.nombre}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>{CARRERA_LABEL[alumnoVisto.carrera]} · Boleta {alumnoVisto.boleta}</p>
                </div>
                <PanelHistorial {...panelProps} />
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
