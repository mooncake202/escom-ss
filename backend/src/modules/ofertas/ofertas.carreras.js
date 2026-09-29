// El catálogo real de la tabla `carrera` en esta rama guarda "IA" (mismo
// criterio ya confirmado en GR/AH/LSS), pero el frontend de PRO
// (CarreraSelector.jsx, FormCorreccion.jsx) manda "IIA" — mismo alias legado
// que ya existe en reportes.shared.js, aquí en dirección inversa porque este
// módulo necesita ir de "lo que manda el form" a "lo que existe en catálogo",
// no al revés. Se duplica en vez de importar de reportes.shared.js para no
// crear una dependencia cruzada entre módulos por un mapeo de 3 líneas.
const ALIAS_CARRERA_A_CATALOGO = Object.freeze({ IIA: 'IA' });

function normalizarNombreCarrera(nombre) {
  return ALIAS_CARRERA_A_CATALOGO[nombre] ?? nombre;
}

module.exports = { normalizarNombreCarrera };
