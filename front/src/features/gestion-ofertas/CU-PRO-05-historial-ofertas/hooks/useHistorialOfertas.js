import { useState, useMemo, useEffect } from "react";
import { apiFetch } from "@/services/apiClient";

export function useHistorialOfertas() {
  const [proyectos, setProyectos]           = useState([]);
  const [cargando, setCargando]             = useState(true);
  const [errorCarga, setErrorCarga]         = useState(null);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [editando, setEditando]             = useState(false);
  const [formEdicion, setFormEdicion]           = useState({});
  const [erroresEdicion, setErroresEdicion]     = useState({});
  const [reenviado, setReenviado]               = useState(false);
  const [filtroEstado, setFiltroEstado]         = useState("todos");
  const [filtroModalidad, setFiltroModalidad]   = useState("todos");

  useEffect(() => {
    apiFetch("/ofertas/mias")
      .then(setProyectos)
      .catch((err) => setErrorCarga(err.message || "No se pudieron cargar tus ofertas."))
      .finally(() => setCargando(false));
  }, []);

  const ofertasFiltradas = useMemo(() => proyectos.filter(p => {
    if (filtroEstado    !== "todos" && p.estatus !== filtroEstado)    return false;
    if (filtroModalidad !== "todos" && p.tipo    !== filtroModalidad) return false;
    return true;
  }), [proyectos, filtroEstado, filtroModalidad]);

  const seleccionada = proyectos.find(p => p.id === seleccionadaId) || null;

  function seleccionar(p) {
    if (seleccionadaId === p.id) { cerrarPanel(); return; }
    setSeleccionadaId(p.id);
    setEditando(false);
    setReenviado(false);
  }

  function cerrarPanel() {
    setSeleccionadaId(null);
    setEditando(false);
    setReenviado(false);
  }

  function cancelarEdicion() {
    setEditando(false);
    setErroresEdicion({});
  }

  async function cerrarOferta(id) {
    try {
      await apiFetch(`/ofertas/${id}/cerrar`, { method: "POST" });
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estatus: "cerrado" } : p));
    } catch (err) {
      setErrorCarga(err.message || "No se pudo cerrar la oferta.");
    }
  }

  function iniciarEdicion(p) {
    setFormEdicion({
      nombre:      p.titulo,
      descripcion: p.descripcion || "",
      carreras:    [...(p.carreras || [])],
      cupos:       String(p.cupos || 1),
    });
    setErroresEdicion({});
    setEditando(true);
    setReenviado(false);
  }

  function handleChangeEdicion(e) {
    const { name, value } = e.target;
    setFormEdicion(prev => ({ ...prev, [name]: value }));
    if (erroresEdicion[name]) setErroresEdicion(prev => ({ ...prev, [name]: null }));
  }

  function toggleCarreraEdicion(key) {
    setFormEdicion(prev => ({
      ...prev,
      carreras: prev.carreras.includes(key)
        ? prev.carreras.filter(k => k !== key)
        : [...prev.carreras, key],
    }));
  }

  function validarEdicion(esIndividual) {
    const e = {};
    if (!formEdicion.nombre?.trim())       e.nombre       = "El nombre es obligatorio.";
    if (!formEdicion.descripcion?.trim()) e.descripcion = "La descripción es obligatoria.";
    if (!esIndividual) {
      const n = parseInt(formEdicion.cupos);
      if (!formEdicion.cupos || isNaN(n) || n < 2) e.cupos = "Para modalidad proyecto, el mínimo es de 2 cupos.";
    }
    return e;
  }

async function submitEdicion(p) {
  const esIndividual = p.tipo === "individual";
  const e = validarEdicion(esIndividual);
  if (Object.keys(e).length > 0) { setErroresEdicion(e); return; }

  try {
    await apiFetch(`/ofertas/${p.id}/reenviar`, {
      method: "POST",
      body: JSON.stringify({
        nombre_proyecto: formEdicion.nombre,
        descripcion_actividades: formEdicion.descripcion,
        tipo_oferta: p.tipo,
        cupos_ofertados: esIndividual ? undefined : parseInt(formEdicion.cupos, 10),
        carreras: formEdicion.carreras,
      }),
    });
    setEditando(false);
    setReenviado(true);
    // Recarga la lista completa para reflejar el estado real del servidor.
    apiFetch("/ofertas/mias").then(setProyectos).catch(() => {});
  } catch (err) {
    setErroresEdicion({ general: err.message || "No se pudo reenviar la oferta." });
  }
}

  return {
    proyectos, ofertasFiltradas, seleccionada,
    cargando, errorCarga,
    editando, formEdicion, erroresEdicion, reenviado,
    filtroEstado, filtroModalidad,
    seleccionar, cerrarPanel, cancelarEdicion, cerrarOferta, iniciarEdicion,
    handleChangeEdicion, toggleCarreraEdicion, submitEdicion,
    setFiltroEstado, setFiltroModalidad,
  };
}