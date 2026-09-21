// Reglas puras del calendario institucional (CU-ADM-08): sin BD ni reloj propio.
// Toda validación temporal usa la fecha/hora de México; `ahora` es inyectable para pruebas.
//
// Resultado de validar*: { ok: true, datos } | { ok: false, codigo, errores: { campo: mensaje } }.
// Regla común: sábado y domingo no pueden ser fecha ni extremo; un rango sí los contiene por dentro.

const { calcularDiaMexicoUTC } = require('../../../lib/fechas');
const {
  TIPOS_EVENTO,
  NOMBRE_LONGITUD_MAX,
  ZONA_HORARIA,
  HORAS_INHABIL_PERMITIDAS,
  CODIGOS_ERROR,
} = require('./calendario.shared');

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_ANIO = /^\d{4}$/;
const FORMATO_HORA = /^(\d{2}):(\d{2})$/;
const SEMESTRES = Object.freeze(['01', '02']);

const ausente = (valor) => valor === undefined || valor === null;

function fechaISOValida(valor) {
  if (typeof valor !== 'string' || !FORMATO_FECHA.test(valor)) return false;
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function esFinDeSemana(fechaISO) {
  const dia = new Date(`${fechaISO}T00:00:00Z`).getUTCDay();
  return dia === 0 || dia === 6;
}

/** Día calendario y segundos transcurridos del día, ambos en hora de México. */
function obtenerContextoMexico(ahora = new Date()) {
  if (!(ahora instanceof Date) || Number.isNaN(ahora.getTime())) throw new TypeError('`ahora` debe ser una fecha válida.');

  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(ahora);
  const numero = (tipo) => Number(partes.find((p) => p.type === tipo).value);

  return {
    hoy: calcularDiaMexicoUTC(ahora).toISOString().slice(0, 10),
    segundosDelDia: numero('hour') * 3600 + numero('minute') * 60 + numero('second'),
  };
}

function segundosDeHora(hora) {
  const partes = FORMATO_HORA.exec(hora);
  if (!partes) throw new TypeError(`Hora inválida: ${String(hora)}. Debe ser HH:mm.`);
  return Number(partes[1]) * 3600 + Number(partes[2]) * 60;
}

// ── Validadores de campo (escriben en `errores` solo el primer problema de cada campo) ──

function validarNombre(entrada, errores) {
  const nombre = typeof entrada.nombre === 'string' ? entrada.nombre.trim() : '';
  if (nombre.length === 0) {
    errores.nombre = 'El nombre del evento es obligatorio.';
    return null;
  }
  if (nombre.length > NOMBRE_LONGITUD_MAX) {
    errores.nombre = `El nombre no puede exceder ${NOMBRE_LONGITUD_MAX} caracteres.`;
    return null;
  }
  return nombre;
}

function leerFecha(entrada, campo, etiqueta, errores) {
  const valor = entrada[campo];
  if (ausente(valor) || valor === '') {
    errores[campo] = `${etiqueta} es obligatoria.`;
    return null;
  }
  if (!fechaISOValida(valor)) {
    errores[campo] = `${etiqueta} no es una fecha válida (AAAA-MM-DD).`;
    return null;
  }
  if (esFinDeSemana(valor)) {
    errores[campo] = `${etiqueta} no puede ser sábado ni domingo.`;
    return null;
  }
  return valor;
}

function exigirNoPasada(valor, campo, etiqueta, hoy, errores) {
  if (valor !== null && valor < hoy) errores[campo] = `${etiqueta} no puede ser una fecha pasada.`;
}

// Vacacional y Periodo son planeación previa: la fecha debe ser posterior a hoy.
function exigirFutura(valor, campo, etiqueta, hoy, errores) {
  if (valor !== null && valor <= hoy) errores[campo] = `${etiqueta} debe ser posterior a hoy.`;
}

function exigirSinHora(entrada, errores) {
  if (!ausente(entrada.hora)) errores.hora = 'Este tipo de evento no admite hora.';
}

function exigirConfirmacion(entrada, errores) {
  if (entrada.confirmacionPublicacion !== true) {
    errores.confirmacionPublicacion = 'Debes confirmar la publicación: una vez publicado no podrá editarse ni eliminarse.';
  }
}

function normalizarAnio(valor) {
  const texto = typeof valor === 'number' && Number.isInteger(valor) ? String(valor) : valor;
  return typeof texto === 'string' && FORMATO_ANIO.test(texto) ? texto : null;
}

function resultado(errores, datos) {
  const campos = Object.keys(errores);
  if (campos.length === 0) return { ok: true, datos };
  const soloConfirmacion = campos.length === 1 && campos[0] === 'confirmacionPublicacion';
  return {
    ok: false,
    codigo: soloConfirmacion ? CODIGOS_ERROR.CONFIRMACION_REQUERIDA : CODIGOS_ERROR.VALIDACION,
    errores,
  };
}

// ── Inhabil ──

function validarCamposInhabil(entrada, ahora, errores) {
  const { hoy, segundosDelDia } = obtenerContextoMexico(ahora);
  const nombre = validarNombre(entrada, errores);
  const fechaInicio = leerFecha(entrada, 'fechaInicio', 'La fecha', errores);
  exigirNoPasada(fechaInicio, 'fechaInicio', 'La fecha', hoy, errores);

  if (!ausente(entrada.fechaFin)) errores.fechaFin = 'El día inhábil no admite fecha de fin.';

  // La clave `hora` debe venir explícita (null = todo el día) para no declarar todo el día por omisión.
  const hora = entrada.hora;
  if (hora === undefined) {
    errores.hora = 'Indica la hora, o null si es todo el día.';
  } else if (hora !== null && !HORAS_INHABIL_PERMITIDAS.includes(hora)) {
    errores.hora = 'La hora debe ser una hora exacta entre 07:00 y 18:00.';
  } else if (fechaInicio === hoy && !errores.fechaInicio) {
    if (hora === null) {
      errores.hora = 'No se puede declarar todo el día inhábil cuando el día ya comenzó.';
    } else if (segundosDeHora(hora) <= segundosDelDia) {
      errores.hora = 'La hora debe ser posterior a la hora actual de México.';
    }
  }

  return { tipo: TIPOS_EVENTO.INHABIL, nombre, fechaInicio, fechaFin: null, hora: hora ?? null };
}

function validarActualizarInhabil(entrada, ahora = new Date()) {
  const datosEntrada = entrada ?? {};
  const errores = {};
  if (!ausente(datosEntrada.tipo) && datosEntrada.tipo !== TIPOS_EVENTO.INHABIL) {
    errores.tipo = 'No se puede cambiar el tipo de un evento.';
  }
  const datos = validarCamposInhabil(datosEntrada, ahora, errores);
  return resultado(errores, datos);
}

// ── Vacacional ──

function validarCamposRango(entrada, hoy, errores) {
  const nombre = validarNombre(entrada, errores);
  const fechaInicio = leerFecha(entrada, 'fechaInicio', 'La fecha de inicio', errores);
  exigirFutura(fechaInicio, 'fechaInicio', 'La fecha de inicio', hoy, errores);

  const fechaFin = leerFecha(entrada, 'fechaFin', 'La fecha de fin', errores);
  exigirFutura(fechaFin, 'fechaFin', 'La fecha de fin', hoy, errores);
  if (fechaFin !== null && !errores.fechaFin && fechaISOValida(entrada.fechaInicio) && fechaFin <= entrada.fechaInicio) {
    errores.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio.';
  }

  exigirSinHora(entrada, errores);
  return { nombre, fechaInicio, fechaFin };
}

function validarVacacional(entrada, hoy, errores) {
  const { nombre, fechaInicio, fechaFin } = validarCamposRango(entrada, hoy, errores);
  exigirConfirmacion(entrada, errores);
  return { tipo: TIPOS_EVENTO.VACACIONAL, nombre, fechaInicio, fechaFin, hora: null };
}

// ── Periodo ──

function validarPeriodo(entrada, hoy, errores) {
  const { nombre, fechaInicio, fechaFin } = validarCamposRango(entrada, hoy, errores);

  const anio = normalizarAnio(entrada.anio);
  if (anio === null) errores.anio = 'El año debe tener exactamente 4 dígitos.';

  const semestre = entrada.semestre;
  if (!SEMESTRES.includes(semestre)) errores.semestre = 'El semestre debe ser "01" o "02".';

  // Solo fechaInicio debe caer en el ciclo; fechaFin y fechaMaxExpediente pueden quedar fuera.
  const cicloValido = anio !== null && SEMESTRES.includes(semestre);
  if (fechaInicio !== null && !errores.fechaInicio && cicloValido && !fechaEnCicloSemestre(fechaInicio, anio, semestre)) {
    errores.fechaInicio = mensajeFueraDeCiclo(anio, semestre);
  }

  const fechaMaxExpediente = leerFecha(entrada, 'fechaMaxExpediente', 'La fecha máxima de expediente', errores);
  exigirFutura(fechaMaxExpediente, 'fechaMaxExpediente', 'La fecha máxima de expediente', hoy, errores);
  if (fechaMaxExpediente !== null && !errores.fechaMaxExpediente && fechaISOValida(entrada.fechaInicio)
    && fechaMaxExpediente >= entrada.fechaInicio) {
    errores.fechaMaxExpediente = 'La fecha máxima de expediente debe ser anterior a la fecha de inicio.';
  }

  exigirConfirmacion(entrada, errores);
  return {
    tipo: TIPOS_EVENTO.PERIODO,
    nombre,
    fechaInicio,
    fechaFin,
    hora: null,
    periodo: { anio, semestre: SEMESTRES.includes(semestre) ? semestre : null, fechaMaxExpediente },
  };
}

/** Valida el alta de cualquier tipo de evento. */
function validarCrearEvento(entrada, ahora = new Date()) {
  const datosEntrada = entrada ?? {};
  const errores = {};

  if (!Object.values(TIPOS_EVENTO).includes(datosEntrada.tipo)) {
    errores.tipo = 'El tipo de evento es obligatorio (Inhabil, Vacacional o Periodo).';
    return resultado(errores, null);
  }

  let datos;
  if (datosEntrada.tipo === TIPOS_EVENTO.INHABIL) {
    datos = validarCamposInhabil(datosEntrada, ahora, errores);
  } else {
    const { hoy } = obtenerContextoMexico(ahora);
    datos = datosEntrada.tipo === TIPOS_EVENTO.VACACIONAL
      ? validarVacacional(datosEntrada, hoy, errores)
      : validarPeriodo(datosEntrada, hoy, errores);
  }
  return resultado(errores, datos);
}

/**
 * ¿Se puede editar/eliminar? Periodo y Vacacional nunca (publicados). Un Inhabil solo mientras no
 * haya entrado en vigor: fecha futura, u hoy con hora posterior a la actual. `hora`: "HH:mm" o null.
 */
function evaluarModificabilidad(evento, ahora = new Date()) {
  const { tipo, fechaInicio, hora } = evento;
  const si = { editable: true, eliminable: true, motivo: null };
  const no = (motivo) => ({ editable: false, eliminable: false, motivo });

  if (tipo === TIPOS_EVENTO.PERIODO || tipo === TIPOS_EVENTO.VACACIONAL) return no(CODIGOS_ERROR.EVENTO_INMUTABLE);
  if (tipo !== TIPOS_EVENTO.INHABIL) throw new TypeError(`Tipo de evento desconocido: ${String(tipo)}`);
  if (!fechaISOValida(fechaInicio)) throw new TypeError(`Fecha inválida: ${String(fechaInicio)}`);

  const { hoy, segundosDelDia } = obtenerContextoMexico(ahora);
  if (fechaInicio > hoy) return si;
  if (fechaInicio < hoy || ausente(hora)) return no(CODIGOS_ERROR.EVENTO_YA_EN_VIGOR);
  return segundosDeHora(hora) > segundosDelDia ? si : no(CODIGOS_ERROR.EVENTO_YA_EN_VIGOR);
}

/**
 * Meses (conceptuales) de un ciclo/semestre: AAAA-01 = agosto AAAA-1 → enero AAAA;
 * AAAA-02 = enero AAAA → julio AAAA. NO son fechas oficiales: los días exactos los define el calendario,
 * y para filtrar por un Periodo concreto se usan su fecha_inicio/fecha_fin registradas en BD.
 */
function mesesCicloSemestre(anio, semestre) {
  const anioTexto = normalizarAnio(anio);
  if (anioTexto === null) throw new TypeError(`Año inválido: ${String(anio)}. Debe tener 4 dígitos.`);
  if (!SEMESTRES.includes(semestre)) throw new TypeError(`Semestre inválido: ${String(semestre)}. Debe ser "01" o "02".`);

  const anioNumero = Number(anioTexto);
  if (semestre === '01') {
    return { desde: { anio: anioNumero - 1, mes: 8 }, hasta: { anio: anioNumero, mes: 1 } };
  }
  return { desde: { anio: anioNumero, mes: 1 }, hasta: { anio: anioNumero, mes: 7 } };
}

const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** ¿La fecha ISO cae en algún mes del ciclo/semestre? Enero pertenece tanto al 01 como al 02. */
function fechaEnCicloSemestre(fechaISO, anio, semestre) {
  const { desde, hasta } = mesesCicloSemestre(anio, semestre);
  const [anioFecha, mesFecha] = fechaISO.split('-').map(Number);
  const mesesFecha = anioFecha * 12 + mesFecha;
  return mesesFecha >= desde.anio * 12 + desde.mes && mesesFecha <= hasta.anio * 12 + hasta.mes;
}

function mensajeFueraDeCiclo(anio, semestre) {
  const { desde, hasta } = mesesCicloSemestre(anio, semestre);
  const texto = ({ anio: a, mes }) => `${NOMBRES_MES[mes - 1]} ${a}`;
  return `La fecha de inicio no corresponde al ciclo ${normalizarAnio(anio)}/${semestre} (${texto(desde)} a ${texto(hasta)}).`;
}

module.exports = {
  fechaISOValida,
  esFinDeSemana,
  obtenerContextoMexico,
  validarCrearEvento,
  validarActualizarInhabil,
  evaluarModificabilidad,
  mesesCicloSemestre,
  fechaEnCicloSemestre,
};
