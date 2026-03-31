// ID del alumno con sesión activa — en producción vendrá del contexto de sesión
const ALUMNO_SESION_ID = 1;

const MOCK_PROYECTO = {
  nombre: "Sistema de gestión de inventarios",
  descripcion: "Desarrollo de un sistema web para el control de inventarios del departamento de cómputo.",
};

const MOCK_INTEGRANTES = [
  {
    id: 1,
    nombre:         "García López Ana",
    boleta:         "2022630001",
    carrera:        "ISC",
    correoInst:     "agarcia0001@alumno.ipn.mx",
    correoPersonal: "ana.garcia@gmail.com",
    telefono:       "55 1234 5678",
  },
  {
    id: 2,
    nombre:         "Hernández Ruiz Carlos",
    boleta:         "2021630042",
    carrera:        "IA",
    correoInst:     "chernandez0042@alumno.ipn.mx",
    correoPersonal: "carlos.hdz@outlook.com",
    telefono:       "55 8765 4321",
  },
  {
    id: 3,
    nombre:         "Martínez Soto Diana",
    boleta:         "2022630078",
    carrera:        "LCD",
    correoInst:     "dmartinez0078@alumno.ipn.mx",
    correoPersonal: null,
    telefono:       "55 9999 0000",
  },
];

export function useContactoEquipo() {
  return {
    proyecto:     MOCK_PROYECTO,
    integrantes:  MOCK_INTEGRANTES,
    alumnoSesionId: ALUMNO_SESION_ID,
  };
}
