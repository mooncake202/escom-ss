import { useTheme, RADIUS }                from "@/themes/colors";
import { DashboardLayout }                  from "@/components/layout/DashboardLayout";
import { ReporteCard }                      from "./components/ReporteCard";
import { ReporteDetalle }                   from "./components/ReporteDetalle";
import { useRevisarReportes, PROFESOR }     from "./hooks/useRevisarReportes";

export default function RevisarReportes() {
  const { C } = useTheme();
  const {
    tieneReportes, pendientes, procesados, reporte,
    pendientesAgrupados, procesadosAgrupados,
    busqueda, setBusqueda,
    seleccionado, seleccionar, cerrar,
    modo, irModo, resetModo,
    rubricaGuardada, firmaFile, firmaUrl, errorFirma,
    firmaConfirmada, handleFirmaChange, confirmarFirmaYVerPDF,
    comentario, handleComentarioChange, errorComentario,
    resultado, setResultado,
    loading,
    confirmarAprobacion, confirmarRechazo,
    blobRef, datosPDF,
  } = useRevisarReportes();

  // ── Empty state ──────────────────────────────────────────────
  if (!tieneReportes) {
    return (
      <DashboardLayout titulo="Reportes de alumnos" subtitulo="CU-REP-05 · Profesor" rol="profesor" usuario={PROFESOR.nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%", padding: "0 1rem" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.borderDefault}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: C.bgInput,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
                stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
              Sin reportes disponibles
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              No tienes alumnos asignados con reportes enviados en este momento.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Reportes de alumnos" subtitulo="CU-REP-05 · Profesor" rol="profesor" usuario={PROFESOR.nombre}>
      <div style={{ maxWidth: 900, margin: "0 auto", width: "100%", padding: "0 1rem" }}>

        {/* ── Toast resultado ── */}
        {resultado && (
          <div style={{
            marginBottom: "1.25rem", padding: "12px 16px", borderRadius: RADIUS.md,
            background: resultado.tipo === "aprobado" ? C.successSoft : "rgba(239,68,68,0.08)",
            border: `1px solid ${resultado.tipo === "aprobado" ? C.success : C.danger}`,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem",
          }}>
            <div>
              {resultado.tipo === "aprobado" ? (
                <>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.success }}>
                    ✓ Reporte aprobado y firmado — enviado a coordinación
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: C.textMuted }}>
                    {resultado.alumno} — {resultado.periodo}
                  </p>
                  {/*<p style={{ margin: "0 0 4px", fontSize: 11, fontFamily: "monospace", color: C.textDisabled, wordBreak: "break-all" }}>
                    SHA-256: {resultado.hash}
                  </p> */}
                  <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                    Coordinación recibirá una notificación para proceder con la validación final.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.danger }}>
                    ✕ Reporte rechazado — firmas invalidadas
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: C.textMuted }}>
                    {resultado.alumno} — {resultado.periodo}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                    El alumno fue notificado y deberá corregir y volver a firmar desde cero.
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => setResultado(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textDisabled, fontSize: 18, padding: 0, flexShrink: 0 }}
            >✕</button>
          </div>
        )}

        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>

          {/* ── Lista izquierda ── */}
          <div style={{ flex: "0 0 310px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Barra de búsqueda */}
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
                placeholder="Buscar por alumno..."
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

            {/* Pendientes */}
            <div>
              <p style={{ margin: "0 0 0.625rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Pendientes de revisión ({pendientes.length})
              </p>
              {pendientesAgrupados.length === 0 ? (
                <div style={{
                  padding: "1rem", borderRadius: RADIUS.lg,
                  background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                  textAlign: "center",
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
                    {busqueda ? `Sin resultados para "${busqueda}".` : "Sin reportes pendientes."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {pendientesAgrupados.map(grupo => (
                    <div key={grupo.alumno}>
                      {/* Nombre del alumno */}
                      <p style={{ margin: "0 0 0.375rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        {grupo.alumno}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {grupo.reportes.map(r => (
                          <ReporteCard
                            key={r.id} reporte={r}
                            activo={seleccionado === r.id}
                            onSeleccionar={seleccionar}
                            esPendiente C={C}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Procesados */}
            {procesadosAgrupados.length > 0 && (
              <div>
                <p style={{ margin: "0 0 0.625rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Procesados ({procesados.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {procesadosAgrupados.map(grupo => (
                    <div key={grupo.alumno}>
                      <p style={{ margin: "0 0 0.375rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        {grupo.alumno}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {grupo.reportes.map(r => (
                          <ReporteCard
                            key={r.id} reporte={r}
                            activo={seleccionado === r.id}
                            onSeleccionar={seleccionar}
                            esPendiente={false} C={C}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Placeholder derecho ── */}
          {!reporte && (
            <div style={{
              flex: 1, background: C.bgCard, borderRadius: RADIUS.lg,
              border: `1px dashed ${C.borderDefault}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: 260,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
                Selecciona un reporte para ver el detalle
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel lateral solapado ── */}
      {reporte && (
        <ReporteDetalle
          reporte={reporte}
          onCerrar={cerrar}
          modo={modo}
          irModo={irModo}
          resetModo={resetModo}
          rubricaGuardada={rubricaGuardada}
          firmaFile={firmaFile}
          firmaUrl={firmaUrl}
          errorFirma={errorFirma}
          firmaConfirmada={firmaConfirmada}
          handleFirmaChange={handleFirmaChange}
          confirmarFirmaYVerPDF={confirmarFirmaYVerPDF}
          comentario={comentario}
          onComentarioChange={handleComentarioChange}
          errorComentario={errorComentario}
          loading={loading}
          confirmarAprobacion={confirmarAprobacion}
          confirmarRechazo={confirmarRechazo}
          blobRef={blobRef}
          datosPDF={datosPDF}
          C={C}
        />
      )}
    </DashboardLayout>
  );
}