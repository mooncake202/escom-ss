import { useTheme, RADIUS }         from "@/themes/colors";
import { DashboardLayout }           from "@/components/layout/DashboardLayout";
import { Breadcrumb }                from "./components/Breadcrumb";
import { ProfesorCard }              from "./components/ProfesorCard";
import { AlumnoCard }                from "./components/AlumnoCard";
import { AlumnoDetalle }             from "./components/AlumnoDetalle";
import { useConsultarUsuarios }      from "./hooks/useConsultarUsuarios";

function EmptyState({ msg, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "2.5rem", textAlign: "center",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: "50%", background: C.bgInput,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 0.875rem",
      }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
          stroke={C.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>{msg}</p>
    </div>
  );
}

function SectionLabel({ count, singular, plural, C }) {
  return (
    <p style={{
      margin: "0 0 0.875rem", fontSize: 12, fontWeight: 700,
      color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em",
    }}>
      {count} {count !== 1 ? plural : singular}
    </p>
  );
}

export default function ConsultarUsuariosAsignados({ rol }) {
  const { C } = useTheme();
  const {
    usuario, nivel,
    profesoresFiltrados, profesorSel,
    alumnosActuales, alumnoSel,
    busqueda, setBusqueda,
    handleSeleccionarProfesor, handleSeleccionarAlumno,
    breadcrumbs,
  } = useConsultarUsuarios(rol);

  const titulo    = rol === "profesor" ? "Mis alumnos asignados" : "Usuarios asignados";
  const subtitulo = `CU-ADM-17 · ${rol === "profesor" ? "Profesor" : "Coordinación"}`;

  return (
    <DashboardLayout titulo={titulo} subtitulo={subtitulo} rol={rol} usuario={usuario.nombre}>
      <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>

        {/* Breadcrumb (RF-ADM-05) */}
        <Breadcrumb items={breadcrumbs} C={C} />

        {/* ── Coordinador · Nivel 1: lista de profesores (RF-ADM-02) ── */}
        {rol === "coordinacion" && nivel === 1 && (
          <>
            <div style={{
              background: C.bgCard, borderRadius: RADIUS.lg,
              border: `1px solid ${C.borderDefault}`,
              padding: "0.875rem 1.25rem", marginBottom: "1.25rem",
            }}>
              <input
                type="text"
                placeholder="Buscar por nombre de profesor…"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "6px 10px", borderRadius: RADIUS.md, fontSize: 12,
                  background: C.bgInput,
                  border: `1px solid ${busqueda ? C.accent : C.borderDefault}`,
                  color: C.textPrimary, fontFamily: "inherit", outline: "none",
                }}
              />
            </div>

            <SectionLabel count={profesoresFiltrados.length} singular="profesor" plural="profesores" C={C} />

            {profesoresFiltrados.length === 0 ? (
              <EmptyState
                msg={busqueda.trim()
                  ? "No hay profesores que coincidan con la búsqueda."
                  : "No hay profesores con alumnos asignados en el periodo actual."}
                C={C}
              />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "0.75rem",
              }}>
                {profesoresFiltrados.map(p => (
                  <ProfesorCard key={p.id} profesor={p} onSeleccionar={handleSeleccionarProfesor} C={C} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Coordinador · Nivel 2: alumnos del profesor (RF-ADM-03) ── */}
        {rol === "coordinacion" && nivel === 2 && (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem",
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                {profesorSel.nombre}
              </p>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: RADIUS.full,
                background: C.accentSoft, border: `1px solid ${C.accent}`, color: C.accentText,
              }}>
                {alumnosActuales.length} alumno{alumnosActuales.length !== 1 ? "s" : ""}
              </span>
            </div>

            {alumnosActuales.length === 0 ? (
              <EmptyState msg="Este profesor no tiene alumnos asignados en el periodo actual." C={C} />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "0.75rem",
              }}>
                {alumnosActuales.map(a => (
                  <AlumnoCard key={a.id} alumno={a} onSeleccionar={handleSeleccionarAlumno} C={C} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Profesor · Nivel 1: sus alumnos (RF-ADM-01) ── */}
        {rol === "profesor" && nivel === 1 && (
          <>
            <SectionLabel
              count={alumnosActuales.length}
              singular="alumno asignado"
              plural="alumnos asignados"
              C={C}
            />

            {alumnosActuales.length === 0 ? (
              <EmptyState msg="No tienes alumnos asignados en el periodo actual." C={C} />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "0.75rem",
              }}>
                {alumnosActuales.map(a => (
                  <AlumnoCard key={a.id} alumno={a} onSeleccionar={handleSeleccionarAlumno} C={C} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Detalle del alumno — Profesor nivel 2 / Coordinador nivel 3 (RF-ADM-04) ── */}
        {((rol === "profesor" && nivel === 2) || (rol === "coordinacion" && nivel === 3)) && alumnoSel && (
          <AlumnoDetalle alumno={alumnoSel} C={C} />
        )}

      </div>
    </DashboardLayout>
  );
}
