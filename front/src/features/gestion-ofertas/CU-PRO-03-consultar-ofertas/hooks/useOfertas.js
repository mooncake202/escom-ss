import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "@/services/apiClient";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";
import { adaptarOferta, resolverSeleccion, terminoBuscado, hayFiltrosActivos } from "../consultaOfertas.js";


export function useOfertas() {
  const [proyectos, setProyectos]                 = useState([]);
  const [cargando, setCargando]                   = useState(true);
  const [errorCarga, setErrorCarga]               = useState(null);
  const [vista, setVista]                         = useState("solicitudes");
  const [busqueda, setBusqueda]                   = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const [filtroModalidad, setFiltroModalidad]     = useState("todos");
  const [seleccionado, setSeleccionado]           = useState(null);
  const [toast, setToast]                         = useState(null);

  const { socket } = useSocket();

  const [searchParams] = useSearchParams();
  const [destacadosIds, setDestacadosIds] = useState(new Set());

  useEffect(() => {
    const val = searchParams.get("destacar");
    setDestacadosIds(val ? new Set(val.split(",").map(Number)) : new Set());
  }, [searchParams]);

  useEffect(() => {
    // El recorte vive en `terminoBuscado`: de ahí salen tanto el término que se envía como el que
    // decide si hay filtros activos, así que un texto de solo espacios equivale a no buscar en los
    // dos sitios.
    const timer = setTimeout(() => setBusquedaDebounced(terminoBuscado(busqueda)), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // `silencioso`: recarga sin tocar `cargando`, para que un refresco por socket no haga
  // desaparecer la lista ya pintada. Mismo criterio que el dashboard, que tampoco toca `cargando`
  // al refrescar por evento.
  const cargar = useCallback(({ silencioso = false } = {}) => {
    const params = new URLSearchParams();
    if (busquedaDebounced) params.set("busqueda", busquedaDebounced);
    if (filtroModalidad !== "todos") params.set("tipo", filtroModalidad);

    if (!silencioso) setCargando(true);
    return Promise.all([
      apiFetch(`/ofertas/consultar?vista=pendientes&${params.toString()}`),
      apiFetch(`/ofertas/consultar?vista=historial&${params.toString()}`),
    ])
      .then(([pendientes, historial]) => {
        const lista = [...pendientes, ...historial].map(adaptarOferta);
        setProyectos(lista);
        // El detalle abierto apunta a un objeto de la lista ANTERIOR. Se re-resuelve por id contra
        // la nueva: si sigue ahí, se reemplaza por la versión fresca; si desapareció (otro
        // coordinador la decidió y cambió de categoría, o dejó de entrar en la consulta), se cierra
        // para no mostrar datos que ya no existen.
        setSeleccionado((previo) => resolverSeleccion(lista, previo));
        setErrorCarga(null);
      })
      .catch((err) => setErrorCarga(err.message || "No se pudieron cargar las ofertas."))
      .finally(() => { if (!silencioso) setCargando(false); });
  }, [busquedaDebounced, filtroModalidad]);

  useEffect(() => { cargar(); }, [cargar]);

  // Tiempo real: el backend emite `oferta:actualizada` a los coordinadores cuando un profesor
  // registra o reenvía una oferta, y cuando OTRO coordinador la decide (a quien decide ya se le
  // excluye en el servidor, así que aquí no hace falta filtrar). La recarga es silenciosa y
  // conserva búsqueda, modalidad y pestaña: `cargar` lleva los filtros vigentes en su closure y
  // `vista` no es parámetro suyo.
  //
  // `cargar` va en las dependencias a propósito: su identidad cambia con los filtros, y el handler
  // debe capturar los vigentes. El cleanup desregistra la MISMA referencia antes de volver a
  // registrar, así que no se acumulan listeners.
  useEffect(() => {
    if (!socket) return;

    const refrescarSilencioso = () => cargar({ silencioso: true });
    socket.on("oferta:actualizada", refrescarSilencioso);
    return () => socket.off("oferta:actualizada", refrescarSilencioso);
  }, [socket, cargar]);

  // Cierra el hueco de eventos perdidos durante una desconexión real.
  useSocketReconectado(() => cargar({ silencioso: true }));

  const lista = proyectos.filter(p =>
    vista === "solicitudes" ? p.estado === "pendiente" : p.estado !== "pendiente"
  );

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 5000);
  }

  function seleccionar(p) {
    setSeleccionado(seleccionado?.id === p.id ? null : p);
    if (destacadosIds.has(p.id)) {
      setDestacadosIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
    }
  }

  function cambiarVista(v) {
    setVista(v);
    setBusqueda("");
    setBusquedaDebounced("");
    setFiltroModalidad("todos");
    setSeleccionado(null);
  }

  async function aprobar(oferta, opciones) {
    try {
      await apiFetch(`/ofertas/${oferta.id}/decidir`, {
        method: "POST",
        body: JSON.stringify({
          decision: "aprobar",
          programaSISS: opciones?.programaSISS,
          actividadSISS: opciones?.actividadSISS,
        }),
      });
      const esIndividual = oferta.modalidad === "individual";
      mostrarToast(
        esIndividual
          ? "Oferta individual aprobada · Cupo: 1. El profesor ha sido notificado."
          : `Proyecto aprobado · ${oferta.cuposRegistrados} cupo(s). El profesor ha sido notificado.`
      );
      setSeleccionado(null);
      cargar();
    } catch (err) {
      mostrarToast(err.message || "No se pudo aprobar la solicitud.", "danger");
    }
  }

  async function rechazar(oferta, motivos) {
    try {
      await apiFetch(`/ofertas/${oferta.id}/decidir`, {
        method: "POST",
        body: JSON.stringify({ decision: "rechazar", motivoRechazo: motivos }),
      });
      mostrarToast("Solicitud rechazada. El profesor ha sido notificado con los motivos.", "danger");
      setSeleccionado(null);
      cargar();
    } catch (err) {
      mostrarToast(err.message || "No se pudo rechazar la solicitud.", "danger");
    }
  }

  // Se deriva del término ya RECORTADO, no del texto crudo del input: así "   " no cuenta como
  // filtro activo ni dispara el mensaje de "no se encontraron ofertas".
  const hayFiltros = hayFiltrosActivos(busquedaDebounced, filtroModalidad);

  return {
    proyectos, lista, cargando, errorCarga, vista, busqueda, hayFiltros, filtroModalidad, seleccionado, toast, destacadosIds,
    seleccionar, cambiarVista, setBusqueda, setFiltroModalidad, aprobar, rechazar,
  };
}