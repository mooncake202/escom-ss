import { useState } from "react";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSolicitudesPendientes } from "./hooks/useSolicitudesPendientes";
import { SolicitudCard }    from "./components/SolicitudCard";
import { DetalleSolicitud } from "./components/DetalleSolicitud";

export default function SolicitudesPendientes() {
  const { C } = useTheme();
  const {
    pendientes, cargandoLista, seleccionada, loading, resultado,
    verDetalle, cerrarDetalle, decidir,
  } = useSolicitudesPendientes();
  const [busqueda, setBusqueda] = useState("");

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombreProfesor = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "Profesor";

  const filtrados = pendientes.filter((s) =>
    (s.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <DashboardLayout
      titulo="Solicitudes pendientes"
      subtitulo="Alumnos que han solicitado realizar su servicio social con usted"
      rol="profesor"
      usuario={nombreProfesor}
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
            ? `✓ Solicitud de ${resultado.nombre} aceptada. El alumno lo verá reflejado en su proceso.`
            : `✕ Solicitud de ${resultado.nombre} rechazada. El alumno lo verá reflejado en su proceso.`
          }
        </div>
      )}

      {/* Encabezado de sección */}
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
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: C.textDisabled }}>
          Cargando solicitudes...
        </div>
      ) : pendientes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 32, margin: "0 0 0.75rem" }}>📭</p>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>No tienes solicitudes pendientes</p>
          <p style={{ fontSize: 13, color: C.textDisabled, margin: "6px 0 0" }}>
            Aquí aparecerán los alumnos que soliciten hacer su servicio social contigo
          </p>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>No se encontraron solicitudes</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 720 }}>
          {filtrados.map(s => (
            <SolicitudCard key={s.id} solicitud={s} onVer={verDetalle} C={C} />
          ))}
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.textDisabled, textAlign: "right" }}>
            {filtrados.length} solicitud{filtrados.length !== 1 ? "es" : ""} pendiente{filtrados.length !== 1 ? "s" : ""}
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