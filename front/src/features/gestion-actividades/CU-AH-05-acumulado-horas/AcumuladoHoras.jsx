import { useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }   from "@/components/layout/DashboardLayout";
import { ProgresoCircular, MetricaCards, BarraProgreso } from "./components/ProgresoHoras";
import { useAcumuladoHoras } from "./hooks/useAcumuladoHoras";

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

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

// ── Stats del alumno (columna derecha) ───────────────────────
function DetalleAlumno({ alumno, C }) {
  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
          {alumno.nombre}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          {CARRERA_LABEL[alumno.carrera]} · Boleta {alumno.boleta}
        </p>
      </div>

      <div style={{ background: C.bgCard, borderRadius: RADIUS.xl, border: `1px solid ${C.borderSubtle}`,
        padding: "1.5rem", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
        <ProgresoCircular
          porcentaje={alumno.porcentaje}
          horasRealizadas={alumno.horasRealizadas}
          horasTotales={alumno.horasTotales}
          C={C}
        />
      </div>

      <MetricaCards datos={alumno} C={C} />

      <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`,
        padding: "1.25rem 1.5rem", marginTop: "1rem" }}>
        <BarraProgreso datos={alumno} C={C} />
      </div>
    </div>
  );
}

function Placeholder({ emoji, texto, C }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "5rem 1rem", color: C.textDisabled }}>
      <p style={{ fontSize: 32, margin: "0 0 0.5rem" }}>{emoji}</p>
      <p style={{ fontSize: 13, margin: 0 }}>{texto}</p>
    </div>
  );
}

// ── Vista alumno ─────────────────────────────────────────────
function VistaAlumno({ propio, C }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Mi acumulado de horas
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Seguimiento de tu progreso en el servicio social
        </p>
      </div>

      <div style={{ background: C.bgCard, borderRadius: RADIUS.xl, border: `1px solid ${C.borderSubtle}`,
        padding: "2rem", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
        <ProgresoCircular
          porcentaje={propio.porcentaje}
          horasRealizadas={propio.horasRealizadas}
          horasTotales={propio.horasTotales}
          C={C}
        />
      </div>

      <MetricaCards datos={propio} C={C} />

      <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`,
        padding: "1.25rem 1.5rem", marginTop: "1rem" }}>
        <BarraProgreso datos={propio} C={C} />
      </div>
    </div>
  );
}

// ── Componente de tarjeta de alumno en lista ─────────────────
function AlumnoCard({ alumno, activo, onClick, C, size = "md" }) {
  const color = alumno.porcentaje >= 90 ? "#22C55E" : alumno.porcentaje >= 50 ? "#2E86DE" : "#F59E0B";
  const avatarSize = size === "sm" ? 28 : 34;
  const avatarFont = size === "sm" ? 10 : 12;

  return (
    <div
      onClick={onClick}
      style={{ padding: size === "sm" ? "0.625rem 0.75rem" : "0.75rem 1rem",
        borderRadius: RADIUS.md, cursor: "pointer",
        background: activo ? C.accentSoft : C.bgCard,
        border: `1px solid ${activo ? C.accent : C.borderDefault}`,
        display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}
    >
      <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", flexShrink: 0,
        background: activo ? C.accent : C.accentSoft, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: avatarFont, fontWeight: 700,
        color: activo ? "#fff" : C.accentText }}>
        {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("")}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: C.textPrimary,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {alumno.nombre.split(" ").slice(0, 2).join(" ")}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ flex: 1, height: 3, background: C.borderSubtle, borderRadius: 2 }}>
            <div style={{ width: `${alumno.porcentaje}%`, height: "100%", borderRadius: 2, background: color }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{alumno.porcentaje}%</span>
        </div>
      </div>
    </div>
  );
}

const inputStyle = (C) => ({
  width: "100%", padding: "7px 10px", marginBottom: "0.5rem",
  borderRadius: RADIUS.md, background: C.bgInput, boxSizing: "border-box",
  border: `1px solid ${C.borderDefault}`, color: C.textPrimary,
  fontSize: 12, outline: "none",
});

// ── Vista profesor ───────────────────────────────────────────
function VistaProfesor({ alumnos, C }) {
  const [filtro, setFiltro]           = useState("");
  const [alumnoVisto, setAlumnoVisto] = useState(null);

  const filtrados = alumnos.filter(a =>
    filtro === "" || a.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

      {/* Columna izquierda */}
      <div style={{ width: 240, flexShrink: 0 }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700, color: C.textDisabled,
          letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Mis alumnos ({filtrados.length})
        </p>
        <input
          placeholder="Buscar alumno..."
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={inputStyle(C)}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {filtrados.map(a => (
            <AlumnoCard key={a.id} alumno={a} activo={alumnoVisto?.id === a.id}
              onClick={() => setAlumnoVisto(a)} C={C} size="sm" />
          ))}
          {filtrados.length === 0 && (
            <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "1rem 0" }}>
              Sin resultados
            </p>
          )}
        </div>
      </div>

      {/* Columna derecha */}
      <div style={{ flex: 1, borderLeft: `1px solid ${C.borderSubtle}`, paddingLeft: "1.5rem", minWidth: 0 }}>
        {alumnoVisto
          ? <DetalleAlumno alumno={alumnoVisto} C={C} />
          : <Placeholder emoji="📋" texto="Selecciona un alumno para ver su progreso" C={C} />
        }
      </div>

    </div>
  );
}

// ── Vista coordinación ───────────────────────────────────────
function VistaCoordinacion({ profesores, C }) {
  const [filtroPro, setFiltroPro]     = useState("");
  const [filtroAlu, setFiltroAlu]     = useState("");
  const [profesorVisto, setProfesorVisto] = useState(null);
  const [alumnoVisto, setAlumnoVisto]     = useState(null);

  const profesoresFiltrados = profesores.filter(p =>
    filtroPro === "" ||
    p.nombre.toLowerCase().includes(filtroPro.toLowerCase()) ||
    p.dept.toLowerCase().includes(filtroPro.toLowerCase())
  );

  const alumnosFiltrados = (profesorVisto?.alumnos ?? []).filter(a =>
    filtroAlu === "" || a.nombre.toLowerCase().includes(filtroAlu.toLowerCase())
  );

  const breadcrumbItems = [
    profesorVisto
      ? { label: "Profesores", onClick: () => { setProfesorVisto(null); setAlumnoVisto(null); setFiltroAlu(""); } }
      : { label: "Profesores" },
    ...(profesorVisto && !alumnoVisto ? [{ label: profesorVisto.nombre }] : []),
    ...(profesorVisto && alumnoVisto  ? [
      { label: profesorVisto.nombre, onClick: () => { setAlumnoVisto(null); setFiltroAlu(""); } },
      { label: alumnoVisto.nombre.split(" ").slice(0, 2).join(" ") },
    ] : []),
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} C={C} />

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

        {/* Columna izquierda */}
        <div style={{ width: 240, flexShrink: 0 }}>

          {/* Nivel 1: lista de profesores */}
          {!profesorVisto && (
            <>
              <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700, color: C.textDisabled,
                letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Profesores ({profesoresFiltrados.length})
              </p>
              <input
                placeholder="Buscar profesor..."
                value={filtroPro}
                onChange={e => setFiltroPro(e.target.value)}
                style={inputStyle(C)}
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
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 600, color: C.textPrimary,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.nombre}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: C.textDisabled }}>{p.dept}</p>
                    </div>
                    <svg style={{ marginLeft: "auto", flexShrink: 0 }} width={12} height={12} viewBox="0 0 24 24"
                      fill="none" stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                ))}
                {profesoresFiltrados.length === 0 && (
                  <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "1rem 0" }}>
                    Sin resultados
                  </p>
                )}
              </div>
            </>
          )}

          {/* Nivel 2: lista de alumnos del profesor */}
          {profesorVisto && (
            <>
              <p style={{ margin: "0 0 0.5rem", fontSize: 11, fontWeight: 700, color: C.textDisabled,
                letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Alumnos ({alumnosFiltrados.length})
              </p>
              <input
                placeholder="Buscar alumno..."
                value={filtroAlu}
                onChange={e => setFiltroAlu(e.target.value)}
                style={inputStyle(C)}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {alumnosFiltrados.map(a => (
                  <AlumnoCard key={a.id} alumno={a} activo={alumnoVisto?.id === a.id}
                    onClick={() => setAlumnoVisto(a)} C={C} size="sm" />
                ))}
                {alumnosFiltrados.length === 0 && (
                  <p style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: "1rem 0" }}>
                    Sin resultados
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Columna derecha */}
        <div style={{ flex: 1, borderLeft: `1px solid ${C.borderSubtle}`, paddingLeft: "1.5rem", minWidth: 0 }}>
          {!profesorVisto && (
            <Placeholder emoji="👥" texto="Selecciona un profesor para ver sus alumnos" C={C} />
          )}
          {profesorVisto && !alumnoVisto && (
            <Placeholder emoji="📋" texto="Selecciona un alumno para ver su progreso" C={C} />
          )}
          {alumnoVisto && <DetalleAlumno alumno={alumnoVisto} C={C} />}
        </div>

      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function AcumuladoHoras({ rol = "alumno" }) {
  const { C } = useTheme();
  const { propio, alumnos, profesores } = useAcumuladoHoras(rol);

  const titulos = {
    alumno:       { titulo: "Mi acumulado de horas", sub: "CU-AH-05 · Alumno"        },
    profesor:     { titulo: "Acumulado de horas",    sub: "CU-AH-05 · Profesor"      },
    coordinacion: { titulo: "Acumulado de horas",    sub: "CU-AH-05 · Coordinación"  },
  };
  const { titulo, sub } = titulos[rol] ?? titulos.alumno;

  return (
    <DashboardLayout titulo={titulo} subtitulo={sub} rol={rol}
      usuario={rol === "alumno" ? "García López Juan Carlos" : rol === "profesor" ? "Dr. Torres Vega" : "Coordinación ESCOM"}>
      {rol === "alumno"  && <VistaAlumno propio={propio} C={C} />}
      {rol === "profesor" && <VistaProfesor alumnos={alumnos} C={C} />}
      {rol === "coordinacion" && <VistaCoordinacion profesores={profesores} C={C} />}
    </DashboardLayout>
  );
}