import { useCallback, useEffect, useState } from "react";
import { getEstadoConstancia, descargarConstancia } from "@/services/lssAlumnoService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Estados reales (derivados de la existencia del documento en backend):
// pendiente:   coordinación aún no ha subido la constancia
// disponible:  constancia lista para descargar

export function useConsultarConstanciaTermino() {
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState("pendiente");
  const [nombreConstancia, setNombreConstancia] = useState(null);
  const [error, setError] = useState(null);
  const { socket } = useSocket();

  const cargar = useCallback(async () => {
    try {
      const data = await getEstadoConstancia();
      setEstado(data.estado);
      setNombreConstancia(data.nombreConstancia);
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

  // RN-LSS-30: coordinación emite la constancia de forma asíncrona
  // (CU-LSS-11, no construido todavía) — mismo patrón de refresco en vivo
  // ya usado en todo el módulo.
  useEffect(() => {
    if (!socket) return;
    const handler = () => cargar();
    socket.on("resumen:actualizado", handler);
    return () => socket.off("resumen:actualizado", handler);
  }, [socket, cargar]);

  useSocketReconectado(cargar);

  const descargar = async () => {
    setError(null);
    try {
      await descargarConstancia();
    } catch (err) {
      setError(err.message || "No se pudo descargar tu constancia de término.");
    }
  };

  return {
    cargando,
    estado,
    nombreConstancia,
    error,
    descargar,
  };
}
