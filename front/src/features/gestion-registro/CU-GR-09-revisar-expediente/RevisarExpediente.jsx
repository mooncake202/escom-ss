import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }        from "@/components/layout/DashboardLayout";
import { ExpedienteCard }         from "./components/ExpedienteCard";
import { DetalleExpediente }      from "./components/DetalleExpediente";
import { useRevisarExpediente }   from "./hooks/useRevisarExpediente";

export default function RevisarExpediente() {
  const { C } = useTheme();
  const {
    pendientes, seleccionado, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    verDetalle, cerrar, decidir,
  } = useRevisarExpediente();

  return (
    <DashboardLayout
      titulo="Revisión de expedientes"
      subtitulo="CU-GR-09 · Coordinación"
      rol="coordinacion"
      usuario="Coordinación ESCOM"
    >
      {/* Toast resultado — RN-GR-55 */}
      {resultado && (
        <div style={{
          marginBottom: "1.25rem", padding: "12px 16px", borderRadius: RADIUS.md,
          background: resultado.tipo === "aprobar" ? C.successSoft : C.dangerSoft,
          border: `1px solid ${resultado.tipo === "aprobar" ? C.success : C.danger}`,
          color: resultado.tipo === "aprobar" ? C.success : C.danger,
          fontSize: 13, fontWeight: 500,
        }}>
          {resultado.tipo === "aprobar"
            ? `✓ Expediente de ${resultado.nombre} aprobado. El alumno fue asignado al profesor y su rol fue actualizado a AlumnoAsignado.`
            : `✕ Expediente de ${resultado.nombre} rechazado. El alumno fue notificado con el motivo para realizar correcciones.`
          }
        </div>
      )}

      {/* Encabezado */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Expedientes pendientes de revisión
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Alumnos que han enviado su expediente final y están esperando aprobación para iniciar su servicio social
        </p>
      </div>

      {/* Lista */}
      {pendientes.length === 0 ? (
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

      {/* Panel detalle */}
      <DetalleExpediente
        item={seleccionado}
        loading={loading}
        comentario={comentario}
        setComentario={setComentario}
        modoRechazo={modoRechazo}
        setModoRechazo={setModoRechazo}
        onDecidir={decidir}
        onCerrar={cerrar}
        C={C}
      />
    </DashboardLayout>
  );
}
