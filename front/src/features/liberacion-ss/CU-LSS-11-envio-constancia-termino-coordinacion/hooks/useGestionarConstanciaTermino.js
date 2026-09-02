import { useState } from "react";

const ALUMNOS_MOCK = [
  { id: 1, nombre: "Lagarza Ortega Ana Karen",        estado: "solicitada",   constancia: null, fechaSolicitud: "2024-06-01", fechaEnvio: null, profesor : "Dr. Smith", proyecto: "Desarrollo de app móvil" },
  { id: 2, nombre: "Martínez López José Luis",         estado: "solicitada",   constancia: null, fechaSolicitud: "2024-06-02", fechaEnvio: null, profesor : "Dr. Johnson", proyecto: "Investigación de mercado" },
  { id: 3, nombre: "Hernández Ruiz María Fernanda",    estado: "emitida",      constancia: { nombre: "CONSTANCIA_HERNANDEZ_RUIZ_MARIA_FERNANDA.pdf" }, fechaSolicitud: "2024-06-03", fechaEnvio: "2024-06-10", profesor : "Dr. Williams", proyecto: "Desarrollo de app web" },
  { id: 4, nombre: "Torres Vega Carlos Eduardo",       estado: "emitida",      constancia: { nombre: "CONSTANCIA_TORRES_VEGA_CARLOS_EDUARDO.pdf" }, fechaSolicitud: "2024-06-04", fechaEnvio: "2024-06-11", profesor : "Dr. Brown", proyecto: "Diseño de interfaz" },
  { id: 5, nombre: "Ramírez Castillo Diana Paola",     estado: "solicitada",   constancia: null, fechaSolicitud: "2024-06-05", fechaEnvio: null, profesor : "Dr. Davis", proyecto: "Análisis de datos" },
];

// Estados: solicitada → emitida
// solicitada: el alumno solicitó su constancia, coordinación debe subirla
// emitida:    coordinación subió el archivo, el alumno ya puede descargarlo

export function useGestionarConstanciaTermino() {
  const [alumnos, setAlumnos]                       = useState(ALUMNOS_MOCK);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [archivoSubido, setArchivoSubido]           = useState(null);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState("");

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setArchivoSubido(null);
    setError("");
  };

  const estadoAlumno = alumnoSeleccionado
    ? alumnos.find(a => a.id === alumnoSeleccionado.id)?.estado
    : null;

  const manejarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF.");
      return;
    }
    setError("");
    setArchivoSubido({ nombre: file.name, url: URL.createObjectURL(file) });
  };

  const emitirConstancia = async () => {
    if (!alumnoSeleccionado || !archivoSubido) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    setAlumnos(prev =>
      prev.map(a =>
        a.id === alumnoSeleccionado.id
          ? { ...a, estado: "emitida", constancia: archivoSubido }
          : a
      )
    );
    setAlumnoSeleccionado(prev =>
      prev ? { ...prev, estado: "emitida", constancia: archivoSubido } : prev
    );
    setArchivoSubido(null);
    setLoading(false);
  };

  return {
    alumnos,
    alumnoSeleccionado,
    estadoAlumno,
    archivoSubido,
    loading,
    error,
    seleccionarAlumno,
    manejarArchivo,
    emitirConstancia,
  };
}
