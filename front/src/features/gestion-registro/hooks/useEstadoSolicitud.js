import { useEffect, useState, useCallback, useRef } from "react";
import { getEstadoSolicitud } from "@/services/estadoSolicitudService";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Los 7 eventos de Parte 2 que pueden cambiar el estado_solicitud del
// alumno (los dirigidos al profesor/coordinador — solicitud:nueva,
// documentacion:pendiente, carta:pendiente_confirmacion,
// expediente:pendiente_revision — no aplican aquí: ya los ve el alumno de
// inmediato en la respuesta de su propia acción, no cambian SU estado).
const EVENTOS_ESTADO = [
  "solicitud:aceptada",
  "solicitud:rechazada",
  "solicitud:rechazada_por_cupos",
  "solicitud:vencida",
  "documentacion:decidida",
  "carta:recibida",
  "expediente:decidido",
];

/**
 * Hook compartido por todas las pantallas de espera de GR. Consulta el
 * estado actual de la solicitud al montar, y expone `refrescar()` para
 * forzar una consulta inmediata justo después de una acción del alumno
 * (cambiar oferta, continuar, etc.) sin depender de un evento.
 */
export function useEstadoSolicitud() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const activoRef = useRef(true);
  const { socket } = useSocket();

  const consultar = useCallback(async () => {
    try {
      const data = await getEstadoSolicitud();
      if (activoRef.current) {
        setEstado(data);
        setError("");
      }
    } catch (err) {
      if (activoRef.current) setError(err.message || "No se pudo consultar tu estado.");
    } finally {
      if (activoRef.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    activoRef.current = true;
    consultar();
    return () => {
      activoRef.current = false;
    };
  }, [consultar]);

  // Socket — reemplaza el polling de 120s.
  useEffect(() => {
    if (!socket) return;

    const handler = () => consultar();
    EVENTOS_ESTADO.forEach((evento) => socket.on(evento, handler));
    return () => {
      EVENTOS_ESTADO.forEach((evento) => socket.off(evento, handler));
    };
  }, [socket, consultar]);

  // Cierra el hueco de eventos perdidos durante una desconexión real.
  useSocketReconectado(consultar);

  return { estado, cargando, error, refrescar: consultar };
}
