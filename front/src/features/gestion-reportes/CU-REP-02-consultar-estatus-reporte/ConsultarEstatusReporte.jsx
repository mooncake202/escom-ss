import { useNavigate }                  from "react-router-dom";
import { useTheme, RADIUS }            from "@/themes/colors";
import { DashboardLayout }              from "@/components/layout/DashboardLayout";
import { PasoCirculo }                  from "./components/PasoCirculo";
import {
  useConsultarEstatusReporte,
  PASOS, getBadge,
} from "./hooks/useConsultarEstatusReporte";

function BackLink({ C }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
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

export default function ConsultarEstatusReporte() {
  const { C } = useTheme();
  const { alumno, estadoActivo, reporte, pasoActivo, esRechazado } = useConsultarEstatusReporte();
  const badge = getBadge(estadoActivo, C);

  // ── Flujo alterno: sin reportes ──────────────────────────────
  if (estadoActivo === "sin_reportes") {
    return (
      <DashboardLayout titulo="Estatus del reporte" subtitulo="CU-REP-04 · Alumno" rol="alumno" usuario={alumno.nombre}>
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
              Aún no tienes ningún reporte generado en el sistema.<br />
              Genera tu primer reporte mensual para comenzar.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout titulo="Estatus del reporte" subtitulo="CU-REP-02 · Alumno" rol="alumno" usuario={alumno.nombre}>
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
                Reporte · {reporte.periodo}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                {reporte.diasLaborados} días · {reporte.horas} h
              </p>
            </div>
            <span style={{
              padding: "4px 12px", borderRadius: RADIUS.full,
              background: badge.bg, color: badge.color,
              fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {badge.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.textDisabled }}>
              Profesor: <strong style={{ color: C.textMuted }}>{reporte.profesor}</strong>
            </span>
            <span style={{ fontSize: 12, color: C.textDisabled }}>
              Última actualización: <strong style={{ color: C.textMuted }}>{reporte.ultimaActualizacion}</strong>
            </span>
          </div>
        </div>

        {/* Stepper */}
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.5rem", marginBottom: "1.25rem",
        }}>
          <p style={{ margin: "0 0 1.25rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Flujo de revisión
          </p>

          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", left: 15, top: 20, bottom: 20,
              width: 2, background: C.borderDefault, zIndex: 0,
            }} />

            {PASOS.map((paso, i) => {
              const completado = i < pasoActivo;
              const activo     = i === pasoActivo;
              const rechazado  = activo && esRechazado;
              const ocurrido   = completado || activo;
              const fecha      = reporte.timestamps[paso.fechaKey];

              let prefijo = "";
              if (ocurrido && fecha) {
                if (rechazado) {
                  prefijo = estadoActivo === "rechazado_coordinacion"
                    ? "Rechazado por coordinación el"
                    : "Rechazado por profesor el";
                } else if (activo) {
                  prefijo = "En proceso desde";
                } else {
                  prefijo = "Completado el";
                }
              }

              return (
                <div key={paso.key} style={{
                  display: "flex", gap: "1rem", alignItems: "flex-start",
                  marginBottom: i < PASOS.length - 1 ? "1.5rem" : 0,
                  position: "relative",
                }}>
                  <PasoCirculo
                    completado={completado}
                    activo={activo && !esRechazado}
                    rechazado={rechazado}
                    numero={i + 1}
                    C={C}
                  />
                  <div style={{ paddingTop: 4 }}>
                    <p style={{
                      margin: "0 0 4px", fontSize: 13,
                      fontWeight: ocurrido ? 700 : 500,
                      color: activo
                        ? (esRechazado ? C.danger : C.warning)
                        : completado ? C.success : C.textDisabled,
                    }}>
                      {paso.label}
                    </p>
                    <p style={{
                      margin: 0, fontSize: 11, color: C.textDisabled,
                      fontStyle: ocurrido && fecha ? "normal" : "italic",
                    }}>
                      {ocurrido && fecha ? `${prefijo} ${fecha}` : "Aún no ocurre"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comentario de rechazo */}
        {esRechazado && reporte.comentarioRechazo && (
          <div style={{
            background: "rgba(239,68,68,0.05)", borderRadius: RADIUS.lg,
            border: `1px solid ${C.danger}`, padding: "1.25rem 1.5rem",
          }}>
            <p style={{ margin: "0 0 0.625rem", fontSize: 11, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Motivo de rechazo
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.7 }}>
              {reporte.comentarioRechazo}
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
