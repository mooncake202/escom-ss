import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEstadoExpediente, solicitarConstanciaTermino, corregirExpedienteLss } from "@/services/lssAlumnoService";
import { ESTADO_LSS_A_RUTA } from "@/features/liberacion-ss/utils/estadoRutasLSS";
import { useSocket, useSocketReconectado } from "@/context/SocketContext";

// Estados posibles (documento.estado_documento real): en_revision | aprobado | rechazado

export function useEstadoResolucionAlumno() {
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState(null);
  const [observacionesGuardadas, setObservacionesGuardadas] = useState("");
  const [error, setError] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    try {
      const data = await getEstadoExpediente();
      setEstado(data.estado);
      setObservacionesGuardadas(data.observacionesRechazo || "");
      setError(null);
    } catch (err) {
      setError(err.message || "No se pudo cargar el estado de tu expediente.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // RF-LSS-40: refresca en vivo cuando coordinación dictamine (CU-LSS-09,
  // no construido todavía — el seed de prueba simula este paso mientras
  // tanto), mismo patrón ya usado en todo el módulo.
  useEffect(() => {
    if (!socket) return;
    const handler = () => cargar();
    socket.on("resumen:actualizado", handler);
    return () => socket.off("resumen:actualizado", handler);
  }, [socket, cargar]);

  useSocketReconectado(cargar);

  // Alterno B — backend real (guardia: expediente debe estar 'aprobado')
  // + navigate explícito tras el éxito (mismo patrón ya aprendido en
  // LSS-02/07: nunca confiar solo en refetch cuando hay que cambiar de
  // pantalla).
  const solicitarConstancia = async () => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await solicitarConstanciaTermino();
      navigate(ESTADO_LSS_A_RUTA.solicitud_constancia_termino);
    } catch (err) {
      setError(err.message || "No se pudo solicitar la constancia de término.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  // Alterno C — "Corregir y reenviar": mismo mecanismo real que
  // corregirExpediente de GR (Paso 1, investigación de esta tarea) — SÍ
  // requiere una llamada real al backend antes de navegar (cambia la FASE
  // en liberacion_proceso.estado de vuelta a 'carta_recogida', sin tocar
  // el documento). Sin este paso, la guarda de ruta (RutaProtegida
  // guardaLSS) rebotaría de inmediato de vuelta a esta misma pantalla, ya
  // que seguiría viendo 'expediente_en_revision'.
  const corregirYReenviar = async () => {
    setAccionEnCurso(true);
    setError(null);
    try {
      await corregirExpedienteLss();
      navigate(ESTADO_LSS_A_RUTA.carta_recogida);
    } catch (err) {
      setError(err.message || "No se pudo continuar con la corrección de tu expediente.");
    } finally {
      setAccionEnCurso(false);
    }
  };

  return {
    cargando,
    estado,
    observacionesGuardadas,
    error,
    accionEnCurso,
    solicitarConstancia,
    corregirYReenviar,
  };
}
