import { useState, useMemo } from "react";

const MOCK_REGISTROS_POR_ALUMNO = {
  1: [
    { id: "b1", tipo: "bitacora", fecha: "2026-03-20", horaInicio: "09:00", horaFin: "13:00", horasTrabajadas: 4, avances: [{ actividad: "Análisis de requerimientos", progreso: 75 }, { actividad: "Diseño de base de datos", progreso: 30 }], descripcion: "Se realizaron entrevistas con usuarios clave y se inició el modelado de BD.", evidencia: "https://docs.google.com/document/d/1abc123", estado: "Aprobada", comentarioProfesor: null },
    { id: "b2", tipo: "bitacora", fecha: "2026-03-19", horaInicio: "09:00", horaFin: "13:00", horasTrabajadas: 4, avances: [{ actividad: "Análisis de requerimientos", progreso: 50 }], descripcion: "Revisión de documentación existente del sistema anterior.", evidencia: "Entregado en carpeta compartida de Teams", estado: "Rechazada", comentarioProfesor: "La evidencia no corresponde al avance reportado." },
    { id: "b3", tipo: "bitacora", fecha: "2026-03-18", horaInicio: "10:00", horaFin: "14:00", horasTrabajadas: 4, avances: [{ actividad: "Investigación de frameworks", progreso: 100 }], descripcion: "Comparación de React, Vue y Angular.", evidencia: "https://docs.google.com/spreadsheets/d/xyz", estado: "Aprobada", comentarioProfesor: null },
    { id: "b4", tipo: "bitacora", fecha: "2026-03-21", horaInicio: "09:00", horaFin: "12:00", horasTrabajadas: 3, avances: [{ actividad: "Diseño de base de datos", progreso: 60 }], descripcion: "Continuación del diseño del esquema de BD.", evidencia: "https://github.com/jgarcia/db-schema", estado: "PendienteRevision", comentarioProfesor: null },
    { id: "a1", tipo: "actividad", fecha: "2026-03-15", titulo: "Análisis de requerimientos", descripcion: "Levantar requerimientos del sistema.", entregable: "Documento IEEE 830", estado: "En progreso", progreso: 75, fechaLimite: "2026-03-20" },
    { id: "a2", tipo: "actividad", fecha: "2026-03-18", titulo: "Diseño de base de datos", descripcion: "Modelar el esquema ER.", entregable: "Diagrama ER y script SQL", estado: "En progreso", progreso: 60, fechaLimite: "2026-03-20" },
    { id: "a3", tipo: "actividad", fecha: "2026-03-10", titulo: "Investigación de frameworks", descripcion: "Comparar frameworks frontend.", entregable: "Documento comparativo", estado: "Completada", progreso: 100,  fechaLimite: "2026-03-11" },
  ],
  2: [
    { id: "b5", tipo: "bitacora", fecha: "2026-03-20", horaInicio: "10:00", horaFin: "14:00", horasTrabajadas: 4, avances: [{ actividad: "Preparación del dataset", progreso: 90 }], descripcion: "Limpieza y normalización de datos.", evidencia: "https://github.com/aramirez/dataset", estado: "Aprobada", comentarioProfesor: null },
    { id: "a4", tipo: "actividad", fecha: "2026-03-10", titulo: "Preparación del dataset", descripcion: "Limpiar y normalizar los datos.", entregable: "Dataset limpio CSV", estado: "Completada", progreso: 100, fechaLimite: "2026-03-25" },
  ],
};

export const MOCK_ALUMNOS = [
  { id: 1, profesorId: 1, nombre: "García López Juan Carlos", boleta: "2021630412", carrera: "ISC", oferta: "Sistema Web" },
  { id: 2, profesorId: 1, nombre: "Ramírez Torres Ana Sofía", boleta: "2022630187", carrera: "IA", oferta: "Base de datos IA" },
  
];

export const MOCK_PROFESORES = [
  { id: 1, nombre: "Dr. Torres Vega",      dept: "Sistemas" },
  { id: 2, nombre: "Dra. Ruiz Méndez",     dept: "Inteligencia Artificial" },
  { id: 3, nombre: "M.C. Herrera López",   dept: "Ciencia de Datos" },
];

export function useHistorial(rol = "alumno") {
  const [tipoFiltro, setTipoFiltro]     = useState("todos");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [fechaDesde, setFechaDesde]     = useState("");
  const [fechaHasta, setFechaHasta]     = useState("");
  

  // Para profesor/coordinación: alumno seleccionado en la lista
  const [profesorVisto, setProfesorVisto] = useState(null);
const [alumnoVisto, setAlumnoVisto]     = useState(null);

const idActivo      = rol === "alumno" ? 1 : alumnoVisto?.id ?? null;
const registrosBase = idActivo ? (MOCK_REGISTROS_POR_ALUMNO[idActivo] ?? []) : [];

const profesorActivoId = rol === "profesor" ? 1 : profesorVisto?.id ?? null;

const alumnosPorProfesor = profesorActivoId
  ? MOCK_ALUMNOS.filter(a => a.profesorId === profesorActivoId)
  : [];

const registros = useMemo(() => {
  return registrosBase
    .filter(r => tipoFiltro   === "todos" || r.tipo   === tipoFiltro)
    .filter(r => estadoFiltro === "todos" || r.estado === estadoFiltro)
    .filter(r => !fechaDesde  || r.fecha >= fechaDesde)
    .filter(r => !fechaHasta  || r.fecha <= fechaHasta)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}, [registrosBase, tipoFiltro, estadoFiltro, fechaDesde, fechaHasta]);

const totales = {
  bitacoras:   registrosBase.filter(r => r.tipo === "bitacora").length,
  actividades: registrosBase.filter(r => r.tipo === "actividad").length,
};

return {
  registros, totales,
  tipoFiltro, setTipoFiltro,
  estadoFiltro, setEstadoFiltro,
  fechaDesde, setFechaDesde,
  fechaHasta, setFechaHasta,
  profesores: MOCK_PROFESORES,
  profesorVisto, setProfesorVisto,
  alumnos: alumnosPorProfesor,
  alumnoVisto, setAlumnoVisto,
};
}
