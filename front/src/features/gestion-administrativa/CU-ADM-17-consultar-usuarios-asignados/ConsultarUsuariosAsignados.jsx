import { useTheme, RADIUS }         from "@/themes/colors";
import { DashboardLayout }           from "@/components/layout/DashboardLayout";
import { Breadcrumb }                from "./components/Breadcrumb";
import { ProfesorCard }              from "./components/ProfesorCard";
import { AlumnoCard }                from "./components/AlumnoCard";
import { AlumnoDetalle }             from "./components/AlumnoDetalle";
import { useConsultarUsuarios }      from "./hooks/useConsultarUsuarios";

const REJILLA = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: "0.75rem",
};

function Aviso({ children, C }) {
  return (
    <div style={{
      background: C.bgCard, borderRadius: RADIUS.lg,
      border: `1px solid ${C.borderDefault}`,
      padding: "2.5rem", textAlign: "center",
    }}>
      {children}
    </div>
  );
}

function Cargando({ msg, C }) {
  return (
    <Aviso C={C}>
      <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>{msg}</p>
    </Aviso>
  );
}

function ErrorCarga({ error, onReintentar, C }) {
  return (
    <Aviso C={C}>
      <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{error}</p>
      <button onClick={onReintentar} style={{
        padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
        color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      }}>
        Reintentar
      </button>
    </Aviso>
  );
}

function EmptyState({ msg, C }) {
  return (
    <Aviso C={C}>
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
    </Aviso>
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

// Lista de alumnos con sus tres estados. La comparten la vista del profesor (nivel 1) y la de
// coordinación (nivel 2): es la misma tarjeta sobre la misma respuesta del backend.
function ListaAlumnos({ carga, alumnos, onSeleccionar, onReintentar, vacio, C }) {
  if (carga.estado === "cargando") return <Cargando msg="Cargando alumnos..." C={C} />;
  if (carga.estado === "error") return <ErrorCarga error={carga.error} onReintentar={onReintentar} C={C} />;
  if (alumnos.length === 0) return <EmptyState msg={vacio} C={C} />;

  return (
    <div style={REJILLA}>
      {alumnos.map((a) => (
        <AlumnoCard key={a.boleta} alumno={a} onSeleccionar={onSeleccionar} C={C} />
      ))}
    </div>
  );
}

export default function ConsultarUsuariosAsignados({ rol }) {
  const { C } = useTheme();
  const {
    nombreUsuario, esProfesor, nivel,
    carga, recargar,
    profesoresFiltrados, profesorSel,
    alumnos, cargaAlumnos, reintentarAlumnos,
    detalle, cargaDetalle, reintentarDetalle,
    busqueda, setBusqueda,
    seleccionarProfesor, seleccionarAlumno,
    breadcrumbs,
  } = useConsultarUsuarios(rol);

  const titulo = esProfesor ? "Mis alumnos asignados" : "Usuarios asignados";
  const subtitulo = esProfesor
    ? "Consulta de alumnos que supervisas"
    : "Consulta de profesores y sus alumnos asignados";

  const enDetalle = (esProfesor && nivel === 2) || (!esProfesor && nivel === 3);

  return (
    <DashboardLayout titulo={titulo} subtitulo={subtitulo} rol={rol} usuario={nombreUsuario}>
      <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>

        <Breadcrumb items={breadcrumbs} C={C} />

        {/* ── Coordinación · Nivel 1: profesores ── */}
        {!esProfesor && nivel === 1 && (
          <>
            {carga.estado === "cargando" && <Cargando msg="Cargando profesores..." C={C} />}
            {carga.estado === "error" && <ErrorCarga error={carga.error} onReintentar={recargar} C={C} />}

            {carga.estado === "listo" && (
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
                    onChange={(e) => setBusqueda(e.target.value)}
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
                      : "Todavía no hay profesores registrados."}
                    C={C}
                  />
                ) : (
                  <div style={REJILLA}>
                    {profesoresFiltrados.map((p) => (
                      <ProfesorCard key={p.id} profesor={p} onSeleccionar={seleccionarProfesor} C={C} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Coordinación · Nivel 2: alumnos del profesor elegido ── */}
        {!esProfesor && nivel === 2 && profesorSel && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                {profesorSel.nombreCompleto}
              </p>
              <span style={{ fontSize: 12, color: C.textMuted }}>{profesorSel.departamento}</span>
            </div>

            <ListaAlumnos
              carga={cargaAlumnos}
              alumnos={alumnos}
              onSeleccionar={seleccionarAlumno}
              onReintentar={reintentarAlumnos}
              vacio="Este profesor no tiene alumnos asignados."
              C={C}
            />
          </>
        )}

        {/* ── Profesor · Nivel 1: sus alumnos ── */}
        {esProfesor && nivel === 1 && (
          <>
            {carga.estado === "listo" && (
              <SectionLabel
                count={alumnos.length}
                singular="alumno asignado"
                plural="alumnos asignados"
                C={C}
              />
            )}
            <ListaAlumnos
              carga={carga}
              alumnos={alumnos}
              onSeleccionar={seleccionarAlumno}
              onReintentar={recargar}
              vacio="No tienes alumnos asignados."
              C={C}
            />
          </>
        )}

        {/* ── Detalle del alumno — profesor nivel 2 / coordinación nivel 3 ── */}
        {enDetalle && (
          <>
            {cargaDetalle.estado === "cargando" && <Cargando msg="Cargando la información del alumno..." C={C} />}
            {cargaDetalle.estado === "error" && (
              <ErrorCarga error={cargaDetalle.error} onReintentar={reintentarDetalle} C={C} />
            )}
            {cargaDetalle.estado === "listo" && detalle && (
              <AlumnoDetalle detalle={detalle} mostrarProfesor={!esProfesor} C={C} />
            )}
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
