import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "@/services/apiClient";

function adaptarOferta(o) {
  return {
    id: o.id,
    nombre: o.titulo,
    tituloSISS: o.nombreSISS,
    programaSISS: o.programaSISS,
    profesor: o.profesor,
    modalidad: o.modalidad,
    estado: o.estado === "pendiente_revision" ? "pendiente"
          : o.estado === "aprobada" ? "aprobado"
          : o.estado === "rechazada" ? "rechazado"
          : o.estado,
    descripcion: o.descripcion,
    actividades: o.actividades ? [o.actividades] : [],
    cuposRegistrados: o.cuposRegistrados,
    cuposDisponibles: o.cuposDisponibles,
    esInvestigador: o.esInvestigador,
    cuposOcupadosProfesor: o.cuposOcupadosProfesor,
    cuposTotalesProfesor: o.cuposTotalesProfesor,
    perfilDeseado: o.perfilCarrera,
    motivoRechazo: o.motivoRechazo,
  };
}

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

  const [searchParams] = useSearchParams();
  const [destacadosIds, setDestacadosIds] = useState(new Set());

  useEffect(() => {
    const val = searchParams.get("destacar");
    setDestacadosIds(val ? new Set(val.split(",").map(Number)) : new Set());
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const cargar = useCallback(() => {
    const params = new URLSearchParams();
    if (busquedaDebounced) params.set("busqueda", busquedaDebounced);
    if (filtroModalidad !== "todos") params.set("tipo", filtroModalidad);

    setCargando(true);
    Promise.all([
      apiFetch(`/ofertas/consultar?vista=pendientes&${params.toString()}`),
      apiFetch(`/ofertas/consultar?vista=historial&${params.toString()}`),
    ])
      .then(([pendientes, historial]) => {
        setProyectos([...pendientes, ...historial].map(adaptarOferta));
        setErrorCarga(null);
      })
      .catch((err) => setErrorCarga(err.message || "No se pudieron cargar las ofertas."))
      .finally(() => setCargando(false));
  }, [busquedaDebounced, filtroModalidad]);

  useEffect(() => { cargar(); }, [cargar]);

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

  return {
    proyectos, lista, cargando, errorCarga, vista, busqueda, filtroModalidad, seleccionado, toast, destacadosIds,
    seleccionar, cambiarVista, setBusqueda, setFiltroModalidad, aprobar, rechazar,
  };
}