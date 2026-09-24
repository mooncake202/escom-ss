import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEstadoCarta, confirmarRecogidaCarta } from "@/services/lssAlumnoService";
import { ESTADO_LSS_A_RUTA } from "@/features/liberacion-ss/utils/estadoRutasLSS";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// ——— ESTADOS POSIBLES (carta_termino.estado, valores reales de la ficha) ———
// "solicitada"        → Coordinación aún no ha elaborado la carta
// "lista_para_recoger"→ Coordinación marcó la carta como lista
// "recogida"          → Alumno confirmó que ya la recogió
// ————————————————————————————————————————————————————

export function useCartaTerminoAlumno() {
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    try {
      const data = await getEstadoCarta();
      setEstado(data.estado);
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudo cargar el estado de tu carta de término.");
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

  // Mismo criterio ya aprendido en el bug de CU-LSS-02 (pedirCartaTermino):
  // NO se hace cargar() tras el éxito — se navega directo a la pantalla del
  // nuevo estado (liberacion_proceso.estado ya cambió a 'carta_recogida',
  // esta pantalla vive bajo 'solicitud_carta_termino' y no tiene sentido
  // seguir montada esperando un refetch).
  const confirmarEntrega = async () => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await confirmarRecogidaCarta();
      navigate(ESTADO_LSS_A_RUTA.carta_recogida);
    } catch (err) {
      setError(err.message || "No se pudo confirmar la recogida de tu carta de término.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  return {
    cargando,
    estado,
    error,
    accionEnCurso,
    confirmarEntrega,
  };
}
