
const MOCK_PROFESOR = {
  nombre:       "Dr. Torres Vega",
  correo:       "torres.vega@escom.ipn.mx",
  departamento: "Departamento de Ciencias de la Computación",
  contactos: [
    { tipo: "Teléfono personal",   valor: "55 1234 5678" },
    { tipo: "Horario de atención", valor: "Lunes y miércoles, 10:00–12:00 h" },
    { tipo: "Cubículo",            valor: "Edificio de Cómputo, planta baja, CB-03" },
  ],
};

// Descomenta para probar estado vacío "sin profesor asignado":
// const MOCK_PROFESOR = null;

// Descomenta para probar estado vacío "sin medios de contacto":
// const MOCK_PROFESOR = { nombre: "Dr. Torres Vega", correo: "torres.vega@escom.ipn.mx", contactos: [] };

const MOCK_ALUMNO = { nombre: "García López Ana", matricula: "2022630001", id: 1 };

// true  → alumno en proyecto (muestra sección de equipo)
// false → alumno individual (no muestra sección de equipo)
const MOCK_EN_PROYECTO = false;

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

export function useContactoProfesor() {
  return {
    profesor:       MOCK_PROFESOR,
    alumno:         MOCK_ALUMNO,
    enProyecto:     MOCK_EN_PROYECTO,
    proyecto:       MOCK_PROYECTO,
    integrantes:    MOCK_INTEGRANTES,
  };
}