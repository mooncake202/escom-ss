import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useHistorialOfertas } from "./hooks/useHistorialOfertas";
import { EstatusBadge } from "./components/EstatusBadge";
import { TipoBadge } from "./components/TipoBadge";
import { OfertaCard } from "./components/OfertaCard";
import { FormCorreccion } from "./components/FormCorreccion";
import { CerrarOfertaPanel } from "../CU-PRO-04-gestionar-estado-oferta/components/CerrarOfertaPanel";

export default function HistorialOfertas() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const {
    proyectos, ofertasFiltradas, seleccionada,
    editando, formEdicion, erroresEdicion, reenviado,
    filtroEstado, filtroModalidad,
    seleccionar, cerrarPanel, cancelarEdicion, cerrarOferta, iniciarEdicion,
    handleChangeEdicion, toggleCarreraEdicion, submitEdicion,
    setFiltroEstado, setFiltroModalidad,
  } = useHistorialOfertas();

  const panelAbierto = seleccionada !== null;

  const cuposDisponibles = seleccionada
    ? (seleccionada.cuposDisponibles ?? ((seleccionada.cupos ?? 1) - (seleccionada.cuposOcupados || 0)))
    : 0;

  const selectStyle = {
    padding: "8px 12px", borderRadius: RADIUS.md,
    background: C.bgInput, border: `1px solid ${C.borderDefault}`,
    color: C.textPrimary, fontSize: 13, fontFamily: "inherit",
    cursor: "pointer", outline: "none",
  };

  return (
    <DashboardLayout
      titulo="Mis ofertas"
      subtitulo="CU-PRO-05 · Profesor"
      rol="profesor"
      usuario="Dr. Torres Vega"
    >
      <div style={{ maxWidth: panelAbierto ? 1160 : 860, margin: "0 auto", width: "100%" }}>

        {/* Encabezado */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem",
        }}>
          <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
            {proyectos.length} oferta{proyectos.length !== 1 ? "s" : ""} registrada{proyectos.length !== 1 ? "s" : ""}
          </p>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/profesor/proyectos/individual")} style={{
              padding: "9px 20px", borderRadius: RADIUS.md,
              background: C.accent, border: "none",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Registrar oferta individual</button>
            <button onClick={() => navigate("/profesor/proyectos/registrar")} style={{
              padding: "9px 20px", borderRadius: RADIUS.md,
              background: C.accent, border: "none",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Registrar oferta de proyecto</button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={selectStyle}>
            <option value="todos">Todos los estados</option>
            <option value="en_revision">En revisión</option>
            <option value="activo">Activo</option>
            <option value="rechazada">Rechazada</option>
            <option value="concluido">Concluido</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <select value={filtroModalidad} onChange={e => setFiltroModalidad(e.target.value)} style={selectStyle}>
            <option value="todos">Todas las modalidades</option>
            <option value="individual">Individual</option>
            <option value="proyecto">Proyecto</option>
          </select>
          <p style={{ margin: "auto 0", fontSize: 13, color: C.textMuted }}>
            Mostrando {ofertasFiltradas.length} oferta{ofertasFiltradas.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Layout principal */}
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>

          {/* Lista */}
          <div style={{ flexShrink: 0, width: panelAbierto ? 420 : "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {proyectos.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: C.textMuted, fontSize: 14 }}>
                No tienes ofertas registradas aún.
              </div>
            )}
            {proyectos.length > 0 && ofertasFiltradas.length === 0 && (
              <div style={{ textAlign: "center", padding: "2.5rem", color: C.textMuted, fontSize: 14 }}>
                No hay ofertas con el filtro seleccionado.
              </div>
            )}
            {ofertasFiltradas.map(p => (
              <OfertaCard key={p.id} oferta={p} seleccionadaId={seleccionada?.id} onSelect={seleccionar} />
            ))}
          </div>

          {/* Panel de detalle */}
          {seleccionada && (
            <div style={{
              flex: 1, minWidth: 0,
              background: C.bgCard, borderRadius: RADIUS.xl,
              border: `1px solid ${C.borderDefault}`,
              position: "sticky", top: 24,
              maxHeight: "calc(100vh - 140px)", overflowY: "auto",
            }}>
              {/* Cabecera */}
              <div style={{
                padding: "1.5rem 1.5rem 1.25rem",
                borderBottom: `1px solid ${C.borderDefault}`,
                position: "sticky", top: 0, background: C.bgCard, zIndex: 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
                      {editando ? "Corrección de oferta" : seleccionada.titulo}
                    </h3>
                    {!editando && seleccionada.tituloSISS && (
                      <p style={{ margin: "0 0 10px", fontSize: 12, color: C.textDisabled }}>
                        SISS: {seleccionada.tituloSISS}
                      </p>
                    )}
                    {!editando && (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        <EstatusBadge estatus={seleccionada.estatus} />
                        <TipoBadge tipo={seleccionada.tipo} />
                        {seleccionada.fechaRegistro && (
                          <span style={{ fontSize: 12, color: C.textDisabled }}>
                            {new Date(seleccionada.fechaRegistro + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={cerrarPanel} style={{
                    background: "transparent", border: "none", cursor: "pointer", padding: "4px 6px",
                    color: C.textMuted, fontSize: 16, lineHeight: 1, flexShrink: 0, borderRadius: RADIUS.md,
                  }}>×</button>
                </div>
              </div>

              {/* Cuerpo */}
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* Vista detalle */}
                {!editando && (
                  <>
                    {reenviado && (
                      <div style={{
                        padding: "10px 14px", borderRadius: RADIUS.md,
                        background: C.successSoft, border: `1px solid ${C.success}`,
                        fontSize: 13, color: C.success, fontWeight: 600,
                      }}>
                        Oferta reenviada. Quedó con estado "Pendiente de revisión".
                      </div>
                    )}

                    {seleccionada.descripcion && (
                      <div>
                        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Descripción</p>
                        <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{seleccionada.descripcion}</p>
                      </div>
                    )}

                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Cupos</p>
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <div style={{ flex: 1, padding: "0.875rem 1rem", borderRadius: RADIUS.lg, background: C.bgInput, border: `1px solid ${C.borderDefault}` }}>
                          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cupos registrados</p>
                          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.textPrimary, lineHeight: 1 }}>{seleccionada.cupos ?? 1}</p>
                        </div>
                        <div style={{
                          flex: 1, padding: "0.875rem 1rem", borderRadius: RADIUS.lg,
                          background: cuposDisponibles > 0 ? C.successSoft : C.bgInput,
                          border: `1px solid ${cuposDisponibles > 0 ? C.success : C.borderDefault}`,
                        }}>
                          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: cuposDisponibles > 0 ? C.success : C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cupos disponibles</p>
                          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: cuposDisponibles > 0 ? C.success : C.textPrimary, lineHeight: 1 }}>{cuposDisponibles}</p>
                        </div>
                      </div>
                    </div>

                    {seleccionada.carreras?.length > 0 && (
                      <div>
                        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Perfil de carrera deseado</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {seleccionada.carreras.map(c => (
                            <span key={c} style={{ fontSize: 13, color: C.textMuted }}>
                              {{ ISC: "ISC — Ingeniería en Sistemas Computacionales", LCD: "LCD — Licenciatura en Ciencia de Datos", IIA: "IIA — Ingeniería en Inteligencia Artificial" }[c] || c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {seleccionada.alumnos?.length > 0 && (
                      <div>
                        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Alumnos asignados</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          {seleccionada.alumnos.map((a, i) => (
                            <span key={i} style={{
                              padding: "3px 10px", borderRadius: RADIUS.full,
                              background: C.bgInput, color: C.textPrimary,
                              fontSize: 12, border: `1px solid ${C.borderDefault}`,
                            }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {seleccionada.estatus === "rechazada" && seleccionada.motivoRechazo && (
                      <div style={{
                        padding: "0.875rem 1rem", borderRadius: RADIUS.md,
                        background: C.dangerSoft, border: `1px solid ${C.danger}`,
                      }}>
                        <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.07em" }}>Motivo de rechazo</p>
                        <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>{seleccionada.motivoRechazo}</p>
                      </div>
                    )}

                    {seleccionada.estatus === "rechazada" && (
                      <button onClick={() => iniciarEdicion(seleccionada)} style={{
                        width: "100%", padding: "10px", borderRadius: RADIUS.md,
                        background: C.accent, border: "none",
                        color: "#fff", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>Corregir y reenviar</button>
                    )}

                    {/* Gestión de estado — CU-PRO-04 */}
                    <CerrarOfertaPanel
                      key={seleccionada.id}
                      oferta={seleccionada}
                      onCerrar={cerrarOferta}
                    />
                  </>
                )}

                {/* Formulario de corrección — CU-PRO-05 flujo corrección */}
                {editando && (
                  <FormCorreccion
                    oferta={seleccionada}
                    form={formEdicion}
                    errores={erroresEdicion}
                    onChange={handleChangeEdicion}
                    onToggleCarrera={toggleCarreraEdicion}
                    onCancelar={cancelarEdicion}
                    onSubmit={() => submitEdicion(seleccionada)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}