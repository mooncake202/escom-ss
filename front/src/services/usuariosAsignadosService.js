import { apiFetch } from "./apiClient";

// CU-ADM-17 — consulta de usuarios asignados. Todo es de solo lectura.
//
// El profesor NO manda su id en ninguna llamada: el backend lo deriva del token. Solo coordinación
// navega por profesor, y para eso sí necesita pasar el id que eligió de la lista.

// Profesor: sus propios alumnos asignados.
export function obtenerMisAlumnos() {
  return apiFetch("/directorio/mis-alumnos");
}

// Coordinación: todos los profesores del sistema con su número de alumnos asignados.
export function obtenerProfesores() {
  return apiFetch("/directorio/profesores");
}

// Coordinación: alumnos asignados a un profesor concreto.
export function obtenerAlumnosDeProfesor(profesorId) {
  return apiFetch(`/directorio/profesores/${encodeURIComponent(profesorId)}/alumnos`);
}

// Detalle del alumno. Sirve a las dos navegaciones: el backend decide el alcance según el rol.
export function obtenerAlumnoAsignado(boleta) {
  return apiFetch(`/directorio/alumnos/${encodeURIComponent(boleta)}`);
}
