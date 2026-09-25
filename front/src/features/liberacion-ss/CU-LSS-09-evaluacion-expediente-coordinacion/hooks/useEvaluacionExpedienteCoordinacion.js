import { useCallback, useEffect, useState } from "react";
import {
  listarExpedientesPendientes,
  dictaminarExpedienteAprobado,
  dictaminarExpedienteRechazado,
  descargarExpediente,
} from "@/services/lssCoordinadorService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Mismo criterio que mapearAlumno en useFirmarEvaluacionCoordinacion.js
// (LSS-04) / useEstadoCartaTerminoCoordinacion.js (LSS-06): traduce los
// nombres reales de la API a los que ya usa el JSX del mockup. `id` =
// documentoId (la clave real que necesitan aprobar/rechazar/descargar).
function mapearAlumno(e) {
  return {
    id: e.documentoId,
    nombre: e.nombreCompleto,
    estado: "en_revision", // el listado solo trae expedientes en_revision — si ya no está aquí, es porque ya se dictaminó.
    expediente: e.nombreExpediente,
    fechaSolicitud: e.fechaEnvio ? new Date(e.fechaEnvio).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }) : "",
    fechaEnvio: null,
    profesor: e.profesorNombre,
    proyecto: e.oferta,
  };
}

export function useEvaluacionExpedienteCoordinacion() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  const cargar = useCallback(async () => {
    try {
      const data = await listarExpedientesPendientes();
      const mapeados = data.map(mapearAlumno);
      setAlumnos(mapeados);
      setError(null);
      // Mismo criterio que LSS-04/06: si el alumno seleccionado ya fue
      // dictaminado (ya no aparece en el listado, que solo trae
      // en_revision), sale de la selección — la vista de detalle se
      // cierra en vez de quedarse obsoleta.
      setAlumnoSeleccionado((prev) => {
        if (!prev) return prev;
        return mapeados.find((a) => a.id === prev.id) || null;
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar la lista de expedientes.");
    } finally {
      setCargando(false);
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
    setObservaciones("");
  };

  const estadoAlumno = alumnoSeleccionado
    ? alumnos.find((a) => a.id === alumnoSeleccionado.id)?.estado
    : null;

  const descargar = async () => {
    if (!alumnoSeleccionado) return;
    setError(null);
    try {
      await descargarExpediente(alumnoSeleccionado.id);
    } catch (err) {
      setError(err.message || "No se pudo descargar el expediente.");
    }
  };

  // Sin navigate() aquí a propósito: igual que LSS-06, el coordinador se
  // queda en la MISMA lista tras dictaminar — un refetch es correcto y
  // suficiente (el expediente ya dictaminado desaparece solo del listado).
  const aprobar = async () => {
    if (!alumnoSeleccionado) return;
    setLoading(true);
    setError(null);
    try {
      await dictaminarExpedienteAprobado(alumnoSeleccionado.id);
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo aprobar el expediente.");
    } finally {
      setLoading(false);
    }
  };

  const rechazar = async () => {
    if (!alumnoSeleccionado || !observaciones.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await dictaminarExpedienteRechazado(alumnoSeleccionado.id, observaciones.trim());
      setObservaciones("");
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo rechazar el expediente.");
    } finally {
      setLoading(false);
    }
  };

  return {
    alumnos,
    cargando,
    error,
    alumnoSeleccionado,
    estadoAlumno,
    observaciones,
    loading,
    seleccionarAlumno,
    setObservaciones,
    descargar,
    aprobar,
    rechazar,
  };
}
