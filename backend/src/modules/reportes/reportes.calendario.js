// Clasificación día por día del calendario de un periodo (CU-REP-01). Módulo puro:
// información calculada, no se persiste.
//
// AH controla las bitácoras y ADM el calendario. Una bitácora aprobada en fin de semana o en un
// día Inhabil/Vacacional es una inconsistencia entre ambos: Reportes solo la informa, no la corrige.

const { listarFechasISO, esFinDeSemanaISO } = require('./reportes.periodos');
const { TIPO_EVENTO_INHABIL, TIPO_EVENTO_VACACIONAL } = require('./reportes.shared');

// Orden de prioridad para clasificar un día.
const TIPOS_DIA = Object.freeze({
  LABORADO: 'laborado',
  VACACIONAL: 'vacacional',
  INHABIL: 'inhabil',
  FIN_DE_SEMANA: 'fin_de_semana',
  LABORABLE_SIN_BITACORA: 'laborable_sin_bitacora',
});

const MOTIVOS_INCONSISTENCIA = Object.freeze({
  EVENTO_INHABIL: 'evento_inhabil',
  EVENTO_VACACIONAL: 'evento_vacacional',
  FIN_DE_SEMANA: 'fin_de_semana',
});

// Sin fechaFin, el evento cubre solo su fechaInicio (mismo criterio que AH).
function eventoCubreFecha(evento, fecha) {
  if (evento.fechaInicio > fecha) return false;
  if (evento.fechaFin) return evento.fechaFin >= fecha;
  return evento.fechaInicio === fecha;
}

// Con dos eventos el mismo día, el principal es el Vacacional; luego por id.
function porPrioridadDeEvento(a, b) {
  const pa = a.tipo === TIPO_EVENTO_VACACIONAL ? 0 : 1;
  const pb = b.tipo === TIPO_EVENTO_VACACIONAL ? 0 : 1;
  return pa - pb || a.id - b.id;
}

/**
 * eventos: { id, nombre, tipo, fechaInicio, fechaFin|null } Inhabil/Vacacional.
 * bitacoras: { id, fecha, horas } solo aprobadas.
 */
function construirCalendarioPeriodo({ inicio, fin, eventos = [], bitacoras = [] }) {
  const eventosOrdenados = [...eventos].sort(porPrioridadDeEvento);

  const bitacorasPorFecha = new Map();
  for (const b of bitacoras) {
    if (b.fecha < inicio || b.fecha > fin) continue;
    const previa = bitacorasPorFecha.get(b.fecha) ?? { ids: [], horas: 0 };
    previa.ids.push(b.id);
    previa.horas += b.horas ?? 0;
    bitacorasPorFecha.set(b.fecha, previa);
  }

  const inconsistencias = [];

  const dias = listarFechasISO(inicio, fin).map((fecha) => {
    const cubren = eventosOrdenados.filter((e) => eventoCubreFecha(e, fecha));
    const inhabil = cubren.some((e) => e.tipo === TIPO_EVENTO_INHABIL);
    const vacacional = cubren.some((e) => e.tipo === TIPO_EVENTO_VACACIONAL);
    const finDeSemana = esFinDeSemanaISO(fecha);
    const bitacora = bitacorasPorFecha.get(fecha) ?? null;
    const principal = cubren[0] ?? null;

    const motivos = [];
    if (bitacora) {
      if (inhabil) motivos.push(MOTIVOS_INCONSISTENCIA.EVENTO_INHABIL);
      if (vacacional) motivos.push(MOTIVOS_INCONSISTENCIA.EVENTO_VACACIONAL);
      if (finDeSemana) motivos.push(MOTIVOS_INCONSISTENCIA.FIN_DE_SEMANA);
    }

    let tipo;
    if (bitacora) tipo = TIPOS_DIA.LABORADO;
    else if (vacacional) tipo = TIPOS_DIA.VACACIONAL;
    else if (inhabil) tipo = TIPOS_DIA.INHABIL;
    else if (finDeSemana) tipo = TIPOS_DIA.FIN_DE_SEMANA;
    else tipo = TIPOS_DIA.LABORABLE_SIN_BITACORA;

    if (motivos.length > 0) {
      inconsistencias.push({
        fecha,
        bitacoraIds: bitacora.ids,
        horas: bitacora.horas,
        motivos,
        eventos: cubren.map((e) => ({ id: e.id, nombre: e.nombre, tipo: e.tipo })),
      });
    }

    return {
      fecha,
      tipo,
      finDeSemana,
      inhabil,
      vacacional,
      evento: principal ? { id: principal.id, nombre: principal.nombre, tipo: principal.tipo } : null,
      bitacoraAprobada: bitacora !== null,
      horas: bitacora ? bitacora.horas : null,
      inconsistente: motivos.length > 0,
    };
  });

  const eventosDelPeriodo = eventosOrdenados
    .filter((e) => dias.some((d) => eventoCubreFecha(e, d.fecha)))
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || a.id - b.id)
    .map((e) => ({ id: e.id, nombre: e.nombre, tipo: e.tipo, fechaInicio: e.fechaInicio, fechaFin: e.fechaFin }));

  return { dias, eventos: eventosDelPeriodo, inconsistencias };
}

module.exports = {
  TIPOS_DIA,
  MOTIVOS_INCONSISTENCIA,
  eventoCubreFecha,
  construirCalendarioPeriodo,
};
