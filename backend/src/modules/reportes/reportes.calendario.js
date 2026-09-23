// Clasificación día por día del calendario de un periodo (CU-REP-01). Módulo puro:
// información calculada, no se persiste.
//
// AH controla las bitácoras y ADM el calendario. Una bitácora aprobada en fin de semana o en un
// día Inhabil/Vacacional es una inconsistencia entre ambos: Reportes solo la informa, no la corrige.

const { listarFechasISO, esFinDeSemanaISO, sumarDiasISO } = require('./reportes.periodos');
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

// ── Día hábil ADMINISTRATIVO (CU-REP-01, Bloque 2) ──────────────────────
//
// Distinto del día laboral de AH (bitácoras): aquí decide desde cuándo Reportes permite GENERAR un reporte, no
// cuándo el alumno puede trabajar. Lunes a viernes, sin evento Inhabil ni Vacacional ese día.

// Tope de búsqueda hacia adelante: evita un bucle indefinido ante una anomalía del calendario institucional
// (varios eventos Inhabil/Vacacional encadenados sin un día hábil de por medio).
const TOPE_BUSQUEDA_DIA_HABIL_ADMINISTRATIVO = 90;

function esDiaHabilAdministrativo(fecha, eventos) {
  if (esFinDeSemanaISO(fecha)) return false;
  return !eventos.some((e) => (e.tipo === TIPO_EVENTO_INHABIL || e.tipo === TIPO_EVENTO_VACACIONAL) && eventoCubreFecha(e, fecha));
}

/**
 * Primer día hábil administrativo a partir de `fecha` (inclusive). `eventos` debe cubrir ese rango de búsqueda —
 * es responsabilidad de quien llama haberlos consultado. null si no se encuentra dentro del tope: anomalía del
 * calendario institucional, no un caso de negocio esperado.
 */
function primerDiaHabilAdministrativoDesde(fecha, eventos) {
  let candidato = fecha;
  for (let i = 0; i < TOPE_BUSQUEDA_DIA_HABIL_ADMINISTRATIVO; i += 1) {
    if (esDiaHabilAdministrativo(candidato, eventos)) return candidato;
    candidato = sumarDiasISO(candidato, 1);
  }
  return null;
}

/**
 * Los primeros `n` días hábiles administrativos a partir de `fecha` (inclusive), en orden. `eventos` debe cubrir
 * el rango de búsqueda. El arreglo trae menos de `n` elementos si se agota el tope de búsqueda (misma anomalía de
 * calendario que primerDiaHabilAdministrativoDesde).
 */
function diasHabilesAdministrativosDesde(fecha, n, eventos) {
  const dias = [];
  let candidato = fecha;
  for (let i = 0; i < TOPE_BUSQUEDA_DIA_HABIL_ADMINISTRATIVO && dias.length < n; i += 1) {
    if (esDiaHabilAdministrativo(candidato, eventos)) dias.push(candidato);
    candidato = sumarDiasISO(candidato, 1);
  }
  return dias;
}

/**
 * Cantidad de días hábiles administrativos entre `desde` y `hasta`, ambos inclusive. 0 si `hasta` es anterior a
 * `desde`. `eventos` debe cubrir ese rango.
 */
function contarDiasHabilesAdministrativos(desde, hasta, eventos) {
  let contados = 0;
  for (let fecha = desde; fecha <= hasta; fecha = sumarDiasISO(fecha, 1)) {
    if (esDiaHabilAdministrativo(fecha, eventos)) contados += 1;
  }
  return contados;
}

module.exports = {
  TIPOS_DIA,
  MOTIVOS_INCONSISTENCIA,
  eventoCubreFecha,
  construirCalendarioPeriodo,
  TOPE_BUSQUEDA_DIA_HABIL_ADMINISTRATIVO,
  esDiaHabilAdministrativo,
  primerDiaHabilAdministrativoDesde,
  diasHabilesAdministrativosDesde,
  contarDiasHabilesAdministrativos,
};
