// Tipos de reporte (mensual y global) y lo ÚNICO en que difieren. Todo el flujo (envío, revisión del profesor, validación de
// Coordinación, seguimiento y corrección) es el mismo para los dos: los servicios reciben esta configuración en vez de repetir
// la lógica. Cada tipo usa su propia tabla de reporte y de revisiones (mismas columnas), y la misma tabla `documento`.

const {
  TIPO_DOCUMENTO_REPORTE_MENSUAL,
  TIPO_DOCUMENTO_REPORTE_GLOBAL,
  tituloReporteMensual,
  tituloReporteGlobal,
} = require('./reportes.shared');
const { formatearFechaLarga, formatearMesAnio, calcularPeriodoReporte, normalizarFechaISO } = require('./reportes.periodos');

const TIPOS_REPORTE = Object.freeze({ MENSUAL: 'mensual', GLOBAL: 'global' });

// ── Periodo ──────────────────────────────────────────────────

/**
 * Periodo del reporte mensual `numero` según el periodo oficial del alumno. `mesMostrado` es el mes en que TERMINA el
 * periodo (en el esquema de mediados de mes, del 16 al 15, es el mes del cierre; en mes calendario, el propio mes).
 */
function periodoMensualDe(solicitud, numero) {
  const evento = solicitud.periodo_registro?.evento_calendario;
  if (!evento?.fecha_inicio) return { periodo: null, mesMostrado: null };
  let calculado;
  try {
    calculado = calcularPeriodoReporte({ fechaInicio: evento.fecha_inicio, fechaFin: evento.fecha_fin ?? null, numero });
  } catch {
    return { periodo: null, mesMostrado: null };
  }
  const [anio, mes] = calculado.fin.split('-').map(Number);
  return {
    periodo: {
      inicio: calculado.inicio,
      fin: calculado.fin,
      inicioTexto: formatearFechaLarga(calculado.inicio),
      finTexto: formatearFechaLarga(calculado.fin),
      esquema: calculado.esquema,
    },
    mesMostrado: { mes, anio, texto: formatearMesAnio(calculado.fin) },
  };
}

/**
 * Periodo del reporte global: TODO el periodo de prestación elegido en el registro (fecha de inicio → fecha de fin del periodo
 * oficial), no hasta la fecha en que se genera. Sin fecha de inicio o de fin no hay periodo.
 */
function periodoGlobalDe(solicitud) {
  const evento = solicitud.periodo_registro?.evento_calendario;
  if (!evento?.fecha_inicio || !evento?.fecha_fin) return { periodo: null, mesMostrado: null };
  const inicio = normalizarFechaISO(evento.fecha_inicio);
  const fin = normalizarFechaISO(evento.fecha_fin);
  return {
    periodo: { inicio, fin, inicioTexto: formatearFechaLarga(inicio), finTexto: formatearFechaLarga(fin), esquema: 'completo' },
    mesMostrado: null,
  };
}

// ── Configuración por tipo ───────────────────────────────────

const MENSUAL = Object.freeze({
  tipo: TIPOS_REPORTE.MENSUAL,
  modelo: 'reporte_mensual',
  modeloRevision: 'revision_reporte_mensual', // también es el nombre de la relación en la fila del reporte
  fkRevision: 'reporte_mensual_id',
  columnaActividades: 'actividades_mes',
  tipoDocumento: TIPO_DOCUMENTO_REPORTE_MENSUAL,
  // Columnas propias del tipo para los `select` (el snapshot del primer envío).
  camposPropios: Object.freeze({ num_reporte: true, dias_laborados: true, horas_reportadas: true }),
  etiqueta: (fila) => `Reporte Mensual No. ${fila.num_reporte}`,
  titulo: (fila) => tituloReporteMensual(fila.num_reporte),
  numero: (fila) => fila.num_reporte,
  // Días y horas son el snapshot del primer envío guardado en el propio reporte: no se consultan bitácoras.
  snapshot: (fila) => ({ diasLaborados: fila.dias_laborados, horasReportadas: fila.horas_reportadas }),
  periodo: (solicitud, fila) => periodoMensualDe(solicitud, fila.num_reporte),
  archivo: (fila, boleta) => `reporte-mensual-${fila.num_reporte}-${boleta}.pdf`,
  // Lo que va en la URL para resaltar el reporte desde una notificación (los ids de cada tipo se repiten).
  consultaDestacar: (id) => `destacar=${id}`,
});

// El global no guarda snapshot de días ni de horas (su tabla no tiene esas columnas): esos datos solo se muestran al generarlo.
const GLOBAL = Object.freeze({
  tipo: TIPOS_REPORTE.GLOBAL,
  modelo: 'reporte_global',
  modeloRevision: 'revision_reporte_global',
  fkRevision: 'reporte_global_id',
  columnaActividades: 'actividades_resumen',
  tipoDocumento: TIPO_DOCUMENTO_REPORTE_GLOBAL,
  camposPropios: Object.freeze({}),
  etiqueta: () => 'Reporte Global',
  titulo: () => tituloReporteGlobal(),
  numero: () => null,
  snapshot: () => ({ diasLaborados: null, horasReportadas: null }),
  periodo: (solicitud) => periodoGlobalDe(solicitud),
  archivo: (fila, boleta) => `reporte-global-${boleta}.pdf`,
  consultaDestacar: (id) => `destacar=${id}&tipo=global`,
});

const CONFIG = Object.freeze({ [TIPOS_REPORTE.MENSUAL]: MENSUAL, [TIPOS_REPORTE.GLOBAL]: GLOBAL });

/** Configuración del tipo, o null si no existe (un tipo desconocido se trata como un reporte inexistente). */
const configDe = (tipoReporte) => (typeof tipoReporte === 'string' && Object.hasOwn(CONFIG, tipoReporte) ? CONFIG[tipoReporte] : null);

module.exports = { TIPOS_REPORTE, CONFIG, MENSUAL, GLOBAL, configDe, periodoMensualDe, periodoGlobalDe };
