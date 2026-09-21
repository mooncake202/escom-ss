// Cálculo de periodos de reporte mensual (CU-REP-01). Módulo puro: sin BD ni reloj.
// Fechas como 'YYYY-MM-DD' o el Date UTC de un @db.Date. Toda la regla se ajusta en CONFIG_PERIODOS.
//
// "Día laboral" para los extremos = lunes a viernes, y nada más: los eventos Inhabil/Vacacional del calendario NO
// desplazan los límites. Ningún periodo inicia ni termina en sábado o domingo: un inicio nominal en fin de semana
// pasa al lunes siguiente y un fin nominal, al viernes anterior.
//
// mes_calendario (inicio dentro de los primeros diasLaboralesInicioMesCalendario días L-V del mes):
//   #1 = inicio real → último día L-V de ese mes; #k = primer día L-V → último día L-V del mes.
// mediados_de_mes (inicio posterior):
//   cortes nominales #1 = inicio real → día diaCorteMediados del mes siguiente; #k = día 16 → día 15 siguiente,
//   con sus extremos ajustados a L-V.
//
// El inicio REAL del servicio nunca se corrige: si cae en sábado o domingo es una inconsistencia
// (InicioServicioNoLaboralError) que debe resolver quien registró el Periodo.
//
// Solo periodos mensuales completos: si uno rebasa fecha_fin no se recorta, no se fusiona y no se
// generan periodos residuales; REP-01 lo bloquea.
// PENDIENTE: el tramo final del servicio se resuelve junto con CU-REP-07 y la regla de las 480 h.

const CONFIG_PERIODOS = Object.freeze({
  diasLaboralesInicioMesCalendario: 5,
  diaCorteMediados: 15,
});

class InicioServicioNoLaboralError extends TypeError {
  constructor(fecha) {
    super(`La fecha de inicio del servicio (${fecha}) cae en sábado o domingo.`);
    this.name = 'InicioServicioNoLaboralError';
    this.code = 'INICIO_SERVICIO_FIN_DE_SEMANA';
  }
}

const ESQUEMAS = Object.freeze({
  MES_CALENDARIO: 'mes_calendario',
  MEDIADOS_DE_MES: 'mediados_de_mes',
});

const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}$/;

const MESES_ES = Object.freeze([
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]);

function armarISO(anio, mes, dia) {
  // Date.UTC normaliza desbordes: mes 12 = enero siguiente, día 0 = último día del mes anterior.
  return new Date(Date.UTC(anio, mes, dia)).toISOString().slice(0, 10);
}

function descomponerISO(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return { anio, mes: mes - 1, dia };
}

/** Devuelve 'YYYY-MM-DD'; lanza TypeError si no es una fecha calendario real. */
function normalizarFechaISO(valor) {
  let iso;
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) throw new TypeError('Fecha inválida.');
    iso = valor.toISOString().slice(0, 10);
  } else if (typeof valor === 'string' && FORMATO_ISO.test(valor)) {
    iso = valor;
  } else {
    throw new TypeError(`Fecha no válida: ${String(valor)}`);
  }
  const { anio, mes, dia } = descomponerISO(iso);
  if (armarISO(anio, mes, dia) !== iso) throw new TypeError(`La fecha no existe en el calendario: ${iso}`);
  return iso;
}

/** "16 de mayo de 2025". */
function formatearFechaLarga(valor) {
  const { anio, mes, dia } = descomponerISO(normalizarFechaISO(valor));
  return `${dia} de ${MESES_ES[mes]} de ${anio}`;
}

/** "Agosto 2026" (mes con inicial mayúscula y año). */
function formatearMesAnio(valor) {
  const { anio, mes } = descomponerISO(normalizarFechaISO(valor));
  return `${MESES_ES[mes][0].toUpperCase()}${MESES_ES[mes].slice(1)} ${anio}`;
}

function sumarDiasISO(iso, dias) {
  const { anio, mes, dia } = descomponerISO(iso);
  return armarISO(anio, mes, dia + dias);
}

function listarFechasISO(inicio, fin) {
  const fechas = [];
  for (let fecha = inicio; fecha <= fin; fecha = sumarDiasISO(fecha, 1)) fechas.push(fecha);
  return fechas;
}

function esFinDeSemanaISO(iso) {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return dow === 0 || dow === 6;
}

function diaSemanaISO(iso) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

// Sábado → lunes siguiente; domingo → lunes siguiente; L-V no cambia.
function alSiguienteLunes(iso) {
  const dia = diaSemanaISO(iso);
  if (dia === 6) return sumarDiasISO(iso, 2);
  return dia === 0 ? sumarDiasISO(iso, 1) : iso;
}

// Sábado → viernes anterior; domingo → viernes anterior; L-V no cambia.
function alViernesAnterior(iso) {
  const dia = diaSemanaISO(iso);
  if (dia === 6) return sumarDiasISO(iso, -1);
  return dia === 0 ? sumarDiasISO(iso, -2) : iso;
}

const primerDiaLaboralDelMes = (anio, mes) => alSiguienteLunes(armarISO(anio, mes, 1));
const ultimoDiaLaboralDelMes = (anio, mes) => alViernesAnterior(armarISO(anio, mes + 1, 0));

/** Fecha del n-ésimo día lunes-viernes del mes (mes 0-11). */
function nDiaLaboralDelMes(anio, mes, n) {
  let contados = 0;
  for (let dia = 1; ; dia++) {
    const iso = armarISO(anio, mes, dia);
    if (!esFinDeSemanaISO(iso)) contados += 1;
    if (contados === n) return iso;
  }
}

// mes_calendario si el inicio está dentro de los primeros N días lunes-viernes del mes; si no, mediados_de_mes.
function determinarEsquema(fechaInicio, config = CONFIG_PERIODOS) {
  const inicio = normalizarFechaISO(fechaInicio);
  const { anio, mes } = descomponerISO(inicio);
  const limite = nDiaLaboralDelMes(anio, mes, config.diasLaboralesInicioMesCalendario);
  return inicio <= limite ? ESQUEMAS.MES_CALENDARIO : ESQUEMAS.MEDIADOS_DE_MES;
}

/**
 * Periodo mensual número `numero` (= número de reporte) del servicio, con extremos en lunes-viernes.
 * rebasaFinServicio: true si `fin` > fechaFin; null si no hay fechaFin.
 * Lanza InicioServicioNoLaboralError si el inicio real del servicio cae en sábado o domingo.
 */
function calcularPeriodoReporte({ fechaInicio, fechaFin = null, numero, config = CONFIG_PERIODOS }) {
  if (!Number.isInteger(numero) || numero < 1) {
    throw new TypeError('El número de reporte debe ser un entero mayor o igual a 1.');
  }

  const inicioServicio = normalizarFechaISO(fechaInicio);
  if (esFinDeSemanaISO(inicioServicio)) throw new InicioServicioNoLaboralError(inicioServicio);
  const finServicio = fechaFin == null ? null : normalizarFechaISO(fechaFin);
  const esquema = determinarEsquema(inicioServicio, config);
  const { anio, mes } = descomponerISO(inicioServicio);

  let inicio;
  let fin;
  if (esquema === ESQUEMAS.MES_CALENDARIO) {
    inicio = numero === 1 ? inicioServicio : primerDiaLaboralDelMes(anio, mes + numero - 1);
    fin = ultimoDiaLaboralDelMes(anio, mes + numero - 1);
  } else {
    inicio = numero === 1 ? inicioServicio : alSiguienteLunes(armarISO(anio, mes + numero - 1, config.diaCorteMediados + 1));
    fin = alViernesAnterior(armarISO(anio, mes + numero, config.diaCorteMediados));
  }

  return {
    numero,
    esquema,
    inicio,
    fin,
    esPrimero: numero === 1,
    rebasaFinServicio: finServicio === null ? null : fin > finServicio,
  };
}

/** Periodos que no rebasan fechaFin. Sin fechaFin no se sabe cuáles caben: []. */
function listarPeriodosCompletos({ fechaInicio, fechaFin, config = CONFIG_PERIODOS, maximo = 36 }) {
  if (fechaFin == null) return [];
  const periodos = [];
  for (let numero = 1; numero <= maximo; numero++) {
    const periodo = calcularPeriodoReporte({ fechaInicio, fechaFin, numero, config });
    if (periodo.rebasaFinServicio) break;
    periodos.push(periodo);
  }
  return periodos;
}

/** Cierra el día siguiente a su último día (`hoy` = día calendario México). */
function periodoCerrado(periodo, hoy) {
  return normalizarFechaISO(hoy) > periodo.fin;
}

function servicioIniciado(fechaInicio, hoy) {
  return normalizarFechaISO(hoy) >= normalizarFechaISO(fechaInicio);
}

module.exports = {
  CONFIG_PERIODOS,
  ESQUEMAS,
  InicioServicioNoLaboralError,
  normalizarFechaISO,
  formatearFechaLarga,
  formatearMesAnio,
  sumarDiasISO,
  listarFechasISO,
  esFinDeSemanaISO,
  nDiaLaboralDelMes,
  determinarEsquema,
  calcularPeriodoReporte,
  listarPeriodosCompletos,
  periodoCerrado,
  servicioIniciado,
};
