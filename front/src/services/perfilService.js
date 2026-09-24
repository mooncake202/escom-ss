import { apiFetch } from "./apiClient";

// CU-ADM-10 (profesor) y CU-ADM-04 (alumno). El backend deriva al usuario del token: ningún
// endpoint recibe un id, así que no hay forma de leer ni editar el perfil de otra persona.
//
// Las respuestas vienen separadas en { institucionales, editables }: `institucionales` es lo que la
// pantalla muestra bloqueado y `editables` lo único que admite el PUT. El backend ignora cualquier
// otro campo que se envíe, aunque lleve el nombre correcto de la columna.

export function obtenerPerfilProfesor() {
  return apiFetch("/perfil/profesor");
}

export function actualizarPerfilProfesor({ horario_atencion, telefono_personal }) {
  return apiFetch("/perfil/profesor", {
    method: "PUT",
    body: JSON.stringify({ horario_atencion, telefono_personal }),
  });
}

export function obtenerPerfilAlumno() {
  return apiFetch("/perfil/alumno");
}

export function actualizarPerfilAlumno({ correo_personal, celular }) {
  return apiFetch("/perfil/alumno", {
    method: "PUT",
    body: JSON.stringify({ correo_personal, celular }),
  });
}
