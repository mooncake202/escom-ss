import { useTheme, RADIUS }             from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { useNavigate }                   from "react-router-dom";
import { useModificarReenviarReporte }   from "./hooks/useModificarReenviarReporte";
import { nombreEtapa, consultaDeReporte } from "../CU-REP-02-consultar-estatus-reporte/seguimientoReportes";
import { etiquetaReporte, textoPeriodo, textoFechaEnvio } from "../CU-REP-05-revisar-reportes-profesor/revisionReportes";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// Fuera del componente principal: definirlo dentro lo recrearía en cada render.
function Layout({ usuario, ancho = 580, children }) {
  return (
    <DashboardLayout titulo="Corregir reporte mensual" subtitulo="Alumno" rol="alumno_asignado" usuario={usuario}>
      <div style={{ maxWidth: ancho, margin: "0 auto", width: "100%" }}>{children}</div>
    </DashboardLayout>
  );
}

export default function ModificarReenviarReporte() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const nombreAlumno = nombreCompletoSesion(usuario);
  const {
    estado, error, reporte, recargar,
    paso, actividades, handleChange, errores,
    irAVistaPrevia, volverAEditar, vistaPrevia, pedirVistaPrevia,
    enviando, errorEnvio, confirmarReenvio, resultado,
  } = useModificarReenviarReporte();

  const botonSecundario = (extra = {}) => ({
    flex: 1, padding: "10px", borderRadius: RADIUS.md,
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    background: "transparent", border: `1px solid ${C.borderDefault}`,
    color: C.textMuted, fontFamily: "inherit", ...extra,
  });

  const inputBase = (hasError) => ({
    width: "100%", padding: "10px 14px", background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  });

  const flechaAtras = (
    <button
      onClick={() => navigate("/alumno/reportes")}
      style={{
        display: "flex", alignItems: "center", gap: "0.375rem",
        background: "transparent", border: "none", cursor: "pointer",
        color: C.textMuted, fontSize: 13, padding: "0 0 1rem",
        fontFamily: "inherit",
      }}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Mis reportes
    </button>
  );

  // ── Carga, error y reportes que no se pueden corregir ────────
  if (estado !== "listo" && !resultado) {
    const mensajes = {
      cargando:      { texto: "Cargando tu reporte...", tono: "neutro" },
      error:         { texto: error, tono: "error" },
      sin_reporte:   { texto: "Elige el reporte que quieres corregir desde Mis reportes.", tono: "neutro" },
      no_corregible: { texto: "Este reporte no se puede corregir: solo se corrigen los reportes rechazados por tu profesor o por coordinación.", tono: "neutro" },
    };
    const m = mensajes[estado];
    return (
      <Layout usuario={nombreAlumno} ancho={520}>
        {flechaAtras}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.xl,
          border: `1px solid ${C.borderDefault}`, padding: "2.5rem 2rem", textAlign: "center",
        }}>
          <p style={{ margin: "0 0 1rem", fontSize: 13, color: m.tono === "error" ? C.danger : C.textMuted, lineHeight: 1.6 }}>{m.texto}</p>
          {estado === "error" && (
            <button onClick={recargar} style={{
              padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              Reintentar
            </button>
          )}
          {estado === "no_corregible" && (
            <button onClick={() => navigate(`/alumno/reportes/estatus?${consultaDeReporte(reporte)}`)} style={botonSecundario({ flex: "none", padding: "9px 22px" })}>
              Ver seguimiento
            </button>
          )}
        </div>
      </Layout>
    );
  }

  // ── Confirmación de reenvío ──────────────────────────────────
  if (resultado) {
    return (
      <Layout usuario={nombreAlumno}>
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.success}`,
          padding: "2.5rem 2rem", textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: C.successSoft,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
              stroke={C.success} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
            Reporte reenviado correctamente
          </h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: 14, color: C.textMuted }}>
            Tu corrección fue enviada{reporte?.revisor ? <> a <strong>{reporte.revisor.nombreCompleto}</strong></> : ""} con estado:
          </p>
          <span style={{
            display: "inline-block", margin: "0 0 1.5rem",
            padding: "4px 14px", borderRadius: RADIUS.full,
            background: C.warningSoft, color: C.warning,
            fontSize: 13, fontWeight: 700, border: `1px solid ${C.warning}`,
          }}>
            En revisión del profesor
          </span>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
            El profesor recibirá una notificación para revisar nuevamente tu reporte.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate(`/alumno/reportes/estatus?${consultaDeReporte(reporte)}`)} style={botonSecundario({ flex: "none", padding: "10px 22px" })}>
              Ver seguimiento
            </button>
            <button
              onClick={() => navigate("/alumno/reportes")}
              style={{
                padding: "10px 28px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Ver mis reportes
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const ultimoRechazo = reporte.ultimoRechazo;
  const avisoRechazo = (
    <div style={{
      marginBottom: "1.25rem", padding: "10px 14px", borderRadius: RADIUS.md,
      background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}`,
      fontSize: 13, color: C.danger, lineHeight: 1.6,
    }}>
      <strong>Motivo de rechazo{ultimoRechazo ? ` · ${nombreEtapa(ultimoRechazo.etapa)}` : ""}:</strong>{" "}
      {ultimoRechazo?.motivo ?? "No se registró un motivo."}
      {ultimoRechazo?.fecha && <span style={{ display: "block", marginTop: 4, fontSize: 11, color: C.textDisabled }}>{textoFechaEnvio(ultimoRechazo.fecha)}</span>}
    </div>
  );

  // Solo lectura: son los datos del envío original y no se pueden modificar.
  const franjaResumen = (
    <div style={{
      background: C.bgInput, borderRadius: RADIUS.md,
      border: `1px solid ${C.borderDefault}`,
      padding: "10px 16px", marginBottom: "1.25rem",
      display: "flex", justifyContent: "space-between",
      alignItems: "center", flexWrap: "wrap", gap: "0.5rem",
    }}>
      {textoPeriodo(reporte) && (
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Periodo</span>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{textoPeriodo(reporte)}</p>
        </div>
      )}
      {reporte.diasLaborados != null && (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Días laborados</span>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.accentText }}>{reporte.diasLaborados}</p>
        </div>
      )}
      {reporte.horasReportadas != null && (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total horas</span>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.accentText }}>{reporte.horasReportadas} h</p>
        </div>
      )}
    </div>
  );

  // ── Paso 1: corregir las actividades ─────────────────────────
  if (paso === 1) {
    return (
      <Layout usuario={nombreAlumno}>
        {flechaAtras}
        {avisoRechazo}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Paso 1 de 2
          </p>
          <h3 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            {etiquetaReporte(reporte)}
          </h3>

          {franjaResumen}
          <div style={{
            marginBottom: "1.25rem", padding: "10px 14px", borderRadius: RADIUS.md,
            background: "rgba(0,58,143,0.08)", border: "1px solid rgba(0,58,143,0.2)",
            fontSize: 12, color: C.accentText, lineHeight: 1.6,
          }}>
            Solo puedes corregir las actividades realizadas. Se reutilizará tu firma registrada.
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
            }}>
              Actividades realizadas <span style={{ color: C.danger }}>*</span>
            </label>
            <textarea
              name="actividades"
              value={actividades}
              onChange={handleChange}
              rows={8}
              placeholder="Describe las actividades realizadas durante el periodo, una por línea..."
              style={{ ...inputBase(!!errores.actividades), resize: "vertical", lineHeight: 1.6 }}
            />
            {errores.actividades && (
              <p role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{errores.actividades}</p>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => navigate("/alumno/reportes")} style={botonSecundario()}>
              Cancelar
            </button>
            <button onClick={irAVistaPrevia} style={{
              flex: 2, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
            }}>
              Firmar y ver vista previa →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Paso 2: vista previa del PDF corregido + reenvío ─────────
  return (
    <Layout usuario={nombreAlumno} ancho={780}>
      {flechaAtras}
      {franjaResumen}

      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        marginBottom: "1.25rem",
      }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Paso 2 de 2
        </p>
        <h3 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
          Vista previa del reporte corregido
        </h3>

        <div style={{
          height: 600, marginBottom: "1.25rem",
          borderRadius: RADIUS.md, overflow: "hidden",
          border: `1px solid ${vistaPrevia.estado === "error" ? C.danger : C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: C.bgInput,
        }}>
          {vistaPrevia.estado === "cargando" && (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Generando vista previa...</p>
          )}
          {vistaPrevia.estado === "error" && (
            <div style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
              <p role="alert" style={{ margin: "0 0 0.75rem", fontSize: 13, color: C.danger, lineHeight: 1.5 }}>{vistaPrevia.error}</p>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={volverAEditar} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Corregir actividades</button>
                <button onClick={pedirVistaPrevia} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Reintentar</button>
              </div>
            </div>
          )}
          {vistaPrevia.estado === "listo" && (
            <iframe src={vistaPrevia.url} width="100%" height="100%" style={{ border: "none" }} title="Vista previa del reporte corregido" />
          )}
        </div>

        {errorEnvio && (
          <div role="alert" style={{
            margin: "0 0 1rem", padding: "10px 14px", borderRadius: RADIUS.md,
            background: C.dangerSoft, border: `1px solid ${C.danger}`,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: C.danger, lineHeight: 1.5 }}>{errorEnvio.mensaje}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: 8, flexWrap: "wrap" }}>
              {errorEnvio.accion === "actividades" && (
                <button onClick={volverAEditar} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Corregir actividades</button>
              )}
              {errorEnvio.accion === "reintentar" && (
                <button onClick={confirmarReenvio} disabled={enviando} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Reintentar envío</button>
              )}
              {errorEnvio.accion === "lista" && (
                <button onClick={() => navigate("/alumno/reportes")} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Ver mis reportes</button>
              )}
              {errorEnvio.accion === "recargar" && (
                <button onClick={() => navigate("/alumno/reportes")} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Volver a mis reportes</button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={volverAEditar} disabled={enviando} style={botonSecundario({ cursor: enviando ? "not-allowed" : "pointer" })}>
            ← Editar
          </button>
          <button
            onClick={confirmarReenvio}
            disabled={enviando || vistaPrevia.estado !== "listo"}
            style={{
              flex: 2, padding: "10px", borderRadius: RADIUS.md,
              fontSize: 13, fontWeight: 700, fontFamily: "inherit", border: "none", color: "#fff",
              cursor: enviando ? "wait" : vistaPrevia.estado !== "listo" ? "not-allowed" : "pointer",
              background: enviando || vistaPrevia.estado !== "listo" ? C.borderDefault : C.accent,
            }}
          >
            {enviando ? "Firmando y reenviando..." : "Reenviar al profesor →"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
