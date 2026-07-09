import { useState } from "react";

// Future: reemplazar con llamada a la API (useQuery, fetch, axios, etc.)
const MOCK_PROYECTOS = [
  {
    id: 1, nombre: "Sistema de gestión de inventario con IA",
    tituloSISS: "Sistema de Gestión de Inventario con IA",
    profesor: "Dr. Torres Vega", modalidad: "grupal", estado: "aprobado",
    descripcion: "Desarrollo de un sistema inteligente para el control de inventarios utilizando algoritmos de machine learning para predicción de demanda y optimización de stock.",
    cuposRegistrados: 3, cuposDisponibles: 1, cuposDisponiblesProfesor: null,
    tieneDesglose: false, esInvestigador: false, perfilDeseado: null,
    actividades: ["Análisis y diseño del módulo de predicción de demanda", "Implementación del backend con FastAPI", "Integración con base de datos MySQL"],
    motivoRechazo: null,
  },
  {
    id: 2, nombre: "Plataforma de aprendizaje adaptativo",
    tituloSISS: "Plataforma de Aprendizaje Adaptativo",
    profesor: "Dr. Torres Vega", modalidad: "grupal", estado: "pendiente",
    descripcion: "Creación de una plataforma e-learning que adapta el contenido y ritmo de aprendizaje según el desempeño individual del estudiante mediante técnicas de IA educativa.",
    cuposRegistrados: 2, cuposDisponibles: 2, cuposDisponiblesProfesor: 4,
    tieneDesglose: true, desgloseISC: 1, desgloseIIA: 1, esInvestigador: false, perfilDeseado: null,
    actividades: ["Investigación del estado del arte en sistemas adaptativos", "Diseño de la arquitectura del sistema", "Prototipado de la interfaz de usuario"],
    motivoRechazo: null,
  },
  {
    id: 3, nombre: "Análisis de datos climáticos con Python",
    tituloSISS: "Análisis de Datos Climáticos",
    profesor: "Dra. Ramírez Gutiérrez", modalidad: "grupal", estado: "aprobado",
    descripcion: "Procesamiento y visualización de datos meteorológicos históricos para identificar patrones y tendencias climáticas en la zona metropolitana.",
    cuposRegistrados: 4, cuposDisponibles: 1, cuposDisponiblesProfesor: null,
    tieneDesglose: false, esInvestigador: false, perfilDeseado: null,
    actividades: ["Recolección y limpieza de datasets climáticos", "Análisis estadístico descriptivo", "Generación de visualizaciones interactivas con Matplotlib", "Redacción del reporte técnico final"],
    motivoRechazo: null,
  },
  {
    id: 4, nombre: "Sistema de monitoreo de redes con ML",
    tituloSISS: "Sistema de Monitoreo de Redes",
    profesor: "Dr. Torres Vega", modalidad: "grupal", estado: "rechazado",
    descripcion: "Implementación de un sistema de detección de anomalías en tráfico de red usando modelos de aprendizaje automático no supervisado.",
    cuposRegistrados: 0, cuposDisponibles: 0, cuposDisponiblesProfesor: null,
    tieneDesglose: false, esInvestigador: false, perfilDeseado: null,
    actividades: ["Captura y análisis de paquetes de red", "Entrenamiento de modelos de clustering"],
    motivoRechazo: "El proyecto no cuenta con la infraestructura necesaria para el monitoreo de redes en el laboratorio. Se solicita reformular el alcance o esperar la habilitación del equipo.",
  },
  {
    id: 5, nombre: "App móvil de servicios estudiantiles ESCOM",
    tituloSISS: "Aplicación Móvil ESCOM",
    profesor: "Dr. Mendoza Flores", modalidad: "grupal", estado: "pendiente",
    descripcion: "Desarrollo de una aplicación móvil multiplataforma que centralice los servicios digitales ofrecidos por ESCOM a sus estudiantes.",
    cuposRegistrados: 3, cuposDisponibles: 3, cuposDisponiblesProfesor: 2,
    tieneDesglose: false, esInvestigador: false, perfilDeseado: null,
    actividades: ["Relevamiento de servicios digitales existentes", "Diseño UX/UI de la aplicación", "Desarrollo del módulo de autenticación"],
    motivoRechazo: null,
  },
  {
    id: 6, nombre: "Chatbot de orientación académica",
    tituloSISS: "Chatbot de Orientación ESCOM",
    profesor: "Dra. Ramírez Gutiérrez", modalidad: "grupal", estado: "aprobado",
    descripcion: "Construcción de un asistente virtual basado en procesamiento de lenguaje natural para orientar a alumnos sobre trámites y servicios escolares.",
    cuposRegistrados: 2, cuposDisponibles: 1, cuposDisponiblesProfesor: null,
    tieneDesglose: false, esInvestigador: false, perfilDeseado: null,
    actividades: ["Diseño del árbol de conversación", "Integración con API de lenguaje natural", "Pruebas de usuario con alumnos piloto"],
    motivoRechazo: null,
  },
  {
    id: 7, nombre: "Desarrollo de módulo de reportes en Python",
    tituloSISS: "Módulo de Reportes Estadísticos",
    profesor: "Dr. Torres Vega", modalidad: "individual", estado: "pendiente",
    descripcion: "Implementación de un módulo de generación y exportación de reportes estadísticos en formato PDF y Excel para el sistema interno del departamento.",
    cuposRegistrados: 1, cuposDisponibles: 1, cuposDisponiblesProfesor: null,
    tieneDesglose: false, esInvestigador: false, perfilDeseado: ["ISC", "LCD"],
    actividades: ["Análisis de requerimientos de reportes con el área usuaria", "Desarrollo del módulo con ReportLab y openpyxl", "Pruebas unitarias y documentación técnica"],
    motivoRechazo: null,
  },
];

export function useOfertas() {
  const [proyectos, setProyectos]               = useState(MOCK_PROYECTOS);
  const [vista, setVista]                       = useState("solicitudes");
  const [busqueda, setBusqueda]                 = useState("");
  const [filtroModalidad, setFiltroModalidad]   = useState("todos");
  const [seleccionado, setSeleccionado]         = useState(null);
  const [toast, setToast]                       = useState(null);

  const listaBase = proyectos.filter(p =>
    vista === "solicitudes" ? p.estado === "pendiente" : p.estado !== "pendiente"
  );

  const lista = listaBase.filter(p => {
    const q = busqueda.toLowerCase();
    const matchQ         = !q || p.nombre.toLowerCase().includes(q) || p.profesor.toLowerCase().includes(q);
    const matchModalidad = filtroModalidad === "todos" || p.modalidad === filtroModalidad;
    return matchQ && matchModalidad;
  });

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 5000);
  }

  function seleccionar(p) {
    setSeleccionado(seleccionado?.id === p.id ? null : p);
  }

  function cambiarVista(v) {
    setVista(v);
    setBusqueda("");
    setFiltroModalidad("todos");
    setSeleccionado(null);
  }

  // Future: await api.aprobarOferta(oferta.id, cuposAutorizados)
  function aprobar(oferta) {
    const esIndividual = oferta.modalidad === "individual";
    const cuposAutorizados = esIndividual ? 1 : oferta.cuposRegistrados;
    setProyectos(prev => prev.map(p =>
      p.id === oferta.id ? { ...p, estado: "aprobado", cuposDisponibles: cuposAutorizados } : p
    ));
    mostrarToast(
      esIndividual
        ? "Oferta individual aprobada · Cupo: 1. El profesor ha sido notificado."
        : `Proyecto aprobado · ${cuposAutorizados} cupo${cuposAutorizados !== 1 ? "s" : ""}. El profesor ha sido notificado.`
    );
    setSeleccionado(null);
  }

  // Future: await api.rechazarOferta(oferta.id, motivos)
  function rechazar(oferta, motivos) {
    setProyectos(prev => prev.map(p =>
      p.id === oferta.id ? { ...p, estado: "rechazado", motivoRechazo: motivos } : p
    ));
    mostrarToast("Solicitud rechazada. El profesor ha sido notificado con los motivos.", "danger");
    setSeleccionado(null);
  }

  return {
    proyectos, lista, vista, busqueda, filtroModalidad, seleccionado, toast,
    seleccionar, cambiarVista, setBusqueda, setFiltroModalidad, aprobar, rechazar,
  };
}