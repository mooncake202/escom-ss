import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, RADIUS, GRADIENTS, SHADOWS } from "@/themes/colors";
import { ProcesoLayout } from "@/features/gestion-registro/CU-GR-03-registro-siss/components/ProcesoLayout";
import { useEstadoSolicitud } from "@/features/gestion-registro/hooks/useEstadoSolicitud";
import { SolicitudRechazadaDefinitivamente } from "@/features/gestion-registro/components/SolicitudRechazadaDefinitivamente";
import { getOfertas } from "@/services/registroService";
import { cambiarOferta, continuarARegistroSISS } from "@/services/estadoSolicitudService";
import { OfertaCard } from "@/features/gestion-registro/CU-GR-01-enviar-solicitud/components/OfertaCard";

const ESTADOS_PERMITEN_CAMBIO_OFERTA = ["espera_respuesta_de_profesor", "rechazada_por_profesor", "rechazada_por_cupos"];

// IMPORTANTE: RutaProtegida decide a qué pantalla pertenece un
// alumno_sin_asignar leyendo el `usuario` cacheado en localStorage, no la
// BD en vivo. Cada vez que una acción cambie estado_solicitud en el
// backend, hay que actualizar TAMBIÉN esta copia local ANTES de navegar —
// si no, RutaProtegida rebota de vuelta a la ruta vieja porque sigue
// pensando que el estado es el de cuando se hizo login.
function actualizarUsuarioLocal(cambios) {
  const actual = JSON.parse(localStorage.getItem("usuario") || "null");
  if (!actual) return;
  localStorage.setItem("usuario", JSON.stringify({ ...actual, ...cambios }));
}

export default function EsperandoProfesor() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const { estado, cargando, error, refrescar } = useEstadoSolicitud();

  const [mostrarOfertas, setMostrarOfertas] = useState(false);
  const [ofertas, setOfertas] = useState([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [motivacion, setMotivacion] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuarioLS ? `${usuarioLS.nombre} ${usuarioLS.apellidos}` : "";

  if (cargando) return null;

  if (error) {
    return (
      <ProcesoLayout pasoActual={1} usuario={nombre}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem", color: C.danger }}>
          {error}
        </div>
      </ProcesoLayout>
    );
  }

  const estadoSolicitud = estado?.estado_solicitud;

  // RF-GR-33: se cargan las ofertas justo al abrir el panel, nunca antes.
  const abrirCambioOferta = async () => {
    setMostrarOfertas(true);
    setErrorAccion("");
    setCargandoOfertas(true);
    try {
      const data = await getOfertas();
      setOfertas(data);
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setCargandoOfertas(false);
    }
  };

  const confirmarCambioOferta = async () => {
    if (!ofertaSeleccionada || motivacion.trim().length < 20) return;
    setEnviando(true);
    setErrorAccion("");
    try {
      const resultado = await cambiarOferta(ofertaSeleccionada, motivacion.trim());
      actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: null, motivo_rechazo: null });
      setMostrarOfertas(false);
      setOfertaSeleccionada(null);
      setMotivacion("");
      setConfirmado(true);
      await refrescar(); // RN-GR-19: la vista debe reflejar el nuevo estado de inmediato
    } catch (err) {
      // Excepción E2: el cupo se llenó entre que la vio y confirmó.
      if (err.code === "OFERTA_SIN_CUPOS") {
        setErrorAccion("Esa oferta ya no tiene cupo disponible. Elige otra de la lista actualizada.");
        try {
          const data = await getOfertas();
          setOfertas(data);
        } catch {
          // si ni siquiera se puede refrescar la lista, el mensaje de arriba ya es suficiente
        }
        setOfertaSeleccionada(null);
      } else {
        setErrorAccion(err.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleSiguientePaso = async () => {
    setEnviando(true);
    setErrorAccion("");
    try {
      const resultado = await continuarARegistroSISS();
      // Sin esto, RutaProtegida rebota de vuelta aquí mismo (ver nota arriba).
      actualizarUsuarioLocal({ estado_solicitud: resultado.estado_solicitud, estado_anterior: "aceptada_por_profesor" });
      navigate("/alumnoSinAsignar/siss");
    } catch (err) {
      setErrorAccion(err.message);
      setEnviando(false);
    }
  };

  return (
    <ProcesoLayout pasoActual={1} usuario={nombre}>
      {estadoSolicitud === "rechazada_definitivamente" ? (
        <SolicitudRechazadaDefinitivamente motivoRechazo={estado.motivo_rechazo} />
      ) : (
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: "4rem" }}>

          {estadoSolicitud === "aceptada_por_profesor" && (
            <>
              <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: C.success }}>
                ¡Profesor aceptó tu solicitud!
              </h2>
              <p style={{ color: C.textMuted }}>Puedes continuar con el siguiente paso.</p>
              <button
                onClick={handleSiguientePaso}
                disabled={enviando}
                style={{
                  marginTop: "1rem", padding: "12px 28px", borderRadius: RADIUS.md,
                  fontSize: 14, fontWeight: 600, cursor: enviando ? "wait" : "pointer",
                  background: enviando ? C.borderDefault : GRADIENTS.primary,
                  color: "#fff", border: "none", fontFamily: "inherit", boxShadow: enviando ? "none" : SHADOWS.accent,
                }}
              >
                {enviando ? "Avanzando..." : "Siguiente paso →"}
              </button>
            </>
          )}

          {estadoSolicitud === "espera_respuesta_de_profesor" && (
            <>
              <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>⏳</div>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>Esperando respuesta del profesor</h2>
              <p style={{ color: C.textMuted }}>
                Tu solicitud fue enviada correctamente. Esta pantalla se actualiza sola cada
                par de minutos — no necesitas recargar la página.
              </p>
            </>
          )}

          {estadoSolicitud === "rechazada_por_profesor" && (
            <>
              <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>❌</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>Solicitud rechazada</h2>
              <p style={{ color: C.textMuted }}>Tu solicitud fue rechazada porque no cumplías con el perfil requerido.</p>
            </>
          )}

          {estadoSolicitud === "rechazada_por_cupos" && (
            <>
              <div style={{ fontSize: 52, marginBottom: "1.5rem" }}>❌</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: C.danger }}>Solicitud rechazada</h2>
              <p style={{ color: C.textMuted }}>Tu solicitud fue rechazada porque los cupos de la oferta fueron cubiertos.</p>
            </>
          )}

          {/* RN-GR-17: botón visible en los 3 escenarios de arriba */}
          {ESTADOS_PERMITEN_CAMBIO_OFERTA.includes(estadoSolicitud) && !mostrarOfertas && (
            <button
              onClick={abrirCambioOferta}
              style={{
                marginTop: "1rem", padding: "10px 20px", borderRadius: RADIUS.md,
                background: C.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: 600,
              }}
            >
              Cambiar oferta
            </button>
          )}

          {confirmado && !mostrarOfertas && (
            <p style={{ marginTop: "1rem", color: C.success, fontSize: 13 }}>
              ✔ Tu selección de oferta fue actualizada correctamente.
            </p>
          )}

          {errorAccion && (
            <p style={{ marginTop: "1rem", color: C.danger, fontSize: 13 }}>{errorAccion}</p>
          )}

          {/* RF-GR-33 / RF-GR-34: lista de ofertas + motivo nuevo */}
          {mostrarOfertas && (
            <div style={{
              marginTop: "1.5rem", textAlign: "left",
              background: C.bgCard, border: `1px solid ${C.borderSubtle}`,
              borderRadius: RADIUS.md, padding: "1.25rem",
            }}>
              {cargandoOfertas ? (
                <p style={{ color: C.textDisabled, textAlign: "center" }}>Cargando ofertas...</p>
              ) : ofertas.length === 0 ? (
                <p style={{ color: C.textDisabled, textAlign: "center" }}>
                  No hay ofertas de servicio social disponibles en este momento.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {ofertas.map(o => (
                    <OfertaCard
                      key={o.id} oferta={o} C={C}
                      selected={ofertaSeleccionada === o.id}
                      onSelect={setOfertaSeleccionada}
                    />
                  ))}
                </div>
              )}

              {ofertaSeleccionada && (
                <div style={{ marginTop: "1rem" }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
                    Nuevo motivo de postulación
                  </label>
                  <textarea
                    value={motivacion}
                    onChange={e => setMotivacion(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%", marginTop: "0.5rem", padding: "10px",
                      borderRadius: RADIUS.sm, border: `1px solid ${C.borderDefault}`, fontFamily: "inherit",
                    }}
                  />
                  {motivacion.trim().length > 0 && motivacion.trim().length < 20 && (
                    <p style={{ color: C.danger, fontSize: 12, margin: "4px 0 0" }}>
                      Mínimo 20 caracteres.
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  onClick={() => { setMostrarOfertas(false); setOfertaSeleccionada(null); setMotivacion(""); setErrorAccion(""); }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: RADIUS.md,
                    background: "transparent", border: `1px solid ${C.borderDefault}`,
                    color: C.textSecondary, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCambioOferta}
                  disabled={!ofertaSeleccionada || motivacion.trim().length < 20 || enviando}
                  style={{
                    flex: 1, padding: "10px", borderRadius: RADIUS.md,
                    background: (!ofertaSeleccionada || motivacion.trim().length < 20 || enviando) ? C.borderDefault : C.accent,
                    color: "#fff", border: "none",
                    cursor: (!ofertaSeleccionada || motivacion.trim().length < 20 || enviando) ? "not-allowed" : "pointer",
                  }}
                >
                  {enviando ? "Guardando..." : "Confirmar cambio de oferta"}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </ProcesoLayout>
  );
}