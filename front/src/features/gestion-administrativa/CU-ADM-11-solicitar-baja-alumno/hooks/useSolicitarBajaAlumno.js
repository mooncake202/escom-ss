import { useState } from "react";

const PROFESOR = { nombre: "Dr. Torres Vega" };

// Cambia a [] para probar estado vacío "sin alumnos activos"
const MOCK_ALUMNOS = [
  {
    id: 1,
    nombre:     "García López Ana",
    boleta:     "2022630001",
    carrera:    "ISC",
    correoInst: "agarcia0001@alumno.ipn.mx",
  },
  {
    id: 2,
    nombre:     "Hernández Ruiz Carlos",
    boleta:     "2021630042",
    carrera:    "IA",
    correoInst: "chernandez0042@alumno.ipn.mx",
  },
  {
    id: 3,
    nombre:     "Martínez Soto Diana",
    boleta:     "2022630078",
    carrera:    "LCD",
    correoInst: "dmartinez0078@alumno.ipn.mx",
  },
];

export function useBajaAlumnoProfesor() {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [motivo, setMotivo]                         = useState("");
  const [errores, setErrores]                       = useState({});
  const [enviado, setEnviado]                       = useState(false);
  const [busqueda, setBusqueda]                     = useState("");

  function seleccionarAlumno(alumno) {
    setAlumnoSeleccionado(alumno);
    setMotivo("");
    setErrores({});
    setEnviado(false);
  }

  function handleMotivoChange(e) {
    setMotivo(e.target.value);
    if (errores.motivo) setErrores(prev => ({ ...prev, motivo: null }));
  }

  function validar() {
    const e = {};
    if (!motivo.trim()) e.motivo = "El motivo de la solicitud es obligatorio.";
    return e;
  }

  function handleSubmit() {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrores(e); return; }
    setEnviado(true);
  }

  function handleNuevaSolicitud() {
    setAlumnoSeleccionado(null);
    setMotivo("");
    setErrores({});
    setEnviado(false);
  }

  const alumnosFiltrados = MOCK_ALUMNOS.filter(a => {
    const q = busqueda.toLowerCase();
    return a.nombre.toLowerCase().includes(q) || a.boleta.includes(q);
  });

  return {
    profesor:           PROFESOR,
    totalAlumnos:       MOCK_ALUMNOS.length,
    alumnos:            alumnosFiltrados,
    alumnoSeleccionado, motivo, errores, enviado,
    busqueda, setBusqueda,
    seleccionarAlumno, handleMotivoChange,
    handleSubmit, handleNuevaSolicitud,
  };
}
