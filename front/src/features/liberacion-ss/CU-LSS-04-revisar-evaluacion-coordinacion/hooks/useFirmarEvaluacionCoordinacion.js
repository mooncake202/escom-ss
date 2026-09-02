import { useState } from "react";

export function useFirmarEvaluacionCoordinacion() {
  const [alumnos] = useState([
    { id: 1, nombre: "Juan Pérez", firmadoProfesor: false, proyecto: "Desarrollo de app móvil", fechaEnvío: "2024-05-20", profesor: "Dr. Smith" },
    { id: 2, nombre: "Ana López", firmadoProfesor: true, proyecto: "Investigación en IA", fechaEnvío: "2024-05-21", profesor: "Dr. Johnson" },
  ]);

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const [estado, setEstado] = useState({
    evaluacion: "",
    firmadoProfesor: false,
    firmadoCoordinacion: true,
  });

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);

    setEstado({
      evaluacion: "",
      firmadoProfesor: alumno.firmadoProfesor,
      firmadoCoordinacion: false,
    });
  };

  const firmar = () => {
    if (!estado.firmadoProfesor) return;

    setEstado(prev => ({
      ...prev,
      firmadoCoordinacion: true
    }));
  };

  return {
    alumnos,
    alumnoSeleccionado,
    seleccionarAlumno,
    estado,
    firmar,
  };
}