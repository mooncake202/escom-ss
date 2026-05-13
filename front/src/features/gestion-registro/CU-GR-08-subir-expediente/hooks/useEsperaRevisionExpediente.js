import { useState, useEffect, useCallback } from "react";

/**
 * Hook para la vista de espera de revisión del expediente (CU-GR-10).
 *
 * Consulta periódicamente si Coordinación ya revisó el expediente.
 * Expone:
 *   - estado: "Expediente enviado" | "Expediente aprobado" | "Expediente con correcciones"
 *   - observacion: string con las observaciones de Coordinación (solo cuando hay correcciones)
 */

const POLLING_INTERVAL_MS = 15000;

export function useEsperaRevisionExpediente() {
  const [estado,      setEstado]      = useState("Expediente con correcciones");
  const [observacion, setObservacion] = useState(null);
  const [error,       setError]       = useState(null);

  const verificarEstado = useCallback(async () => {
    try {
      // TODO: reemplazar con el endpoint real
      // GET /api/solicitud/estado
      // Respuesta esperada:
      // { estado: "Expediente enviado" | "Expediente aprobado" | "Expediente con correcciones",
      //   observacion?: string }
      const response = await fetch("/api/solicitud/estado", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Error al consultar el estado del expediente.");

      const data = await response.json();

      if (
        data.estado === "Expediente aprobado" ||
        data.estado === "Expediente con correcciones"
      ) {
        setEstado(data.estado);
        setObservacion(data.observacion ?? null);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    verificarEstado();

    const intervalo = setInterval(() => {
      if (estado === "Expediente enviado") verificarEstado();
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalo);
  }, [estado, verificarEstado]);

  return { estado, observacion, error };
}
