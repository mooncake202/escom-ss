// Lógica pura de CU-PRO-03, separada del hook para poder probarla sin renderizar React ni
// resolver el alias `@/` (misma convención que revisionReportes.js de CU-REP-05).

export function adaptarOferta(o) {
  return {
    id: o.id,
    nombre: o.titulo,
    tituloSISS: o.nombreSISS,
    programaSISS: o.programaSISS,
    profesor: o.profesor,
    modalidad: o.modalidad,
    estado: o.estado === "pendiente_revision" ? "pendiente"
          : o.estado === "aprobada" ? "aprobado"
          : o.estado === "rechazada" ? "rechazado"
          : o.estado,
    descripcion: o.descripcion,
    actividades: o.actividades ? [o.actividades] : [],
    cuposRegistrados: o.cuposRegistrados,
    cuposDisponibles: o.cuposDisponibles,
    cuposOcupadosProfesor: o.cuposOcupadosProfesor,
    cuposTotalesProfesor: o.cuposTotalesProfesor,
    perfilDeseado: o.perfilCarrera,
    motivoRechazo: o.motivoRechazo,
    fechaRegistro: o.fechaRegistro,
  };
}

/**
 * Re-resuelve el detalle abierto contra la lista recién cargada: devuelve la versión FRESCA de la
 * misma oferta si sigue estando, o null si desapareció (otro coordinador la decidió y cambió de
 * categoría, o dejó de entrar en la consulta por los filtros vigentes). Pura a propósito, para
 * poder probarla sin renderizar el hook.
 */
export function resolverSeleccion(lista, previo) {
  if (!previo) return null;
  return lista.find((p) => p.id === previo.id) ?? null;
}

/**
 * ÚNICO punto donde se recorta el término de búsqueda. De aquí sale tanto el valor que se envía al
 * backend como el que decide si hay filtros activos, así que un texto de solo espacios equivale a
 * no buscar en los dos sitios. Solo los extremos: el espacio interior es parte del término.
 */
export function terminoBuscado(texto) {
  return typeof texto === "string" ? texto.trim() : "";
}

/** Hay filtros activos si queda término tras recortar, o si la modalidad no es "todos". */
export function hayFiltrosActivos(terminoRecortado, filtroModalidad) {
  return Boolean(terminoRecortado) || filtroModalidad !== "todos";
}
