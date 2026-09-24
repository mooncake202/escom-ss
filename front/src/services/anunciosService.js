import { apiFetch } from "./apiClient";

// CU-ADM-02 (el alumno consulta) y CU-ADM-07 (profesor y coordinación publican).
//
// Ninguna llamada manda autor, origen ni destinatarios: el backend los deriva del token. El alcance
// tampoco se elige — se deriva de las asignaciones vigentes.

// Anuncios visibles para el alumno: los de Coordinación más los de SU profesor actual.
// `limite` lo usa el resumen del dashboard; la regla de visibilidad es exactamente la misma.
export function obtenerAnuncios(limite) {
  const query = Number.isInteger(limite) && limite > 0 ? `?limite=${limite}` : "";
  return apiFetch(`/anuncios${query}`);
}

// Acuse de lectura al abrir el detalle. El backend revalida que el anuncio sea visible y la
// operación es idempotente, así que repetirla no molesta.
export function marcarAnuncioVisto(id) {
  return apiFetch(`/anuncios/${encodeURIComponent(id)}/visto`, { method: "POST" });
}

// Historial propio de quien publica (profesor o coordinación).
export function obtenerMisAnuncios() {
  return apiFetch("/anuncios/mios");
}

// Publicar. Solo viajan título y contenido.
export function publicarAnuncio({ titulo, contenido }) {
  return apiFetch("/anuncios", { method: "POST", body: JSON.stringify({ titulo, contenido }) });
}
