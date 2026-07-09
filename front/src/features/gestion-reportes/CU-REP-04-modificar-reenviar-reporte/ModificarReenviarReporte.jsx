import { useTheme, RADIUS }             from "@/themes/colors";
import { DashboardLayout }               from "@/components/layout/DashboardLayout";
import { useNavigate }                   from "react-router-dom";
import { BlobProvider }                  from "@react-pdf/renderer";
import { Calendario }                    from "./components/Calendario";
import { AvanceActividades }             from "../CU-REP-01-generar-reporte/components/AvanceActividades";
import { ReportePDF }                    from "../CU-REP-01-generar-reporte/components/ReportePDF";
import { MESES, useModificarReenviarReporte } from "./hooks/useModificarReenviarReporte";

export default function ModificarReenviarReporte() {
  const { C }    = useTheme();
  const navigate = useNavigate();
  const {
    alumno, reporteRechazado, avancesMes,
    year, month,
    paso, setPaso,
    seleccionados,
    form, handleChange,
    errores, setErrores,
    enviado, confirmarReenvio, datosPDF,
    irAPaso2, irAPaso3,
  } = useModificarReenviarReporte();

  const inputBase = (hasError) => ({
    width: "100%", padding: "10px 14px", background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  });

  const totalDiasLaborados = seleccionados.size;
  const totalHoras         = seleccionados.size * 4;
  const diasDelMes         = new Date(year, month + 1, 0).getDate();
  const periodoInicio      = `1 de ${MESES[month]} de ${year}`;
  const periodoFin         = `${diasDelMes} de ${MESES[month]} de ${year}`;

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

  const avisoRechazo = (
    <div style={{
      marginBottom: "1.25rem", padding: "10px 14px", borderRadius: RADIUS.md,
      background: "rgba(239,68,68,0.05)", border: `1px solid ${C.danger}`,
      fontSize: 13, color: C.danger, lineHeight: 1.6,
    }}>
      <strong>Motivo de rechazo:</strong> {reporteRechazado.comentarioRechazo}
    </div>
  );

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
          {periodoInicio} — {periodoFin}
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
      <DashboardLayout titulo="Corregir reporte mensual" subtitulo="CU-REP-04 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          {flechaAtras}
          {avisoRechazo}
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Paso 1 de 3
            </p>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              {reporteRechazado.titulo}
            </h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: 12, color: C.textMuted }}>
              Periodo: {periodoInicio} — {periodoFin}
            </p>

            <div style={{
              marginBottom: "1rem", padding: "10px 14px", borderRadius: RADIUS.md,
              background: "rgba(0,58,143,0.08)", border: "1px solid rgba(0,58,143,0.2)",
              fontSize: 12, color: C.accentText, lineHeight: 1.6,
            }}>
              Los días laborados se determinan automáticamente con base en tus
              bitácoras registradas. Cada día con bitácora equivale a <strong>4 horas</strong>.
            </div>

            <div style={{
              background: C.bgInput, borderRadius: RADIUS.lg,
              border: `1px solid ${C.borderDefault}`,
              padding: "1rem", marginBottom: "0.75rem",
            }}>
              <Calendario year={year} month={month} seleccionados={seleccionados} C={C} />
            </div>

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
              <button onClick={irAPaso2} style={{
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
      <DashboardLayout titulo="Corregir reporte mensual" subtitulo="CU-REP-04 · Alumno" rol="alumno" usuario={alumno.nombre}>
        <div style={{ maxWidth: 580, margin: "0 auto", width: "100%" }}>
          {flechaAtras}
          {avisoRechazo}
          {franjaResumen}
          <AvanceActividades avances={avancesMes} C={C} />

          <div style={{
            background: C.bgCard, borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Paso 2 de 3
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
                name="actividades"
                value={form.actividades}
                onChange={handleChange}
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
              <button onClick={() => { setPaso(1); setErrores({}); }} style={{
                flex: 1, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${C.borderDefault}`,
                color: C.textMuted, fontFamily: "inherit",
              }}>
                ← Atrás
              </button>
              <button onClick={irAPaso3} style={{
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

  // ── Confirmación de reenvío ──────────────────────────────────
  if (enviado) {
    return (
      <DashboardLayout titulo="Corregir reporte mensual" subtitulo="CU-REP-04 · Alumno" rol="alumno" usuario={alumno.nombre}>
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
              Reporte reenviado correctamente
            </h3>
            <p style={{ margin: "0 0 0.75rem", fontSize: 14, color: C.textMuted }}>
              Tu corrección fue enviada a <strong>Dr. Torres Vega</strong> con estado:
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

  // ── Paso 3: Vista previa PDF + reenvío ───────────────────────
  return (
    <DashboardLayout titulo="Corregir reporte mensual" subtitulo="CU-REP-04 · Alumno" rol="alumno" usuario={alumno.nombre}>
      <div style={{ maxWidth: 780, margin: "0 auto", width: "100%" }}>
        {flechaAtras}
        {franjaResumen}

        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "1.75rem",
          marginBottom: "1.25rem",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Paso 3 de 3
          </p>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
            Vista previa del reporte
          </h3>

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
              onClick={() => { setPaso(2); setErrores({}); }}
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
              onClick={confirmarReenvio}
              style={{
                flex: 2, padding: "10px", borderRadius: RADIUS.md,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: C.accent, border: "none", color: "#fff", fontFamily: "inherit",
              }}
            >
              Reenviar al profesor →
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}