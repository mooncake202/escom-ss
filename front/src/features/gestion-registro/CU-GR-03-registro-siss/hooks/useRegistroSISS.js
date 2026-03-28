import { useState } from "react";

export function useRegistroSISS() {
  const [confirmado, setConfirmado] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [completado, setCompletado] = useState(false);

  // Simula guardar que el alumno confirmó el registro en SISS (RN-GR-19)
  const confirmarRegistro = async () => {
    if (!confirmado) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setCompletado(true);
    setLoading(false);
  };

  return { confirmado, setConfirmado, loading, completado, confirmarRegistro };
}
