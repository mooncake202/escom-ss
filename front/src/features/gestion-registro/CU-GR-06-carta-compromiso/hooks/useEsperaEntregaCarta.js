import { useState, useEffect, useCallback } from "react";

/**
 * Hook para la vista de espera de confirmación de entrega presencial
 * de la carta compromiso (CU-GR-09).
 *
 * Consulta periódicamente si Coordinación ya registró la recepción
 * del documento físico. Cuando lo confirma, expone entregaConfirmada = true
 * para que el componente cambie su vista y habilite el avance al expediente.
 */

const POLLING_INTERVAL_MS = 15000; // consulta cada 15 segundos

export function useEsperaEntregaCarta() {
  const [entregaConfirmada, setEntregaConfirmada] = useState(true);
  const [error, setError]                         = useState(null);

  const verificarEstado = useCallback(async () => {
    try {
      // TODO: reemplazar con el endpoint real
      // GET /api/solicitud/estado
      // Respuesta esperada: { estado: "Carta compromiso recibida" | ... }
      const response = await fetch("/api/solicitud/estado", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Error al consultar el estado de la solicitud.");

      const data = await response.json();

      if (data.estado === "Carta compromiso recibida") {
        setEntregaConfirmada(true);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    // Consulta inmediata al montar por si ya fue confirmada
    verificarEstado();

    // Polling periódico mientras no se confirme
    const intervalo = setInterval(() => {
      if (!entregaConfirmada) verificarEstado();
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalo);
  }, [entregaConfirmada, verificarEstado]);

  return { entregaConfirmada, error };
}
