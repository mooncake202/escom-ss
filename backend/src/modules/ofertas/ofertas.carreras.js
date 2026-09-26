// Normaliza el código de carrera que llega del cliente al que existe en la tabla `carrera`.
//
// El catálogo real guarda "IIA". El alias existe por si el cliente manda el código LEGADO "IA":
// hubo una época en que ese era el valor del catálogo, y partes del frontend lo arrastran todavía
// (p. ej. el formulario de inscripción de GR, utils/constants.js). El selector de Ofertas ya pide
// las opciones a GET /ofertas/perfiles, así que hoy manda "IIA"; esto es defensa para cualquier
// otro cliente. SE RETIRA cuando ya no haga falta — mismo criterio que CARRERAS_ALIAS_LEGADO en
// backend/src/modules/reportes/reportes.shared.js.
//
// Se duplica en vez de importar de reportes.shared.js para no crear una dependencia cruzada entre
// módulos por un mapeo de una línea.
const ALIAS_CARRERA_LEGADO = Object.freeze({ IA: 'IIA' });

function normalizarNombreCarrera(nombre) {
  // `hasOwn` y no `??`: con acceso directo, un nombre como '__proto__' o 'constructor' devolvería
  // un miembro heredado de Object.prototype en vez de undefined, y acabaría en el `where` de la
  // consulta. Mismo riesgo que ya cubre reportes.shared.test.js para su propio alias.
  return Object.hasOwn(ALIAS_CARRERA_LEGADO, nombre) ? ALIAS_CARRERA_LEGADO[nombre] : nombre;
}

module.exports = { normalizarNombreCarrera };
