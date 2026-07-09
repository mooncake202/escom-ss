import { useState, useCallback } from "react";

const PROFESOR = { nombre: "Dr. Torres Vega" };

const MOCK_ALUMNOS = [
  {
    id: 1,
    nombre:              "García López Ana",
    boleta:              "2022630001",
    carrera:             "ISC",
    correoInst:          "agarcia0001@alumno.ipn.mx",
    faltasAcumuladas:    3,
    faltasConsecutivas:  2,
  },
  {
    id: 2,
    nombre:              "Hernández Ruiz Carlos",
    boleta:              "2021630042",
    carrera:             "IA",
    correoInst:          "chernandez0042@alumno.ipn.mx",
    faltasAcumuladas:    0,
    faltasConsecutivas:  0,
  },
  {
    id: 3,
    nombre:              "Martínez Soto Diana",
    boleta:              "2022630078",
    carrera:             "LCD",
    correoInst:          "dmartinez0078@alumno.ipn.mx",
    faltasAcumuladas:    5,
    faltasConsecutivas:  3,
  },
];

// modo: null | "selector" | "baja" | "amonestacion"
export function useBajaAlumnoProfesor() {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [modo, setModo]                             = useState(null);
  const [motivo, setMotivo]                         = useState("");
  const [observaciones, setObservaciones]           = useState("");
  const [errores, setErrores]                       = useState({});
  const [busqueda, setBusqueda]                     = useState("");
  const [alumnosConBaja, setAlumnosConBaja]          = useState(new Set());
  const [alumnosConAmonestacion, setAlumnosConAmonestacion] = useState(new Set());
  const [faltasReseteadas, setFaltasReseteadas]     = useState(new Set());
  const [toast, setToast]                           = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  function tieneFaltasEfectivas(alumno) {
    return alumno.faltasAcumuladas > 0 && !faltasReseteadas.has(alumno.id);
  }

  function seleccionarAlumno(alumno) {
    if (!alumno || alumnosConBaja.has(alumno.id)) return;
    setAlumnoSeleccionado(alumno);
    setMotivo("");
    setObservaciones("");
    setErrores({});
    // Si tiene faltas activas → mostrar selector de acción (flujo 0.1)
    setModo(tieneFaltasEfectivas(alumno) ? "selector" : "baja");
  }

  function elegirAccion(accion) {
    setModo(accion);
    setErrores({});
  }

  // ── Flujo A: solicitar baja ──────────────────────────────────
  function handleMotivoChange(e) {
    setMotivo(e.target.value);
    if (errores.motivo) setErrores(prev => ({ ...prev, motivo: null }));
  }

  function handleSubmitBaja() {
    if (!motivo.trim()) {
      setErrores({ motivo: "El motivo de la solicitud es obligatorio." });
      return;
    }
    setAlumnosConBaja(prev => new Set(prev).add(alumnoSeleccionado.id));
    setToast(`Solicitud de baja de ${alumnoSeleccionado.nombre} registrada correctamente.`);
    setAlumnoSeleccionado(null);
    setModo(null);
    setMotivo("");
    setErrores({});
    setTimeout(() => setToast(null), 4000);
  }

  // ── Flujo B: enviar amonestación ─────────────────────────────
  function handleObservacionesChange(e) {
    setObservaciones(e.target.value);
    if (errores.observaciones) setErrores(prev => ({ ...prev, observaciones: null }));
  }

  function handleSubmitAmonestacion() {
    if (!observaciones.trim()) {
      setErrores({ observaciones: "Las observaciones de la amonestación son obligatorias." });
      return;
    }
    // Reinicia contadores de faltas (RN-ADM-03 / flujo 0.1.2)
    setFaltasReseteadas(prev => new Set(prev).add(alumnoSeleccionado.id));
    setAlumnosConAmonestacion(prev => new Set(prev).add(alumnoSeleccionado.id));
    setToast(`Amonestación enviada a ${alumnoSeleccionado.nombre}. Sus faltas han sido reiniciadas.`);
    setAlumnoSeleccionado(null);
    setModo(null);
    setObservaciones("");
    setErrores({});
    setTimeout(() => setToast(null), 4500);
  }

  const alumnosFiltrados = MOCK_ALUMNOS.map(a => ({
    ...a,
    faltasEfectivas:     faltasReseteadas.has(a.id) ? 0 : a.faltasAcumuladas,
    faltasConsEfectivas: faltasReseteadas.has(a.id) ? 0 : a.faltasConsecutivas,
  })).filter(a => {
    const q = busqueda.toLowerCase();
    return a.nombre.toLowerCase().includes(q) || a.boleta.includes(q);
  });

  return {
    profesor:           PROFESOR,
    totalAlumnos:       MOCK_ALUMNOS.length,
    alumnos:            alumnosFiltrados,
    alumnosConBaja,
    alumnosConAmonestacion,
    alumnoSeleccionado,
    modo, elegirAccion,
    motivo, observaciones, errores,
    busqueda, setBusqueda,
    toast, dismissToast,
    seleccionarAlumno,
    handleMotivoChange, handleSubmitBaja,
    handleObservacionesChange, handleSubmitAmonestacion,
  };
}
