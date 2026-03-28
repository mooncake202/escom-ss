import { useState } from "react";

// Mock — RN-AH-47: horas totales, realizadas, deuda, restantes, rechazadas
const MOCK_PROGRESO = {
  horasTotales:    480,
  horasRealizadas: 124,
  horasDeuda:        8,
  horasRechazadas:  12,
  // restantes = totales - realizadas (sin contar deuda aún)
};

// Para profesor y coordinación: lista de alumnos con su progreso
const MOCK_ALUMNOS = [
  {
    id: 1,
    nombre:   "García López Juan Carlos",
    boleta:   "2021630412",
    carrera:  "ISC",
    horasTotales:    480,
    horasRealizadas: 124,
    horasDeuda:        8,
    horasRechazadas:  12,
  },
  {
    id: 2,
    nombre:   "Ramírez Torres Ana Sofía",
    boleta:   "2022630187",
    carrera:  "IA",
    horasTotales:    480,
    horasRealizadas: 210,
    horasDeuda:        0,
    horasRechazadas:   4,
  },
];

export function useAcumuladoHoras(rol = "alumno") {
  const [alumnos]           = useState(MOCK_ALUMNOS);
  const [progreso]          = useState(MOCK_PROGRESO);
  const [alumnoVisto, setAlumnoVisto] = useState(MOCK_ALUMNOS[0]);

  const calcular = (p) => ({
    ...p,
    horasRestantes: Math.max(p.horasTotales - p.horasRealizadas, 0),
    porcentaje:     Math.min(Math.round((p.horasRealizadas / p.horasTotales) * 100), 100),
  });

  return {
    // alumno ve su propio progreso
    propio: calcular(progreso),
    // profesor y coordinación ven lista
    alumnos: alumnos.map(calcular),
    alumnoVisto: calcular(alumnoVisto),
    setAlumnoVisto,
    rol,
  };
}
