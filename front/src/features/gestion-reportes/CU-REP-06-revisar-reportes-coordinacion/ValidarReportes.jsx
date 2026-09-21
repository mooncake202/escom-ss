import { useEffect }                                          from "react";
import { useTheme, RADIUS }                                    from "@/themes/colors";
import { DashboardLayout }                                       from "@/components/layout/DashboardLayout";
import { ReporteCard }                                           from "./components/ReporteCard";
import { ReporteDetalle }                                        from "./components/ReporteDetalle";
import { claveReporte }                                          from "../CU-REP-05-revisar-reportes-profesor/revisionReportes";
import {
  useValidarReportes,
  FILTRO_ESTADO, CRITERIO,
}                                                                from "./hooks/useValidarReportes";
import { useSesion, nombreCompletoSesion }                       from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import { listarNotificacionesPendientes, marcarNotificacionLeida } from "@/services/notificacionesService";

export default function ValidarReportes() {
  const { C } = useTheme();
  const { usuario } = useSesion();
  const nombreCoordinacion = nombreCompletoSesion(usuario);
  const {
    carga, recargar,
    tieneReportes, reportesFiltrados, reporte, detalle, reintentarDetalle, estaDestacado,
    seleccionado, seleccionar, cerrar,
    pdf, verPdf, cerrarPdf,
    modo, irModo, resetModo,
    filtroEstado, setFiltroEstado,
    criterio, setCriterio,
    busqueda, setBusqueda,
    comentario, handleComentarioChange, errorComentario,
    resultado, setResultado,
    loading, errorAccion,
    confirmarAprobacion, confirmarRechazo,
  } = useValidarReportes();

  // Al entrar se marcan como leídas las notificaciones de reportes (mismo patrón que Ofertas y CU-REP-05): la ruta trae
  // "?destacar=<id>", así que se filtran por prefijo y se marcan una por una.
  useEffect(() => {
    listarNotificacionesPendientes()
      .then((notifs) => {
        const propias = notifs.filter((n) => n.ruta_relacionada?.startsWith("/coordinacion/reportes"));
        return Promise.all(propias.map((n) => marcarNotificacionLeida(n.id)));
      })
      .catch((err) => console.error("No se pudieron marcar como leídas las notificaciones de reportes:", err));
  }, []);

  // ── Carga inicial y error ────────────────────────────────────
  if (carga.estado !== "listo") {
    return (
      <DashboardLayout titulo="Reportes de validación" subtitulo="Coordinación" rol="coordinacion" usuario={nombreCoordinacion}>
        <div style={{ maxWidth: 560, margin: "0 auto", width: "100%", padding: "0 1rem" }}>
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.borderDefault}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            {carga.estado === "cargando" ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando los reportes de validación...</p>
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

  // ── Empty state ──────────────────────────────────────────────
  if (!tieneReportes) {
    return (
      <DashboardLayout titulo="Reportes de validación" subtitulo="Coordinación" rol="coordinacion" usuario={nombreCoordinacion}>
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
              No hay reportes pendientes de validación en este momento.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Reportes de validación" subtitulo="Coordinación" rol="coordinacion" usuario={nombreCoordinacion}>
      <div style={{ maxWidth: 980, margin: "0 auto", width: "100%", padding: "0 1rem" }}>

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
                    ✓ Reporte aprobado — PDF final con el sello de validación del prototipo
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: C.textMuted }}>
                    {resultado.alumno} — {resultado.periodo}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                    El alumno y el profesor fueron notificados.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.danger }}>
                    ✕ Reporte rechazado por coordinación
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: C.textMuted }}>
                    {resultado.alumno} — {resultado.periodo}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                    El alumno y el profesor fueron notificados. El alumno deberá corregir y volver a firmar el reporte.
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

        {/* ── Filtros ── */}
        <div style={{
          display: "flex", gap: "0.75rem", marginBottom: "1.25rem",
          flexWrap: "wrap", alignItems: "center",
        }}>

          {/* Filtro estado — toggle */}
          <div style={{
            display: "flex", borderRadius: RADIUS.md, overflow: "hidden",
            border: `1px solid ${C.borderDefault}`,
          }}>
            {[
              { key: FILTRO_ESTADO.PENDIENTES, label: "Pendientes" },
              { key: FILTRO_ESTADO.PROCESADOS, label: "Procesados" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFiltroEstado(key); seleccionar(null); }}
                style={{
                  padding: "8px 16px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", border: "none",
                  background: filtroEstado === key ? C.accent : "transparent",
                  color: filtroEstado === key ? "#fff" : C.textMuted,
                  transition: "background 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Criterio de búsqueda */}
          <select
            value={criterio}
            onChange={e => setCriterio(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: RADIUS.md,
              background: C.bgInput, border: `1px solid ${C.borderDefault}`,
              color: C.textPrimary, fontSize: 13, fontFamily: "inherit",
              cursor: "pointer", outline: "none",
            }}
          >
            <option value={CRITERIO.TODOS}>Todos</option>
            <option value={CRITERIO.ALUMNO}>Alumno</option>
            <option value={CRITERIO.PROFESOR}>Profesor</option>
            <option value={CRITERIO.CARRERA}>Carrera</option>
          </select>

          {/* Input de búsqueda */}
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
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
              placeholder={
                criterio === CRITERIO.ALUMNO   ? "Buscar por alumno..." :
                criterio === CRITERIO.PROFESOR ? "Buscar por profesor..." :
                criterio === CRITERIO.CARRERA  ? "Buscar por carrera..." :
                "Buscar..."
              }
              style={{
                width: "100%", padding: "8px 32px 8px 34px", boxSizing: "border-box",
                background: C.bgInput, border: `1px solid ${C.borderDefault}`,
                borderRadius: RADIUS.md, color: C.textPrimary,
                fontSize: 13, outline: "none", fontFamily: "inherit",
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

        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>

          {/* ── Lista izquierda ── */}
          <div style={{ flex: "0 0 310px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ margin: "0 0 0.625rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {filtroEstado === FILTRO_ESTADO.PENDIENTES ? "Pendientes de validación" : "Procesados"} ({reportesFiltrados.length})
            </p>

            {reportesFiltrados.length === 0 ? (
              <div style={{
                padding: "1rem", borderRadius: RADIUS.lg,
                background: C.bgCard, border: `1px solid ${C.borderDefault}`,
                textAlign: "center",
              }}>
                <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>
                  {busqueda ? `Sin resultados para "${busqueda}".` : "Sin reportes en esta categoría."}
                </p>
              </div>
            ) : (
              reportesFiltrados.map(r => (
                <ReporteCard
                  key={claveReporte(r)}
                  reporte={r}
                  activo={seleccionado === claveReporte(r)}
                  onSeleccionar={seleccionar}
                  destacado={estaDestacado(r)}
                  C={C}
                />
              ))
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
          detalle={detalle}
          onReintentar={reintentarDetalle}
          onCerrar={cerrar}
          pdf={pdf}
          onVerPdf={verPdf}
          onCerrarPdf={cerrarPdf}
          modo={modo}
          irModo={irModo}
          resetModo={resetModo}
          comentario={comentario}
          onComentarioChange={handleComentarioChange}
          errorComentario={errorComentario}
          loading={loading}
          errorAccion={errorAccion}
          confirmarAprobacion={confirmarAprobacion}
          confirmarRechazo={confirmarRechazo}
          C={C}
        />
      )}
    </DashboardLayout>
  );
}