import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout }          from "@/components/layout/DashboardLayout";
import { SolicitudDocCard }         from "./components/SolicitudDocCard";
import { DetalleDocumentacion }     from "./components/DetalleDocumentacion";
import { useRevisarDocumentacion }  from "./hooks/useRevisarDocumentacion";

const MENSAJE_RESULTADO = {
  aceptar: (nombre) => `✓ Documentación de ${nombre} validada. El alumno fue notificado.`,
  corregir_siss: (nombre) => `⚠ Se pidió corregir el registro SISS de ${nombre}.`,
  corregir_documentos: (nombre) => `⚠ Se pidió corregir los documentos de ${nombre}.`,
  rechazar_definitivo: (nombre) => `✕ Solicitud de ${nombre} rechazada definitivamente.`,
};

export default function RevisarDocumentacion() {
  const { C } = useTheme();
  const {
    pendientes, cargandoLista, seleccionada, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    verDetalle, cerrar, decidir, verPdf, errorDescarga,
  } = useRevisarDocumentacion();

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombreCoordinador = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "Coordinación";

  const esResultadoExito = resultado?.tipo === "aceptar";

  return (
    <DashboardLayout
      titulo="Revisión de documentación inicial"
      
      rol="coordinador"
      usuario={nombreCoordinador}
    >
      {/* Toast resultado */}
      {resultado && (
        <div style={{
          marginBottom: "1.25rem", padding: "12px 16px", borderRadius: RADIUS.md,
          background: esResultadoExito ? C.successSoft : C.dangerSoft,
          border: `1px solid ${esResultadoExito ? C.success : C.danger}`,
          color: esResultadoExito ? C.success : C.danger,
          fontSize: 13, fontWeight: 500,
        }}>
          {MENSAJE_RESULTADO[resultado.tipo]?.(resultado.nombre)}
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
      {cargandoLista ? (
        <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "2rem" }}>Cargando...</p>
      ) : pendientes.length === 0 ? (
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
        onVerPdf={verPdf}
        errorDescarga={errorDescarga}
        onCerrar={cerrar}
        C={C}
      />
    </DashboardLayout>
  );
}