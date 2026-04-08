import { useState } from "react";

export function useValidacionRequisitos() {
const [confirmado, setConfirmado] = useState(false);
const [solicitarValidacion, setSolicitarValidacion] = useState(false);
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);
const [enviado, setEnviado] = useState(false);

const toggleConfirmado = () => {
setConfirmado(prev => {
    const nuevo = !prev;

    // 🔴 si activas este → apaga el otro
    if (nuevo) setSolicitarValidacion(false);

    return nuevo;
  });

  setError(null);
};

const toggleSolicitud = () => {
  setSolicitarValidacion(prev => {
    const nuevo = !prev;

    // 🔴 si activas este → apaga el otro
    if (nuevo) setConfirmado(false);

    return nuevo;
  });

  setError(null);
};
  const confirmar = async () => {
    // 🔴 regla: al menos uno debe cumplirse
    if (!confirmado && !solicitarValidacion) {
      setError("Debes confirmar o solicitar validación");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setEnviado(true);
    setLoading(false);
  };

  return {
    confirmado,
    solicitarValidacion,
    error,
    loading,
    enviado,
    toggleConfirmado,
    toggleSolicitud,
    confirmar,
    completo: confirmado || solicitarValidacion
  };
}