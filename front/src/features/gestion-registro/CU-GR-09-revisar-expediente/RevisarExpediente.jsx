import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }        from "@/components/layout/DashboardLayout";
import { ExpedienteCard }         from "./components/ExpedienteCard";
import { DetalleExpediente }      from "./components/DetalleExpediente";
import { useRevisarExpediente }   from "./hooks/useRevisarExpediente";

export default function RevisarExpediente() {
  const { C } = useTheme();
  const {
    pendientes, cargandoLista, seleccionado, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    verDetalle, cerrar, decidir, verPdf, errorDescarga,
  } = useRevisarExpediente();

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombreCoordinador = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "Coordinación";

  return (
    <DashboardLayout
      titulo="Revisión de expedientes"
      
      rol="coordinador"
      usuario={nombreCoordinador}
    >
      {resultado && (
        <div style={{
          marginBottom: "1.25rem", padding: "12px 16px", borderRadius: RADIUS.md,
          background: resultado.tipo === "aprobar" ? C.successSoft : C.dangerSoft,
          border: `1px solid ${resultado.tipo === "aprobar" ? C.success : C.danger}`,
          color: resultado.tipo === "aprobar" ? C.success : C.danger,
          fontSize: 13, fontWeight: 500,
        }}>
          {resultado.tipo === "aprobar"
            ? `✓ Expediente de ${resultado.nombre} aprobado. El alumno fue asignado al profesor y su rol fue actualizado a Alumno Asignado.`
            : `✕ Expediente de ${resultado.nombre} rechazado. El alumno fue notificado con el motivo para realizar correcciones.`
          }
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Expedientes pendientes de revisión
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Alumnos que han enviado su expediente final y están esperando aprobación para iniciar su servicio social
        </p>
      </div>

      {cargandoLista ? (
        <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "2rem" }}>Cargando...</p>
      ) : pendientes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>📭</p>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>No hay expedientes pendientes de revisión</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 760 }}>
          {pendientes.map(item => (
            <ExpedienteCard key={item.id} item={item} onVer={verDetalle} C={C} />
          ))}
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.textDisabled, textAlign: "right" }}>
            {pendientes.length} expediente{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      <DetalleExpediente
        item={seleccionado}
        loading={loading}
        comentario={comentario}
        setComentario={setComentario}
        modoRechazo={modoRechazo}
        setModoRechazo={setModoRechazo}
        onDecidir={decidir}
        onVerPdf={verPdf}
        errorDescarga={errorDescarga}
        onCerrar={cerrar}
        C={C}
      />
    </DashboardLayout>
  );
}