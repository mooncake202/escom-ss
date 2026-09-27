import { useTheme, GRADIENTS, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSesion, nombreCompletoSesion } from "@/features/login/CU-CRED-03-crear-usuarios/hooks/useSesion";
import { useExpedienteCoordinacion } from "./hooks/useExpediente";
import { FichaAlumno, BarraProgreso, ListaPorEtapas, VisorDocumento } from "./components/ExpedientePanel";
import { siglaCarrera } from "@/features/gestion-administrativa/utils/carreraLabel";

// CU-ADM-13 — Coordinación consulta el expediente documental de cualquier alumno asignado.
// Solo lectura: no sube, no aprueba, no elimina. (Subir la carta firmada es CU-ADM-14.)

const iniciales = (nombre) => nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function AlumnoItem({ alumno, activo, onClick, C }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        padding: "10px 12px", borderRadius: RADIUS.md,
        background: activo ? "rgba(0,58,143,0.20)" : "transparent",
        borderLeft: activo ? "3px solid #0A4DB5" : "3px solid transparent",
        display: "flex", alignItems: "center", gap: 10,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: activo ? GRADIENTS.primary : C.bgInput,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: activo ? "#fff" : C.textMuted,
      }}>
        {iniciales(alumno.nombreCompleto)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: activo ? 600 : 500,
          color: activo ? C.accentText : C.textPrimary,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {alumno.nombreCompleto}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
          {alumno.boleta} · {siglaCarrera(alumno.carrera)}
        </p>
      </div>

      {/* Sin colorear la fila entera: solo un chip neutro con la etapa. */}
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: RADIUS.full,
        background: C.bgInput, border: `1px solid ${C.borderDefault}`,
        color: alumno.totalDocumentos > 0 ? C.textMuted : C.textDisabled,
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {alumno.etapaActual}
      </span>
    </button>
  );
}

export default function ExpedienteCoordinacion() {
  const { C } = useTheme();
  const { usuario } = useSesion();
  const {
    carga, recargar, alumnos, metricas, busqueda, setBusqueda, filtro, setFiltro,
    alumnoSeleccionado, seleccionar, expediente, cargaExpediente,
    pdf, documentoEnPdf, verDocumento, cerrarVisor, descargarDocumento, descarga,
  } = useExpedienteCoordinacion();

  const marco = {
    titulo: "Expedientes de alumnos",
    subtitulo: "Consulta de documentos del servicio social",
    rol: "coordinacion",
    usuario: nombreCompletoSesion(usuario),
  };

  if (carga.estado !== "listo") {
    return (
      <DashboardLayout {...marco}>
        <div style={{
          maxWidth: 520, margin: "3rem auto", textAlign: "center",
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`, padding: "3rem 2rem",
        }}>
          {carga.estado === "cargando" ? (
            <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando alumnos...</p>
          ) : (
            <>
              <p style={{ margin: "0 0 1rem", fontSize: 13, color: C.danger }}>{carga.error}</p>
              <button onClick={recargar} style={{
                padding: "9px 22px", borderRadius: RADIUS.md, background: C.accent, border: "none",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Reintentar
              </button>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout {...marco}>
      {/* Indicadores del mock, ahora sobre la etapa REAL que deriva el backend. */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[
          { label: "Total alumnos", value: metricas.total },
          { label: "En inicio", value: metricas.enInicio },
          { label: "En desarrollo", value: metricas.enDesarrollo },
          { label: "En término", value: metricas.enTermino },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: 1, minWidth: 150, padding: "12px 16px", borderRadius: RADIUS.lg,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: RADIUS.md, background: C.bgInput,
              border: `1px solid ${C.borderDefault}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.accentText }}>{value}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", height: "calc(100vh - 250px)", minHeight: 0 }}>

        {/* Columna izquierda: alumnos */}
        <div style={{
          width: 310, flexShrink: 0, background: C.bgCard,
          borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o boleta…"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "7px 10px", borderRadius: RADIUS.md, fontSize: 13,
                background: C.bgInput, border: `1px solid ${C.borderDefault}`,
                color: C.textPrimary, outline: "none", fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[
                { key: "todos", label: "Todos" },
                { key: "Inicio", label: "Inicio" },
                { key: "Desarrollo", label: "Desarrollo" },
                { key: "Término", label: "Término" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltro(key)}
                  style={{
                    flex: 1, padding: "5px 4px", borderRadius: RADIUS.sm, border: "none",
                    cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                    fontWeight: filtro === key ? 700 : 500,
                    background: filtro === key ? C.accentSoft : "transparent",
                    color: filtro === key ? C.accentText : C.textMuted,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {alumnos.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: C.textDisabled, margin: 0 }}>Sin resultados</p>
              </div>
            ) : (
              alumnos.map((a) => (
                <AlumnoItem
                  key={a.boleta}
                  alumno={a}
                  activo={alumnoSeleccionado?.boleta === a.boleta}
                  onClick={() => seleccionar(a)}
                  C={C}
                />
              ))
            )}
          </div>
        </div>

        {/* Columna derecha: expediente */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {!alumnoSeleccionado ? (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              background: C.bgCard, borderRadius: RADIUS.lg, border: `1px solid ${C.borderDefault}`,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: RADIUS.xl, background: C.accentSoft,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>
                🗂️
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>Selecciona un alumno</p>
              <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                Elige un alumno de la lista para consultar su expediente.
              </p>
            </div>
          ) : (
            <>
              {/* Ficha del alumno SELECCIONADO: la misma pieza que ve el alumno en su expediente. */}
              <FichaAlumno alumno={alumnoSeleccionado} C={C} />

              {cargaExpediente.estado === "cargando" && (
                <p style={{ margin: 0, fontSize: 13, color: C.textDisabled }}>Cargando expediente...</p>
              )}
              {cargaExpediente.estado === "error" && (
                <p style={{ margin: 0, fontSize: 13, color: C.danger }}>{cargaExpediente.error}</p>
              )}

              {cargaExpediente.estado === "listo" && expediente && (
                <>
                  <BarraProgreso progreso={expediente.progreso} etapaActual={expediente.etapaActual} C={C} />
                  <ListaPorEtapas
                    etapas={expediente.etapas}
                    onVer={verDocumento}
                    onDescargar={descargarDocumento}
                    descarga={descarga}
                    cargandoPdf={pdf.estado === "cargando"}
                    C={C}
                  />
                  <p style={{ margin: "0.5rem 0 0", fontSize: 11, color: C.textDisabled }}>
                    Vista de solo consulta. Solo se muestran los documentos aprobados.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <VisorDocumento pdf={pdf} documento={documentoEnPdf} onCerrar={cerrarVisor} />
    </DashboardLayout>
  );
}
