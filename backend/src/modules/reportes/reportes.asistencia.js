// Datos del CONTROL DE ASISTENCIA (página 2 del PDF). Módulo PURO: sin BD ni reloj.
//
// No decide qué bitácoras entran: recibe las que ya seleccionó `prepararReporteMensual` con el criterio vigente de
// Reportes (mismo alumno/solicitud, mismo periodo, estados 'aprobada' + 'rechazada', orden cronológico). Aquí solo se
// da formato y se arman los dos totales.
//
// HORAS: se usa `horas_contabilizadas` tal como la guarda AH. NUNCA se recalcula como salida - entrada; las horas de
// entrada y salida son informativas para el formato y pueden no cuadrar con el entero contabilizado (AH trunca hacia
// abajo y tiene un techo de 4 h por jornada).

const { DESFASE_MEXICO_HORAS } = require('./reportes.shared');
const { TABLA } = require('./reportes.plantilla.asistencia');

const CODIGOS_ERROR = Object.freeze({
  ASISTENCIA_EXCEDE_FILAS: 'ASISTENCIA_EXCEDE_FILAS',
});

const FILAS = TABLA.filas.cantidad; // 24, como el formato oficial

function crearError(mensaje, code, status = 422, extra = {}) {
  return Object.assign(new Error(mensaje), { status, code, ...extra });
}

/** 'YYYY-MM-DD' → 'DD/MM/AAAA'. */
function formatearFechaCorta(iso) {
  const [anio, mes, dia] = String(iso).split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Instante UTC → 'HH:MM' en hora de México (UTC-6 todo el año, mismo criterio que el resto del módulo).
 * `null` si no hay instante: una jornada sin cerrar no tiene hora de salida.
 */
function formatearHoraMexico(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const local = new Date(fecha.getTime() - DESFASE_MEXICO_HORAS * 3600000);
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Las 24 filas del formato. Las bitácoras van en orden; las filas sobrantes quedan vacías (el formato conserva sus 24
 * renglones aunque el periodo tenga menos jornadas).
 *
 * Si hubiera MÁS de 24 no se recorta en silencio: se lanza un error explícito, igual que hace el resto del generador
 * cuando algo no cabe. Un periodo mensual L-V no llega a 24 jornadas, así que esto solo puede pasar con datos
 * inconsistentes.
 */
function filasDeAsistencia(bitacoras) {
  if (bitacoras.length > FILAS) {
    throw crearError(
      `El periodo tiene ${bitacoras.length} registros de asistencia y el formato solo admite ${FILAS}.`,
      CODIGOS_ERROR.ASISTENCIA_EXCEDE_FILAS,
      422,
      { registros: bitacoras.length, maximo: FILAS },
    );
  }

  return Array.from({ length: FILAS }, (_, i) => {
    const b = bitacoras[i];
    if (!b) return { numero: i + 1, fecha: '', entrada: '', salida: '', horas: '', conRegistro: false };
    return {
      numero: i + 1,
      fecha: formatearFechaCorta(b.fecha),
      entrada: formatearHoraMexico(b.horaInicio),
      salida: formatearHoraMexico(b.horaFin),
      // El entero que AH contabilizó, no una resta de horas.
      horas: String(b.horas ?? 0),
      conRegistro: true,
    };
  });
}

/**
 * Bloque completo del Control de Asistencia.
 *
 * `totalDelMes`  — horas del periodo. Quien llama decide la fuente: el snapshot `reporte_mensual.horas_reportadas`
 *                  cuando el reporte ya existe, o el cálculo vigente en la primera generación (que es exactamente el
 *                  que después se persiste). Aquí no se recalcula nada.
 * `horasPrevias` — suma de `horas_reportadas` de los reportes mensuales ANTERIORES al actual.
 *                  acumulado = horasPrevias + totalDelMes, que es lo mismo que SUM(horas_reportadas) hasta el actual
 *                  inclusive cuando el snapshot ya existe.
 *
 * `totalDelMes` en `null` deja los dos totales vacíos: es el caso del reporte global, cuyo "total por mes" no está
 * definido por la lógica actual.
 */
function construirAsistencia({ bitacoras = [], totalDelMes = null, horasPrevias = 0, responsable = null } = {}) {
  const hayTotalMes = Number.isFinite(totalDelMes);
  return {
    filas: filasDeAsistencia(bitacoras),
    totalMes: hayTotalMes ? String(totalDelMes) : '',
    totalAcumulado: hayTotalMes ? String(horasPrevias + totalDelMes) : '',
    responsable: {
      nombre: responsable?.nombre ?? '',
      cargo: responsable?.cargo ?? '',
    },
  };
}

module.exports = {
  CODIGOS_ERROR,
  FILAS,
  formatearFechaCorta,
  formatearHoraMexico,
  filasDeAsistencia,
  construirAsistencia,
};
