import { useState } from "react";

export function useEvaluacion() {
  const [estado, setEstado] = useState({
    evaluacion: "",
    firmadoProfesor: true,
    firmadoCoordinacion: true,
    requiereValidacion: true 
  });

  const guardar = (data) => {
    setEstado(prev => ({
      ...prev,
      evaluacion: data
    }));
  };

  const firmarProfesor = () => {
    setEstado(prev => ({
      ...prev,
      firmadoProfesor: true
    }));
  };

  const firmarCoordinacion = () => {
    if (!estado.firmadoProfesor) return;

    setEstado(prev => ({
      ...prev,
      firmadoCoordinacion: true
    }));
  };

  return {
    estado,
    guardar,
    firmarProfesor,
    firmarCoordinacion
  };
}