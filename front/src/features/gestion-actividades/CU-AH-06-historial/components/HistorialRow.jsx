import { useState } from "react";
import { RADIUS } from "@/themes/colors";
import { formatearFechaMexico } from "@/utils/fechas";

// ── Estilos por estado (valores reales snake_case del backend) ──────────
// completada_tarde usa el mismo ámbar que ActividadRow.jsx (CU-AH-01) y
// ActividadCard.jsx (CU-AH-02) — antes aquí quedó mal copiado con el rojo
// de vencida/rechazada.
const ESTADO_STYLE = {
  aprobada:             { bg: "rgba(34,197,94,0.12)",  color: "#22C55E" },
  completada_a_tiempo:  { bg: "rgba(34,197,94,0.12)",  color: "#22C55E" },
  rechazada:            { bg: "rgba(239,68,68,0.12)",  color: "#EF4444" },
  completada_tarde:     { bg: "rgba(245,158,11,0.14)", color: "#F59E0B" },
  vencida:              { bg: "rgba(239,68,68,0.12)",  color: "#EF4444" },
  pendiente_revision:   { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  pendiente_datos:      { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  en_progreso:          { bg: "rgba(10,102,194,0.12)", color: "#2E86DE" },
  en_curso:             { bg: "rgba(10,102,194,0.12)", color: "#2E86DE" },
  sin_comenzar:         { bg: "rgba(85,85,85,0.12)",   color: "#9A9A9A" },
};

const ESTADO_LABEL = {
  aprobada: "Aprobada",
  completada_a_tiempo: "Completada a tiempo",
  rechazada: "Rechazada",
  completada_tarde: "Completada fuera de tiempo",
  vencida: "Vencida",
  pendiente_revision: "Pendiente de revisión",
  pendiente_datos: "Pendiente de datos",
  en_progreso: "En progreso",
  en_curso: "En curso",
  sin_comenzar: "Sin comenzar",
};

function formatearFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

// ── Fila del historial ───────────────────────────────────────
export function HistorialRow({ registro, expandido, onToggle, destacado, onAprobar, onExtenderFecha, C }) {
  const estilo = ESTADO_STYLE[registro.estado] ?? ESTADO_STYLE.sin_comenzar;
  const label  = ESTADO_LABEL[registro.estado] ?? registro.estado;
  const esBitacora = registro.tipo === "bitacora";

  const [aprobando, setAprobando] = useState(false);
  const [errorAprobar, setErrorAprobar] = useState(null);
  const [pidiendoConfirmacion, setPidiendoConfirmacion] = useState(null); // mensaje del backend, o null

  const [nuevaFecha, setNuevaFecha] = useState("");
  const [extendiendo, setExtendiendo] = useState(false);
  const [errorExtender, setErrorExtender] = useState(null);

  async function handleAprobar(e, confirmarSobrepasoHoras = false) {
    e.stopPropagation(); // evita colapsar el row
    setAprobando(true);
    setErrorAprobar(null);
    try {
      const resultado = await onAprobar(registro.id, confirmarSobrepasoHoras);
      if (resultado.requiereConfirmacion) {
        setPidiendoConfirmacion(resultado.mensaje);
      } else {
        setPidiendoConfirmacion(null);
      }
    } catch (err) {
      setErrorAprobar(err.message || "No se pudo aprobar la bitácora.");
    } finally {
      setAprobando(false);
    }
  }

  async function handleExtenderFecha(e) {
    e.stopPropagation();
    if (!nuevaFecha) return;
    setExtendiendo(true);
    setErrorExtender(null);
    try {
      await onExtenderFecha(registro.id, nuevaFecha);
      setNuevaFecha("");
    } catch (err) {
      setErrorExtender(err.message || "No se pudo extender la fecha límite.");
    } finally {
      setExtendiendo(false);
    }
  }

  return (
    <div
      id={`registro-${registro.tipo}-${registro.id}`}
      style={{
        borderRadius: RADIUS.lg, overflow: "hidden",
        border: `1px solid ${destacado ? "#F59E0B" : expandido ? C.accent : C.borderDefault}`,
        boxShadow: destacado ? "0 0 0 3px rgba(245,158,11,0.25)" : "none",
        background: C.bgCard, transition: "border-color 0.15s, box-shadow 0.3s",
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        style={{ padding: "0.875rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        {/* Icono tipo */}
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: esBitacora ? "rgba(10,102,194,0.1)" : "rgba(34,197,94,0.1)", fontSize: 15 }}>
          {esBitacora ? "📝" : "✅"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 20, background: esBitacora ? "rgba(10,102,194,0.1)" : "rgba(34,197,94,0.1)", color: esBitacora ? "#2E86DE" : "#22C55E", fontWeight: 600 }}>
              {esBitacora ? "Bitácora" : "Actividad"}
            </span>
            <span style={{ fontSize: 12, color: C.textDisabled }}>{formatearFecha(registro.fecha)}</span>
            {/* RF-AH-47: distintivo de fecha límite extendida */}
            {!esBitacora && registro.fecha_limite_original && (
              <span title={`Fecha límite original: ${formatearFecha(registro.fecha_limite_original)}`}
                style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "rgba(245,158,11,0.12)", color: "#F59E0B", fontWeight: 600 }}>
                🕒 Extendida
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {esBitacora
              ? registro.avances.map(a => a.actividad).join(", ")
              : registro.titulo
            }
          </p>
          {esBitacora && (
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
              {registro.hora_inicio ? new Date(registro.hora_inicio).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : ""}
              {registro.hora_fin ? ` – ${new Date(registro.hora_fin).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}` : ""}
              {registro.horas_contabilizadas != null ? ` · ${registro.horas_contabilizadas}h` : ""}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: estilo.bg, color: estilo.color, fontWeight: 600 }}>
            {label}
          </span>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth={2} strokeLinecap="round"
            style={{ transform: expandido ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${C.borderSubtle}` }}>
          <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

            {/* BITÁCORA */}
            {esBitacora && (
              <>
                {/* Revisado el — solo si ya fue decidida (aprobada/rechazada) */}
                {(registro.estado === "aprobada" || registro.estado === "rechazada") && registro.fecha_revision && (
                  <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                    Revisado el: {formatearFechaMexico(registro.fecha_revision, { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}

                {/* Avances — cada uno agrupado con su propia descripción y
                    evidencia (mismo criterio visual que DetalleBitacora.jsx
                    de CU-AH-04, para no ver el mismo dato repartido distinto
                    según la pantalla). */}
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Actividades reportadas ({registro.avances.length})
                  </p>
                  {registro.avances.map((av, i) => {
                    const esUrl = av.evidencia?.startsWith("http");
                    return (
                      <div key={i} style={{ padding: "10px 12px", marginBottom: 8, background: C.bgInput, borderRadius: RADIUS.md, border: `1px solid ${C.borderSubtle}` }}>
                        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{av.actividad}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ flex: 1, height: 4, background: C.borderSubtle, borderRadius: 2 }}>
                            <div style={{ width: `${av.progreso}%`, height: "100%", borderRadius: 2, background: av.progreso === 100 ? "#22C55E" : "#2E86DE" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, minWidth: 34, textAlign: "right" }}>{av.progreso}%</span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{av.descripcion}</p>
                        {esUrl
                          ? <a href={av.evidencia} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2E86DE", wordBreak: "break-all" }}>{av.evidencia}</a>
                          : <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>{av.evidencia}</p>
                        }
                      </div>
                    );
                  })}
                </div>

                {/* Comentario rechazo — RN-AH-55 */}
                {registro.estado === "rechazada" && registro.motivo_rechazo && (
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: RADIUS.md,
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.3)"
                  }}>
                    <p style={{
                      margin: "0 0 4px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#EF4444",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em"
                    }}>
                      Motivo del rechazo
                    </p>

                    <p style={{
                      margin: 0,
                      fontSize: 13,
                      color: C.textSecondary,
                      lineHeight: 1.5
                    }}>
                      {registro.motivo_rechazo}
                    </p>

                    {/* Aprobar bitácora rechazada desde historial — solo si
                        el padre pasó onAprobar (solo vista profesor). */}
                    {onAprobar && (
                      <>
                        {pidiendoConfirmacion && (
                          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: RADIUS.md, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
                            <p style={{ margin: "0 0 8px", fontSize: 12, color: C.textSecondary }}>{pidiendoConfirmacion}</p>
                            <button
                              onClick={(e) => handleAprobar(e, true)}
                              disabled={aprobando}
                              style={{ width: "100%", padding: "7px", borderRadius: RADIUS.md, background: "#F59E0B", color: "#fff",
                                border: "none", fontSize: 12, fontWeight: 600, cursor: aprobando ? "default" : "pointer", opacity: aprobando ? 0.7 : 1 }}
                            >
                              {aprobando ? "Aplicando..." : "Confirmar de todos modos"}
                            </button>
                          </div>
                        )}
                        {!pidiendoConfirmacion && (
                          <button
                            onClick={(e) => handleAprobar(e, false)}
                            disabled={aprobando}
                            style={{
                              marginTop: "10px",
                              width: "100%",
                              padding: "9px",
                              borderRadius: RADIUS.md,
                              background: "linear-gradient(135deg, #22C55E, #16A34A)",
                              color: "#fff",
                              border: "none",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: aprobando ? "default" : "pointer",
                              opacity: aprobando ? 0.7 : 1,
                              boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                              transition: "all 0.2s ease"
                            }}
                          >
                            {aprobando ? "Aprobando..." : "Aprobar bitácora"}
                          </button>
                        )}
                        {errorAprobar && (
                          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#EF4444" }}>{errorAprobar}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ACTIVIDAD */}
            {!esBitacora && (
              <>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em"  }}>
                    Fecha límite de entrega: {formatearFecha(registro.fecha_limite)}
                    {registro.fecha_limite_original && ` (original: ${formatearFecha(registro.fecha_limite_original)})`}
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Descripción</p>
                  <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{registro.descripcion}</p>
                </div>

                {(registro.estado === "completada_a_tiempo" || registro.estado === "completada_tarde") && registro.fecha_completada && (
                  <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                    Completada el: {formatearFechaMexico(registro.fecha_completada, { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}

                {registro.entregable_esperado && (
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Entregable esperado</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>{registro.entregable_esperado}</p>
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>Progreso</p>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{registro.porcentaje_progreso}%</span>
                  </div>
                  <div style={{ height: 6, background: C.borderSubtle, borderRadius: 3 }}>
                    <div style={{ width: `${registro.porcentaje_progreso}%`, height: "100%", borderRadius: 3, background: registro.porcentaje_progreso === 100 ? "#22C55E" : "#2E86DE" }} />
                  </div>
                </div>

                {/* Extender fecha límite — solo si está vencida y el padre
                    pasó onExtenderFecha (solo vista profesor), mismo
                    criterio ya usado en AH-01 para mostrar este control. */}
                {registro.estado === "vencida" && onExtenderFecha && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      value={nuevaFecha}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                      style={{ flex: 1, padding: "7px 10px", borderRadius: RADIUS.md, background: C.bgInput,
                        border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontSize: 12, outline: "none" }}
                    />
                    <button
                      onClick={handleExtenderFecha}
                      disabled={extendiendo || !nuevaFecha}
                      style={{ padding: "7px 14px", borderRadius: RADIUS.md, background: C.accent, color: "#fff",
                        border: "none", fontSize: 12, fontWeight: 600, cursor: (extendiendo || !nuevaFecha) ? "default" : "pointer",
                        opacity: (extendiendo || !nuevaFecha) ? 0.6 : 1, whiteSpace: "nowrap" }}
                    >
                      {extendiendo ? "Extendiendo..." : "Extender fecha límite"}
                    </button>
                  </div>
                )}
                {errorExtender && (
                  <p style={{ margin: 0, fontSize: 12, color: "#EF4444" }}>{errorExtender}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
