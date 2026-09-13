/**
 * Utilidades de fecha compartidas por todo el backend (no específicas de
 * ningún módulo) — vive aquí y no en modules/ah/ para que módulos no
 * relacionados con AH (ej. periodos/) puedan reutilizarla sin acoplarse
 * artificialmente al módulo de Actividades y Horas.
 */

/**
 * Medianoche del día calendario MÉXICO actual, expresada en UTC —
 * Intl.DateTimeFormat con timeZone explícito, nunca getUTCFullYear/Month/Date
 * directo sobre `new Date()` (eso da el día calendario UTC crudo, que se
 * adelanta hasta 6 horas respecto al día real en México durante la noche).
 *
 * `ahora` es parametrizable (default `new Date()`) solo para poder probar
 * el cálculo en un instante fijo sin mockear el reloj global.
 */
function calcularDiaMexicoUTC(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(ahora);
  const obtener = (tipo) => Number(partes.find((p) => p.type === tipo).value);
  return new Date(Date.UTC(obtener('year'), obtener('month') - 1, obtener('day')));
}

module.exports = { calcularDiaMexicoUTC };
