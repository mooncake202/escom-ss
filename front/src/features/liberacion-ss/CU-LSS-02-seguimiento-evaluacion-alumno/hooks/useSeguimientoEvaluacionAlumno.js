import { useState } from "react";

export function useSeguimientoEvaluacionAlumno() {
  const [estado] = useState({
    firmadoProfesor: true,
    firmadoCoordinacion: true,
  });

  const [confirmadoSISS, setConfirmadoSISS] = useState(false);

  const puedeContinuar =
    estado.firmadoProfesor &&
    estado.firmadoCoordinacion &&
    confirmadoSISS;

  return {
    estado,
    confirmadoSISS,
    setConfirmadoSISS,
    puedeContinuar,
  };
}