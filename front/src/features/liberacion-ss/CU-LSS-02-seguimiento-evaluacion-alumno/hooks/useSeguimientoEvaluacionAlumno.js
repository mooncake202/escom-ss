import { useCallback, useEffect, useState } from "react";
import {
  getEstadoEvaluacion,
  reenviarSolicitudEvaluacion,
  descargarEvaluacion,
  confirmarSubidaSiss,
  solicitarCartaTermino,
} from "@/services/lssAlumnoService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

export function useSeguimientoEvaluacionAlumno() {
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const { socket } = useSocket();

  const cargar = useCallback(async () => {
    try {
      const data = await getEstadoEvaluacion();
      setEstado(data);
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudo cargar el estado de tu evaluación.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Mismo patrón ya usado en el resto de LSS/GR: 'resumen:actualizado' es
  // genérico (fail-open en el backend), aquí solo dispara un refetch
  // completo — cubre tanto los cambios que hace el propio alumno como los
  // que hipotéticamente hiciera el profesor/coordinación (LSS-03/04) sobre
  // esta misma evaluación mientras la pantalla sigue abierta.
  useEffect(() => {
    if (!socket) return;
    const handler = () => cargar();
    socket.on("resumen:actualizado", handler);
    return () => socket.off("resumen:actualizado", handler);
  }, [socket, cargar]);

  useSocketReconectado(cargar);

  const reenviarSolicitud = async (reportesValidadosSiss) => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await reenviarSolicitudEvaluacion(reportesValidadosSiss);
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo reenviar tu solicitud.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  const descargarEval = async () => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await descargarEvaluacion();
      await cargar(); // refleja evaluacionDescargada=true de inmediato
    } catch (err) {
      setError(err.message || "No se pudo descargar tu evaluación.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  const confirmarSiss = async () => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await confirmarSubidaSiss();
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo confirmar la subida a SISS.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  const pedirCartaTermino = async () => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await solicitarCartaTermino();
      await cargar();
    } catch (err) {
      setError(err.message || "No se pudo solicitar la carta de término.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  return {
    cargando,
    estado,
    error,
    accionEnCurso,
    reenviarSolicitud,
    descargarEval,
    confirmarSiss,
    pedirCartaTermino,
  };
}
