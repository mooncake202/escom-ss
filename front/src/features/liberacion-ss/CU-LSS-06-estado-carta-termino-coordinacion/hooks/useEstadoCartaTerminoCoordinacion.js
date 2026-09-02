import { useState } from "react";

// ——— ESTADOS POSIBLES POR ALUMNO ————————————————————
// "solicitada"         → Alumno solicitó carta, coordinación aún no la elabora
// "lista_para_recoger" → Coordinación marcó la carta como lista
// "recibida"           → Alumno confirmó que ya la recogió
// ————————————————————————————————————————————————————

const MOCK_ALUMNOS = [
  { id: 1, nombre: "García López Juan Carlos",  estado: "solicitada", proyecto: "Desarrollo de app móvil", fechaSolicitud: "2024-05-20", profesor: "Dr. Smith", fechaEnvio:null, fechaRecibido: null },
  { id: 2, nombre: "Martínez Ramos Ana Sofía",  estado: "lista_para_recoger", proyecto: "Investigación en IA", fechaSolicitud: "2024-05-21", profesor: "Dr. Johnson", fechaEnvio:"2024-06-01", fechaRecibido: null },
  { id: 3, nombre: "Hernández Torres Luis",     estado: "recibida", proyecto: "Desarrollo de software", fechaSolicitud: "2024-05-22", profesor: "Dr. Williams", fechaEnvio: "2024-06-01", fechaRecibido: "2024-06-02" },
];

export function useEstadoCartaTerminoCoordinacion() {
  const [alumnos, setAlumnos] = useState(MOCK_ALUMNOS);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  // Estado del alumno actualmente seleccionado
  const estadoAlumno = alumnos.find(a => a.id === alumnoSeleccionado?.id)?.estado ?? null;

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
  };

  // 🔧 Cambia el estado de un alumno específico (para pruebas manuales o acción real)
  const setEstadoAlumno = (id, nuevoEstado) => {
    setAlumnos(prev =>
      prev.map(a => a.id === id ? { ...a, estado: nuevoEstado } : a)
    );
  };

  const marcarCartaLista = () => {
    if (!alumnoSeleccionado) return;
    setEstadoAlumno(alumnoSeleccionado.id, "lista_para_recoger");
  };

  return {
    alumnos,
    alumnoSeleccionado,
    seleccionarAlumno,
    estadoAlumno,
    marcarCartaLista,
    setEstadoAlumno, // 🔧 para modificar el estado manualmente desde fuera
  };
}
