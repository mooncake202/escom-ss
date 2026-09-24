import { apiFetch } from "./apiClient";

// CU-ADM-01 (profesor asignado) y CU-ADM-03 (equipo de proyecto).
// El backend deriva al alumno del token: ninguna de las dos funciones manda id, oferta ni boleta,
// así que no hay forma de consultar el profesor o el equipo de otra persona.

export function obtenerMiProfesor() {
  return apiFetch("/directorio/mi-profesor");
}

// Devuelve { oferta: { esProyecto }, yo, companeros }. En una oferta individual `companeros` viene
// vacío y `esProyecto` en false: la pantalla oculta la sección sin tener que deducirlo.
export function obtenerMiEquipo() {
  return apiFetch("/directorio/mi-equipo");
}
