// Mock: null simula alumno sin profesor asignado
// Cambiar a MOCK_PROFESOR para el flujo principal
const MOCK_PROFESOR = {
  nombre: "Dr. Torres Vega",
  correo: "torres.vega@escom.ipn.mx",
  contactos: [
    { tipo: "Teléfono de oficina", valor: "55 5729-6000 ext. 52101" },
    { tipo: "Horario de atención", valor: "Lunes y miércoles, 10:00–12:00 h" },
    { tipo: "Cubículo",            valor: "Edificio de Cómputo, planta baja, CB-03" },
  ],
};

// Descomenta para probar estado vacío "sin profesor asignado":
// const MOCK_PROFESOR = null;

// Descomenta para probar estado vacío "sin medios de contacto":
// const MOCK_PROFESOR = { nombre: "Dr. Torres Vega", correo: "torres.vega@escom.ipn.mx", contactos: [] };

const MOCK_ALUMNO = { nombre: "García López Ana", matricula: "2022630001" };

export function useContactoProfesor() {
  return {
    profesor: MOCK_PROFESOR,
    alumno:   MOCK_ALUMNO,
  };
}
