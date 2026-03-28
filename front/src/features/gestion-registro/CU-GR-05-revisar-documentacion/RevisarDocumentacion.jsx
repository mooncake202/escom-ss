import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }          from "@/components/layout/DashboardLayout";
import { SolicitudDocCard }         from "./components/SolicitudDocCard";
import { DetalleDocumentacion }     from "./components/DetalleDocumentacion";
import { useRevisarDocumentacion }  from "./hooks/useRevisarDocumentacion";

export default function RevisarDocumentacion() {
  const { C } = useTheme();
  const {
    pendientes, seleccionada, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    verDetalle, cerrar, decidir,
  } = useRevisarDocumentacion();

  return (
    <DashboardLayout
      titulo="Revisión de documentación inicial"
      subtitulo="CU-GR-05 · Coordinación"
      rol="coordinacion"
      usuario="Coordinación ESCOM"
    >
      {/* Toast resultado — RN-GR-31 */}
      {resultado && (
        <div style={{
          marginBottom: "1.25rem", padding: "12px 16px", borderRadius: RADIUS.md,
          background: resultado.tipo === "aceptar" ? C.successSoft : C.dangerSoft,
          border: `1px solid ${resultado.tipo === "aceptar" ? C.success : C.danger}`,
          color: resultado.tipo === "aceptar" ? C.success : C.danger,
          fontSize: 13, fontWeight: 500,
        }}>
          {resultado.tipo === "aceptar"
            ? `✓ Documentación de ${resultado.nombre} validada. El alumno fue notificado.`
            : `✕ Documentación de ${resultado.nombre} rechazada. El alumno fue notificado con el motivo.`
          }
        </div>
      )}

      {/* Encabezado */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.25rem", fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
          Documentación pendiente de revisión
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
          Alumnos que han enviado su documentación inicial y están esperando validación
        </p>
      </div>

      {/* Lista */}
      {pendientes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>📭</p>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>No hay documentación pendiente de revisión</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 760 }}>
          {pendientes.map(s => (
            <SolicitudDocCard key={s.id} solicitud={s} onVer={verDetalle} C={C} />
          ))}
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.textDisabled, textAlign: "right" }}>
            {pendientes.length} solicitud{pendientes.length !== 1 ? "es" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Panel detalle */}
      <DetalleDocumentacion
        solicitud={seleccionada}
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
