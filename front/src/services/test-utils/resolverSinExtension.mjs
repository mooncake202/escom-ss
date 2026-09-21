// Solo para las pruebas con node:test: los servicios importan "./apiClient" sin extensión (Vite la resuelve) y Node no.
export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND" && especificador.startsWith(".")) return siguiente(`${especificador}.js`, contexto);
    throw err;
  }
}
