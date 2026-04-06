import { useState, useCallback } from "react";

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
  const [busqueda, setBusqueda]                     = useState("");
  const [alumnosConBaja, setAlumnosConBaja]         = useState(new Set());
  const [toast, setToast]                           = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  function seleccionarAlumno(alumno) {
    if (alumnosConBaja.has(alumno.id)) return;
    setAlumnoSeleccionado(alumno);
    setMotivo("");
    setErrores({});
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

    setAlumnosConBaja(prev => new Set(prev).add(alumnoSeleccionado.id));
    setToast(`Solicitud de baja de ${alumnoSeleccionado.nombre} registrada correctamente.`);
    setAlumnoSeleccionado(null);
    setMotivo("");
    setErrores({});

    setTimeout(() => setToast(null), 4000);
  }

  const alumnosFiltrados = MOCK_ALUMNOS.filter(a => {
    const q = busqueda.toLowerCase();
    return a.nombre.toLowerCase().includes(q) || a.boleta.includes(q);
  });

  return {
    profesor:           PROFESOR,
    totalAlumnos:       MOCK_ALUMNOS.length,
    alumnos:            alumnosFiltrados,
    alumnosConBaja,
    alumnoSeleccionado, motivo, errores,
    busqueda, setBusqueda,
    toast, dismissToast,
    seleccionarAlumno, handleMotivoChange, handleSubmit,
  };
}
