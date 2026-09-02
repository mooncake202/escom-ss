import { useState } from "react";

const MOCK_BITACORAS = [
  {
    id: 1,
    estado: "PendienteRevision",
    alumno: { nombre: "García López Juan Carlos", boleta: "2021630412", carrera: "ISC", oferta: "Sistema Web" },
    fecha:           "2026-03-20",
    horaInicio:      "09:00",
    horaFin:         "13:00",
    horasTrabajadas: 4,
    // múltiples avances
    avances: [
      { actividad: "Análisis de requerimientos", progreso: 75 },
      { actividad: "Diseño de base de datos",    progreso: 30 },
    ],
    descripcion:     "Se realizaron 3 entrevistas con los usuarios clave del sistema para identificar los requerimientos funcionales y no funcionales del módulo de registro. Adicionalmente se inició el modelado de la base de datos.",
    evidencia:       "https://docs.google.com/document/d/1abc123",
  },
  {
    id: 2,
    estado: "PendienteRevision",
    alumno: { nombre: "Ramírez Torres Ana Sofía", boleta: "2022630187", carrera: "IA", oferta: "Base de datos para IA" },
    fecha:           "2026-03-20",
    horaInicio:      "10:00",
    horaFin:         "14:00",
    horasTrabajadas: 4,
    avances: [
      { actividad: "Preparación del dataset", progreso: 90 },
    ],
    descripcion:     "Se aplicaron técnicas de limpieza de datos: eliminación de duplicados, normalización de variables numéricas y codificación de variables categóricas.",
    evidencia:       "https://github.com/anaramirez/dataset-limpio",
  },
  {
    id: 3,
    estado: "PendienteRevision",
    alumno: { nombre: "García López Juan Carlos", boleta: "2021630412", carrera: "ISC", oferta: "Sistema Web" },
    fecha:           "2026-03-19",
    horaInicio:      "09:00",
    horaFin:         "13:00",
    horasTrabajadas: 4,
    avances: [
      { actividad: "Análisis de requerimientos", progreso: 50 },
    ],
    descripcion:     "Revisión de documentación existente del sistema anterior para identificar funcionalidades a conservar.",
    evidencia:       "Entregado en carpeta compartida de Teams",
  },
];

const CARRERA_LABEL = {
  ISC: "Ing. Sistemas Computacionales",
  IA:  "Inteligencia Artificial",
  LCD: "Lic. Ciencia de Datos",
};

export function useRevisarAvances() {
  const [bitacoras, setBitacoras]       = useState(MOCK_BITACORAS);
  const [seleccionada, setSeleccionada] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [comentario, setComentario]     = useState("");
  const [modoRechazo, setModoRechazo]   = useState(false);
  const [filtroAlumno, setFiltroAlumno] = useState("todos");

  const verDetalle = (b) => {
    setSeleccionada(b);
    setResultado(null);
    setComentario("");
    setModoRechazo(false);
  };

  const cerrar = () => {
    setSeleccionada(null);
    setModoRechazo(false);
    setComentario("");
  };

  // RN-AH-34, RN-AH-35, RN-AH-36, RN-AH-43, RN-AH-44
  const decidir = async (id, decision, actividadAdicional = null) => {
    if (decision === "rechazar" && !comentario.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const esAdicional  = decision === "aprobar-adicional";
    const nuevoEstado  = decision === "rechazar" ? "Rechazada" : "Aprobada";

    setBitacoras(prev => prev.map(b => b.id === id ? { ...b, estado: nuevoEstado } : b));

    const alumno = bitacoras.find(b => b.id === id)?.alumno.nombre ?? "";
    setResultado({ tipo: esAdicional ? "aprobar-adicional" : decision, alumno, actividadAdicional });
    setSeleccionada(null);
    setModoRechazo(false);
    setComentario("");
    setLoading(false);
  };

  // Alumnos únicos para el filtro
  const alumnos = [...new Map(bitacoras.map(b => [b.alumno.boleta, b.alumno])).values()];

  const pendientes = bitacoras
    .filter(b => b.estado === "PendienteRevision")
    .filter(b => filtroAlumno === "todos" || b.alumno.boleta === filtroAlumno);

  return {
    pendientes, alumnos, seleccionada, loading, resultado,
    comentario, setComentario, modoRechazo, setModoRechazo,
    filtroAlumno, setFiltroAlumno,
    verDetalle, cerrar, decidir, CARRERA_LABEL,
  };
}