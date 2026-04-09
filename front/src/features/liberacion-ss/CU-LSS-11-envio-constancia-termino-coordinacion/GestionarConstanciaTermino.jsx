import { useState } from "react";
import { useTheme, GRADIENTS, SHADOWS, RADIUS } from "@/themes/colors";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGestionarConstanciaTermino } from "./hooks/useGestionarConstanciaTermino";

// ——— Badge de estado ————————————————————————————————
function EstadoBadge({ estado }) {
  const map = {
    solicitada: { label: "Solicitada", color: "#b45309", bg: "rgba(234,179,8,0.10)",  border: "rgba(234,179,8,0.25)"  },
    emitida:    { label: "Emitida",    color: "#15803d", bg: "rgba(21,128,61,0.10)",  border: "rgba(21,128,61,0.25)"  },
  };
  const s = map[estado] ?? map.solicitada;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 9px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ——— Sidebar: lista de alumnos ————————————————————————
function ListaAlumnos({ alumnos, seleccionado, onSeleccionar, C }) {
  const [filtro, setFiltro] = useState("");

  const filtrados = alumnos.filter(a =>
    a.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ width: 280, flexShrink: 0 }}>
      <p style={{
        margin: "0 0 0.75rem",
        fontSize: 11,
        fontWeight: 700,
        color: C.accentText,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Alumnos
      </p>

      <input
        placeholder="Buscar alumno..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "0.75rem",
          padding: "8px 12px",
          borderRadius: RADIUS.md,
          border: `1px solid ${C.borderDefault}`,
          background: C.bgInput,
          color: C.textPrimary,
          fontSize: 13,
          fontFamily: "inherit",
          boxSizing: "border-box",
          outline: "none",
        }}
      />

      <div style={{
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderSubtle}`,
        overflow: "hidden",
      }}>
        {filtrados.length === 0 && (
          <p style={{ padding: "1rem", fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            Sin resultados
          </p>
        )}

        {filtrados.map((a, i) => {
          const esSel = seleccionado?.id === a.id;
          return (
            <div
              key={a.id}
              onClick={() => onSeleccionar(a)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: i < filtrados.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
                background: esSel ? "rgba(59,130,246,0.08)" : "transparent",
                borderLeft: esSel ? `3px solid ${C.accentText}` : "3px solid transparent",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <p style={{
                margin: 0,
                fontSize: 13,
                fontWeight: esSel ? 600 : 400,
                color: esSel ? C.accentText : C.textPrimary,
                lineHeight: 1.3,
              }}>
                {a.nombre}
              </p>
              <EstadoBadge estado={a.estado} />
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "0.5rem", fontSize: 11, color: C.textDisabled, textAlign: "right" }}>
        {filtrados.length} alumno{filtrados.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ——— Contenido principal según estado ————————————————
function VistaGestion({ alumno, estadoAlumno, archivoSubido, loading, error, onArchivo, onEmitir, C }) {

  // Sin alumno seleccionado
  if (!alumno) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        background: C.bgCard,
        borderRadius: RADIUS.lg,
        border: `1px dashed ${C.borderDefault}`,
        padding: "3rem",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 32, marginBottom: "1rem" }}>👈</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: "0.35rem" }}>
          Selecciona un alumno
        </p>
        <p style={{ fontSize: 13, color: C.textMuted }}>
          Elige un alumno de la lista para gestionar su constancia de término.
        </p>
      </div>
    );
  }

  // Estado: solicitada → coordinación sube y emite la constancia
  if (estadoAlumno === "solicitada") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        

        <div style={{
          padding: "10px 14px",
          borderRadius: RADIUS.md,
          background: "rgba(234,179,8,0.07)",
          border: "1px solid rgba(234,179,8,0.25)",
          fontSize: 12,
          color: "#b45309",
          lineHeight: 1.5,
        }}>
          ⏳ Pendiente de emisión por coordinación
        </div>

        <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
                  Este alumno completó su servicio social y solicita su constancia de término.
                  Sube el archivo PDF firmado para que el alumno pueda descargarlo.
                </p>

        {/* Subir archivo */}
        <div style={{
          background: C.bgCard,
          borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderSubtle}`,
          padding: "1.25rem 1.5rem",
        }}>
          <p style={{
            margin: "0 0 0.75rem",
            fontSize: 12,
            fontWeight: 700,
            color: C.accentText,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Subir constancia (PDF)
          </p>

          {/* Drop zone / input */}
          <label style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "1.5rem",
            borderRadius: RADIUS.md,
            border: `2px dashed ${archivoSubido ? C.accentText : C.borderDefault}`,
            background: archivoSubido ? "rgba(59,130,246,0.04)" : C.bgInput,
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}>
            <span style={{ fontSize: 28 }}>{archivoSubido ? "📄" : "📂"}</span>
            {archivoSubido ? (
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.accentText, textAlign: "center" }}>
                {archivoSubido.nombre}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: C.textMuted, textAlign: "center" }}>
                Haz clic para seleccionar el archivo PDF de la constancia
              </p>
            )}
            <input
              type="file"
              accept="application/pdf"
              onChange={onArchivo}
              style={{ display: "none" }}
            />
          </label>

          {error && (
            <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: C.danger }}>{error}</p>
          )}
        </div>

        <button
          onClick={onEmitir}
          disabled={!archivoSubido || loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: RADIUS.md,
            fontSize: 14,
            fontWeight: 600,
            cursor: !archivoSubido || loading ? "not-allowed" : "pointer",
            background: !archivoSubido || loading ? C.borderDefault : GRADIENTS.primary,
            border: "none",
            color: !archivoSubido || loading ? C.textDisabled : "#fff",
            fontFamily: "inherit",
            boxShadow: !archivoSubido || loading ? "none" : SHADOWS.accent,
            transition: "background 0.2s",
          }}
        >
          {loading ? "Emitiendo..." : "Emitir constancia al alumno →"}
        </button>
      </div>
    );
  }

  // Estado: emitida → proceso completado
  if (estadoAlumno === "emitida") {
    const constancia = alumno?.constancia;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderRadius: RADIUS.lg,
          background: "rgba(21,128,61,0.06)",
          border: "1px solid rgba(21,128,61,0.25)",
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "rgba(21,128,61,0.12)",
            border: "1px solid rgba(21,128,61,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>
            ✔
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" }}>
              Constancia emitida correctamente
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
              El alumno ya puede descargar su constancia de término desde su portal.
            </p>
          </div>
        </div>

        {/* Archivo emitido */}
        {constancia && (
          <div style={{
            background: C.bgCard,
            borderRadius: RADIUS.lg,
            border: `1px solid ${C.borderSubtle}`,
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                Constancia de término
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textDisabled, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {constancia.nombre}
              </p>
            </div>
            <div style={{
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: "#15803d",
              background: "rgba(21,128,61,0.10)",
              border: "1px solid rgba(21,128,61,0.25)",
              whiteSpace: "nowrap",
            }}>
              Emitida
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ——— Página principal ————————————————————————————————
export default function GestionarConstanciaTermino() {
  const { C } = useTheme();

  const {
    alumnos,
    alumnoSeleccionado,
    estadoAlumno,
    archivoSubido,
    loading,
    error,
    seleccionarAlumno,
    manejarArchivo,
    emitirConstancia,
  } = useGestionarConstanciaTermino();

  return (
    <DashboardLayout
      titulo="Constancia de término"
      subtitulo="Vista de coordinación"
      rol="coordinacion"
      usuario="Coordinación"
    >
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>

        {/* SIDEBAR */}
        <ListaAlumnos
          alumnos={alumnos}
          seleccionado={alumnoSeleccionado}
          onSeleccionar={seleccionarAlumno}
          C={C}
        />

        {/* CONTENIDO */}
        <div style={{ 
        flex: 1,
        display: "flex",
        justifyContent: "center"
        }}>
          <div style={{
              width: "100%",
              maxWidth: 680
          }}>

          {/* Header alumno seleccionado */}
          {alumnoSeleccionado && (
            <div style={{
              background: C.bgCard,
              borderRadius: RADIUS.lg,
              border: `1px solid ${C.borderSubtle}`,
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <p style={{
                  margin: "0 0 0.35rem",
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.accentText,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Solicitud recibida
                </p>
                
                
                <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600, color: C.textPrimary }}>
                  {alumnoSeleccionado.nombre}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Profesor: {alumnoSeleccionado.profesor}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Proyecto: {alumnoSeleccionado.proyecto}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Fecha de solicitud: {alumnoSeleccionado.fechaSolicitud}
                  </p>
                  {alumnoSeleccionado?.fechaEnvio != null &&(
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>
                    Fecha de envío: {alumnoSeleccionado.fechaEnvio}
                  </p>
                  )}

                  
                  
              </div>
              <EstadoBadge estado={estadoAlumno} />
            </div>
          )}

          {/* Vista principal */}
          <VistaGestion
            alumno={alumnoSeleccionado}
            estadoAlumno={estadoAlumno}
            archivoSubido={archivoSubido}
            loading={loading}
            error={error}
            onArchivo={manejarArchivo}
            onEmitir={emitirConstancia}
            C={C}
          />

        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
