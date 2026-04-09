import { useState } from "react";

export function useEvaluarAlumnoProfesor() {
  const [alumnos] = useState([
    { id: 1, nombre: "Juan Pérez Lopez Lopez", requiereValidacion: true, proyecto: "Desarrollo de app móvil", fechaEnvío: "2024-05-20" },
    { id: 2, nombre: "Ana López", requiereValidacion: false, proyecto: "Desarrollo de app web", fechaEnvío: "2024-05-20" },
  ]);

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const [estado, setEstado] = useState({
    evaluacion: "",
    firmadoProfesor: false,
    requiereValidacion: false,
    validadoSISS: false,
  });

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setEstado({
      evaluacion: "",
      firmadoProfesor: false,
      requiereValidacion: alumno.requiereValidacion,
      validadoSISS: false,
    });
  };

  const marcarValidadoSISS = () => {
    setEstado(prev => ({
      ...prev,
      validadoSISS: !prev.validadoSISS,
    }));
  };

  const guardar = (data) => {
    setEstado(prev => ({
      ...prev,
      evaluacion: data,
    }));
  };

  const firmar = () => {
    if (estado.requiereValidacion && !estado.validadoSISS) return;
    setEstado(prev => ({
      ...prev,
      firmadoProfesor: true,
    }));


  };

  return {
    alumnos,
    alumnoSeleccionado,
    
    seleccionarAlumno,
    estado,
    guardar,
    firmar,
    marcarValidadoSISS,
  };
}