import { useEffect }                    from "react";
import { useNavigate }                  from "react-router-dom";
import { useTheme, RADIUS }            from "@/themes/colors";
import { DashboardLayout }              from "@/components/layout/DashboardLayout";
import { PasoCirculo }                  from "./components/PasoCirculo";
import { useConsultarEstatusReporte }   from "./hooks/useConsultarEstatusReporte";
import { estadoAlumnoDe, describirEvento, textoEsperaActual, fechaUltimoEvento, nombreEtapa, consultaDeReporte } from "./seguimientoReportes";
import { etiquetaReporte, textoPeriodo, textoFechaEnvio } from "../CU-REP-05-revisar-reportes-profesor/revisionReportes";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import { listarNotificacionesPendientes, marcarNotificacionLeida } from "@/services/notificacionesService";

function BackLink({ C }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/alumno/reportes")}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.375rem",
        background: "none", border: "none", padding: "0 0 1rem", cursor: "pointer",
        fontSize: 13, fontWeight: 600, color: C.textMuted,
      }}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Mis reportes
    </button>
  );
}

// Fuera del componente principal: definirlo dentro lo recrearía en cada render.
function Layout({ usuario, children }) {
  return <DashboardLayout titulo="Estatus del reporte" subtitulo="Alumno" rol="alumno_asignado" usuario={usuario}>{children}</DashboardLayout>;
}

export default function ConsultarEstatusReporte() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { usuario } = useSesion();
  const nombreAlumno = nombreCompletoSesion(usuario);
  const { estado, error, reporte, destacarUltimo, recargar } = useConsultarEstatusReporte();

  // Al entrar se marcan como leídas las notificaciones de reportes (mismo patrón que Ofertas y CU-REP-05): la ruta trae
  // "?destacar=<id>", así que se filtran por prefijo y se marcan una por una.
  useEffect(() => {
    listarNotificacionesPendientes()
      .then((notifs) => {
        const propias = notifs.filter((n) => n.ruta_relacionada?.startsWith("/alumno/reportes/estatus"));
        return Promise.all(propias.map((n) => marcarNotificacionLeida(n.id)));
      })
      .catch((err) => console.error("No se pudieron marcar como leídas las notificaciones de reportes:", err));
  }, []);

  // ── Carga y error ────────────────────────────────────────────
  if (estado === "cargando" || estado === "error") {
    return (
      <Layout usuario={nombreAlumno}>
        <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
          <BackLink C={C} />
          <div style={{
            background: C.bgCard, borderRadius: RADIUS.xl,
            border: `1px solid ${C.borderDefault}`,
            padding: "2.5rem 2rem", textAlign: "center",
          }}>
            {estado === "cargando" ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando el seguimiento de tu reporte...</p>
            ) : (
              <>
                <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{error}</p>
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
      </Layout>
    );
  }

  // ── Flujo alterno: sin reportes ──────────────────────────────
  if (estado === "vacio") {
    return (
      <Layout usuario={nombreAlumno}>
        <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
          <BackLink C={C} />
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
              Sin reportes registrados
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Aún no tienes ningún reporte enviado en el sistema.<br />
              Genera tu primer reporte mensual para comenzar.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const badge = estadoAlumnoDe(reporte.estadoReporte);
  const esRechazado = reporte.puedeCorregir;
  const espera = textoEsperaActual(reporte.estadoReporte);
  const ultimaFecha = fechaUltimoEvento(reporte.historial);
  const eventos = reporte.historial;

  return (
    <Layout usuario={nombreAlumno}>
      <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
        <BackLink C={C} />

        {/* Encabezado del reporte */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${esRechazado ? C.danger : C.borderDefault}`,
          padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: C.textPrimary }}>
                {etiquetaReporte(reporte)}
              </p>
              {textoPeriodo(reporte) && (
                <p style={{ margin: "0 0 3px", fontSize: 12, color: C.textMuted }}>Periodo: {textoPeriodo(reporte)}</p>
              )}
              {reporte.diasLaborados != null && reporte.horasReportadas != null && (
                <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                  {reporte.diasLaborados} días · {reporte.horasReportadas} h
                </p>
              )}
            </div>
            <span style={{
              padding: "4px 12px", borderRadius: RADIUS.full,
              background: badge.bg(C), color: badge.color(C),
              fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {badge.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {reporte.revisor && (
              <span style={{ fontSize: 12, color: C.textDisabled }}>
                Profesor: <strong style={{ color: C.textMuted }}>{reporte.revisor.nombreCompleto}</strong>
              </span>
            )}
            {ultimaFecha && (
              <span style={{ fontSize: 12, color: C.textDisabled }}>
                Última actualización: <strong style={{ color: C.textMuted }}>{textoFechaEnvio(ultimaFecha)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Historial real: una entrada por revisión guardada, en orden (los rechazos anteriores se conservan) */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.5rem", marginBottom: "1.25rem",
        }}>
          <p style={{ margin: "0 0 1.25rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Historial de revisión
          </p>

          {eventos.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled, fontStyle: "italic" }}>Este reporte no tiene movimientos registrados.</p>
          )}

          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", left: 15, top: 20, bottom: 20,
              width: 2, background: C.borderDefault, zIndex: 0,
            }} />

            {eventos.map((evento, i) => {
              const { titulo, rechazo } = describirEvento(evento);
              const esUltimo = i === eventos.length - 1;
              const resaltado = destacarUltimo && esUltimo;
              return (
                <div key={evento.id} style={{
                  display: "flex", gap: "1rem", alignItems: "flex-start",
                  marginBottom: !esUltimo || espera ? "1.5rem" : 0,
                  position: "relative",
                }}>
                  <PasoCirculo completado={!rechazo} activo={false} rechazado={rechazo} numero={i + 1} C={C} />
                  <div style={{
                    paddingTop: 4, flex: 1, minWidth: 0,
                    ...(resaltado ? { padding: "4px 10px", borderRadius: RADIUS.md, border: `1px solid ${rechazo ? C.danger : C.accent}`, background: C.bgInput } : {}),
                  }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: rechazo ? C.danger : C.success }}>
                      {titulo}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
                      {textoFechaEnvio(evento.fecha)}
                      {evento.actor ? ` · ${evento.actor.nombreCompleto}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Lo que sigue según el estado actual: no es un movimiento guardado, por eso no lleva fecha */}
            {espera && (
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", position: "relative" }}>
                <PasoCirculo completado={false} activo={!esRechazado} rechazado={esRechazado} simbolo="•" C={C} />
                <div style={{ paddingTop: 4 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: esRechazado ? C.danger : C.warning }}>{espera}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textDisabled, fontStyle: "italic" }}>Estado actual</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Motivo del último rechazo + acción, solo si el estado ACTUAL es rechazado */}
        {esRechazado && (
          <div style={{
            background: "rgba(239,68,68,0.05)", borderRadius: RADIUS.lg,
            border: `1px solid ${C.danger}`, padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
          }}>
            <p style={{ margin: "0 0 0.625rem", fontSize: 11, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Motivo de rechazo{reporte.ultimoRechazo ? ` · ${nombreEtapa(reporte.ultimoRechazo.etapa)}` : ""}
            </p>
            <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.textPrimary, lineHeight: 1.7 }}>
              {reporte.ultimoRechazo?.motivo ?? "No se registró un motivo."}
            </p>
            <button
              onClick={() => navigate(`/alumno/reportes/modificar?${consultaDeReporte(reporte)}`)}
              style={{
                padding: "9px 18px", borderRadius: RADIUS.md,
                background: C.danger, border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Editar y reenviar →
            </button>
          </div>
        )}

      </div>
    </Layout>
  );
}
