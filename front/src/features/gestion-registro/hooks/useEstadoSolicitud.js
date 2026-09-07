import { useEffect, useState, useCallback, useRef } from "react";
import { getEstadoSolicitud } from "@/services/estadoSolicitudService";

// Confirmado: 120 segundos de intervalo para el refresco automático.
const INTERVALO_MS = 120000;

/**
 * Hook compartido por todas las pantallas de espera de GR. Consulta el
 * estado actual de la solicitud al montar, cada 120s mientras el componente
 * siga montado, Y expone `refrescar()` para forzar una consulta inmediata
 * justo después de una acción del alumno (cambiar oferta, continuar, etc.)
 * sin tener que esperar al siguiente ciclo automático.
 */
export function useEstadoSolicitud() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const activoRef = useRef(true);

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
    const intervalo = setInterval(consultar, INTERVALO_MS);
    return () => {
      activoRef.current = false;
      clearInterval(intervalo);
    };
  }, [consultar]);

  return { estado, cargando, error, refrescar: consultar };
}
