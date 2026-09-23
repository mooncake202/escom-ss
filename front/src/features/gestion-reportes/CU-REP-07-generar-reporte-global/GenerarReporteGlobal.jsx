import { useTheme, RADIUS }              from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { useNavigate }                   from "react-router-dom";
import { useGenerarReporteGlobal }       from "./hooks/useGenerarReporteGlobal";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";

// Fuera del componente principal: definirlo dentro lo recrearía en cada render.
function Layout({ usuario, ancho = 560, children }) {
  return (
    <DashboardLayout titulo="Reporte global" subtitulo="Alumno" rol="alumno_asignado" usuario={usuario}>
      <div style={{ maxWidth: ancho, margin: "0 auto", width: "100%" }}>{children}</div>
    </DashboardLayout>
  );
}

export default function GenerarReporteGlobal() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const nombreAlumno = nombreCompletoSesion(usuario);
  const {
    estado, error, datos, recargar,
    paso, actividades, handleActividadesChange, errores,
    continuarDesdeActividades, volverAEditar, vistaPrevia, pedirVistaPrevia,
    enviando, errorEnvio, enviar, resultado,
  } = useGenerarReporteGlobal();

  const botonSecundario = (extra = {}) => ({
    flex: 1, padding: "10px", borderRadius: RADIUS.md,
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    background: "transparent", border: `1px solid ${C.borderDefault}`,
    color: C.textMuted, fontFamily: "inherit", ...extra,
  });
  const botonPrimario = (extra = {}) => ({
    padding: "10px 28px", borderRadius: RADIUS.md,
    background: C.accent, border: "none", color: "#fff",
    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", ...extra,
  });
  const tarjeta = {
    background: C.bgCard, borderRadius: RADIUS.lg,
    border: `1px solid ${C.borderDefault}`, padding: "2.5rem 2rem", textAlign: "center",
  };
  const icono = (fondo, trazo, dibujo) => (
    <div style={{
      width: 52, height: 52, borderRadius: "50%", background: fondo,
      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
    }}>
      <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
        stroke={trazo} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{dibujo}</svg>
    </div>
  );

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

  // ── Reporte enviado ──────────────────────────────────────────
  if (resultado) {
    return (
      <Layout usuario={nombreAlumno}>
        <div style={{ ...tarjeta, border: `1px solid ${C.success}` }}>
          {icono(C.successSoft, C.success, <polyline points="20 6 9 17 4 12" />)}
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Reporte global enviado</h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: 14, color: C.textMuted }}>
            Tu reporte fue enviado{datos?.profesor ? <> a <strong>{datos.profesor.nombreCompleto}</strong></> : ""} con estado:
          </p>
          <span style={{
            display: "inline-block", margin: "0 0 1.25rem", padding: "4px 14px", borderRadius: RADIUS.full,
            background: C.warningSoft, color: C.warning, fontSize: 13, fontWeight: 700, border: `1px solid ${C.warning}`,
          }}>
            En revisión del profesor
          </span>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
            El profesor recibirá una notificación para revisarlo. Después pasará a la validación de coordinación.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate(`/alumno/reportes/estatus?reporte=${resultado.reporte.id}&tipo=global`)} style={botonSecundario({ flex: "none", padding: "10px 22px" })}>
              Ver seguimiento
            </button>
            <button onClick={() => navigate("/alumno/reportes")} style={botonPrimario()}>Ver mis reportes</button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Carga y error ────────────────────────────────────────────
  if (estado !== "listo") {
    return (
      <Layout usuario={nombreAlumno}>
        {flechaAtras}
        <div style={tarjeta}>
          {estado === "cargando" ? (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando los datos de tu reporte global...</p>
          ) : (
            <>
              <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{error}</p>
              <button onClick={recargar} style={botonPrimario({ padding: "9px 22px" })}>Reintentar</button>
            </>
          )}
        </div>
      </Layout>
    );
  }

  const { horas, mensualDeHorasFinales, reporte, reporteExistente, motivosBloqueo, firma } = datos;
  const periodo = reporte.periodo ? `${reporte.periodo.inicioTexto} — ${reporte.periodo.finTexto}` : null;

  // ── Ya existe el reporte global (solo uno por servicio social) ─
  if (reporteExistente) {
    const consulta = `reporte=${reporteExistente.id}&tipo=global`;
    return (
      <Layout usuario={nombreAlumno}>
        {flechaAtras}
        <div style={tarjeta}>
          {icono(C.accentSoft, C.accentText, <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>)}
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 17, fontWeight: 700, color: C.textPrimary }}>Reporte global ya generado</h3>
          <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
            Ya cuentas con un reporte global en el sistema. Solo se puede generar uno durante todo el servicio social.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate(`/alumno/reportes/estatus?${consulta}`)} style={botonPrimario()}>Ver seguimiento</button>
            {reporteExistente.puedeModificar && (
              <button onClick={() => navigate(`/alumno/reportes/modificar?${consulta}`)} style={botonPrimario({ background: C.danger })}>Editar y reenviar →</button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // ── Horas insuficientes: solo el aviso de las horas requeridas (no se muestra el avance del alumno) ─
  if (!horas.suficientes) {
    return (
      <Layout usuario={nombreAlumno}>
        {flechaAtras}
        <div style={tarjeta}>
          {icono(C.warningSoft, C.warning, <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>)}
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 17, fontWeight: 700, color: C.textPrimary }}>Horas insuficientes</h3>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
            Para generar el reporte global debes acumular <strong style={{ color: C.textPrimary }}>{horas.requeridas} horas</strong> contabilizables (bitácoras aprobadas o rechazadas).
          </p>
        </div>
      </Layout>
    );
  }

  // ── Ya tiene las horas, pero falta enviar el mensual donde las completó ─
  // Aviso persistente derivado (no hay notificación en BD ni WebSocket): el acceso a la pantalla sigue habilitado,
  // solo no se puede generar todavía. El backend vuelve a validarlo al enviar.
  if (mensualDeHorasFinales?.numero !== null && !mensualDeHorasFinales?.enviado) {
    return (
      <Layout usuario={nombreAlumno}>
        {flechaAtras}
        <div style={tarjeta}>
          {icono(C.warningSoft, C.warning, <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>)}
          <h3 style={{ margin: "0 0 0.5rem", fontSize: 17, fontWeight: 700, color: C.textPrimary }}>
            Falta enviar tu Reporte Mensual No. {mensualDeHorasFinales.numero}
          </h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
            Ya completaste tus <strong style={{ color: C.textPrimary }}>{horas.acumuladas} horas</strong>, pero las últimas quedaron
            dentro del periodo del Reporte Mensual No. {mensualDeHorasFinales.numero}. Envíalo y después podrás generar tu reporte global.
          </p>
          <p style={{ margin: "0 0 2rem", fontSize: 12, color: C.textDisabled, lineHeight: 1.6 }}>
            No necesitas esperar a que tu profesor o coordinación lo revisen: basta con haberlo enviado.
          </p>
          <button onClick={() => navigate("/alumno/reportes/generar")} style={botonPrimario()}>Ir a generar mi reporte mensual</button>
        </div>
      </Layout>
    );
  }

  // ── Otros bloqueos (datos que faltan, periodo oficial) o rúbrica sin registrar ─
  if (!datos.puedeGenerar || firma.requiereSubirRubrica) {
    return (
      <Layout usuario={nombreAlumno}>
        {flechaAtras}
        <div style={{ ...tarjeta, textAlign: "left", padding: "2rem 1.75rem" }}>
          {icono(C.warningSoft, C.warning, <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>)}
          <h3 style={{ margin: "0 0 0.75rem", fontSize: 17, fontWeight: 700, color: C.textPrimary, textAlign: "center" }}>Todavía no puedes generar el reporte global</h3>
          <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem", fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>
            {motivosBloqueo.map((m) => <li key={m.codigo}>{m.mensaje}</li>)}
            {firma.requiereSubirRubrica && <li>Aún no tienes una rúbrica registrada. Se registra al generar tu primer reporte mensual.</li>}
          </ul>
          {firma.requiereSubirRubrica && (
            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/alumno/reportes/generar")} style={botonPrimario()}>Ir a generar reporte mensual</button>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Solo interfaz: las horas acumuladas no se imprimen en el PDF.
  const franjaResumen = (
    <div style={{
      background: C.bgInput, borderRadius: RADIUS.md, border: `1px solid ${C.borderDefault}`,
      padding: "10px 16px", marginBottom: "1.25rem",
      display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem",
    }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Periodo del servicio</span>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{periodo}</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Horas acumuladas</span>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.accentText }}>{horas.acumuladas} h</p>
      </div>
    </div>
  );

  // ── Paso 1: actividades ──────────────────────────────────────
  if (paso === 1) {
    return (
      <Layout usuario={nombreAlumno} ancho={580}>
        {flechaAtras}
        <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`, padding: "1.75rem" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Paso 1 de 2</p>
          <h3 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{reporte.titulo}</h3>
          {franjaResumen}
          <div style={{
            marginBottom: "1.25rem", padding: "10px 14px", borderRadius: RADIUS.md,
            background: "rgba(0,58,143,0.08)", border: "1px solid rgba(0,58,143,0.2)",
            fontSize: 12, color: C.accentText, lineHeight: 1.6,
          }}>
            El reporte abarca todo el periodo de tu servicio social. Resume las actividades que realizaste durante todo el servicio.
            Al enviarlo se aplicará tu rúbrica registrada.
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Resumen de actividades <span style={{ color: C.danger }}>*</span>
            </label>
            <textarea
              value={actividades}
              onChange={handleActividadesChange}
              rows={9}
              placeholder="Describe en párrafos las actividades realizadas durante todo el servicio social..."
              style={{
                width: "100%", padding: "10px 14px", background: C.bgInput,
                border: `1px solid ${errores.actividades ? C.danger : C.borderDefault}`,
                borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13,
                outline: "none", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6,
              }}
            />
            {errores.actividades && <p role="alert" style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{errores.actividades}</p>}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => navigate("/alumno/reportes")} style={botonSecundario()}>Cancelar</button>
            <button onClick={continuarDesdeActividades} style={botonPrimario({ flex: 2, padding: "10px" })}>Firmar y ver vista previa →</button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Paso 2: vista previa del PDF y envío ─────────────────────
  return (
    <Layout usuario={nombreAlumno} ancho={780}>
      {flechaAtras}
      {franjaResumen}
      <div style={{ background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`, padding: "1.75rem", marginBottom: "1.25rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Paso 2 de 2</p>
        <h3 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>Vista previa del reporte global</h3>

        <div style={{
          height: 600, marginBottom: "1.25rem", borderRadius: RADIUS.md, overflow: "hidden",
          border: `1px solid ${vistaPrevia.estado === "error" ? C.danger : C.borderDefault}`,
          display: "flex", alignItems: "center", justifyContent: "center", background: C.bgInput,
        }}>
          {vistaPrevia.estado === "cargando" && <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Generando vista previa...</p>}
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
            <iframe src={vistaPrevia.url} width="100%" height="100%" style={{ border: "none" }} title="Vista previa del reporte global" />
          )}
        </div>

        {errorEnvio && (
          <div role="alert" style={{ margin: "0 0 1rem", padding: "10px 14px", borderRadius: RADIUS.md, background: C.dangerSoft, border: `1px solid ${C.danger}` }}>
            <p style={{ margin: 0, fontSize: 13, color: C.danger, lineHeight: 1.5 }}>{errorEnvio.mensaje}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: 8, flexWrap: "wrap" }}>
              {errorEnvio.accion === "actividades" && <button onClick={volverAEditar} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Corregir actividades</button>}
              {errorEnvio.accion === "reintentar" && <button onClick={enviar} disabled={enviando} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Reintentar envío</button>}
              {(errorEnvio.accion === "lista" || errorEnvio.accion === "recargar") && (
                <button onClick={() => navigate("/alumno/reportes")} style={botonSecundario({ flex: "none", padding: "6px 14px" })}>Ver mis reportes</button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={volverAEditar} disabled={enviando} style={botonSecundario({ cursor: enviando ? "not-allowed" : "pointer" })}>← Editar</button>
          <button
            onClick={enviar}
            disabled={enviando || vistaPrevia.estado !== "listo"}
            style={botonPrimario({
              flex: 2, padding: "10px",
              cursor: enviando ? "wait" : vistaPrevia.estado !== "listo" ? "not-allowed" : "pointer",
              background: enviando || vistaPrevia.estado !== "listo" ? C.borderDefault : C.accent,
            })}
          >
            {enviando ? "Firmando y enviando..." : "Enviar reporte global →"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
