import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listarSolicitudesBaja,
  obtenerSolicitudBaja,
  obtenerExpedienteBaja,
  marcarBajaEnRevision,
  aprobarSolicitudBaja,
  rechazarSolicitudBaja,
} from "@/services/bajasService";
import { listarNotificacionesPendientes, marcarNotificacionLeida } from "@/services/notificacionesService";
import { usePdfAlmacenado } from "@/features/gestion-reportes/compartido/usePdfAlmacenado";

export const VISTA = { PENDIENTES: "pendientes", RESUELTAS: "resueltas" };

const RUTA = "/coordinacion/gestionar-bajas";

function primerDestacado(valor) {
  const id = Number((valor ?? "").split(",")[0]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Bandeja compartida: solicitudes de profesor (ADM-09) y de alumno (ADM-11) en la misma lista.
// Ya no hay MOCK: todo viene del backend, que además deriva el origen de cada solicitud.
export function useGestionarBajas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [llegaDestacado] = useState(() => primerDestacado(searchParams.get("destacar")));
  const destacadoAtendido = useRef(false);

  const [carga, setCarga] = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [lista, setLista] = useState({ pendientes: [], resueltas: [] });
  const [intento, setIntento] = useState(0);

  const [vista, setVista] = useState(VISTA.PENDIENTES);
  const [seleccionada, setSeleccionada] = useState(null);
  const [panel, setPanel] = useState("detalle"); // detalle | confirmarAprobacion | rechazo
  const [busqueda, setBusqueda] = useState("");
  const [comentario, setComentario] = useState("");
  const [errores, setErrores] = useState({});
  const [toast, setToast] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Visor de PDF de Reportes (CU-REP-05/06): el expediente se pide con el token por apiFetchBlob y se
  // muestra desde su object URL. Un <a href> directo al endpoint no llevaría el Authorization.
  const { pdf, abrirPdf, cerrarPdf } = usePdfAlmacenado();

  function handleVerExpediente() {
    if (!seleccionada?.tieneExpediente) return;
    abrirPdf(() => obtenerExpedienteBaja(seleccionada.id));
  }

  // Solo las notificaciones PROPIAS de esta bandeja (patrón de CU-REP-06 y ADM-16).
  // Las de los demás coordinadores son suyas y no se tocan.
  useEffect(() => {
    listarNotificacionesPendientes()
      .then((notifs) => {
        const propias = notifs.filter((n) => n.ruta_relacionada?.startsWith(RUTA));
        return Promise.all(propias.map((n) => marcarNotificacionLeida(n.id)));
      })
      .catch((err) => console.error("No se pudieron marcar como leídas las notificaciones de bajas:", err));
  }, []);

  // ?destacar=<id>: se busca en ambas listas. Si otro coordinador ya la resolvió, la notificación
  // sigue sirviendo — abre su detalle en Resueltas en vez de no encontrar nada.
  const atenderDestacado = useEffectEvent((respuesta) => {
    if (!llegaDestacado || destacadoAtendido.current) return;
    destacadoAtendido.current = true;

    const enPendientes = respuesta.pendientes.find((s) => s.id === llegaDestacado);
    const enResueltas = respuesta.resueltas.find((s) => s.id === llegaDestacado);
    const encontrada = enPendientes ?? enResueltas;
    if (encontrada) {
      setVista(enPendientes ? VISTA.PENDIENTES : VISTA.RESUELTAS);
      setSeleccionada(encontrada);
      setPanel("detalle");
    }
    navigate(RUTA, { replace: true });
  });

  useEffect(() => {
    let vigente = true;
    setCarga({ estado: "cargando", error: null });
    listarSolicitudesBaja().then(
      (respuesta) => {
        if (!vigente) return;
        setLista({ pendientes: respuesta.pendientes, resueltas: respuesta.resueltas });
        setCarga({ estado: "listo", error: null });
        atenderDestacado(respuesta);
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  const recargar = () => setIntento((n) => n + 1);

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 5000);
  }

  function cambiarVista(nueva) {
    setVista(nueva);
    setSeleccionada(null);
    setPanel("detalle");
    setErrores({});
  }

  async function seleccionarSolicitud(solicitud) {
    setSeleccionada(solicitud);
    setPanel("detalle");
    setErrores({});
    setComentario("");
    cerrarPdf(); // el PDF abierto pertenecía a otra solicitud
    try {
      const fresca = await obtenerSolicitudBaja(solicitud.id);
      setSeleccionada(fresca);
      setLista((prev) => ({
        pendientes: prev.pendientes.map((s) => (s.id === fresca.id ? fresca : s)),
        resueltas: prev.resueltas.map((s) => (s.id === fresca.id ? fresca : s)),
      }));
    } catch {
      // Si la relectura falla se conserva lo mostrado; el backend revalida al resolver.
    }
  }

  // Aprobar NO ejecuta: abre la confirmación explícita, porque cancela el servicio y borra su
  // avance de forma irreversible. Solo está disponible cuando la solicitud ya está en revisión;
  // quien decide es el backend a través de `puedeAprobarse`.
  function handleAprobar() { setErrores({}); setPanel("confirmarAprobacion"); }
  function handleRechazar() { setComentario(""); setErrores({}); setPanel("rechazo"); }
  function handleCancelarAccion() { setPanel("detalle"); setErrores({}); }

  function handleComentarioChange(e) {
    setComentario(e.target.value);
    if (errores.comentario) setErrores((prev) => ({ ...prev, comentario: null }));
  }

  // Construye la tarjeta resuelta a partir de lo que devolvió el backend, para que aparezca
  // completa en "Resueltas" sin esperar a una recarga.
  //
  // Las dos acciones devuelven formas distintas: rechazar manda la solicitud entera (con comentario
  // y fecha_respuesta), mientras que aprobar solo confirma el resultado de la cancelación
  // ({ id, estado, boleta, nombre, cupoLiberado, archivosEliminados }). Por eso el comentario y la
  // fecha se completan aquí con lo que ya conocemos en pantalla cuando el backend no los incluye.
  function moverAResueltas(id, { estado, comentario: comentarioResuelto, fechaRespuesta }) {
    setLista((prev) => ({
      pendientes: prev.pendientes.filter((s) => s.id !== id),
      resueltas: [{
        ...seleccionada,
        estado,
        comentario: comentarioResuelto ?? null,
        fechaRespuesta: fechaRespuesta ?? new Date().toISOString(),
        puedeResolverse: false,
        // Deja de estar en manos del Instituto en cuanto se resuelve.
        enRevisionInstitucional: false,
      }, ...prev.resueltas],
    }));
    setSeleccionada(null);
    setPanel("detalle");
  }

  /**
   * pendiente → en_revision. No abre panel de confirmación: no destruye nada, solo turna el
   * expediente a las autoridades y avisa al alumno. La solicitud sigue en la bandeja de pendientes,
   * ahora con la etiqueta "En revisión".
   */
  async function handleEnviarARevision() {
    if (procesando) return;
    setProcesando(true);
    setErrores({});
    try {
      const fresca = await marcarBajaEnRevision(seleccionada.id);
      setSeleccionada(fresca);
      setLista((prev) => ({
        ...prev,
        pendientes: prev.pendientes.map((s) => (s.id === fresca.id ? fresca : s)),
      }));
      mostrarToast("Solicitud turnada a las autoridades. El alumno ya fue notificado.");
    } catch (err) {
      if (err.code === "SOLICITUD_YA_RESUELTA" || err.status === 404) { recargar(); setSeleccionada(null); }
      setErrores({ accion: err.message });
      mostrarToast(err.message, "danger");
    } finally {
      setProcesando(false);
    }
  }

  async function handleConfirmarAprobacion() {
    if (procesando) return;
    setProcesando(true);
    setErrores({});
    try {
      const r = await aprobarSolicitudBaja(seleccionada.id, comentario.trim() || undefined);
      mostrarToast(`Baja aprobada. Se canceló el servicio social de ${r.nombre} (${r.boleta}); conserva su cuenta y ya fue notificado.`);
      // La respuesta de aprobar no trae comentario ni fecha: se usan los de esta pantalla.
      moverAResueltas(seleccionada.id, { estado: r.estado, comentario: comentario.trim() || null });
    } catch (err) {
      if (err.code === "SOLICITUD_YA_RESUELTA" || err.status === 404) { recargar(); setSeleccionada(null); }
      setErrores({ accion: err.message });
      mostrarToast(err.message, "danger");
    } finally {
      setProcesando(false);
    }
  }

  async function handleConfirmarRechazo() {
    if (procesando) return;
    if (!comentario.trim()) {
      setErrores({ comentario: "El motivo del rechazo es obligatorio." });
      return;
    }
    setProcesando(true);
    setErrores({});
    try {
      const r = await rechazarSolicitudBaja(seleccionada.id, comentario.trim());
      mostrarToast("Solicitud rechazada. El solicitante fue notificado.", "danger");
      moverAResueltas(seleccionada.id, r); // trae estado, comentario y fechaRespuesta reales
    } catch (err) {
      if (err.code === "SOLICITUD_YA_RESUELTA" || err.status === 404) { recargar(); setSeleccionada(null); }
      setErrores({ accion: err.message });
      mostrarToast(err.message, "danger");
    } finally {
      setProcesando(false);
    }
  }

  const solicitudesFiltradas = useMemo(() => {
    const origen = vista === VISTA.PENDIENTES ? lista.pendientes : lista.resueltas;
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return origen;
    return origen.filter((s) => s.alumno.nombre.toLowerCase().includes(texto) || s.alumno.boleta.includes(texto));
  }, [lista, vista, busqueda]);

  const hayFiltroActivo = busqueda.trim() !== "";
  const limpiarFiltros = () => setBusqueda("");

  return {
    carga, recargar,
    vista, cambiarVista,
    totales: { pendientes: lista.pendientes.length, resueltas: lista.resueltas.length },
    solicitudesFiltradas, seleccionada, panel, toast, procesando,
    busqueda, setBusqueda, hayFiltroActivo, limpiarFiltros,
    comentario, errores,
    seleccionarSolicitud,
    pdf, handleVerExpediente, cerrarPdf,
    handleEnviarARevision, handleAprobar, handleRechazar, handleCancelarAccion,
    handleComentarioChange,
    handleConfirmarAprobacion, handleConfirmarRechazo,
  };
}
