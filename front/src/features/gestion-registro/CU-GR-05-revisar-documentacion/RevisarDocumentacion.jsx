import { useState } from "react";
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
  const [busqueda, setBusqueda] = useState("");

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombreCoordinador = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "Coordinación";

  const esResultadoExito = resultado?.tipo === "aceptar";

  const filtrados = pendientes.filter((s) =>
    (s.alumno?.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );

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

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: "1.5rem", maxWidth: 360 }}>
        <div style={{ position: "relative" }}>
          <svg
            width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar alumno..."
            style={{
              width: "100%", padding: "9px 14px 9px 34px",
              boxSizing: "border-box",
              background: C.bgInput,
              border: `1px solid ${C.borderDefault}`,
              borderRadius: RADIUS.md,
              color: C.textPrimary, fontSize: 13,
              outline: "none", fontFamily: "inherit",
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: C.textDisabled, fontSize: 16, padding: 0, lineHeight: 1,
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Lista */}
      {cargandoLista ? (
        <p style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: "2rem" }}>Cargando...</p>
      ) : pendientes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>📭</p>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>No hay documentación pendiente de revisión</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>No se encontraron solicitudes</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 760 }}>
          {filtrados.map(s => (
            <SolicitudDocCard key={s.id} solicitud={s} onVer={verDetalle} C={C} />
          ))}
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.textDisabled, textAlign: "right" }}>
            {filtrados.length} solicitud{filtrados.length !== 1 ? "es" : ""} pendiente{filtrados.length !== 1 ? "s" : ""}
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