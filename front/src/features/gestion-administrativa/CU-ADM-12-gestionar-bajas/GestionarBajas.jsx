import { useTheme, RADIUS }       from "@/themes/colors";
import { DashboardLayout }         from "@/components/layout/DashboardLayout";
import { SolicitudCard }           from "./components/SolicitudCard";
import { SolicitudDetalle }        from "./components/SolicitudDetalle";
import { useGestionarBajas, VISTA } from "./hooks/useGestionarBajas";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// Pendientes | Resueltas, mismo criterio que el resto de bandejas de Coordinación.
function Pestana({ activa, etiqueta, total, onClick, C }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: RADIUS.full, cursor: "pointer",
        fontSize: 12, fontWeight: 700, fontFamily: "inherit",
        background: activa ? C.accent : "transparent",
        border: `1px solid ${activa ? C.accent : C.borderDefault}`,
        color: activa ? "#fff" : C.textMuted,
        transition: "all 0.15s",
      }}
    >
      {etiqueta} ({total})
    </button>
  );
}

export default function GestionarBajas() {
  const { C } = useTheme();
  const { usuario } = useSesion();
  const {
    carga, recargar,
    vista, cambiarVista, totales,
    solicitudesFiltradas, seleccionada, panel, toast, procesando,
    busqueda, setBusqueda, hayFiltroActivo, limpiarFiltros,
    comentario, errores,
    seleccionarSolicitud,
    handleAprobar, handleRechazar, handleCancelarAccion,
    handleComentarioChange,
    handleConfirmarAprobacion, handleConfirmarRechazo,
  } = useGestionarBajas();

  return (
    <DashboardLayout
      titulo="Gestionar solicitudes de baja"
      subtitulo="CU-ADM-12 · Coordinación"
      rol="coordinacion"
      usuario={nombreCompletoSesion(usuario)}
    >
      <div style={{ maxWidth: 980, margin: "0 auto", width: "100%" }}>

        {/* Toast */}
        {toast && (
          <div style={{
            marginBottom: "1.25rem", padding: "11px 16px", borderRadius: RADIUS.md,
            background: toast.tipo === "danger" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
            border: `1px solid ${toast.tipo === "danger" ? "#ef4444" : "#22c55e"}`,
            color: toast.tipo === "danger" ? "#ef4444" : "#22c55e",
            fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Filtros */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "0.875rem 1.25rem", marginBottom: "1.25rem",
          display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
        }}>
          {/* Búsqueda de texto */}
          <input
            type="text"
            placeholder="Buscar por nombre o boleta…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              flex: "1 1 200px", minWidth: 180,
              padding: "6px 10px", borderRadius: RADIUS.md, fontSize: 12,
              background: C.bgInput,
              border: `1px solid ${busqueda ? C.accent : C.borderDefault}`,
              color: C.textPrimary, fontFamily: "inherit", outline: "none",
            }}
          />

          {/* Separador */}
          <div style={{ width: 1, height: 24, background: C.borderDefault, flexShrink: 0 }} />

          {/* Pendientes | Resueltas */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Pestana activa={vista === VISTA.PENDIENTES} etiqueta="Pendientes" total={totales.pendientes}
              onClick={() => cambiarVista(VISTA.PENDIENTES)} C={C} />
            <Pestana activa={vista === VISTA.RESUELTAS} etiqueta="Resueltas" total={totales.resueltas}
              onClick={() => cambiarVista(VISTA.RESUELTAS)} C={C} />
          </div>

          {/* Limpiar */}
          {hayFiltroActivo && (
            <button onClick={limpiarFiltros} style={{
              marginLeft: "auto", padding: "6px 10px", borderRadius: RADIUS.md, fontSize: 12,
              cursor: "pointer", background: "transparent",
              border: `1px solid ${C.borderDefault}`, color: C.textMuted, fontFamily: "inherit",
            }}>
              Limpiar
            </button>
          )}
        </div>

        {/* Carga y error */}
        {carga.estado !== "listo" && (
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "2.5rem 2rem", textAlign: "center",
          }}>
            {carga.estado === "cargando" ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando solicitudes...</p>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
                <button onClick={recargar} style={{
                  padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Reintentar</button>
              </>
            )}
          </div>
        )}

        {/* Layout principal */}
        {carga.estado === "listo" && <div style={{
          display: "grid",
          gridTemplateColumns: seleccionada ? "340px 1fr" : "1fr",
          gap: "1.5rem", alignItems: "start",
        }}>

          {/* Columna izquierda — lista */}
          <div>
            <p style={{
              margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700,
              color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {solicitudesFiltradas.length} solicitud{solicitudesFiltradas.length !== 1 ? "es" : ""}
            </p>

            {solicitudesFiltradas.length === 0 ? (
              <div style={{
                background: C.bgCard, borderRadius: RADIUS.lg,
                border: `1px solid ${C.borderDefault}`,
                padding: "2rem", textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
                  {hayFiltroActivo
                    ? "No hay solicitudes que coincidan con la búsqueda."
                    : vista === VISTA.PENDIENTES
                      ? "No hay solicitudes de baja pendientes."
                      : "Todavía no se ha resuelto ninguna solicitud."}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {solicitudesFiltradas.map(s => (
                  <SolicitudCard
                    key={s.id}
                    solicitud={s}
                    seleccionada={seleccionada?.id === s.id}
                    onSeleccionar={seleccionarSolicitud}
                    C={C}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha — detalle */}
          {seleccionada && (
            <SolicitudDetalle
              solicitud={seleccionada}
              panel={panel}
              comentario={comentario}
              errores={errores}
              procesando={procesando}
              onAprobar={handleAprobar}
              onRechazar={handleRechazar}
              onCancelar={handleCancelarAccion}
              onComentarioChange={handleComentarioChange}
              onConfirmarAprobacion={handleConfirmarAprobacion}
              onConfirmarRechazo={handleConfirmarRechazo}
              C={C}
            />
          )}
        </div>}

      </div>
    </DashboardLayout>
  );
}