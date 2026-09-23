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

// Duración máxima del servicio social contada desde la fecha de inicio del periodo oficial.
const ANIOS_MAXIMOS_SERVICIO = 2;

/**
 * Fecha límite del servicio social: `fechaInicio` + 2 años, como día calendario UTC (medianoche).
 *
 * El día que devuelve TODAVÍA es válido; se considera excedido a partir del día siguiente. Quien la use decide qué
 * hacer con ella: esta función no conoce bitácoras, reportes ni ninguna regla de negocio.
 *
 * 29 de febrero: sumar 2 años siempre cae en un año NO bisiesto, y `Date.UTC(anio, 1, 29)` se desbordaría al 1 de
 * marzo. Se ancla explícitamente al último día de febrero (28) en vez de dejar correr ese desborde.
 */
function calcularFechaLimiteServicio(fechaInicio) {
  // `new Date(null)` daría el epoch y `new Date(undefined)` una fecha inválida: se descartan antes de convertir.
  if (fechaInicio === null || fechaInicio === undefined || fechaInicio === '') {
    throw new TypeError(`Fecha de inicio no válida: ${String(fechaInicio)}`);
  }
  const inicio = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
  if (Number.isNaN(inicio.getTime())) throw new TypeError(`Fecha de inicio no válida: ${String(fechaInicio)}`);

  const anio = inicio.getUTCFullYear() + ANIOS_MAXIMOS_SERVICIO;
  const mes = inicio.getUTCMonth();
  const dia = inicio.getUTCDate();

  const limite = new Date(Date.UTC(anio, mes, dia));
  // Solo se desborda cuando el día no existe en el mes destino (29-feb → año no bisiesto): se usa su último día.
  if (limite.getUTCMonth() !== mes) return new Date(Date.UTC(anio, mes + 1, 0));
  return limite;
}

module.exports = { calcularDiaMexicoUTC, calcularFechaLimiteServicio, ANIOS_MAXIMOS_SERVICIO };
