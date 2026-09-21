// Constantes del módulo Reportes. No importa nada de AH, GR, ADM ni Ofertas.

const path = require('path');

// Misma carpeta que usa GR para los documentos cifrados: <boleta>/<uuid>.pdf (documento.ruta_archivo es relativa a ella).
const RUTA_BASE_DOCUMENTOS = path.join(__dirname, '../../../uploads/documentos');

// reporte_mensual.estado_reporte. No existe 'aprobado_profesor'.
const ESTADOS_REPORTE = Object.freeze({
  PENDIENTE_REVISION_PROFESOR: 'pendiente_revision_profesor',
  RECHAZADO_PROFESOR: 'rechazado_profesor',
  PENDIENTE_REVISION_COORDINADOR: 'pendiente_revision_coordinador',
  RECHAZADO_COORDINADOR: 'rechazado_coordinador',
  APROBADO_COORDINADOR: 'aprobado_coordinador',
});

const ESTADO_REPORTE_APROBACION_FINAL = ESTADOS_REPORTE.APROBADO_COORDINADOR;

// Lo que Coordinación ve (CU-REP-06): lo que ya aprobó el profesor y lo que Coordinación ya resolvió.
const ESTADOS_REPORTE_EN_COORDINACION = Object.freeze([
  ESTADOS_REPORTE.PENDIENTE_REVISION_COORDINADOR,
  ESTADOS_REPORTE.APROBADO_COORDINADOR,
  ESTADOS_REPORTE.RECHAZADO_COORDINADOR,
]);

// El alumno los corrige con CU-REP-04.
const ESTADOS_REPORTE_RECHAZADOS = Object.freeze([
  ESTADOS_REPORTE.RECHAZADO_PROFESOR,
  ESTADOS_REPORTE.RECHAZADO_COORDINADOR,
]);

// `documento` de un reporte mensual. estado_documento es NOT NULL en la BD, pero en Reportes es solo un estado técnico:
// 'vigente' = el documento almacenado es el válido del reporte. NO indica revisión ni aprobación: el flujo vive en
// reporte_mensual.estado_reporte y revision_reporte_mensual, y ningún CU de Reportes vuelve a modificar este campo.
const TIPO_DOCUMENTO_REPORTE_MENSUAL = 'reporte_mensual';
const TIPO_DOCUMENTO_REPORTE_GLOBAL = 'reporte_global'; // mismo criterio para el reporte global (CU-REP-07)
const ESTADO_DOCUMENTO_VIGENTE = 'vigente';

// Color de las notificaciones de Reportes (el dashboard pinta cada `tipo` de la tabla notificacion: info azul, warning amarillo,
// success verde, urgente rojo). UNA sola tabla para alumno, profesor y coordinación, y para el mensual y el global:
//   rechazo (profesor o coordinación)                            → rojo
//   reporte enviado, corregido o reenviado, pendiente de revisión → amarillo
//   aprobación final por coordinación                             → verde
//   azul: solo avisos informativos que no sean ninguno de los anteriores (rechazo, aprobación final o acción pendiente).
const TIPOS_NOTIFICACION = Object.freeze({
  RECHAZO: 'urgente',
  PENDIENTE: 'warning',
  APROBACION_FINAL: 'success',
  INFORMATIVA: 'info',
});

// Revisión de Coordinación (CU-REP-06) reutiliza ESTADO_REVISION_FIRMADA / ESTADO_REVISION_RECHAZADA.
const TIPO_REVISOR_COORDINADOR = 'coordinador';

// Revisión del profesor (CU-REP-05): aprobar = firmar y pasar a Coordinación; rechazar = devolver al alumno.
const TIPO_REVISOR_PROFESOR = 'profesor';
const ESTADO_REVISION_RECHAZADA = 'rechazado';

// Firma del alumno al enviar: enums TipoRevisor.alumno y EstadoRevision.aprobado (no hay otro valor para "firmado").
const TIPO_REVISOR_ALUMNO = 'alumno';
const ESTADO_REVISION_FIRMADA = 'aprobado';

// Valor de bitacora.estado definido por AH; Reportes solo lo lee.
const ESTADO_BITACORA_APROBADA = 'aprobada';

// Valores del enum TipoEventoCalendario que vuelven no laborable un día.
const TIPO_EVENTO_INHABIL = 'Inhabil';
const TIPO_EVENTO_VACACIONAL = 'Vacacional';
const TIPOS_EVENTO_NO_LABORABLE = Object.freeze([TIPO_EVENTO_INHABIL, TIPO_EVENTO_VACACIONAL]);

// México es UTC-6 todo el año (sin horario de verano desde 2022).
const DESFASE_MEXICO_HORAS = 6;

// Nombre institucional por código de carrera (alumno.carrera).
const CARRERAS_NOMBRE_INSTITUCIONAL = Object.freeze({
  ISC: 'Ingeniería en Sistemas Computacionales',
  LCD: 'Licenciatura en Ciencia de Datos',
  IIA: 'Ingeniería en Inteligencia Artificial',
});

// Códigos que el registro de esta rama aún guarda con otro nombre. El correcto es IIA (ya corregido en otra rama);
// se retira el alias cuando el catálogo deje de emitirlo.
const CARRERAS_ALIAS_LEGADO = Object.freeze({ IA: 'IIA' });

function nombreInstitucionalCarrera(codigo) {
  return CARRERAS_NOMBRE_INSTITUCIONAL[CARRERAS_ALIAS_LEGADO[codigo] ?? codigo] ?? null;
}

// Horas de bitácoras aprobadas (suma de horas_contabilizadas) desde las que se habilita el reporte global.
const HORAS_MINIMAS_REPORTE_GLOBAL = 480;

const MOTIVOS_BLOQUEO = Object.freeze({
  SIN_PERIODO_OFICIAL: 'SIN_PERIODO_OFICIAL',
  INICIO_SERVICIO_FIN_DE_SEMANA: 'INICIO_SERVICIO_FIN_DE_SEMANA',
  SERVICIO_NO_INICIADO: 'SERVICIO_NO_INICIADO',
  FECHA_FIN_NO_DISPONIBLE: 'FECHA_FIN_NO_DISPONIBLE',
  PERIODO_REBASA_FIN_SERVICIO: 'PERIODO_REBASA_FIN_SERVICIO',
  PERIODO_NO_CERRADO: 'PERIODO_NO_CERRADO',
  SIN_BITACORAS_APROBADAS: 'SIN_BITACORAS_APROBADAS',
  REPORTE_YA_EXISTE: 'REPORTE_YA_EXISTE',
  REPORTE_ANTERIOR_SIN_APROBACION_FINAL: 'REPORTE_ANTERIOR_SIN_APROBACION_FINAL',
  // Reporte global (CU-REP-07).
  HORAS_INSUFICIENTES: 'HORAS_INSUFICIENTES',
  REPORTE_GLOBAL_YA_EXISTE: 'REPORTE_GLOBAL_YA_EXISTE',
  // Datos que el PDF necesita y que no se pueden inventar ni sustituir por otros.
  SIN_CORREO_PERSONAL: 'SIN_CORREO_PERSONAL',
  SIN_PROGRAMA_SISS: 'SIN_PROGRAMA_SISS',
  SIN_PROFESOR_RESPONSABLE: 'SIN_PROFESOR_RESPONSABLE',
  CARRERA_NO_RECONOCIDA: 'CARRERA_NO_RECONOCIDA',
});

const MENSAJES_BLOQUEO = Object.freeze({
  [MOTIVOS_BLOQUEO.SIN_PERIODO_OFICIAL]:
    'Tu solicitud no tiene un periodo oficial de servicio social con fecha de inicio.',
  [MOTIVOS_BLOQUEO.INICIO_SERVICIO_FIN_DE_SEMANA]:
    'La fecha oficial de inicio de tu servicio social cae en sábado o domingo, por lo que no se puede calcular el periodo del reporte. Solicita a coordinación que la corrija.',
  [MOTIVOS_BLOQUEO.SERVICIO_NO_INICIADO]:
    'Tu servicio social todavía no inicia.',
  [MOTIVOS_BLOQUEO.FECHA_FIN_NO_DISPONIBLE]:
    'El periodo oficial no tiene fecha de término, por lo que no se puede confirmar que el reporte esté dentro del servicio.',
  [MOTIVOS_BLOQUEO.PERIODO_REBASA_FIN_SERVICIO]:
    'El siguiente periodo mensual completo rebasa la fecha oficial de término de tu servicio social.',
  [MOTIVOS_BLOQUEO.PERIODO_NO_CERRADO]:
    'El periodo de este reporte todavía no termina.',
  [MOTIVOS_BLOQUEO.SIN_BITACORAS_APROBADAS]:
    'No hay bitácoras aprobadas en el periodo de este reporte.',
  [MOTIVOS_BLOQUEO.REPORTE_YA_EXISTE]:
    'Ya existe un reporte para este periodo.',
  [MOTIVOS_BLOQUEO.REPORTE_ANTERIOR_SIN_APROBACION_FINAL]:
    'Todos tus reportes anteriores deben estar aprobados por coordinación antes de generar uno nuevo.',
  [MOTIVOS_BLOQUEO.HORAS_INSUFICIENTES]:
    `El reporte global se habilita al completar ${HORAS_MINIMAS_REPORTE_GLOBAL} horas de bitácoras aprobadas.`,
  [MOTIVOS_BLOQUEO.REPORTE_GLOBAL_YA_EXISTE]:
    'Ya existe un reporte global para tu servicio social.',
  [MOTIVOS_BLOQUEO.SIN_CORREO_PERSONAL]:
    'Tu perfil no tiene correo personal registrado y el reporte lo requiere. Solicita a coordinación que lo corrija.',
  [MOTIVOS_BLOQUEO.SIN_PROGRAMA_SISS]:
    'La oferta de tu servicio social no tiene un Programa SISS asignado. Solicita a coordinación que lo corrija.',
  [MOTIVOS_BLOQUEO.SIN_PROFESOR_RESPONSABLE]:
    'Tu solicitud no tiene un profesor responsable asignado (la oferta ya no está disponible).',
  [MOTIVOS_BLOQUEO.CARRERA_NO_RECONOCIDA]:
    'Tu carrera no está en el catálogo institucional, por lo que no se puede imprimir en el reporte.',
});

// Textos fijos del reporte mensual.
const PRESTATARIO = 'Escuela Superior de Cómputo';
const TEXTO_RESPONSABLE_DIRECTO = 'Responsable Directo';

// "Nombre Apellidos", tal como están guardados (sin cambiar mayúsculas).
function nombreCompleto(nombre, apellidos) {
  return [nombre, apellidos].map((t) => String(t ?? '').trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ');
}

// Número finito o null. Acepta number, string y el Decimal de Prisma (vía toString).
function aNumero(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;
  const numero = Number(String(valor));
  return Number.isFinite(numero) ? numero : null;
}

// Porcentaje sin ceros decimales innecesarios: 85 → "85 %", 85.50 → "85.5 %".
function formatearPorcentajeCreditos(valor) {
  const numero = aNumero(valor);
  return numero === null ? null : `${Number(numero.toFixed(2))} %`;
}

function tituloReporteMensual(numero) {
  return `Reporte mensual de actividades No. ${numero}`;
}

const tituloReporteGlobal = () => 'Reporte global de actividades';

module.exports = {
  RUTA_BASE_DOCUMENTOS,
  TIPOS_NOTIFICACION,
  ESTADOS_REPORTE,
  ESTADO_REPORTE_APROBACION_FINAL,
  ESTADOS_REPORTE_EN_COORDINACION,
  ESTADOS_REPORTE_RECHAZADOS,
  TIPO_DOCUMENTO_REPORTE_MENSUAL,
  TIPO_DOCUMENTO_REPORTE_GLOBAL,
  HORAS_MINIMAS_REPORTE_GLOBAL,
  ESTADO_DOCUMENTO_VIGENTE,
  TIPO_REVISOR_ALUMNO,
  TIPO_REVISOR_PROFESOR,
  TIPO_REVISOR_COORDINADOR,
  ESTADO_REVISION_FIRMADA,
  ESTADO_REVISION_RECHAZADA,
  ESTADO_BITACORA_APROBADA,
  TIPO_EVENTO_INHABIL,
  TIPO_EVENTO_VACACIONAL,
  TIPOS_EVENTO_NO_LABORABLE,
  DESFASE_MEXICO_HORAS,
  CARRERAS_NOMBRE_INSTITUCIONAL,
  CARRERAS_ALIAS_LEGADO,
  nombreInstitucionalCarrera,
  MOTIVOS_BLOQUEO,
  MENSAJES_BLOQUEO,
  PRESTATARIO,
  TEXTO_RESPONSABLE_DIRECTO,
  nombreCompleto,
  aNumero,
  formatearPorcentajeCreditos,
  tituloReporteMensual,
  tituloReporteGlobal,
};
