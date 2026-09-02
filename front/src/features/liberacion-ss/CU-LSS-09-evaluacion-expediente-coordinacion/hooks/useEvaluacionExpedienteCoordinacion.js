import { useState } from "react";

// Mock de alumnos con expediente en revisión
const ALUMNOS_MOCK = [
  { id: 1, nombre: "Lagarza Ortega Ana Karen",        estado: "en_revision",  expediente: "LAGARZA_ORTEGA_ANA_KAREN_2022630667.pdf", fechaSolicitud: "2024-06-01", fechaEnvio: null, profesor : "Dr. Smith", proyecto: "Desarrollo de app móvil",   },
  { id: 2, nombre: "Martínez López José Luis",         estado: "en_revision",  expediente: "MARTINEZ_LOPEZ_JOSE_LUIS_2021540332.pdf", fechaSolicitud: "2024-06-02", fechaEnvio: null, profesor : "Dr. Johnson", proyecto: "Investigación en inteligencia artificial" },
  { id: 3, nombre: "Hernández Ruiz María Fernanda",    estado: "aprobado",     expediente: "HERNANDEZ_RUIZ_MARIA_FERNANDA_2020490211.pdf", fechaSolicitud: "2024-06-03", fechaEnvio: "2024-06-10", profesor : "Dr. Williams", proyecto: "Desarrollo de app web" },
  { id: 4, nombre: "Torres Vega Carlos Eduardo",       estado: "rechazado",    expediente: "TORRES_VEGA_CARLOS_EDUARDO_2023710891.pdf", fechaSolicitud: "2024-06-04", fechaEnvio: "2024-06-12", profesor : "Dr. Brown", proyecto: "Análisis de datos" },
  { id: 5, nombre: "Ramírez Castillo Diana Paola",     estado: "en_revision",  expediente: "RAMIREZ_CASTILLO_DIANA_PAOLA_2022680554.pdf", fechaSolicitud: "2024-06-05", fechaEnvio: null, profesor : "Dr. Davis", proyecto: "Diseño de interfaces" },
];

// Estados por alumno: en_revision → aprobado | rechazado
export function useEvaluacionExpedienteCoordinacion() {
  const [alumnos, setAlumnos]                     = useState(ALUMNOS_MOCK);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [observaciones, setObservaciones]           = useState("");
  const [loading, setLoading]                       = useState(false);

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setObservaciones("");
  };

  const estadoAlumno = alumnoSeleccionado
    ? alumnos.find(a => a.id === alumnoSeleccionado.id)?.estado
    : null;

  const actualizarEstado = (id, nuevoEstado) => {
    setAlumnos(prev =>
      prev.map(a => a.id === id ? { ...a, estado: nuevoEstado } : a)
    );
    setAlumnoSeleccionado(prev =>
      prev?.id === id ? { ...prev, estado: nuevoEstado } : prev
    );
  };

  const aprobar = async () => {
    if (!alumnoSeleccionado) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    actualizarEstado(alumnoSeleccionado.id, "aprobado");
    setLoading(false);
  };

  const rechazar = async () => {
    if (!alumnoSeleccionado || !observaciones.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    actualizarEstado(alumnoSeleccionado.id, "rechazado");
    setObservaciones("");
    setLoading(false);
  };

  return {
    alumnos,
    alumnoSeleccionado,
    estadoAlumno,
    observaciones,
    loading,
    seleccionarAlumno,
    setObservaciones,
    aprobar,
    rechazar,
  };
}
