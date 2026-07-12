import { useState } from "react";

// Estados: en_revision → aprobado | rechazado
// Si rechazado → alumno puede corregir → regresa a CU-04

export function useRevisionResolucion() {
  const [estado, setEstado] = useState("en_revision");
  const [observaciones, setObservaciones] = useState("");
  const [observacionesGuardadas, setObservacionesGuardadas] = useState("");
  const [loading, setLoading] = useState(false);

  const aprobar = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setEstado("aprobado");
    setLoading(false);
  };

  const rechazar = async () => {
    if (!observaciones.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setObservacionesGuardadas(observaciones);
    setEstado("rechazado");
    setLoading(false);
  };

  return {
    estado,
    observaciones,
    observacionesGuardadas,
    loading,
    setObservaciones,
    aprobar,
    rechazar,
  };
}
