import { useCallback, useEffect, useState } from "react";
import { listarSolicitudesConstancia, emitirConstancia } from "@/services/lssCoordinadorService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Estados derivados de `emitida` (backend): false -> "solicitada" (pendiente
// de emisión), true -> "emitida" (ya tiene documento, puede corregirse).
// Mismo criterio ya usado en mapearAlumno de LSS-04/06/09.
function mapearAlumno(s) {
  return {
    id: s.liberacionProcesoId,
    nombre: s.nombreCompleto,
    estado: s.emitida ? "emitida" : "solicitada",
    constancia: s.emitida ? { nombre: s.nombreConstancia } : null,
    profesor: s.profesorNombre,
    proyecto: s.oferta,
  };
}

// RN-LSS-33: solo PDF — mismo criterio ya usado en el resto del proyecto
// (el backend valida magic bytes; esto es solo feedback inmediato).
function validarArchivo(archivo) {
  if (archivo.type !== "application/pdf") {
    return "Solo se permiten archivos en formato PDF.";
  }
  return null;
}

export function useGestionarConstanciaTermino() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [archivoSubido, setArchivoSubido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { socket } = useSocket();

  const cargar = useCallback(async () => {
    try {
      const data = await listarSolicitudesConstancia();
      const mapeados = data.map(mapearAlumno);
      setAlumnos(mapeados);
      setError("");
      // Mismo criterio que LSS-04/06/09: mantiene sincronizado al alumno
      // seleccionado si sigue en el listado (ej. tras emitir, pasa de
      // "solicitada" a "emitida" sin perder la selección).
      setAlumnoSeleccionado((prev) => {
        if (!prev) return prev;
        return mapeados.find((a) => a.id === prev.id) || null;
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar la lista de solicitudes.");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => cargar();
    socket.on("resumen:actualizado", handler);
    return () => socket.off("resumen:actualizado", handler);
  }, [socket, cargar]);

  useSocketReconectado(cargar);

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setArchivoSubido(null);
    setError("");
  };

  const estadoAlumno = alumnoSeleccionado
    ? alumnos.find((a) => a.id === alumnoSeleccionado.id)?.estado
    : null;

  const manejarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const errorMsg = validarArchivo(file);
    if (errorMsg) {
      setError(errorMsg);
      setArchivoSubido(null);
      return;
    }
    setError("");
    setArchivoSubido({ nombre: file.name, archivo: file });
  };

  // Misma función sirve para emisión inicial y para corrección (RN-LSS-35,
  // sin ningún guardia que la bloquee) — `archivoCorreccion` opcional lo
  // usa la zona de "Corregir constancia" del JSX (mismo patrón ya
  // construido en el mockup).
  const emitir = async (archivoCorreccion) => {
    const archivo = archivoCorreccion ?? archivoSubido?.archivo;
    if (!alumnoSeleccionado || !archivo) return;
    const errorMsg = validarArchivo(archivo);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await emitirConstancia(alumnoSeleccionado.id, archivo);
      setArchivoSubido(null);
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo emitir la constancia de término.");
    } finally {
      setLoading(false);
    }
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
    emitirConstancia: emitir,
  };
}
