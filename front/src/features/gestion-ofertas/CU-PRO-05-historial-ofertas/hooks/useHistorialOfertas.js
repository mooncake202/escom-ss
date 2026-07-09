import { useState, useMemo } from "react";
import { getOfertas } from "../../ofertasStore";

// Future: reemplazar con llamada a la API
const MOCK_MIS_PROYECTOS = [
  {
    id: 1, tipo: "proyecto",
    titulo: "Sistema de gestión de inventario con IA",
    tituloSISS: "Academia de Inteligencia Artificial",
    descripcion: "Desarrollo de un sistema web para gestionar inventario utilizando modelos de IA para predicción de demanda y automatización de pedidos.",
    cupos: 3, cuposOcupados: 2, cuposDisponibles: 1, alumnosActivos: 2,
    estatus: "activo", carreras: ["ISC", "IIA"],
    alumnos: ["García López Ana", "Martínez Ruiz Luis"],
    fechaRegistro: "2025-01-15",
  },
  {
    id: 2, tipo: "proyecto",
    titulo: "Plataforma de aprendizaje adaptativo",
    tituloSISS: "Academia de Ciencia de Datos",
    descripcion: "Construcción de una plataforma educativa que adapta el contenido según el progreso y rendimiento del alumno en tiempo real.",
    cupos: 2, cuposOcupados: 0, cuposDisponibles: 2, alumnosActivos: 0,
    estatus: "en_revision", carreras: ["LCD"],
    alumnos: [], fechaRegistro: "2025-02-20",
  },
  {
    id: 3, tipo: "individual",
    titulo: "Sistema de monitoreo de redes con ML",
    tituloSISS: "Academia de Sistemas y Redes",
    descripcion: "Implementación de un sistema de monitoreo de tráfico de red usando modelos de machine learning para detección de anomalías.",
    cupos: 1, cuposOcupados: 1, cuposDisponibles: 0, alumnosActivos: 0,
    estatus: "concluido", carreras: ["ISC"],
    alumnos: ["Hernández Díaz Sofia"],
    fechaRegistro: "2024-08-10",
  },
  {
    id: 4, tipo: "proyecto",
    titulo: "Análisis de datos climáticos con Python",
    tituloSISS: "Academia de Ciencia de Datos Aplicada",
    descripcion: "Proyecto de análisis y visualización de datos climáticos históricos usando Python y bibliotecas de ciencia de datos.",
    cupos: 3, cuposOcupados: 1, cuposDisponibles: 2, alumnosActivos: 0,
    estatus: "activo", carreras: ["LCD", "ISC"],
    alumnos: ["Pérez Luna Marco"],
    fechaRegistro: "2025-01-28",
  },
  {
    id: 5, tipo: "individual",
    titulo: "Desarrollo de módulo de reportes en Python",
    tituloSISS: "Academia de Desarrollo de Software",
    descripcion: "Implementación de un módulo de generación de reportes automáticos en PDF usando Python y bibliotecas de reporting.",
    cupos: 1, cuposOcupados: 0, cuposDisponibles: 1, alumnosActivos: 0,
    estatus: "rechazada", carreras: ["ISC"],
    alumnos: [], fechaRegistro: "2025-03-05",
    motivoRechazo: "La descripción de actividades no especifica claramente el tiempo estimado por tarea ni el entregable final. Por favor detalla las actividades semanales y los productos a entregar.",
  },
];

export function useHistorialOfertas() {
  const [proyectos, setProyectos]           = useState(() => [...MOCK_MIS_PROYECTOS, ...getOfertas()]);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [editando, setEditando]             = useState(false);
  const [formEdicion, setFormEdicion]           = useState({});
  const [erroresEdicion, setErroresEdicion]     = useState({});
  const [reenviado, setReenviado]               = useState(false);
  const [filtroEstado, setFiltroEstado]         = useState("todos");
  const [filtroModalidad, setFiltroModalidad]   = useState("todos");

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

  // Future: await api.cerrarOferta(id)
  function cerrarOferta(id) {
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, estatus: "cerrado" } : p));
  }

  function iniciarEdicion(p) {
    setFormEdicion({
      nombre:      p.titulo,
      tituloSISS:  p.tituloSISS  || "",
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
    if (!formEdicion.nombre?.trim())      e.nombre      = "El nombre es obligatorio.";
    if (!formEdicion.tituloSISS?.trim())  e.tituloSISS  = "El título SISS es obligatorio.";
    if (!formEdicion.descripcion?.trim()) e.descripcion = "La descripción es obligatoria.";
    if (!esIndividual) {
      const n = parseInt(formEdicion.cupos);
      if (!formEdicion.cupos || isNaN(n) || n < 1) e.cupos = "Ingresa un número de cupos válido.";
    }
    return e;
  }

  // Future: await api.reenviarOferta(p.id, payload)
  function submitEdicion(p) {
    const esIndividual = p.tipo === "individual";
    const e = validarEdicion(esIndividual);
    if (Object.keys(e).length > 0) { setErroresEdicion(e); return; }
    const nuevosCupos = esIndividual ? 1 : parseInt(formEdicion.cupos);
    setProyectos(prev => prev.map(item => item.id === p.id ? {
      ...item,
      titulo:         formEdicion.nombre,
      tituloSISS:     formEdicion.tituloSISS,
      descripcion:    formEdicion.descripcion,
      carreras:       formEdicion.carreras,
      cupos:          nuevosCupos,
      cuposDisponibles: nuevosCupos - (item.cuposOcupados || 0),
      estatus:        "en_revision",
      motivoRechazo:  null,
    } : item));
    setEditando(false);
    setReenviado(true);
  }

  return {
    proyectos, ofertasFiltradas, seleccionada,
    editando, formEdicion, erroresEdicion, reenviado,
    filtroEstado, filtroModalidad,
    seleccionar, cerrarPanel, cancelarEdicion, cerrarOferta, iniciarEdicion,
    handleChangeEdicion, toggleCarreraEdicion, submitEdicion,
    setFiltroEstado, setFiltroModalidad,
  };
}