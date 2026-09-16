import { useCallback, useEffect, useState } from "react";
import { getEstadoRequisitos, iniciarEvaluacion } from "@/services/lssAlumnoService";

export function useValidacionRequisitos() {
  const [cargando, setCargando] = useState(true);
  const [yaExiste, setYaExiste] = useState(false);
  const [estadoExistente, setEstadoExistente] = useState(null);
  const [requisitos, setRequisitos] = useState(null);
  const [cumpleTodos, setCumpleTodos] = useState(false);

  const [confirmado, setConfirmado] = useState(false);
  const [solicitarValidacion, setSolicitarValidacion] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await getEstadoRequisitos();
      if (data.yaExiste) {
        setYaExiste(true);
        setEstadoExistente(data.estado);
      } else {
        setYaExiste(false);
        setRequisitos(data.requisitos);
        setCumpleTodos(!!data.cumpleTodos);
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar el estado de tus requisitos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggleConfirmado = () => {
    if (!cumpleTodos) return; // RN-LSS-02: bloqueado hasta cumplir requisitos duros
    setConfirmado((prev) => {
      const nuevo = !prev;
      if (nuevo) setSolicitarValidacion(false);
      return nuevo;
    });
    setError(null);
  };

  const toggleSolicitud = () => {
    if (!cumpleTodos) return;
    setSolicitarValidacion((prev) => {
      const nuevo = !prev;
      if (nuevo) setConfirmado(false);
      return nuevo;
    });
    setError(null);
  };

  const confirmar = async () => {
    if (!cumpleTodos) return;
    // RN-LSS-03: uno de los dos checks es obligatorio (mutuamente excluyentes).
    if (!confirmado && !solicitarValidacion) {
      setError("Debes confirmar o solicitar validación");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await iniciarEvaluacion(confirmado);
      setEnviado(true);
    } catch (err) {
      setError(err.message || "No se pudo enviar tu solicitud de evaluación.");
    } finally {
      setLoading(false);
    }
  };

  return {
    cargando, yaExiste, estadoExistente, requisitos, cumpleTodos,
    confirmado,
    solicitarValidacion,
    error,
    loading,
    enviado,
    toggleConfirmado,
    toggleSolicitud,
    confirmar,
    completo: confirmado || solicitarValidacion,
  };
}
