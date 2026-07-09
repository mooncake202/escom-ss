import { useTheme, RADIUS }                    from "@/themes/colors";
import { DashboardLayout }                      from "@/components/layout/DashboardLayout";
import { useNavigate }                          from "react-router-dom";
import { BlobProvider }                         from "@react-pdf/renderer";
import { CalendarioReporte }                    from "./components/CalendarioReporte";
import { AvanceActividades }                    from "./components/AvanceActividades";
import { FirmaUpload }                          from "./components/FirmaUpload";
import { ReportePDF }                           from "./components/ReportePDF";
import { useGenerarReporte, DIAS_INHABILES }    from "./hooks/useGenerarReporte";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function GenerarReporte() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const {
    alumno, periodo, mesActivo, setMesActivo,
    diasConBitacoraPorMes, totalDiasLaborados, totalHoras,
    tituloAuto, avances, esPrimerReporte,
    paso, setPaso,
    actividades, handleActividadesChange,
    firma, firmaUrl, handleFirmaChange,
    errores, irPaso2, irPaso3, datosPDF,
    enviado, handleEnviar,
  } = useGenerarReporte();

  const inputBase = (hasError) => ({
    width: "100%", padding: "10px 14px", background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  });

  const mesData = periodo.meses[mesActivo];

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

  // ── Franja resumen ───────────────────────────────────────────
  const franjaResumen = (
    <div style={{
      background: C.bgInput, borderRadius: RADIUS.md,
      border: `1px solid ${C.borderDefault}`,
      padding: "10px 16px", marginBottom: "1.25rem",
      display: "flex", justifyContent: "space-between",
      alignItems: "center", flexWrap: "wrap", gap: "0.5rem",
    }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Periodo</span>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
          {periodo.fechaInicio} — {periodo.fechaFin}
        </p>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Días laborados</span>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.accentText }}>{totalDiasLaborados}</p>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total horas</span>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.accentText }}>{totalHoras} h</p>
      </div>
    </div>
  );

  // ── Paso 1: Calendario ───────────────────────────────────────
  if (paso === 1) {
    return (
      <DashboardLayout titulo="Generar reporte mensual" subtitulo="CU-REP-01 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          {flechaAtras}
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Paso 1 de {esPrimerReporte ? 4 : 3}
            </p>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              {tituloAuto}
            </h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: 12, color: C.textMuted }}>
              Periodo: {periodo.fechaInicio} — {periodo.fechaFin}
            </p>

            {/* Selector de mes (solo dos meses) */}
            {periodo.tipo === "dos-meses" && (
              <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
                {periodo.meses.map(({ year, month }, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMesActivo(idx)}
                    style={{
                      padding: "6px 14px", borderRadius: RADIUS.full,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit",
                      background: mesActivo === idx ? C.accent : "transparent",
                      border: `1px solid ${mesActivo === idx ? C.accent : C.borderDefault}`,
                      color: mesActivo === idx ? "#fff" : C.textMuted,
                    }}
                  >
                    {MESES[month]} {year}
                  </button>
                ))}
              </div>
            )}

            {/* Aviso */}
            <div style={{
              marginBottom: "1rem", padding: "10px 14px", borderRadius: RADIUS.md,
              background: "rgba(0,58,143,0.08)", border: "1px solid rgba(0,58,143,0.2)",
              fontSize: 12, color: C.accentText, lineHeight: 1.6,
            }}>
              Los días laborados se determinan automáticamente con base en tus
              bitácoras registradas. Cada día con bitácora equivale a <strong>4 horas</strong>.
            </div>

            {/* Calendario */}
            <div style={{
              background: C.bgInput, borderRadius: RADIUS.lg,
              border: `1px solid ${C.borderDefault}`,
              padding: "1rem", marginBottom: "0.75rem",
            }}>
              <CalendarioReporte
                year={mesData.year}
                month={mesData.month}
                diasSeleccionados={diasConBitacoraPorMes[mesActivo]}
                diasInhabiles={DIAS_INHABILES}
                C={C}
              />
            </div>

            {/* Resumen días */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                {totalDiasLaborados} día{totalDiasLaborados !== 1 ? "s" : ""} laborado{totalDiasLaborados !== 1 ? "s" : ""}
              </span>
              <span style={{
                padding: "2px 10px", borderRadius: RADIUS.full,
                background: C.accentSoft, color: C.accentText, fontSize: 12, fontWeight: 700,
              }}>
                Total: {totalHoras} h
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => navigate("/alumno/reportes")} style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}>
                Cancelar
              </button>
              <button onClick={() => setPaso(2)} style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}>
                Continuar →
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Paso 2: Detalle + avance ─────────────────────────────────
  if (paso === 2) {
    return (
      <DashboardLayout titulo="Generar reporte mensual" subtitulo="CU-REP-01 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          {flechaAtras}
          {franjaResumen}
          <AvanceActividades avances={avances} C={C} />

          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Paso 2 de {esPrimerReporte ? 4 : 3}
            </p>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Detalle del reporte
            </h3>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
              }}>
                Actividades realizadas <span style={{ color: C.danger }}>*</span>
              </label>
              <textarea
                value={actividades}
                onChange={handleActividadesChange}
                rows={6}
                placeholder="Describe las actividades realizadas durante el periodo, una por línea..."
                style={{ ...inputBase(!!errores.actividades), resize: "vertical", lineHeight: 1.6 }}
              />
              {errores.actividades && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: C.danger }}>{errores.actividades}</p>
              )}
              {!errores.actividades && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: C.textDisabled }}>
                  Escribe cada actividad en una línea. Se numerarán automáticamente en el PDF.
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setPaso(1)} style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}>
                ← Atrás
              </button>
              <button onClick={irPaso2} style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}>
                {esPrimerReporte ? "Continuar → Firma" : "Ver vista previa →"}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Paso 3: Firma (solo primer reporte) ──────────────────────
  if (paso === 3 && esPrimerReporte) {
    return (
      <DashboardLayout titulo="Generar reporte mensual" subtitulo="CU-REP-01 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          {flechaAtras}
          {franjaResumen}

          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Paso 3 de 4
            </p>
            <h3 style={{ margin: "0 0 1.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Sube tu firma
            </h3>

            <FirmaUpload
              firma={firma}
              firmaUrl={firmaUrl}
              error={errores.firma}
              onChange={handleFirmaChange}
              C={C}
            />

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setPaso(2)} style={{
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

  // ── Confirmación de envío ────────────────────────────────────
  if (enviado) {
    return (
      <DashboardLayout titulo="Generar reporte mensual" subtitulo="CU-REP-01 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
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
              Reporte enviado correctamente
            </h3>
            <p style={{ margin: "0 0 0.75rem", fontSize: 14, color: C.textMuted }}>
              Tu reporte fue enviado a <strong>Dr. Torres Vega</strong> con estado:
            </p>
            <span style={{
              display: "inline-block", margin: "0 0 1.5rem",
              padding: "4px 14px", borderRadius: RADIUS.full,
              background: C.warningSoft, color: C.warning,
              fontSize: 13, fontWeight: 700, border: `1px solid ${C.warning}`,
            }}>
              Pendiente de revisión por profesor
            </span>
            <p style={{ margin: "0 0 2rem", fontSize: 13, color: C.textDisabled, lineHeight: 1.6 }}>
              El profesor recibirá una notificación y podrá revisar tu reporte desde su panel.
            </p>
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
      </DashboardLayout>
    );
  }

  // ── Paso 4 (o 3): Vista previa PDF + envío ───────────────────
  const pasoPDF = esPrimerReporte ? 4 : 3;
  return (
    <DashboardLayout titulo="Generar reporte mensual" subtitulo="CU-REP-01 · Alumno" rol="alumno" usuario={alumno.nombre}>
      <div style={{ maxWidth: 780, margin: "0 auto", width: "100%" }}>
        {flechaAtras}
        {franjaResumen}

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          marginBottom: "1.25rem",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Paso {pasoPDF} de {esPrimerReporte ? 4 : 3}
          </p>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            Vista previa del reporte
          </h3>

          {/* PDF con BlobProvider + iframe */}
          <BlobProvider document={<ReportePDF datos={datosPDF()} />}>
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
                    title="Vista previa del reporte"
                  />
                )}
              </div>
            )}
          </BlobProvider>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setPaso(esPrimerReporte ? 3 : 2)}
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