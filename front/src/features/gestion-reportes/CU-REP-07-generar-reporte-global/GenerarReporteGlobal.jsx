import { useTheme, RADIUS }              from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { useNavigate }                   from "react-router-dom";
import { BlobProvider }                  from "@react-pdf/renderer";
import { FirmaActiva }                   from "./components/FirmaActiva";
import { ReporteGlobalPDF }              from "./components/ReporteGlobalPDF";
import { useGenerarReporteGlobal }       from "./hooks/useGenerarReporteGlobal";

export default function GenerarReporteGlobal() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const {
    alumno, profesorNombre,
    tituloAuto, periodoTexto, fechaInicioSS, fechaGeneracion, totalHoras,
    tieneHorasSuficientes, yaExisteReporteGlobal, firmaUrl,
    paso, setPaso,
    enviado, handleEnviar,
    actividades, handleActividadesChange,
    errores, irPaso2, irPaso3, datosPDF,
  } = useGenerarReporteGlobal();

  const inputBase = (hasError) => ({
    width: "100%", padding: "10px 14px", background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  });

  const flechaAtras = (
    <button
      onClick={() => navigate("/alumno/reportes/historial")}
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

  // ── Bloqueo: ya existe un reporte global ────────────────────
  if (yaExisteReporteGlobal) {
    return (
      <DashboardLayout titulo="Reporte global" subtitulo="CU-REP-07 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
          {flechaAtras}
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: C.accentSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
                stroke={C.accentText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: 17, fontWeight: 700, color: C.textPrimary }}>
              Reporte global ya generado
            </h3>
            <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Ya cuentas con un reporte global de actividades en el sistema.
              Solo se puede generar uno por alumno durante todo el servicio social.
            </p>
            <button
              onClick={() => navigate("/alumno/reportes/estatus")}
              style={{
                padding: "10px 28px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Ver estatus del reporte
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Bloqueo: horas insuficientes (RN-REP-01) ────────────────
  if (!tieneHorasSuficientes) {
    const porcentaje = Math.min(Math.round((totalHoras / 480) * 100), 100);
    return (
      <DashboardLayout titulo="Reporte global" subtitulo="CU-REP-07 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
          {flechaAtras}
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "2rem 1.75rem",
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: C.warningSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
                stroke={C.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: 17, fontWeight: 700, color: C.textPrimary, textAlign: "center" }}>
              Horas insuficientes
            </h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: 13, color: C.textMuted, lineHeight: 1.6, textAlign: "center" }}>
              Para generar el reporte global debes acumular{" "}
              <strong style={{ color: C.textPrimary }}>480 horas</strong> registradas en tus bitácoras.
              Actualmente llevas <strong style={{ color: C.warning }}>{totalHoras} horas</strong>.
            </p>

            {/* Barra de progreso */}
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, fontWeight: 700, color: C.textDisabled,
                textTransform: "uppercase", letterSpacing: "0.07em",
                marginBottom: 6,
              }}>
                <span>Progreso</span>
                <span>{totalHoras} / 480 h</span>
              </div>
              <div style={{
                height: 8, borderRadius: RADIUS.full,
                background: C.bgInput, border: `1px solid ${C.borderDefault}`,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${porcentaje}%`,
                  background: C.warning, borderRadius: RADIUS.full,
                  transition: "width 0.4s ease",
                }} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.textDisabled, textAlign: "right" }}>
                {porcentaje}% completado
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Estado: reporte enviado correctamente ───────────────────
  if (enviado) {
    return (
      <DashboardLayout titulo="Reporte global" subtitulo="CU-REP-07 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
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
              Reporte global enviado
            </h3>
            <p style={{ margin: "0 0 0.75rem", fontSize: 14, color: C.textMuted }}>
              Tu reporte fue enviado a <strong>{profesorNombre}</strong> con estado:
            </p>
            <span style={{
              display: "inline-block", margin: "0 0 1.25rem",
              padding: "4px 14px", borderRadius: RADIUS.full,
              background: C.warningSoft, color: C.warning,
              fontSize: 13, fontWeight: 700, border: `1px solid ${C.warning}`,
            }}>
              Pendiente de revisión por profesor
            </span>
            <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
              El profesor recibirá una notificación y podrá revisar tu reporte desde su panel.
              Una vez aprobado, pasará a revisión de coordinación para concluir formalmente tu servicio social.
            </p>
            <button
              onClick={() => navigate("/alumno/reportes/estatus")}
              style={{
                padding: "10px 28px", borderRadius: RADIUS.md,
                background: C.accent, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Ver estatus del reporte
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Paso 1: Formulario + texto narrativo ────────────────────
  if (paso === 1) {
    return (
      <DashboardLayout titulo="Generar reporte global" subtitulo="CU-REP-07 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          {flechaAtras}

          {/* Franja de info */}
          <div style={{
            background: C.bgInput, borderRadius: RADIUS.md,
            border: `1px solid ${C.borderDefault}`,
            padding: "10px 16px", marginBottom: "1.25rem",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: "0.5rem",
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Periodo</span>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                {periodoTexto}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total horas</span>
              <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.accentText }}>
                {totalHoras} h
              </p>
            </div>
          </div>

          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Paso 1 de 3
            </p>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              {tituloAuto}
            </h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: 12, color: C.textMuted }}>
              Redacta un texto describiendo todas las actividades realizadas durante tu servicio social.
            </p>

            {/* Aviso título auto + periodo */}
            <div style={{
              marginBottom: "1.25rem", padding: "10px 14px", borderRadius: RADIUS.md,
              background: "rgba(0,58,143,0.08)", border: "1px solid rgba(0,58,143,0.2)",
              fontSize: 12, color: C.accentText, lineHeight: 1.6,
            }}>
              <strong>Título:</strong> {tituloAuto}<br />
              <strong>Periodo:</strong> {fechaInicioSS} — {fechaGeneracion}
            </div>

            {/* Texto narrativo */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
              }}>
                Descripción narrativa de actividades <span style={{ color: C.danger }}>*</span>
              </label>
              <textarea
                value={actividades}
                onChange={handleActividadesChange}
                rows={9}
                placeholder="Describe detalladamente todas las actividades realizadas a lo largo de tu servicio social, los conocimientos adquiridos, el impacto de tu trabajo y los resultados obtenidos..."
                style={{ ...inputBase(!!errores.actividades), resize: "vertical", lineHeight: 1.7 }}
              />
              {errores.actividades && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{errores.actividades}</p>
              )}
              {!errores.actividades && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: C.textDisabled }}>
                  Este texto narrativo quedará registrado en tu reporte global y será revisado por tu profesor asignado.
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => navigate("/alumno/reportes/historial")} style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}>
                Cancelar
              </button>
              <button onClick={irPaso2} style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}>
                Continuar → Confirmar firma
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Paso 2: Confirmación de firma (RN-REP-06) ────────────────
  if (paso === 2) {
    return (
      <DashboardLayout titulo="Generar reporte global" subtitulo="CU-REP-07 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          {flechaAtras}

          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Paso 2 de 3
            </p>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Confirmar firma
            </h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: 12, color: C.textMuted }}>
              Verifica que tu rúbrica registrada sea correcta antes de continuar.
            </p>

            <FirmaActiva firmaUrl={firmaUrl} C={C} />

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setPaso(1)} style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}>
                ← Atrás
              </button>
              <button onClick={irPaso3} style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}>
                Ver vista previa →
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Paso 3: Vista previa PDF + envío ────────────────────────
  return (
    <DashboardLayout titulo="Generar reporte global" subtitulo="CU-REP-07 · Alumno" rol="alumno" usuario={alumno.nombre}>
      <div style={{ maxWidth: 780, margin: "0 auto", width: "100%" }}>
        {flechaAtras}

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Paso 3 de 3
          </p>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            Vista previa del reporte global
          </h3>

          <BlobProvider document={<ReporteGlobalPDF datos={datosPDF()} />}>
            {({ url, loading, error }) => (
              <div style={{
                height: 600, marginBottom: "1.25rem",
                borderRadius: RADIUS.md, overflow: "hidden",
                border: `1px solid ${C.borderDefault}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: C.bgInput,
              }}>
                {loading && (
                  <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>
                    Generando vista previa...
                  </p>
                )}
                {error && (
                  <p style={{ margin: 0, fontSize: 13, color: C.danger }}>
                    Error al generar el PDF. Intenta de nuevo.
                  </p>
                )}
                {!loading && !error && url && (
                  <iframe
                    src={url}
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    title="Vista previa del reporte global"
                  />
                )}
              </div>
            )}
          </BlobProvider>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setPaso(2)}
              style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}
            >
              ← Editar
            </button>
            <button
              onClick={handleEnviar}
              style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}
            >
              Enviar al profesor →
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
