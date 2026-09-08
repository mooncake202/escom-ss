import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { DashboardLayout }       from "@/components/layout/DashboardLayout";
import { AlumnoCard }            from "./components/AlumnoCard";
import { ActividadRow }          from "./components/ActividadRow";
import { useAsignarActividades } from "./hooks/useAsignarActividades";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import { SelectField } from "@/components/ui/FormFields";
import { useState } from "react";

const TITULO_MODO = {
  crear: "Nueva actividad",
  editar: "Editar actividad",
  "extender-fecha": "Extender fecha límite",
};

const BOTON_MODO = {
  crear: "Registrar actividad",
  editar: "Guardar cambios",
  "extender-fecha": "Extender fecha",
};

export default function AsignarActividades() {
  const { C } = useTheme();
  const { usuario: sesion } = useSesion();
  const [filtroProyecto, setFiltroProyecto] = useState("todas");
  const [filtroCarrera, setFiltroCarrera] = useState([]);
  const [acordeonVencidasAbierto, setAcordeonVencidasAbierto] = useState(false);
  const {
    alumnos, cargandoAlumnos,
    alumnoSeleccionado, cargandoDetalle,
    actividadEnEdicion,
    form, errores, loading, exitoso,
    modoFormulario,
    seleccionarAlumno, handleChange,
    abrirCrear, abrirEditar, abrirExtenderFecha, cerrarFormulario,
    guardar, eliminarActividad,
  } = useAsignarActividades();

  const proyectos = [...new Set(alumnos.map(a => a.proyecto).filter(Boolean))];
  const carreras = ["ISC", "IA", "LCD"];

  const toggleCarrera = (c) => {
    setFiltroCarrera(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const alumnosFiltrados = alumnos.filter(a => {
    const matchProyecto = filtroProyecto === "todas" || a.proyecto === filtroProyecto;
    const matchCarrera = filtroCarrera.length === 0 || filtroCarrera.includes(a.carrera);
    return matchProyecto && matchCarrera;
  });

  const periodoInicioFormateado = alumnoSeleccionado?.periodoInicio
    ? new Date(alumnoSeleccionado.periodoInicio).toLocaleDateString("es-MX", { timeZone: "UTC" })
    : null;

  // La lista general excluye vencidas — esas viven aparte, en el acordeón,
  // para no duplicarlas en dos lugares.
  const actividadesActivas = alumnoSeleccionado?.actividades.filter(a => a.estado !== "vencida") ?? [];
  const actividadesVencidas = alumnoSeleccionado?.actividades.filter(a => a.estado === "vencida") ?? [];

  return (
    <DashboardLayout
      titulo="Asignar actividades"
      
      rol="profesor"
      usuario={nombreCompletoSesion(sesion)}
    >
      <div style={{ display: "grid", gridTemplateColumns: "500px 1fr", gap: "1.5rem", height: "calc(100vh - 56px - 3.5rem)", minHeight: 0 }}>

        {/* ── Columna izquierda: lista de alumnos ── */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>

          {/* FILTROS */}
          <div style={{ marginBottom: "1rem" }}>

            {/* PROYECTOS — selección única, a diferencia de carreras */}
            <div style={{ maxWidth: 260, marginBottom: "0.5rem" }}>
              <SelectField
                C={C}
                value={filtroProyecto}
                onChange={e => setFiltroProyecto(e.target.value)}
              >
                <option value="todas">Todos los proyectos</option>
                {proyectos.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </SelectField>
            </div>

            {/* CARRERAS */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {carreras.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCarrera(c)}
                  style={{
                    padding: "4px 14px",
                    borderRadius: "999px",
                    border: `1px solid ${filtroCarrera.includes(c) ? C.accent : C.borderDefault}`,
                    background: filtroCarrera.includes(c) ? C.accent : "transparent",
                    color: filtroCarrera.includes(c) ? "#fff" : C.textMuted,
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

          </div>

          <p style={{ margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700, color: C.textDisabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Mis alumnos ({alumnos.length})
          </p>

          {cargandoAlumnos ? (
            <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "2rem" }}>Cargando...</p>
          ) : alumnos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>📭</p>
              <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>No tienes alumnos bajo tu supervisión</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
              {alumnosFiltrados.map(a => (
                <AlumnoCard
                  key={a.solicitudId} alumno={a} C={C}
                  seleccionado={alumnoSeleccionado?.solicitudId === a.solicitudId}
                  onSeleccionar={seleccionarAlumno}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Columna derecha: detalle + formulario ── */}
        <div style={{ overflowY: "auto", minHeight: 0 }}>
          {!alumnoSeleccionado ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>👈</p>
              <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>
                {cargandoDetalle ? "Cargando..." : "Selecciona un alumno para ver sus actividades"}
              </p>
            </div>
          ) : (
            <div>
              {/* Header del alumno seleccionado */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{alumnoSeleccionado.nombre}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>{alumnoSeleccionado.correoInst}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                    Proyecto: {alumnoSeleccionado.proyecto}
                    {periodoInicioFormateado && ` · Inicio de servicio social: ${periodoInicioFormateado}`}
                  </p>
                </div>

                <button
                  onClick={abrirCrear}
                  style={{ padding: "9px 18px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600, cursor: "pointer", background: GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: SHADOWS.accent }}
                >
                  + Asignar actividad
                </button>
              </div>

              {/* Toast éxito */}
              {exitoso && (
                <div style={{ marginBottom: "1.25rem", padding: "10px 14px", borderRadius: RADIUS.md, background: C.successSoft, border: `1px solid ${C.success}`, color: C.success, fontSize: 13, fontWeight: 500 }}>
                  ✓ Cambios guardados correctamente.
                </div>
              )}

              {/* Formulario — modo crear / editar / extender-fecha */}
              {modoFormulario && (
                <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.accent}`, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.accentText, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {TITULO_MODO[modoFormulario]}
                    </p>
                    <button onClick={cerrarFormulario} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDisabled, fontSize: 18, padding: 2 }}>✕</button>
                  </div>

                  {errores.general && (
                    <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.danger }}>{errores.general}</p>
                  )}

                  {modoFormulario === "extender-fecha" ? (
                    <>
                      <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textMuted }}>
                        Fecha límite actual: {new Date(actividadEnEdicion.fecha_limite).toLocaleDateString("es-MX", { timeZone: "UTC" })}
                      </p>
                      <div style={{ marginBottom: "1.25rem" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                          Nueva fecha límite *
                        </label>
                        <input
                          type="date"
                          name="fecha_limite"
                          value={form.fecha_limite}
                          onChange={handleChange}
                          style={{ width: "100%", padding: "10px", background: C.bgInput, border: `1px solid ${errores.fecha_limite ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                        />
                        {errores.fecha_limite && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.fecha_limite}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Título */}
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                          Título *
                        </label>
                        <input
                          name="titulo"
                          value={form.titulo}
                          onChange={handleChange}
                          placeholder="Ej. Desarrollo del módulo de login"
                          style={{ width: "100%", padding: "10px 14px", background: C.bgInput, border: `1px solid ${errores.titulo ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                        />
                        {errores.titulo && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.titulo}</p>}
                      </div>

                      {/* Descripción */}
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                          Descripción *
                        </label>
                        <textarea
                          name="descripcion"
                          value={form.descripcion}
                          onChange={handleChange}
                          placeholder="Describe detalladamente lo que el alumno debe realizar..."
                          rows={3}
                          style={{ width: "100%", padding: "10px 14px", background: C.bgInput, border: `1px solid ${errores.descripcion ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }}
                        />
                        {errores.descripcion && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.descripcion}</p>}
                      </div>

                      {/* Fecha límite */}
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em" }}>
                          Fecha límite *
                        </label>
                        <input
                          type="date"
                          name="fecha_limite"
                          value={form.fecha_limite}
                          onChange={handleChange}
                          style={{
                            background: C.bgInput, border: `1px solid ${errores.fecha_limite ? C.danger : C.borderDefault}`, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                            width: "100%",
                            padding: "10px",
                            borderRadius: RADIUS.md
                          }}
                        />
                        {errores.fecha_limite && (
                          <p style={{ fontSize: 12, color: C.danger }}>
                            {errores.fecha_limite}
                          </p>
                        )}
                      </div>

                      {/* Entregable esperado — ahora obligatorio */}
                      <div style={{ marginBottom: "1.25rem" }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                          Entregable esperado *
                        </label>
                        <input
                          name="entregable_esperado"
                          value={form.entregable_esperado}
                          onChange={handleChange}
                          placeholder="Ej. Documento PDF con el análisis completo"
                          style={{ width: "100%", padding: "10px 14px", background: C.bgInput, border: `1px solid ${errores.entregable_esperado ? C.danger : C.borderDefault}`, borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                        />
                        {errores.entregable_esperado && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.danger }}>{errores.entregable_esperado}</p>}
                      </div>
                    </>
                  )}

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={cerrarFormulario}
                      style={{ flex: 1, padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: "inherit" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={guardar}
                      disabled={loading}
                      style={{ flex: 2, padding: "10px", borderRadius: RADIUS.md, fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", background: loading ? C.borderDefault : GRADIENTS.primary, border: "none", color: "#fff", fontFamily: "inherit", boxShadow: loading ? "none" : SHADOWS.accent }}
                    >
                      {loading ? "Guardando..." : BOTON_MODO[modoFormulario]}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de actividades — RN-AH-05 (excluye vencidas, ver acordeón abajo) */}
              <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.25rem 1.5rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                  Actividades asignadas
                </p>
                <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textMuted }}>
                  {actividadesActivas.length === 0
                    ? "Aún no has asignado actividades a este alumno"
                    : `${actividadesActivas.length} actividad${actividadesActivas.length !== 1 ? "es" : ""}`
                  }
                </p>

                {actividadesActivas.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: C.textDisabled, fontSize: 13 }}>
                    El alumno no podrá registrar bitácoras hasta que asignes al menos una actividad.
                  </div>
                ) : (
                  actividadesActivas.map(act => (
                    <ActividadRow
                      key={act.id} actividad={act} C={C}
                      onEditar={abrirEditar}
                      onEliminar={eliminarActividad}
                      onExtenderFecha={abrirExtenderFecha}
                    />
                  ))
                )}
              </div>

              {/* Acordeón de actividades vencidas — colapsado por defecto,
                  solo aparece si hay al menos una. Reutiliza ActividadRow
                  tal cual, sin estilo nuevo. */}
              {actividadesVencidas.length > 0 && (
                <div style={{ marginTop: "1rem", background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderSubtle}`, padding: "1.25rem 1.5rem" }}>
                  <button
                    onClick={() => setAcordeonVencidasAbierto(v => !v)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: 0, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#EF4444", fontSize: 13, fontWeight: 700 }}
                  >
                    <span>{acordeonVencidasAbierto ? "▾" : "▸"}</span>
                    {actividadesVencidas.length} actividad{actividadesVencidas.length !== 1 ? "es" : ""} vencida{actividadesVencidas.length !== 1 ? "s" : ""}
                  </button>

                  {acordeonVencidasAbierto && (
                    <div style={{ marginTop: "1rem" }}>
                      {actividadesVencidas.map(act => (
                        <ActividadRow
                          key={act.id} actividad={act} C={C}
                          onEditar={abrirEditar}
                          onEliminar={eliminarActividad}
                          onExtenderFecha={abrirExtenderFecha}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
