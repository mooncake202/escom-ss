import { apiFetch } from "./apiClient";

// El profesor solo puede enviar telefono_personal y horario_atencion —
// el backend rechaza cualquier otro campo institucional aunque se mande.
export function actualizarPerfilProfesor(payload) {
  return apiFetch("/perfil/profesor", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
