import { useState, useMemo, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { useTheme, GRADIENTS, RADIUS, SHADOWS } from "@/themes/colors";
import { ALUMNOS_CARTA } from "./hooks/cartaCompromisoData";

// ── Helpers ──────────────────────────────────────────────────
function formatFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Icono SVG inline ─────────────────────────────────────────
function Icon({ d, size = 16, stroke, strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke || "currentColor"} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  upload:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  pdf:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  check:   "M20 6 9 17l-5-5",
  clock:   "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-6v-4l3-3",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  send:    "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  x:       "M18 6 6 18M6 6l12 12",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  filter:  "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
};

// ── Badge de estado ──────────────────────────────────────────
function EstadoBadge({ enviada }) {
  const style = enviada
    ? { bg: "rgba(34,197,94,0.12)", color: "#22C55E", label: "Enviada" }
    : { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", label: "Pendiente" };

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      padding: "2px 9px", borderRadius: RADIUS.full,
      background: style.bg, color: style.color,
    }}>
      {style.label}
    </span>
  );
}

// ── Item de la lista de alumnos ──────────────────────────────
function AlumnoItem({ alumno, activo, onClick, C }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        padding: "10px 12px", borderRadius: RADIUS.md,
        background: activo
          ? "rgba(0,58,143,0.20)"
          : hover ? C.bgCardHover : "transparent",
        borderLeft: activo ? `3px solid #0A4DB5` : "3px solid transparent",
        transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 10,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: activo ? GRADIENTS.primary : C.bgInput,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700,
        color: activo ? "#fff" : C.textMuted,
      }}>
        {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: activo ? 600 : 500,
          color: activo ? C.accentText : C.textPrimary,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {alumno.nombre.split(" ").slice(0, 2).join(" ")}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>
          {alumno.boleta} · {alumno.carreraCorta}
        </p>
      </div>

      <EstadoBadge enviada={alumno.cartaCompromiso.enviada} />
    </button>
  );
}

// ── Panel de upload / detalle ────────────────────────────────
function PanelDetalle({ alumno, onActualizar, C }) {
  const fileInputRef = useRef(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(!alumno.cartaCompromiso.enviada);
  const [dragOver, setDragOver] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const carta = alumno.cartaCompromiso;

  // Reset al cambiar alumno
  useState(() => {
    setArchivoSeleccionado(null);
    setModoEdicion(!alumno.cartaCompromiso.enviada);
    setExito(false);
  }, [alumno.id]);

  function handleFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Solo se aceptan archivos PDF.");
      return;
    }
    setArchivoSeleccionado(file);
    setExito(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleEnviar() {
    if (!archivoSeleccionado) return;
    setEnviando(true);
    setTimeout(() => {
      onActualizar(alumno.id, {
        enviada: true,
        archivo: archivoSeleccionado,
        nombreArchivo: archivoSeleccionado.name,
        fechaEnvio: new Date().toISOString(),
      });
      setEnviando(false);
      setExito(true);
      setModoEdicion(false);
      setArchivoSeleccionado(null);
    }, 1200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%" }}>

      {/* Info del alumno */}
      <div style={{
        background: C.bgCard, borderRadius: RADIUS.lg,
        border: `1px solid ${C.borderDefault}`,
        padding: "1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: "1rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: GRADIENTS.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#fff",
          }}>
            {alumno.nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{alumno.nombre}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textDisabled }}>{alumno.boleta} · {alumno.carrera}</p>
          </div>
          <EstadoBadge enviada={carta.enviada} />
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1.5rem",
          paddingTop: "1rem", borderTop: `1px solid ${C.borderSubtle}`,
        }}>
          {[
            { label: "Oferta de servicio", value: alumno.oferta },
            { label: "Empresa / Institución", value: alumno.empresa },
            { label: "Asesor externo", value: alumno.asesorExterno },
            { label: "Fecha de inicio", value: alumno.fechaInicio },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Carta actual (si ya fue enviada) */}
      {carta.enviada && !modoEdicion && (
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.25rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Carta compromiso enviada
            </p>
            <button
              onClick={() => { setModoEdicion(true); setExito(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: RADIUS.md,
                border: `1px solid ${C.borderDefault}`,
                background: "transparent", color: C.textMuted,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bgCardHover; e.currentTarget.style.color = C.textPrimary; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
            >
              <Icon d={ICONS.edit} size={13} />
              Reemplazar
            </button>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: RADIUS.md,
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.20)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "rgba(34,197,94,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>
              📄
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {carta.nombreArchivo}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Icon d={ICONS.clock} size={11} stroke={C.textDisabled} />
                <span style={{ fontSize: 11, color: C.textDisabled }}>Enviada el {formatFecha(carta.fechaEnvio)}</span>
              </div>
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "rgba(34,197,94,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon d={ICONS.check} size={12} stroke="#22C55E" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      )}

      {/* Éxito tras enviar */}
      {exito && (
        <div style={{
          padding: "12px 16px", borderRadius: RADIUS.md,
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.25)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon d={ICONS.check} size={14} stroke="#22C55E" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#22C55E" }}>Carta enviada correctamente</p>
            <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>Se registró la fecha de envío al expediente del alumno.</p>
          </div>
        </div>
      )}

      {/* Panel de upload */}
      {modoEdicion && (
        <div style={{
          background: C.bgCard, borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          padding: "1.25rem",
          flex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textDisabled, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {carta.enviada ? "Reemplazar carta compromiso" : "Subir carta compromiso"}
            </p>
            {carta.enviada && (
              <button
                onClick={() => { setModoEdicion(false); setArchivoSeleccionado(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: RADIUS.md,
                  border: `1px solid ${C.borderDefault}`,
                  background: "transparent", color: C.textMuted,
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Icon d={ICONS.x} size={12} /> Cancelar
              </button>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#0A4DB5" : archivoSeleccionado ? "rgba(34,197,94,0.4)" : C.borderDefault}`,
              borderRadius: RADIUS.lg,
              padding: "2rem 1.5rem",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver
                ? "rgba(10,77,181,0.06)"
                : archivoSeleccionado
                  ? "rgba(34,197,94,0.05)"
                  : C.bgInput,
              transition: "all 0.2s",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={e => handleFile(e.target.files?.[0])}
            />

            {archivoSeleccionado ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#22C55E" }}>{archivoSeleccionado.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.textDisabled }}>
                  {(archivoSeleccionado.size / 1024).toFixed(1)} KB · Haz clic para cambiar
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: RADIUS.lg,
                  background: C.accentSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                }}>
                  <Icon d={ICONS.upload} size={22} stroke={C.accentText} />
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                  Arrastra el PDF aquí o haz clic para seleccionar
                </p>
                <p style={{ margin: 0, fontSize: 11, color: C.textDisabled }}>Solo archivos PDF · Máx. 10 MB</p>
              </>
            )}
          </div>

          {/* Botón enviar */}
          <button
            onClick={handleEnviar}
            disabled={!archivoSeleccionado || enviando}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "10px",
              borderRadius: RADIUS.md,
              background: archivoSeleccionado && !enviando ? GRADIENTS.primary : C.bgInput,
              color: archivoSeleccionado && !enviando ? "#fff" : C.textDisabled,
              border: "none",
              fontSize: 13, fontWeight: 600,
              cursor: archivoSeleccionado && !enviando ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
              boxShadow: archivoSeleccionado && !enviando ? SHADOWS.accent : "none",
            }}
          >
            {enviando ? (
              <>
                <span style={{
                  width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                Enviando...
              </>
            ) : (
              <>
                <Icon d={ICONS.send} size={14} stroke="#fff" />
                {carta.enviada ? "Actualizar carta compromiso" : "Enviar carta compromiso"}
              </>
            )}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Vista principal ──────────────────────────────────────────
export default function CartaCompromiso() {
  const { C } = useTheme();
  const [alumnos, setAlumnos] = useState(ALUMNOS_CARTA);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos" | "pendiente" | "enviada"

  const alumnosFiltrados = useMemo(() => {
    return alumnos.filter(a => {
      const matchBusqueda = a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.boleta.includes(busqueda);
      const matchEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "enviada" && a.cartaCompromiso.enviada) ||
        (filtroEstado === "pendiente" && !a.cartaCompromiso.enviada);
      return matchBusqueda && matchEstado;
    });
  }, [alumnos, busqueda, filtroEstado]);

  const totales = useMemo(() => ({
    total: alumnos.length,
    enviadas: alumnos.filter(a => a.cartaCompromiso.enviada).length,
    pendientes: alumnos.filter(a => !a.cartaCompromiso.enviada).length,
  }), [alumnos]);

  function handleActualizar(id, nuevaCarta) {
    setAlumnos(prev => prev.map(a =>
      a.id === id ? { ...a, cartaCompromiso: nuevaCarta } : a
    ));
    // Actualiza el alumno seleccionado también
    setAlumnoSeleccionado(prev =>
      prev?.id === id ? { ...prev, cartaCompromiso: nuevaCarta } : prev
    );
  }

  return (
    <DashboardLayout
      titulo="Carta Compromiso"
      subtitulo="CU-CO-14 · Coordinación"
      rol="coordinacion"
      usuario="Coord. María Esquivel"
    >
      {/* Métricas resumen */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total alumnos", value: totales.total, color: C.accentText, bg: C.accentSoft },
          { label: "Cartas enviadas", value: totales.enviadas, color: "#22C55E", bg: "rgba(34,197,94,0.10)" },
          { label: "Pendientes", value: totales.pendientes, color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            flex: 1, padding: "12px 16px", borderRadius: RADIUS.lg,
            background: C.bgCard, border: `1px solid ${C.borderDefault}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: RADIUS.md, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Layout 2 columnas */}
      <div style={{ display: "flex", gap: "1rem", height: "calc(100vh - 220px)", minHeight: 0 }}>

        {/* ── Columna izquierda: lista ── */}
        <div style={{
          width: 310, flexShrink: 0,
          background: C.bgCard,
          borderRadius: RADIUS.lg,
          border: `1px solid ${C.borderDefault}`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Búsqueda + filtro */}
          <div style={{ padding: "12px", borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Buscador */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.bgInput, borderRadius: RADIUS.md,
              border: `1px solid ${C.borderDefault}`,
              padding: "7px 10px",
            }}>
              <Icon d={ICONS.search} size={14} stroke={C.textDisabled} />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o boleta…"
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontSize: 13, color: C.textPrimary, outline: "none",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              />
            </div>

            {/* Filtro estado */}
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { key: "todos", label: "Todos" },
                { key: "pendiente", label: "Pendientes" },
                { key: "enviada", label: "Enviadas" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltroEstado(key)}
                  style={{
                    flex: 1, padding: "5px 4px", borderRadius: RADIUS.sm,
                    border: "none", cursor: "pointer",
                    fontSize: 11, fontWeight: filtroEstado === key ? 700 : 500,
                    fontFamily: "inherit",
                    background: filtroEstado === key ? C.accentSoft : "transparent",
                    color: filtroEstado === key ? C.accentText : C.textMuted,
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista scrolleable */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {alumnosFiltrados.length === 0 ? (
              <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: C.textDisabled, margin: 0 }}>Sin resultados</p>
              </div>
            ) : (
              alumnosFiltrados.map(alumno => (
                <AlumnoItem
                  key={alumno.id}
                  alumno={alumno}
                  activo={alumnoSeleccionado?.id === alumno.id}
                  onClick={() => setAlumnoSeleccionado({ ...alumno })}
                  C={C}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Columna derecha: detalle ── */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {alumnoSeleccionado ? (
            <PanelDetalle
              key={alumnoSeleccionado.id}
              alumno={alumnoSeleccionado}
              onActualizar={handleActualizar}
              C={C}
            />
          ) : (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              background: C.bgCard, borderRadius: RADIUS.lg,
              border: `1px solid ${C.borderDefault}`,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: RADIUS.xl,
                background: C.accentSoft,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>
                📋
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textPrimary, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Selecciona un alumno
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textDisabled, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Elige un alumno de la lista para gestionar su carta compromiso.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
