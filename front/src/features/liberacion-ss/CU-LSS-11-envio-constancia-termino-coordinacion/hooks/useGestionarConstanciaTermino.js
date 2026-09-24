import { useCallback, useEffect, useState } from "react";
import { listarSolicitudesConstancia, emitirConstancia } from "@/services/lssCoordinadorService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Estados derivados de `emitida` (backend): false -> "solicitada" (pendiente
// de envío), true -> "emitida" (ya tiene mensaje, puede corregirse).
// Mismo criterio ya usado en mapearAlumno de LSS-04/06/09.
function mapearAlumno(s) {
  return {
    id: s.liberacionProcesoId,
    nombre: s.nombreCompleto,
    estado: s.emitida ? "emitida" : "solicitada",
    mensajeActual: s.mensajeActual,
    profesor: s.profesorNombre,
    proyecto: s.oferta,
  };
}

export function useGestionarConstanciaTermino() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
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
      // seleccionado si sigue en el listado.
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
    setError("");
  };

  const estadoAlumno = alumnoSeleccionado
    ? alumnos.find((a) => a.id === alumnoSeleccionado.id)?.estado
    : null;

  // RN-LSS-35: sin ningún guardia que bloquee corregir/reenviar — misma
  // función sirve para emisión inicial y corrección, el backend ya lo
  // maneja como un simple UPDATE.
  const enviarMensaje = async (texto) => {
    if (!alumnoSeleccionado || !texto?.trim()) return;
    setLoading(true);
    setError("");
    try {
      await emitirConstancia(alumnoSeleccionado.id, texto.trim());
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo enviar el mensaje de la constancia de término.");
    } finally {
      setLoading(false);
    }
  };

  return {
    alumnos,
    alumnoSeleccionado,
    estadoAlumno,
    loading,
    error,
    seleccionarAlumno,
    enviarMensaje,
  };
}
