import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const SOLICITUDES_INICIALES = [
  {
    id: 1,
    modalidad: "grupal",
    titulo: "Plataforma de aprendizaje adaptativo",
    tituloSISS: "Academia de Aprendizaje Adaptativo",
    profesor: "Dr. Torres Vega",
    fechaSolicitud: "2025-04-28",
    descripcion:
      "Desarrollo de una plataforma web que adapta el contenido de aprendizaje al perfil de cada estudiante mediante algoritmos de machine learning. El sistema ajusta rutas de aprendizaje, evalúa el progreso y genera reportes para docentes.",
    actividades:
      "Análisis de requerimientos, diseño de arquitectura de microservicios, implementación del módulo de perfilamiento, desarrollo del motor de recomendaciones, pruebas de usuario, despliegue en entorno de producción.",
    cuposSolicitados: 3,
    cuposDisponiblesProfesor: 4,
    desgloseISC: 2,
    desgloseIIA: 1,
    tieneDesglose: true,
    perfilDeseado: null,
  },
  {
    id: 2,
    modalidad: "grupal",
    titulo: "App móvil de servicios estudiantiles ESCOM",
    tituloSISS: "Aplicación Móvil ESCOM",
    profesor: "Dr. Mendoza Flores",
    fechaSolicitud: "2025-05-02",
    descripcion:
      "Aplicación móvil multiplataforma (iOS y Android) que centraliza servicios estudiantiles del IPN-ESCOM: consulta de horarios, avisos, trámites, mapa de instalaciones y sistema de notificaciones push.",
    actividades:
      "Levantamiento de requerimientos con usuarios reales, diseño de UI/UX, desarrollo en React Native, integración con APIs institucionales, pruebas en dispositivos físicos, publicación en tiendas.",
    cuposSolicitados: 2,
    cuposDisponiblesProfesor: 2,
    tieneDesglose: false,
    perfilDeseado: null,
  },
  {
    id: 3,
    modalidad: "individual",
    titulo: "Desarrollo de módulo de reportes en Python",
    tituloSISS: "Módulo de Reportes Estadísticos",
    profesor: "Dr. Torres Vega",
    fechaSolicitud: "2025-05-10",
    descripcion:
      "Implementación de un módulo de generación y exportación de reportes estadísticos en formato PDF y Excel para el sistema interno del departamento de sistemas.",
    actividades:
      "Análisis de requerimientos de reportes con el área usuaria, desarrollo del módulo con ReportLab y openpyxl, pruebas unitarias y documentación técnica.",
    cuposSolicitados: 1,
    cuposDisponiblesProfesor: null,
    tieneDesglose: false,
    perfilDeseado: ["ISC"],
  },
];

export default function RevisarSolicitudOferta() {
  const { C } = useTheme();
  const navigate = useNavigate();

  const [pendientes, setPendientes] = useState(SOLICITUDES_INICIALES);
  const [resueltas, setResueltas]   = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [modo, setModo]             = useState(null);
  const [motivos, setMotivos]       = useState("");
  const [errores, setErrores]       = useState({});
  const [toast, setToast]           = useState(null);

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 5000);
  }

  function seleccionar(s) {
    setSeleccionada(s);
    setModo(null);
    setMotivos("");
    setErrores({});
  }

  function cancelarDecision() {
    setModo(null);
    setErrores({});
  }

  function confirmarAprobacion() {
    const esIndividual = seleccionada.modalidad === "individual";
    const cuposAutorizadosFinales = esIndividual ? 1 : seleccionada.cuposSolicitados;
    const resuelta = { ...seleccionada, decision: "aprobado", cuposAutorizados: cuposAutorizadosFinales };
    setResueltas(prev => [...prev, resuelta]);
    mostrarToast(
      esIndividual
        ? "Oferta individual aprobada · Cupo: 1. El profesor ha sido notificado."
        : `Proyecto aprobado · ${cuposAutorizadosFinales} cupo${cuposAutorizadosFinales !== 1 ? "s" : ""}. El profesor ha sido notificado.`
    );
    setPendientes(prev => prev.filter(s => s.id !== seleccionada.id));
    setSeleccionada(null);
    setModo(null);
  }

  function confirmarRechazo() {
    if (!motivos.trim()) {
      setErrores({ motivos: "Los motivos del rechazo son obligatorios." });
      return;
    }
    const resuelta = { ...seleccionada, decision: "rechazado", motivos: motivos.trim() };
    setResueltas(prev => [...prev, resuelta]);
    setPendientes(prev => prev.filter(s => s.id !== seleccionada.id));
    setSeleccionada(null);
    setModo(null);
    mostrarToast("Solicitud rechazada. El profesor ha sido notificado con los motivos.", "danger");
  }

  const inputBase = (hasError) => ({
    width: "100%", padding: "10px 14px",
    background: C.bgInput,
    border: `1px solid ${hasError ? C.danger : C.borderDefault}`,
    borderRadius: RADIUS.md, color: C.textPrimary,
    fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  });

  return (
    <DashboardLayout
      titulo="Solicitudes de oferta"
      subtitulo="CU-PRO-02 · Coordinación"
      rol="coordinacion"
      usuario="Lic. Morales Vega"
    >
      <div style={{ maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <button
          onClick={() => navigate("/coordinacion/ofertas")}
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
          Proyectos
        </button>

        {/* Toast */}
        {toast && (
          <div style={{
            marginBottom: "1.25rem", padding: "12px 16px", borderRadius: RADIUS.md,
            background: toast.tipo === "danger" ? C.dangerSoft : C.successSoft,
            border: `1px solid ${toast.tipo === "danger" ? C.danger : C.success}`,
            color: toast.tipo === "danger" ? C.danger : C.success,
            fontSize: 13, fontWeight: 500,
          }}>
            {toast.msg}
          </div>
        )}

        <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>

          {/* — Lista de pendientes — */}
          <div style={{ flex: "0 0 320px", minWidth: 0 }}>
            <div style={{
              background: C.bgCard, borderRadius: RADIUS.xl,
              border: `1px solid ${C.borderDefault}`, overflow: "hidden",
            }}>
              <div style={{
                padding: "1rem 1.25rem",
                borderBottom: `1px solid ${C.borderDefault}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                  Solicitudes pendientes
                </p>
                <span style={{
                  padding: "2px 10px", borderRadius: RADIUS.full,
                  background: pendientes.length > 0 ? C.warningSoft : C.bgInput,
                  color: pendientes.length > 0 ? C.warning : C.textDisabled,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {pendientes.length}
                </span>
              </div>

              {pendientes.length === 0 ? (
                <div style={{ padding: "2rem 1.25rem", textAlign: "center" }}>
                  <p style={{ margin: "0 0 0.25rem", fontSize: 22 }}>📋</p>
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
                    No hay solicitudes pendientes de revisión.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {pendientes.map(s => {
                    const activa = seleccionada?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => seleccionar(s)}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "0.875rem 1.25rem",
                          background: activa ? C.accentSoft : "transparent",
                          border: "none",
                          borderBottom: `1px solid ${C.borderDefault}`,
                          borderLeft: activa ? `3px solid ${C.accent}` : "3px solid transparent",
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: 4 }}>
                          <p style={{
                            margin: 0, fontSize: 13, fontWeight: 600,
                            color: activa ? C.accentText : C.textPrimary,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1,
                          }}>
                            {s.titulo}
                          </p>
                          <ModalidadBadge modalidad={s.modalidad} C={C} />
                        </div>
                        <p style={{ margin: "0 0 3px", fontSize: 12, color: C.textMuted }}>{s.profesor}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, color: C.textDisabled }}>{s.fechaSolicitud}</span>
                          <span style={{
                            padding: "2px 8px", borderRadius: RADIUS.full,
                            background: C.warningSoft, color: C.warning,
                            fontSize: 11, fontWeight: 600,
                          }}>
                            Pendiente
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Resueltas en esta sesión */}
              {resueltas.length > 0 && (
                <>
                  <div style={{
                    padding: "0.625rem 1.25rem",
                    borderTop: `1px solid ${C.borderDefault}`,
                    background: C.bgInput,
                  }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Resueltas en esta sesión
                    </p>
                  </div>
                  {resueltas.map(r => (
                    <div key={r.id} style={{
                      padding: "0.75rem 1.25rem",
                      borderBottom: `1px solid ${C.borderDefault}`,
                      borderLeft: `3px solid ${r.decision === "aprobado" ? C.success : C.danger}`,
                    }}>
                      <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.titulo}
                      </p>
                      <span style={{
                        padding: "2px 8px", borderRadius: RADIUS.full,
                        background: r.decision === "aprobado" ? C.successSoft : C.dangerSoft,
                        color: r.decision === "aprobado" ? C.success : C.danger,
                        fontSize: 11, fontWeight: 600,
                      }}>
                        {r.decision === "aprobado"
                          ? r.modalidad === "individual"
                            ? "Oferta individual aprobada · Cupo: 1"
                            : `Aprobado · ${r.cuposAutorizados} cupo${r.cuposAutorizados !== 1 ? "s" : ""}`
                          : "Rechazado"}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* — Detalle + decisión — */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!seleccionada ? (
              <div style={{
                background: C.bgCard, borderRadius: RADIUS.xl,
                border: `1px solid ${C.borderDefault}`,
                padding: "3rem 2rem", textAlign: "center",
              }}>
                <p style={{ fontSize: 28, margin: "0 0 0.75rem" }}>📋</p>
                <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
                  Selecciona una solicitud de la lista para revisar su detalle.
                </p>
              </div>
            ) : (
              <div style={{
                background: C.bgCard, borderRadius: RADIUS.xl,
                border: `1px solid ${C.borderDefault}`, padding: "1.5rem",
              }}>
                {/* Encabezado */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: C.textPrimary }}>
                        {seleccionada.titulo}
                      </h3>
                      <p style={{ margin: "0 0 6px", fontSize: 13, color: C.textMuted }}>
                        {seleccionada.profesor} · Solicitado: {seleccionada.fechaSolicitud}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                      <ModalidadBadge modalidad={seleccionada.modalidad} C={C} />
                      <span style={{
                        padding: "4px 12px", borderRadius: RADIUS.full,
                        background: C.warningSoft, color: C.warning,
                        fontSize: 12, fontWeight: 700,
                      }}>
                        Pendiente de revisión
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${C.borderDefault}`, margin: "0 0 1.25rem" }} />

                <Campo label="Título para plataforma SISS" C={C}>
                  <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.6, fontWeight: 500 }}>
                    {seleccionada.tituloSISS}
                  </p>
                </Campo>

                <Campo label="Descripción" C={C}>
                  <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>
                    {seleccionada.descripcion}
                  </p>
                </Campo>

                <Campo label="Actividades a realizar" C={C}>
                  <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>
                    {seleccionada.actividades}
                  </p>
                </Campo>

                {/* Cupos / Perfil — bifurcado por modalidad */}
                {seleccionada.modalidad === "individual" ? (
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    <div style={{
                      padding: "0.875rem 1.25rem", borderRadius: RADIUS.lg,
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      textAlign: "center", minWidth: 120,
                    }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Cupo fijo
                      </p>
                      <p style={{ margin: "0 0 2px", fontSize: 28, fontWeight: 700, color: "#818cf8" }}>1</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#818cf8", opacity: 0.7 }}>No modificable</p>
                    </div>

                    {seleccionada.perfilDeseado && seleccionada.perfilDeseado.length > 0 && (
                      <div style={{
                        flex: 1, padding: "0.875rem 1.25rem", borderRadius: RADIUS.lg,
                        background: C.bgInput, border: `1px solid ${C.borderDefault}`,
                      }}>
                        <p style={{ margin: "0 0 0.625rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Perfil de carrera
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {seleccionada.perfilDeseado.map(c => (
                            <span key={c} style={{
                              padding: "4px 12px", borderRadius: RADIUS.full,
                              fontSize: 12, fontWeight: 700,
                              background: "rgba(99,102,241,0.1)", color: "#818cf8",
                              border: "1px solid rgba(99,102,241,0.2)",
                            }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                    <div style={{
                      flex: "0 0 auto",
                      background: C.bgInput, borderRadius: RADIUS.lg,
                      border: `1px solid ${C.borderDefault}`,
                      padding: "0.875rem 1.25rem", textAlign: "center", minWidth: 120,
                    }}>
                      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Cupos solicitados
                      </p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: C.textPrimary }}>
                        {seleccionada.cuposSolicitados}
                      </p>
                    </div>

                    {seleccionada.tieneDesglose && (
                      <div style={{
                        flex: 1, background: C.bgInput, borderRadius: RADIUS.lg,
                        border: `1px solid ${C.borderDefault}`, padding: "0.875rem 1.25rem",
                      }}>
                        <p style={{ margin: "0 0 0.625rem", fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Desglose por carrera (informativo)
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                          {seleccionada.desgloseISC > 0 && (
                            <DesgloseBadge carrera="ISC" cantidad={seleccionada.desgloseISC} C={C} />
                          )}
                          {seleccionada.desgloseIIA > 0 && (
                            <DesgloseBadge carrera="IIA" cantidad={seleccionada.desgloseIIA} C={C} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Flujo de decisión */}
                {modo === null && (
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => setModo("rechazar")}
                      style={{
                        flex: 1, padding: "10px", borderRadius: RADIUS.md,
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        background: C.dangerSoft, border: `1px solid ${C.danger}`,
                        color: C.danger, fontFamily: "inherit",
                      }}
                    >
                      Rechazar solicitud
                    </button>
                    <button
                      onClick={() => setModo("aprobar")}
                      style={{
                        flex: 2, padding: "10px", borderRadius: RADIUS.md,
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        background: C.success, border: "none",
                        color: "#fff", fontFamily: "inherit",
                      }}
                    >
                      Aprobar solicitud
                    </button>
                  </div>
                )}

                {/* Aprobación grupal */}
                {modo === "aprobar" && seleccionada.modalidad !== "individual" && (
                  <div style={{
                    marginTop: "0.25rem", padding: "1.25rem",
                    background: C.successSoft, border: `1px solid ${C.success}`,
                    borderRadius: RADIUS.lg,
                  }}>
                    <p style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 700, color: C.success }}>
                      Aprobar solicitud de proyecto
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <div style={{
                        padding: "8px 14px", borderRadius: RADIUS.md,
                        background: C.bgInput, border: `1px solid ${C.borderDefault}`,
                        textAlign: "center", minWidth: 110,
                      }}>
                        <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Cupos solicitados
                        </p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
                          {seleccionada.cuposSolicitados}
                        </p>
                      </div>
                      <div style={{
                        padding: "8px 14px", borderRadius: RADIUS.md,
                        background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
                        textAlign: "center", minWidth: 110,
                      }}>
                        <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Disponibles del profesor
                        </p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#818cf8" }}>
                          {seleccionada.cuposDisponiblesProfesor ?? "—"}
                        </p>
                      </div>
                    </div>
                    <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
                      Al confirmar, se autorizarán los {seleccionada.cuposSolicitados} cupos solicitados y el profesor será notificado.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button onClick={cancelarDecision} style={{
                        flex: 1, padding: "9px", borderRadius: RADIUS.md,
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        background: "transparent", border: `1px solid ${C.borderDefault}`,
                        color: C.textMuted, fontFamily: "inherit",
                      }}>
                        Cancelar
                      </button>
                      <button onClick={confirmarAprobacion} style={{
                        flex: 2, padding: "9px", borderRadius: RADIUS.md,
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        background: C.success, border: "none", color: "#fff", fontFamily: "inherit",
                      }}>
                        Confirmar aprobación
                      </button>
                    </div>
                  </div>
                )}

                {/* Aprobación individual */}
                {modo === "aprobar" && seleccionada.modalidad === "individual" && (
                  <div style={{
                    marginTop: "0.25rem", padding: "1.25rem",
                    background: C.successSoft, border: `1px solid ${C.success}`,
                    borderRadius: RADIUS.lg,
                  }}>
                    <p style={{ margin: "0 0 0.5rem", fontSize: 13, fontWeight: 700, color: C.success }}>
                      Aprobar oferta individual
                    </p>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "6px 14px", borderRadius: RADIUS.full,
                      background: "rgba(99,102,241,0.12)", color: "#818cf8",
                      fontSize: 13, fontWeight: 700, marginBottom: "0.875rem",
                    }}>
                      Cupo fijo: 1 lugar
                    </div>
                    <p style={{ margin: "0 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
                      Las ofertas individuales tienen cupo fijo de 1. No es necesario ingresar ningún valor adicional.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button onClick={cancelarDecision} style={{
                        flex: 1, padding: "9px", borderRadius: RADIUS.md,
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        background: "transparent", border: `1px solid ${C.borderDefault}`,
                        color: C.textMuted, fontFamily: "inherit",
                      }}>
                        Cancelar
                      </button>
                      <button onClick={confirmarAprobacion} style={{
                        flex: 2, padding: "9px", borderRadius: RADIUS.md,
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        background: C.success, border: "none", color: "#fff", fontFamily: "inherit",
                      }}>
                        Confirmar aprobación
                      </button>
                    </div>
                  </div>
                )}

                {/* Rechazo */}
                {modo === "rechazar" && (
                  <div style={{
                    marginTop: "0.25rem", padding: "1.25rem",
                    background: C.dangerSoft, border: `1px solid ${C.danger}`,
                    borderRadius: RADIUS.lg,
                  }}>
                    <p style={{ margin: "0 0 1rem", fontSize: 13, fontWeight: 700, color: C.danger }}>
                      Rechazar solicitud — registra los motivos
                    </p>
                    <label style={{
                      display: "block", fontSize: 12, fontWeight: 700, color: C.textMuted,
                      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
                    }}>
                      Motivos del rechazo <span style={{ color: C.danger }}>*</span>
                    </label>
                    <textarea
                      value={motivos}
                      onChange={e => { setMotivos(e.target.value); setErrores({}); }}
                      placeholder="Describe los motivos por los que se rechaza esta solicitud..."
                      rows={3}
                      style={{ ...inputBase(!!errores.motivos), resize: "vertical", lineHeight: 1.55, marginBottom: 4 }}
                    />
                    {errores.motivos && (
                      <p style={{ margin: "0 0 0.75rem", fontSize: 12, color: C.danger }}>{errores.motivos}</p>
                    )}
                    <p style={{ margin: "4px 0 1.25rem", fontSize: 12, color: C.textDisabled }}>
                      Los motivos son obligatorios y se notificarán al profesor.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button onClick={cancelarDecision} style={{
                        flex: 1, padding: "9px", borderRadius: RADIUS.md,
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        background: "transparent", border: `1px solid ${C.borderDefault}`,
                        color: C.textMuted, fontFamily: "inherit",
                      }}>
                        Cancelar
                      </button>
                      <button onClick={confirmarRechazo} style={{
                        flex: 2, padding: "9px", borderRadius: RADIUS.md,
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        background: C.danger, border: "none", color: "#fff", fontFamily: "inherit",
                      }}>
                        Confirmar rechazo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ModalidadBadge({ modalidad, C }) {
  const esIndividual = modalidad === "individual";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: RADIUS.full,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
      background: esIndividual ? "rgba(99,102,241,0.12)" : C.bgInput,
      color: esIndividual ? "#818cf8" : C.textMuted,
      border: `1px solid ${esIndividual ? "rgba(99,102,241,0.3)" : C.borderDefault}`,
    }}>
      {esIndividual ? "Individual" : "Grupal"}
    </span>
  );
}

function Campo({ label, C, children }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <p style={{
        margin: "0 0 0.375rem", fontSize: 11, fontWeight: 700,
        color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function DesgloseBadge({ carrera, cantidad, C }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "5px 12px", borderRadius: RADIUS.full,
      background: C.accentSoft, border: `1px solid ${C.borderDefault}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.accentText }}>{carrera}</span>
    </div>
  );
}