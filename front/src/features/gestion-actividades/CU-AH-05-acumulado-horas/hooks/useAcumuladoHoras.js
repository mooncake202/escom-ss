import { useState } from "react";

const MOCK_PROGRESO = {
  horasTotales: 480, horasRealizadas: 124, horasRechazadas: 12,
  faltasSeguidas: 2, faltasTotal: 7,
};

const MOCK_ALUMNOS_1 = [
  { id: 1, nombre: "García López Juan Carlos", boleta: "2021630412", carrera: "ISC",
    horasTotales: 480, horasRealizadas: 124, horasRechazadas: 12, faltasSeguidas: 2, faltasTotal: 7 },
  { id: 2, nombre: "Ramírez Torres Ana Sofía", boleta: "2022630187", carrera: "IA",
    horasTotales: 480, horasRealizadas: 210, horasRechazadas: 4, faltasSeguidas: 0, faltasTotal: 3 },
];

const MOCK_ALUMNOS_2 = [
  { id: 3, nombre: "Pérez Gómez Luis Alberto", boleta: "2021630500", carrera: "LCD",
    horasTotales: 480, horasRealizadas: 380, horasRechazadas: 0, faltasSeguidas: 1, faltasTotal: 5 },
];

const MOCK_PROFESORES = [
  { id: 1, nombre: "Dr. Torres Vega", dept: "Sistemas Computacionales", alumnos: MOCK_ALUMNOS_1 },
  { id: 2, nombre: "Dra. Flores Ruiz", dept: "Inteligencia Artificial",  alumnos: MOCK_ALUMNOS_2 },
];

export function useAcumuladoHoras(rol = "alumno") {
  const [progreso] = useState(MOCK_PROGRESO);

  const calcular = (p) => ({
    ...p,
    horasRestantes: Math.max(p.horasTotales - p.horasRealizadas, 0),
    porcentaje: Math.min(Math.round((p.horasRealizadas / p.horasTotales) * 100), 100),
  });

  // Alumnos planos para la vista profesor
  const alumnos = MOCK_ALUMNOS_1.map(calcular);

  // Profesores con sus alumnos calculados para coordinación
  const profesores = MOCK_PROFESORES.map(p => ({
    ...p,
    alumnos: p.alumnos.map(calcular),
  }));

  return {
    propio: calcular(progreso),
    alumnos,
    profesores,
    rol,
  };
}