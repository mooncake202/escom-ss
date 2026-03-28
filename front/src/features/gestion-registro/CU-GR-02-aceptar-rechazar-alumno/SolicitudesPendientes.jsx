import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSolicitudesPendientes } from "./hooks/useSolicitudesPendientes";
import { SolicitudCard }    from "./components/SolicitudCard";
import { DetalleSolicitud } from "./components/DetalleSolicitud";
 
export default function SolicitudesPendientes() {
  const { C } = useTheme();
  const {
    pendientes, seleccionada, loading, resultado,
    verDetalle, cerrarDetalle, decidir,
  } = useSolicitudesPendientes();
 
  return (
    <DashboardLayout
      titulo="Solicitudes pendientes"
      subtitulo="Alumnos que han solicitado realizar su servicio social con usted"
      rol="profesor"
      usuario="Dr. Torres Vega"
    >
 
      {/* Toast de resultado */}
      {resultado && (
        <div style={{
          marginBottom: "1.25rem", padding: "12px 16px",
          borderRadius: RADIUS.md,
          background: resultado.tipo === "aceptar" ? C.successSoft : C.dangerSoft,
          border: `1px solid ${resultado.tipo === "aceptar" ? C.success : C.danger}`,
          color: resultado.tipo === "aceptar" ? C.success : C.danger,
          fontSize: 13, fontWeight: 500,
        }}>
          {resultado.tipo === "aceptar"
            ? `✓ Solicitud de ${resultado.nombre} aceptada. El alumno fue notificado.`
            : `✕ Solicitud de ${resultado.nombre} rechazada. El alumno fue notificado.`
          }
        </div>
      )}
 
      {/* Encabezado de sección */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Solicitudes pendientes
        </h2>
        
      </div>
 
      {/* Lista */}
      {pendientes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>📭</p>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>No tienes solicitudes pendientes</p>
          <p style={{ fontSize: 13, color: C.textDisabled, margin: "6px 0 0" }}>
            Aquí aparecerán los alumnos que soliciten hacer su servicio social contigo
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 720 }}>
          {pendientes.map(s => (
            <SolicitudCard key={s.id} solicitud={s} onVer={verDetalle} C={C} />
          ))}
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.textDisabled, textAlign: "right" }}>
            {pendientes.length} solicitud{pendientes.length !== 1 ? "es" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
 
      {/* Panel de detalle */}
      <DetalleSolicitud
        solicitud={seleccionada}
        loading={loading}
        onDecidir={decidir}
        onCerrar={cerrarDetalle}
        C={C}
      />
    </DashboardLayout>
  );
}