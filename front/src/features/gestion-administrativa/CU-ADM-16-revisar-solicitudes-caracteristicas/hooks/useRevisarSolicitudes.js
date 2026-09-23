import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listarSolicitudesCaracteristica,
  obtenerSolicitudCaracteristica,
  aprobarSolicitudCaracteristica,
  rechazarSolicitudCaracteristica,
} from "@/services/caracteristicasService";
import { listarNotificacionesPendientes, marcarNotificacionLeida } from "@/services/notificacionesService";

export const VISTA = { PENDIENTES: "pendientes", RESUELTAS: "resueltas" };

const RUTA = "/coordinacion/solicitudes-caracteristicas";

// La notificación puede traer varios ids ("?destacar=3,7") cuando el dashboard agrupa avisos;
// basta con el primero para abrir su detalle.
function primerDestacado(valor) {
  const id = Number((valor ?? "").split(",")[0]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Las solicitudes vienen del backend; ya no hay MOCK. Cada una trae calculadas la capacidad
// resultante, los ocupados REALES de ese momento y `puedeAprobarse`.
export function useRevisarSolicitudes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [destacado] = useState(() => primerDestacado(searchParams.get("destacar")));
  const destacadoAtendido = useRef(false);

  const [carga, setCarga] = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [lista, setLista] = useState({ pendientes: [], resueltas: [] });
  const [intento, setIntento] = useState(0);

  const [vista, setVista] = useState(VISTA.PENDIENTES);
  const [seleccionada, setSeleccionada] = useState(null);
  const [panel, setPanel] = useState("detalle"); // detalle | aprobacion | rechazo
  const [busqueda, setBusqueda] = useState("");
  const [comentario, setComentario] = useState("");
  const [errores, setErrores] = useState({});
  const [toast, setToast] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Al entrar se marcan como leídas SOLO las notificaciones propias de esta bandeja (mismo patrón
  // que CU-REP-06 y Ofertas). La bandeja es compartida, pero las notificaciones de los demás
  // coordinadores son suyas y no se tocan.
  useEffect(() => {
    listarNotificacionesPendientes()
      .then((notifs) => {
        const propias = notifs.filter((n) => n.ruta_relacionada?.startsWith(RUTA));
        return Promise.all(propias.map((n) => marcarNotificacionLeida(n.id)));
      })
      .catch((err) => console.error("No se pudieron marcar como leídas las notificaciones de características:", err));
  }, []);

  // ?destacar=<id>: se busca en AMBAS listas. Si otro coordinador ya la resolvió, la notificación
  // sigue siendo útil — abre su detalle en Resueltas en vez de no encontrar nada. Se atiende UNA
  // sola vez, aunque la bandeja se recargue.
  const atenderDestacado = useEffectEvent((respuesta) => {
    if (!destacado || destacadoAtendido.current) return;
    destacadoAtendido.current = true;

    const enPendientes = respuesta.pendientes.find((s) => s.id === destacado);
    const enResueltas = respuesta.resueltas.find((s) => s.id === destacado);
    const encontrada = enPendientes ?? enResueltas;
    if (encontrada) {
      setVista(enPendientes ? VISTA.PENDIENTES : VISTA.RESUELTAS);
      setSeleccionada(encontrada);
      setPanel("detalle");
    }
    navigate(RUTA, { replace: true }); // consumido: al refrescar ya no se vuelve a abrir
  });

  useEffect(() => {
    let vigente = true;
    setCarga({ estado: "cargando", error: null });
    listarSolicitudesCaracteristica().then(
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
    setTimeout(() => setToast(null), 4500);
  }

  function cambiarVista(nueva) {
    setVista(nueva);
    setSeleccionada(null);
    setPanel("detalle");
    setErrores({});
  }

  // Al abrir el detalle se relee del backend: los ocupados pueden haber cambiado desde que se
  // cargó la lista, y con ellos `puedeAprobarse`.
  async function handleSeleccionar(solicitud) {
    setSeleccionada(solicitud);
    setPanel("detalle");
    setErrores({});
    setComentario("");
    try {
      const fresca = await obtenerSolicitudCaracteristica(solicitud.id);
      setSeleccionada(fresca);
      setLista((prev) => ({
        pendientes: prev.pendientes.map((s) => (s.id === fresca.id ? fresca : s)),
        resueltas: prev.resueltas.map((s) => (s.id === fresca.id ? fresca : s)),
      }));
    } catch {
      // Si la relectura falla se conserva lo que ya se mostraba; el backend revalida al aprobar.
    }
  }

  function handleAprobar() { setErrores({}); setPanel("aprobacion"); }
  function handleRechazar() { setComentario(""); setErrores({}); setPanel("rechazo"); }
  function handleCancelarAccion() { setPanel("detalle"); setErrores({}); }

  function handleComentarioChange(e) {
    setComentario(e.target.value);
    if (errores.comentario) setErrores((prev) => ({ ...prev, comentario: null }));
  }

  // Resuelta = sale de pendientes y entra al historial, sin recargar toda la bandeja.
  function moverAResueltas(resultado) {
    setLista((prev) => ({
      pendientes: prev.pendientes.filter((s) => s.id !== resultado.id),
      resueltas: [{ ...seleccionada, ...resultado, puedeAprobarse: false }, ...prev.resueltas],
    }));
    setSeleccionada(null);
    setPanel("detalle");
  }

  async function handleConfirmarAprobacion() {
    if (procesando) return;
    setProcesando(true);
    setErrores({});
    try {
      const resultado = await aprobarSolicitudCaracteristica(seleccionada.id, comentario.trim() || undefined);
      mostrarToast(
        `Aprobada. ${seleccionada.profesor.nombre} queda como ${seleccionada.caracteristicaSolicitada?.nombre ?? "Profesor base"} `
        + `con ${resultado.capacidadResultante} cupos.`,
      );
      moverAResueltas(resultado);
    } catch (err) {
      // La capacidad pudo cambiar desde que se envió la solicitud: el backend revalida al aprobar
      // y puede negarla. Se refleja el estado nuevo para que Aprobar quede bloqueado y solo se
      // pueda rechazar, con los números reales a la vista.
      if (err.code === "CAPACIDAD_INSUFICIENTE" && err.detalles?.datos) {
        const { ocupados, capacidadResultante, cuposALiberar } = err.detalles.datos;
        const actualizada = {
          ...seleccionada,
          puedeAprobarse: false,
          cuposALiberar,
          capacidadResultante,
          profesor: { ...seleccionada.profesor, ocupados },
        };
        setSeleccionada(actualizada);
        setLista((prev) => ({
          ...prev,
          pendientes: prev.pendientes.map((s) => (s.id === actualizada.id ? actualizada : s)),
        }));
        setPanel("detalle");
      } else if (err.code === "SOLICITUD_YA_RESUELTA") {
        // Otro coordinador se adelantó: la bandeja es compartida, así que se recarga para verla
        // ya en el historial con lo que él decidió.
        recargar();
        setSeleccionada(null);
      }
      setErrores({ accion: err.message });
      mostrarToast(err.message, "danger");
    } finally {
      setProcesando(false);
    }
  }

  async function handleConfirmarRechazo() {
    if (procesando) return;
    if (!comentario.trim()) {
      setErrores({ comentario: "El comentario es obligatorio al rechazar." });
      return;
    }
    setProcesando(true);
    setErrores({});
    try {
      const resultado = await rechazarSolicitudCaracteristica(seleccionada.id, comentario.trim());
      mostrarToast(`Solicitud rechazada. ${seleccionada.profesor.nombre} fue notificado.`, "danger");
      moverAResueltas(resultado);
    } catch (err) {
      if (err.code === "SOLICITUD_YA_RESUELTA") {
        recargar();
        setSeleccionada(null);
      }
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
    return origen.filter((s) => s.profesor.nombre.toLowerCase().includes(texto));
  }, [lista, vista, busqueda]);

  return {
    carga, recargar,
    vista, cambiarVista,
    totales: { pendientes: lista.pendientes.length, resueltas: lista.resueltas.length },
    solicitudesFiltradas,
    seleccionada, panel,
    busqueda, setBusqueda,
    comentario, errores, toast, procesando,
    handleSeleccionar,
    handleAprobar, handleRechazar, handleCancelarAccion,
    handleComentarioChange,
    handleConfirmarAprobacion, handleConfirmarRechazo,
  };
}
