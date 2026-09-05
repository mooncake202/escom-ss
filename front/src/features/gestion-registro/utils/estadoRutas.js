// Único lugar donde viven estos 2 mapas — tanto LoginPage.jsx (para decidir
// a dónde navegar justo después de iniciar sesión) como RutaProtegida.jsx
// (para impedir que un alumno_sin_asignar entre a cualquier URL que no sea
// la que le corresponde) los importan de aquí. Si solo vivieran duplicados
// en los 2 archivos, function correría el riesgo real de desincronizarse
// con el tiempo según se vayan agregando estados nuevos.

// Mapa de estado_solicitud -> ruta. NO incluye rechazada_definitivamente a
// propósito: ese caso se resuelve aparte con ESTADO_ANTERIOR_A_RUTA, porque
// esa pantalla se muestra DENTRO de la pantalla de origen, no en una aparte.
export const ESTADO_A_RUTA = {
  espera_respuesta_de_profesor: "/alumnoSinAsignar/esperando_profesor",
  aceptada_por_profesor: "/alumnoSinAsignar/esperando_profesor",
  rechazada_por_profesor: "/alumnoSinAsignar/esperando_profesor",
  rechazada_por_cupos: "/alumnoSinAsignar/esperando_profesor",
  registro_SISS: "/alumnoSinAsignar/siss",
  adjuntar_documentacion_inicial: "/alumnoSinAsignar/documentacion",
  SISS_y_documentacion_pendiente: "/alumnoSinAsignar/esperando_validacion_docs",
  SISS_docs_aprobados: "/alumnoSinAsignar/esperando_validacion_docs",
  corregir_docsini: "/alumnoSinAsignar/esperando_validacion_docs",
  corregir_SISS: "/alumnoSinAsignar/esperando_validacion_docs",
  descargar_carta_compromiso: "/alumnoSinAsignar/carta-compromiso",
  espera_confirmacion_carta_compromiso: "/alumnoSinAsignar/esperando-validacion",
  carta_compromiso_confirmada: "/alumnoSinAsignar/esperando-validacion",
  adjuntar_expediente: "/alumnoSinAsignar/expediente",
  expediente_pendiente_revision: "/alumnoSinAsignar/estado-expediente",
  expediente_con_correcciones: "/alumnoSinAsignar/estado-expediente",
  expediente_aprobado: "/alumnoSinAsignar/estado-expediente",
  modificar_reenviar: "/alumnoSinAsignar/modificar-solicitud",
};

// Cuando estado_solicitud === "rechazada_definitivamente", se usa
// estado_anterior contra este mapa para saber a qué pantalla de ORIGEN
// pertenece (esa pantalla es la que sabe mostrar el rechazo inline).
export const ESTADO_ANTERIOR_A_RUTA = {
  espera_respuesta_de_profesor: "/alumnoSinAsignar/esperando_profesor",
  aceptada_por_profesor: "/alumnoSinAsignar/esperando_profesor",
  rechazada_por_profesor: "/alumnoSinAsignar/esperando_profesor",
  rechazada_por_cupos: "/alumnoSinAsignar/esperando_profesor",
  registro_SISS: "/alumnoSinAsignar/siss",
  adjuntar_documentacion_inicial: "/alumnoSinAsignar/documentacion",
  SISS_y_documentacion_pendiente: "/alumnoSinAsignar/esperando_validacion_docs",
  SISS_docs_aprobados: "/alumnoSinAsignar/esperando_validacion_docs",
  corregir_docsini: "/alumnoSinAsignar/esperando_validacion_docs",
  corregir_SISS: "/alumnoSinAsignar/esperando_validacion_docs",
  descargar_carta_compromiso: "/alumnoSinAsignar/carta-compromiso",
  espera_confirmacion_carta_compromiso: "/alumnoSinAsignar/esperando-validacion",
  carta_compromiso_confirmada: "/alumnoSinAsignar/esperando-validacion",
  adjuntar_expediente: "/alumnoSinAsignar/expediente",
  expediente_pendiente_revision: "/alumnoSinAsignar/estado-expediente",
  expediente_con_correcciones: "/alumnoSinAsignar/estado-expediente",
};

export const RUTA_FALLBACK = "/alumnoSinAsignar/esperando_profesor";

/**
 * Dado el usuario guardado en localStorage, regresa la ÚNICA ruta en la que
 * un alumno_sin_asignar puede estar en este momento.
 */
export function rutaCorrectaParaAlumnoSinAsignar({ estado_solicitud, estado_anterior }) {
  if (estado_solicitud === "rechazada_definitivamente") {
    return ESTADO_ANTERIOR_A_RUTA[estado_anterior] || RUTA_FALLBACK;
  }
  return ESTADO_A_RUTA[estado_solicitud] || RUTA_FALLBACK;
}
