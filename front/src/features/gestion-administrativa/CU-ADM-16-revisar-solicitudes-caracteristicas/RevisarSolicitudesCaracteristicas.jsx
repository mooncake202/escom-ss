import { useTheme, RADIUS }          from "@/themes/colors";
import { DashboardLayout }            from "@/components/layout/DashboardLayout";
import { SolicitudCard }              from "./components/SolicitudCard";
import { SolicitudDetalle }           from "./components/SolicitudDetalle";
import { useRevisarSolicitudes }      from "./hooks/useRevisarSolicitudes";

export default function RevisarSolicitudesCaracteristicas() {
  const { C } = useTheme();
  const {
    coordinacion, solicitudesFiltradas,
    seleccionada, panel,
    busqueda, setBusqueda,
    comentario, errores, toast,
    handleSeleccionar,
    handleAprobar, handleRechazar, handleCancelarAccion,
    handleComentarioChange,
    handleConfirmarAprobacion, handleConfirmarRechazo,
  } = useRevisarSolicitudes();

  return (
    <DashboardLayout
      titulo="Solicitudes de modificación de características"
      subtitulo="CU-ADM-16 · Coordinación"
      rol="coordinacion"
      usuario={coordinacion.nombre}
    >
      <div style={{ maxWidth: 980, margin: "0 auto", width: "100%" }}>

        {/* Toast (RF-ADM-06, RF-ADM-08) */}
        {toast && (
          <div style={{
            marginBottom: "1.25rem", padding: "11px 16px", borderRadius: RADIUS.md,
            background: toast.tipo === "danger" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
            border: `1px solid ${toast.tipo === "danger" ? C.danger : C.success}`,
            color: toast.tipo === "danger" ? C.danger : C.success,
            fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              {toast.tipo === "danger"
                ? <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                : <polyline points="20 6 9 17 4 12" />}
            </svg>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Búsqueda (RF-ADM-01) */}
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

        {/* Layout master-detail */}
        <div style={{
          display: "grid",
          gridTemplateColumns: seleccionada ? "300px 1fr" : "1fr",
          gap: "1.5rem", alignItems: "start",
        }}>

          {/* Columna izquierda — lista de pendientes */}
          <div>
            <p style={{
              margin: "0 0 0.75rem", fontSize: 12, fontWeight: 700,
              color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {solicitudesFiltradas.length} pendiente{solicitudesFiltradas.length !== 1 ? "s" : ""}
            </p>

            {/* Flujo 1.1 — sin pendientes */}
            {solicitudesFiltradas.length === 0 ? (
              <div style={{
                background: C.bgCard, borderRadius: RADIUS.lg,
                border: `1px solid ${C.borderDefault}`,
                padding: "2rem", textAlign: "center",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: C.bgInput,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 0.75rem",
                }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                    stroke={C.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
                  {busqueda.trim()
                    ? "No hay solicitudes que coincidan con la búsqueda."
                    : "No hay solicitudes pendientes de revisión."}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {solicitudesFiltradas.map(s => (
                  <SolicitudCard
                    key={s.id}
                    solicitud={s}
                    seleccionada={seleccionada?.id === s.id}
                    onSeleccionar={handleSeleccionar}
                    C={C}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha — detalle + acciones */}
          {seleccionada && (
            <SolicitudDetalle
              solicitud={seleccionada}
              panel={panel}
              comentario={comentario}
              errores={errores}
              onAprobar={handleAprobar}
              onRechazar={handleRechazar}
              onCancelar={handleCancelarAccion}
              onComentarioChange={handleComentarioChange}
              onConfirmarAprobacion={handleConfirmarAprobacion}
              onConfirmarRechazo={handleConfirmarRechazo}
              C={C}
            />
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
