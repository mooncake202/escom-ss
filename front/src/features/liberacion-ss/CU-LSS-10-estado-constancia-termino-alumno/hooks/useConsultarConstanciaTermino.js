import { useCallback, useEffect, useState } from "react";
import { getEstadoConstancia } from "@/services/lssAlumnoService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Estados reales (derivados de la existencia del mensaje en backend):
// pendiente:   coordinación aún no ha redactado el mensaje
// disponible:  mensaje listo, con el enlace a la plataforma externa

export function useConsultarConstanciaTermino() {
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState("pendiente");
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const { socket } = useSocket();

  const cargar = useCallback(async () => {
    try {
      const data = await getEstadoConstancia();
      setEstado(data.estado);
      setMensaje(data.mensaje);
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudo cargar el estado de tu constancia de término.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // RN-LSS-30: coordinación redacta el mensaje de forma asíncrona
  // (CU-LSS-11) — mismo patrón de refresco en vivo ya usado en todo el
  // módulo.
  useEffect(() => {
    if (!socket) return;
    const handler = () => cargar();
    socket.on("resumen:actualizado", handler);
    return () => socket.off("resumen:actualizado", handler);
  }, [socket, cargar]);

  useSocketReconectado(cargar);

  return {
    cargando,
    estado,
    mensaje,
    error,
  };
}
