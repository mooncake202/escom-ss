import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useOfertas } from "./hooks/useOfertas";
import { EstatusBadge } from "./components/EstatusBadge";
import { ModalidadBadge } from "./components/ModalidadBadge";
import { Section } from "./components/Section";
import { OfertaCard } from "./components/OfertaCard";
import { DecisionPanel } from "../CU-PRO-02-revisar-solicitud-oferta/components/DecisionPanel";

export default function ConsultarOfertas() {
  const { C } = useTheme();
  const {
    proyectos, lista, vista, busqueda, filtroModalidad, seleccionado, toast,
    seleccionar, cambiarVista, setBusqueda, setFiltroModalidad, aprobar, rechazar,
  } = useOfertas();

  const hayFiltros = busqueda || filtroModalidad !== "todos";

  const inputStyle = {
    padding: "8px 13px", background: C.bgInput,
    border: `1px solid ${C.borderDefault}`, borderRadius: RADIUS.md,
    color: C.textPrimary, fontSize: 13, outline: "none", fontFamily: "inherit",
  };

  return (
    <DashboardLayout
      titulo="Consultar ofertas"
      subtitulo="CU-PRO-02 / CU-PRO-03 · Coordinación"
      rol="coordinacion"
      usuario="Lic. Morales Vega"
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>

        {/* Toast */}
        {toast && (
          <div style={{
            marginBottom: "1.25rem", padding: "12px 16px", borderRadius: RADIUS.md,
            background: toast.tipo === "danger" ? C.dangerSoft : C.successSoft,
            border: `1px solid ${toast.tipo === "danger" ? C.danger : C.success}`,
            color: toast.tipo === "danger" ? C.danger : C.success,
            fontSize: 13, fontWeight: 500,
          }}>
            {toast.msg}
          </div>
        )}

        {/* Pestañas */}
        <div style={{ display: "flex", marginBottom: "1.25rem", borderBottom: `1px solid ${C.borderDefault}` }}>
          {[
            { key: "solicitudes", label: "Solicitudes de oferta de servicio" },
            { key: "historial",   label: "Historial de servicio" },
          ].map(tab => {
            const activa = vista === tab.key;
            const count = proyectos.filter(p =>
              tab.key === "solicitudes" ? p.estado === "pendiente" : p.estado !== "pendiente"
            ).length;
            return (
              <button key={tab.key} onClick={() => cambiarVista(tab.key)} style={{
                padding: "10px 20px", fontSize: 13, fontWeight: activa ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit",
                background: "transparent", border: "none",
                borderBottom: activa ? `2px solid ${C.accent}` : "2px solid transparent",
                color: activa ? C.accent : C.textMuted, marginBottom: -1,
              }}>
                {tab.label}
                <span style={{
                  marginLeft: 8, padding: "1px 7px", borderRadius: RADIUS.full,
                  fontSize: 11, fontWeight: 700,
                  background: activa ? C.accentSoft : C.bgInput,
                  color: activa ? C.accentText : C.textDisabled,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "center" }}>
          <input
            placeholder="Buscar por nombre de oferta o profesor..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 220 }}
          />
          <select value={filtroModalidad} onChange={e => setFiltroModalidad(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="todos">Todas las modalidades</option>
            <option value="grupal">Grupal</option>
            <option value="individual">Individual</option>
          </select>
          {hayFiltros && (
            <button onClick={() => { setBusqueda(""); setFiltroModalidad("todos"); }}
              style={{ ...inputStyle, cursor: "pointer", color: C.textMuted, background: "transparent" }}>
              Limpiar filtros
            </button>
          )}
        </div>

        <p style={{ margin: "0 0 1rem", fontSize: 12, color: C.textDisabled }}>
          {lista.length === 0
            ? hayFiltros ? "No se encontraron ofertas que coincidan con los criterios aplicados."
                         : "No hay ofertas registradas en esta categoría."
            : `Mostrando ${lista.length} oferta${lista.length !== 1 ? "s" : ""}${hayFiltros ? " (filtros activos)" : ""}`
          }
        </p>

        {lista.length === 0 ? (
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`,
            padding: "4rem 1rem", textAlign: "center",
          }}>
            <p style={{ fontSize: 28, margin: "0 0 0.5rem" }}>📄</p>
            <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
              {hayFiltros ? "No se encontraron ofertas con los criterios de búsqueda."
                          : "No hay ofertas registradas en esta categoría."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: seleccionado ? "340px 1fr" : "1fr", gap: "1.25rem", alignItems: "start" }}>

            {/* Lista */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {lista.map(p => (
                <OfertaCard key={p.id} oferta={p} seleccionado={seleccionado} onSelect={seleccionar} />
              ))}
            </div>

            {/* Panel de detalle */}
            {seleccionado && (
              <div style={{
                background: C.bgCard, borderRadius: RADIUS.lg,
                border: `1px solid ${C.borderDefault}`, padding: "1.5rem",
                position: "sticky", top: 16,
              }}>
                {/* Encabezado */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.textPrimary, lineHeight: 1.4 }}>
                      {seleccionado.nombre}
                    </h2>
                    {seleccionado.tituloSISS && (
                      <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>SISS: {seleccionado.tituloSISS}</p>
                    )}
                  </div>
                  <button onClick={() => seleccionar(seleccionado)}
                    style={{ background: "transparent", border: "none", color: C.textDisabled, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                    ×
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
                  <EstatusBadge estado={seleccionado.estado} />
                  <ModalidadBadge modalidad={seleccionado.modalidad} />
                  <span style={{ fontSize: 12, color: C.textMuted }}>{seleccionado.profesor}</span>
                </div>

                <hr style={{ border: "none", borderTop: `1px solid ${C.borderDefault}`, margin: "0 0 1.25rem" }} />

                <Section label="Descripción">
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{seleccionado.descripcion}</p>
                </Section>

                <Section label="Cupos">
                  <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                    <div style={{
                      padding: "8px 14px", borderRadius: RADIUS.md, textAlign: "center",
                      background: C.bgInput, border: `1px solid ${C.borderDefault}`, minWidth: 100,
                    }}>
                      <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        {seleccionado.esInvestigador ? "Cupos investigador" : "Cupos registrados"}
                      </p>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.textPrimary }}>{seleccionado.cuposRegistrados}</p>
                    </div>
                    {seleccionado.estado !== "pendiente" && (
                      <div style={{
                        padding: "8px 14px", borderRadius: RADIUS.md, textAlign: "center",
                        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", minWidth: 100,
                      }}>
                        <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          Cupos disponibles
                        </p>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#10b981" }}>{seleccionado.cuposDisponibles}</p>
                      </div>
                    )}
                  </div>
                </Section>

                {seleccionado.perfilDeseado?.length > 0 && (
                  <Section label="Perfil de carrera asociado">
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {seleccionado.perfilDeseado.map(c => (
                        <span key={c} style={{
                          padding: "4px 12px", borderRadius: RADIUS.full, fontSize: 12, fontWeight: 700,
                          background: "rgba(99,102,241,0.1)", color: "#818cf8",
                          border: "1px solid rgba(99,102,241,0.2)",
                        }}>{c}</span>
                      ))}
                    </div>
                  </Section>
                )}

                <Section label="Actividades">
                  <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {seleccionado.actividades.map((act, i) => (
                      <li key={i} style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{act}</li>
                    ))}
                  </ol>
                </Section>

                {seleccionado.estado === "rechazado" && seleccionado.motivoRechazo && (
                  <Section label="Motivo de rechazo" last>
                    <div style={{
                      padding: "10px 14px", borderRadius: RADIUS.md,
                      background: C.dangerSoft, border: `1px solid ${C.danger}`,
                      fontSize: 13, color: C.danger, lineHeight: 1.6,
                    }}>
                      {seleccionado.motivoRechazo}
                    </div>
                  </Section>
                )}

                {/* Sección de decisión — CU-PRO-02 */}
                {vista === "solicitudes" && (
                  <DecisionPanel
                    key={seleccionado.id}
                    oferta={seleccionado}
                    onAprobar={aprobar}
                    onRechazar={rechazar}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}