import { useCallback, useEffect, useState } from "react";
import {
  listarMisAlumnosParaBaja,
  solicitarBajaAlumnoProfesor,
  amonestarAlumno,
} from "@/services/bajasService";

// Datos reales: el backend devuelve solo los alumnos asignados a este profesor.
//
// Las faltas son APOYO para decidir, no requisito: cualquier alumno asignado puede darse de baja
// aunque tenga 0 faltas, y el backend tampoco las consulta al crear la solicitud.
//
// La amonestación NO reinicia faltas ni deja historial: solo envía una notificación al alumno.
// AH sigue siendo la única fuente de verdad de los contadores.
export function useBajaAlumnoProfesor() {
  const [carga, setCarga] = useState({ estado: "cargando", error: null }); // cargando | listo | error
  const [alumnos, setAlumnos] = useState([]);
  const [intento, setIntento] = useState(0);

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [modo, setModo] = useState(null); // null | selector | baja | amonestacion
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);
  const recargar = () => setIntento((n) => n + 1);

  useEffect(() => {
    let vigente = true;
    setCarga({ estado: "cargando", error: null });
    listarMisAlumnosParaBaja().then(
      (respuesta) => {
        if (!vigente) return;
        setAlumnos(respuesta.alumnos);
        setCarga({ estado: "listo", error: null });
      },
      (err) => { if (vigente) setCarga({ estado: "error", error: err.message }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  function mostrarToast(msg, tipo = "success") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4500);
  }

  function seleccionarAlumno(alumno) {
    if (!alumno || alumno.tieneBajaPendiente) return;
    setAlumnoSeleccionado(alumno);
    setMotivo("");
    setObservaciones("");
    setErrores({});
    // Con faltas se ofrece elegir entre amonestar o dar de baja; sin faltas se va directo a la baja.
    // No hay regla automática: el profesor da las oportunidades que considere.
    setModo(alumno.faltasAcumuladas > 0 || alumno.faltasConsecutivas > 0 ? "selector" : "baja");
  }

  function elegirAccion(accion) {
    setModo(accion);
    setErrores({});
  }

  function cerrar() {
    setAlumnoSeleccionado(null);
    setModo(null);
    setMotivo("");
    setObservaciones("");
    setErrores({});
  }

  function handleMotivoChange(e) {
    setMotivo(e.target.value);
    if (errores.motivo) setErrores((prev) => ({ ...prev, motivo: null }));
  }

  function handleObservacionesChange(e) {
    setObservaciones(e.target.value);
    if (errores.observaciones) setErrores((prev) => ({ ...prev, observaciones: null }));
  }

  async function handleSubmitBaja() {
    if (enviando) return;
    if (!motivo.trim()) {
      setErrores({ motivo: "El motivo de la solicitud es obligatorio." });
      return;
    }
    setEnviando(true);
    try {
      await solicitarBajaAlumnoProfesor({ alumnoBoleta: alumnoSeleccionado.boleta, motivo: motivo.trim() });
      mostrarToast(`Solicitud de baja de ${alumnoSeleccionado.nombre} enviada a Coordinación.`);
      cerrar();
      recargar();
    } catch (err) {
      setErrores({ envio: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function handleSubmitAmonestacion() {
    if (enviando) return;
    if (!observaciones.trim()) {
      setErrores({ observaciones: "Las observaciones de la amonestación son obligatorias." });
      return;
    }
    setEnviando(true);
    try {
      await amonestarAlumno({ alumnoBoleta: alumnoSeleccionado.boleta, observaciones: observaciones.trim() });
      // Sus faltas NO cambian: la amonestación es solo un aviso.
      mostrarToast(`Amonestación enviada a ${alumnoSeleccionado.nombre}.`);
      cerrar();
    } catch (err) {
      setErrores({ envio: err.message });
    } finally {
      setEnviando(false);
    }
  }

  const [busqueda, setBusqueda] = useState("");
  const alumnosFiltrados = alumnos.filter((a) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return a.nombre.toLowerCase().includes(q) || a.boleta.includes(q);
  });

  return {
    carga, recargar,
    totalAlumnos: alumnos.length,
    alumnos: alumnosFiltrados,
    alumnoSeleccionado,
    modo, elegirAccion, cerrar,
    motivo, observaciones, errores, enviando,
    busqueda, setBusqueda,
    toast, dismissToast,
    seleccionarAlumno,
    handleMotivoChange, handleSubmitBaja,
    handleObservacionesChange, handleSubmitAmonestacion,
  };
}
