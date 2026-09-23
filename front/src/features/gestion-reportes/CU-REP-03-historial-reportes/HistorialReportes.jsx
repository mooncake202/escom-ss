import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReporteItem } from "./components/ReporteItem";
import { useHistorialReportes } from "./hooks/useHistorialReportes";
import { VisorPdf } from "../compartido/VisorPdf";
import { consultaDeReporte } from "../CU-REP-02-consultar-estatus-reporte/seguimientoReportes";
import { claveReporte, etiquetaReporte } from "../CU-REP-05-revisar-reportes-profesor/revisionReportes";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

export default function HistorialReportes() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const nombreAlumno = nombreCompletoSesion(usuario);
  const {
    carga, recargar, tieneHistorial, reportes, expandido, toggleExpandir,
    pdf, reporteEnPdf, verPdf, cerrarVisor, descargarPdf, estadoPdfDe,
    plazoEnvio, limiteServicio,
  } = useHistorialReportes();

  // Acceso al reporte global (el backend decide si ya se puede generar: 480 h de bitácoras aprobadas).
  const botonGlobal = {
    padding: "9px 18px", borderRadius: RADIUS.md,
    background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textMuted,
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };

  // Aviso persistente por plazo de envío del reporte mensual (Bloque 3): derivado en cada carga, nunca guardado.
  // Preventivo mientras hay días hábiles restantes; vencido en cuanto se agotan. Desaparece solo al enviar el reporte.
  const avisoPlazo = plazoEnvio.aplica && (
    <div style={{
      margin: "0 0 1.25rem", padding: "12px 14px", borderRadius: RADIUS.md,
      background: plazoEnvio.estado === "vencido" ? C.dangerSoft : C.warningSoft,
      border: `1px solid ${plazoEnvio.estado === "vencido" ? C.danger : C.warning}`,
    }}>
      {plazoEnvio.estado === "vencido" ? (
        <>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.danger }}>
            El plazo para enviar tu reporte mensual venció
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.5 }}>
            La fecha límite era el {plazoEnvio.fechaLimiteTexto}. El registro de nuevas bitácoras quedará bloqueado hasta que envíes tu reporte.
          </p>
        </>
      ) : (
        <>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: C.warning }}>
            Tienes un reporte mensual pendiente de enviar
          </p>
          <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.5 }}>
            Día hábil {plazoEnvio.diaHabilActual} de {plazoEnvio.diasPlazo}: envíalo antes del {plazoEnvio.fechaLimiteTexto}.
          </p>
        </>
      )}
    </div>
  );

  // Aviso del plazo máximo de 2 años del servicio social. Es SOLO informativo: no deshabilita ningún botón ni
  // impide generar, enviar o corregir reportes. El bloqueo de nuevas bitácoras corresponde a AH, no a Reportes.
  const limiteExcedido = limiteServicio.estado === "excedido";
  const avisoLimite = limiteServicio.estado && (
    <div style={{
      margin: "0 0 1.25rem", padding: "12px 14px", borderRadius: RADIUS.md,
      background: limiteExcedido ? C.dangerSoft : C.warningSoft,
      border: `1px solid ${limiteExcedido ? C.danger : C.warning}`,
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: limiteExcedido ? C.danger : C.warning }}>
        {limiteExcedido
          ? "Se alcanzó el plazo máximo de 2 años de tu servicio social"
          : limiteServicio.estado === "alcanzado"
            ? "Hoy es el último día del plazo máximo de tu servicio social"
            : "Tu servicio social se acerca al plazo máximo de 2 años"}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: C.textPrimary, lineHeight: 1.5 }}>
        {limiteExcedido
          ? `La fecha límite era el ${limiteServicio.fechaLimiteTexto}.`
          : limiteServicio.estado === "alcanzado"
            ? `La fecha límite es hoy, ${limiteServicio.fechaLimiteTexto}.`
            : `Te ${limiteServicio.diasHabilesRestantes === 1 ? "queda" : "quedan"} ${limiteServicio.diasHabilesRestantes} `
              + `${limiteServicio.diasHabilesRestantes === 1 ? "día hábil" : "días hábiles"} antes del ${limiteServicio.fechaLimiteTexto}.`}
      </p>
    </div>
  );

  // ── Carga inicial y error ─────────────────────────────────
  if (carga.estado !== "listo") {
    return (
      <DashboardLayout titulo="Mis reportes" subtitulo="Alumno" rol="alumno_asignado" usuario={nombreAlumno}>
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.borderDefault}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            {carga.estado === "cargando" ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando tus reportes...</p>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
                <button
                  onClick={recargar}
                  style={{
                    padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Reintentar
                </button>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Estado vacío ──────────────────────────────────────────
  if (!tieneHistorial) {
    return (
      <DashboardLayout titulo="Mis reportes" subtitulo="Alumno" rol="alumno_asignado" usuario={nombreAlumno}>
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%" }}>
          {avisoLimite}
          {avisoPlazo}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.625rem", marginBottom: "1.5rem" }}>
            <button onClick={() => navigate("/alumno/reportes/global")} style={botonGlobal}>Reporte global</button>
            <button
              onClick={() => navigate("/alumno/reportes/generar")}
              style={{
                padding: "9px 18px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              + Generar nuevo reporte
            </button>
          </div>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.borderDefault}`,
            padding: "3rem 2rem", textAlign: "center",
          }}>
            <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📄</p>
            <p style={{ margin: "0 0 0.25rem", fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
              Sin reportes registrados
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
              Genera tu primer reporte mensual de actividades.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Mis reportes" subtitulo="Alumno" rol="alumno_asignado" usuario={nombreAlumno}>
      {/* PDF almacenado del reporte elegido (object URL del Blob; se libera al cerrar) */}
      <VisorPdf
        pdf={pdf}
        titulo={reporteEnPdf ? etiquetaReporte(reporteEnPdf) : ""}
        tituloIframe="PDF del reporte almacenado"
        onCerrar={cerrarVisor}
        C={C}
      />
      <div style={{ maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {avisoLimite}
        {avisoPlazo}

        {/* Encabezado con acción */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            {reportes.length} reporte{reportes.length !== 1 ? "s" : ""} 
          </p>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/alumno/reportes/global")} style={botonGlobal}>Reporte global</button>
            <button
              onClick={() => navigate("/alumno/reportes/generar")}
              style={{
                padding: "9px 18px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              + Generar nuevo reporte
            </button>
          </div>
        </div>

        {/* Lista de reportes — accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {reportes.map((r) => (
            <ReporteItem
              key={claveReporte(r)}
              reporte={r}
              abierto={expandido === claveReporte(r)}
              onToggle={() => toggleExpandir(claveReporte(r))}
              onVerSeguimiento={() => navigate(`/alumno/reportes/estatus?${consultaDeReporte(r)}`)}
              onEditar={() => navigate(`/alumno/reportes/modificar?${consultaDeReporte(r)}`)}
              onVerPdf={() => verPdf(r)}
              onDescargar={() => descargarPdf(r)}
              pdf={estadoPdfDe(r)}
              C={C}
            />
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
