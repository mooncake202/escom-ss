const prisma = require('../../lib/prisma');
const { calcularDiaMexicoUTC } = require('../../lib/fechas');

// RF-AH-06: estados que cuentan como "ya terminada" — todo lo demás cuenta
// como pendiente para efectos de la notificación tipo A.
const ESTADOS_COMPLETADA = ['completada_a_tiempo', 'completada_tarde'];

/**
 * RF-AH-06 — Notificación tipo A, conteo en vivo (NO tabla `notificacion`).
 * Consumida por dashboard.service.js (resumenAlumno) para la notificación
 * calculada del dashboard del alumno.
 */
async function tieneActividadesPendientes(solicitudRegistroId) {
  const conteo = await prisma.actividad.count({
    where: {
      solicitud_registro_id: Number(solicitudRegistroId),
      estado: { notIn: ESTADOS_COMPLETADA },
    },
  });
  return conteo > 0;
}

// ─────────────────────────────────────────────────────────────
// CU-AH-03: bitácora del día — helpers compartidos entre
// ah-alumno.service.js, ah.cron.js y dashboard.service.js.
// ─────────────────────────────────────────────────────────────

// Estados de actividad sobre los que el alumno puede reportar avance en una
// bitácora — nunca las ya terminadas (ESTADOS_COMPLETADA de arriba).
const ESTADOS_ACTIVIDAD_REPORTABLE = ['sin_comenzar', 'en_progreso', 'vencida'];

const HORAS_POR_JORNADA = 4;
const LIMITE_HORAS_SERVICIO = 480; // RN-AH-17
// Jornada mínima para poder finalizar/confirmar como bitácora del día — por
// debajo de esto, el alumno solo puede seguir trabajando o descartarla por
// completo (cancelarJornada) e intentar de nuevo el mismo día.
const SEGUNDOS_MINIMOS_JORNADA = 3600;

// RN-AH-14: tipos de evento_calendario que vuelven un día no laborable
// además de sábado/domingo.
const TIPOS_EVENTO_NO_LABORABLE = ['Inhabil', 'Vacacional'];

// calcularDiaMexicoUTC ahora vive en backend/src/lib/fechas.js (utilidad
// genérica, reutilizada también por periodos.service.js) — se re-exporta
// aquí sin cambios para no tocar ningún import existente (ah.cron.js,
// ah-alumno.service.js, dashboard.service.js, validators.js).

function restarDias(diaUTC, n) {
  return new Date(diaUTC.getTime() - n * 86400000);
}

/**
 * RN-AH-14: un día es laborable salvo que sea sábado/domingo, o esté
 * cubierto por un evento_calendario de tipo Inhabil/Vacacional (el
 * calendario escolar es global, no se filtra por coordinador_id).
 */
async function esDiaLaborable(diaUTC) {
  const dow = diaUTC.getUTCDay(); // 0 domingo, 6 sábado
  if (dow === 0 || dow === 6) return false;

  const conteo = await prisma.evento_calendario.count({
    where: {
      tipo: { in: TIPOS_EVENTO_NO_LABORABLE },
      fecha_inicio: { lte: diaUTC },
      OR: [
        { fecha_fin: { gte: diaUTC } },
        { AND: [{ fecha_fin: null }, { fecha_inicio: diaUTC }] },
      ],
    },
  });
  return conteo === 0;
}

async function obtenerBitacoraDelDia(solicitudRegistroId, diaUTC) {
  return prisma.bitacora.findFirst({
    where: { solicitud_registro_id: Number(solicitudRegistroId), fecha_registro: diaUTC },
  });
}

/**
 * Notificación tipo A #1 ("Falta tu bitácora del día"): hoy es día laboral
 * Y no existe ninguna bitácora de hoy (en cualquier estado) para la solicitud.
 */
async function faltaBitacoraHoy(solicitudRegistroId) {
  const hoy = calcularDiaMexicoUTC();
  if (!(await esDiaLaborable(hoy))) return false;
  const existente = await obtenerBitacoraDelDia(solicitudRegistroId, hoy);
  return !existente;
}

/**
 * Notificación tipo A #3 ("Tienes una jornada sin terminar"): existe una
 * bitácora 'pendiente_datos' (auto-cerrada por abandono) sin confirmar
 * todavía. No se limita a "hoy" a propósito — una jornada abandonada ayer
 * sigue pendiente de completarse.
 */
async function tieneJornadaPendienteDatos(solicitudRegistroId) {
  const conteo = await prisma.bitacora.count({
    where: { solicitud_registro_id: Number(solicitudRegistroId), estado: 'pendiente_datos' },
  });
  return conteo > 0;
}

/**
 * Get-or-create perezoso de cumulo_horas_y_faltas — no existía ningún
 * patrón previo de esto en el módulo. Acepta `tx` para poder llamarse
 * dentro de una transacción interactiva (confirmarBitacora).
 */
async function obtenerOCrearCumulo(alumnoBoleta, tx = prisma) {
  return tx.cumulo_horas_y_faltas.upsert({
    where: { alumno_id: alumnoBoleta },
    update: {},
    create: { alumno_id: alumnoBoleta },
  });
}

module.exports = {
  tieneActividadesPendientes,
  ESTADOS_COMPLETADA,
  ESTADOS_ACTIVIDAD_REPORTABLE,
  HORAS_POR_JORNADA,
  LIMITE_HORAS_SERVICIO,
  SEGUNDOS_MINIMOS_JORNADA,
  calcularDiaMexicoUTC,
  restarDias,
  esDiaLaborable,
  obtenerBitacoraDelDia,
  faltaBitacoraHoy,
  tieneJornadaPendienteDatos,
  obtenerOCrearCumulo,
};
