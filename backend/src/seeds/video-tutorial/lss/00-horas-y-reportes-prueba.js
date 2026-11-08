// 00-horas-y-reportes-prueba.js
//
// Deja a Daniela lista para CU-LSS-01: 480 horas netas + 6 reporte_mensual
// + 1 reporte_global, todos 'aprobado_coordinador' — usando la LÓGICA REAL
// de REP (enviarReporteMensual/Global + aprobarReporte de profesor y de
// coordinación), no datos inventados directo por Prisma. Confirmado contra
// el código real (`lss-alumno.service.js::calcularRequisitos`):
//   - horasNetas = calcularHorasNetas(cumulo) >= 480 (ah.shared.js, también
//     la usa LSS — misma función, no una reinventada).
//   - 6 reporte_mensual, TODOS 'aprobado_coordinador'.
//   - 1 reporte_global, 'aprobado_coordinador'.
//
// Importante: REP NO usa el cúmulo para calcular horas_reportadas — lee
// directo las bitácoras 'aprobada' dentro de la ventana [inicio,fin] de
// cada periodo mensual (reportes-alumno.service.js). Por eso este seed
// SÍ crea bitácoras reales de respaldo (no solo sube un contador): sin
// eso, los reportes saldrían con 0 horas/0 días laborados.
//
// Esta parte NO se le pasa a Sol — es exclusiva de la BD de Karen para
// poder grabar LSS sin depender de que Sol genere sus reportes reales de
// REP primero.
//
// Periodos mensuales (esquema mes_calendario, porque fecha_inicio=1 oct
// cae en los primeros 5 días hábiles de octubre):
//   #1 oct 2026 (ya tiene 3 bitácoras de ah/01-actividades-variadas.js,
//      se deja tal cual, no se le agrega nada más)
//   #2 nov 2026, #3 dic 2026, #4 ene 2027, #5 feb 2027, #6 mar 2027
//      (nuevas, se llenan con bitácoras aprobadas de 4h cada día hábil)
//
// Las fechas de estos periodos (2026-2027) ya pasaron respecto al momento
// en que se GENERAN los reportes, pero no respecto al momento REAL en que
// se corre este script (hoy) — por eso SÍ se usa `deps.ahora` (el mismo
// parámetro de pruebas ya documentado en el propio código real, "solo se
// usa en pruebas") para que el candado de "¿ya cerró el periodo?" se abra,
// sin tocar ningún reloj real de ningún lado.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { esDiaLaborable } = require('../../../modules/ah/ah.shared');
const { calcularPeriodoReporte, numeroPeriodoDeFecha, normalizarFechaISO } = require('../../../modules/reportes/reportes.periodos');
const { guardarRubrica } = require('../../../modules/reportes/reportes.rubricas');
const { enviarReporteMensual } = require('../../../modules/reportes/reportes-envio.service');
const { enviarReporteGlobal } = require('../../../modules/reportes/reportes-global.service');
const { aprobarReporte: aprobarComoProfesor } = require('../../../modules/reportes/reportes-revision.service');
const { aprobarReporte: aprobarComoCoordinador } = require('../../../modules/reportes/reportes-validacion.service');

const CORREO_PROFESOR = 'profesornavarro@ipn.mx';
const BOLETA_ALUMNA = '2021630001';
const FECHA_INICIO_PERIODO = '2026-10-01';
const HORAS_POR_JORNADA = 4;
const TITULO_ACTIVIDAD_RESPALDO = 'Dar seguimiento continuo al proyecto';

const CORREO_COORDINADOR = 'coordinadorherrera@ipn.mx';

async function obtenerContexto() {
  const profesorUsuario = await prisma.usuario.findUnique({
    where: { correo_institucional: CORREO_PROFESOR },
    include: { profesor: true },
  });
  if (!profesorUsuario?.profesor) throw new Error(`No existe el profesor ${CORREO_PROFESOR}.`);

  const coordinadorUsuario = await prisma.usuario.findUnique({
    where: { correo_institucional: CORREO_COORDINADOR },
  });
  if (!coordinadorUsuario) throw new Error(`No existe el coordinador ${CORREO_COORDINADOR}.`);

  const alumnoUsuario = await prisma.usuario.findFirst({
    where: { alumno: { boleta: BOLETA_ALUMNA } },
    include: { alumno: { include: { solicitud_registro: true } } },
  });
  if (!alumnoUsuario?.alumno?.solicitud_registro) throw new Error(`No existe la solicitud de la alumna ${BOLETA_ALUMNA}.`);
  if (alumnoUsuario.alumno.solicitud_registro.estado_solicitud !== 'alumno_asignado') {
    throw new Error('La solicitud de Daniela todavía no está en alumno_asignado.');
  }

  return {
    profesorUsuarioId: profesorUsuario.id,
    profesorId: profesorUsuario.profesor.id,
    coordinadorUsuarioId: coordinadorUsuario.id,
    alumnoUsuarioId: alumnoUsuario.id,
    solicitudId: alumnoUsuario.alumno.solicitud_registro.id,
  };
}

async function sembrarRubricaSiFalta(usuarioId, rutaImagen) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { rubrica_imagen: true } });
  if (usuario.rubrica_imagen) {
    console.log(`↷ el usuario ${usuarioId} ya tenía rúbrica guardada.`);
    return;
  }
  const buffer = fs.readFileSync(rutaImagen);
  await guardarRubrica(usuarioId, { buffer }, { prisma });
  console.log(`✅ rúbrica de prueba guardada para el usuario ${usuarioId} (${path.basename(rutaImagen)}).`);
}

async function obtenerOCrearActividadRespaldo(solicitudRegistroId) {
  const existente = await prisma.actividad.findFirst({
    where: { solicitud_registro_id: solicitudRegistroId, titulo: TITULO_ACTIVIDAD_RESPALDO },
  });
  if (existente) return existente;
  return prisma.actividad.create({
    data: {
      solicitud_registro_id: solicitudRegistroId,
      titulo: TITULO_ACTIVIDAD_RESPALDO,
      descripcion: 'Seguimiento, documentación y mantenimiento continuo de los distintos módulos del proyecto a lo largo del periodo de servicio social.',
      entregable_esperado: 'Bitácora diaria de avances y evidencia de las tareas realizadas.',
      fecha_limite: new Date('2027-06-24'), // fecha_fin del periodo oficial
      fecha_asignacion: new Date('2026-10-01T15:00:00.000Z'),
      estado: 'en_progreso',
      porcentaje_progreso: 40,
    },
  });
}

async function diasHabilesDelPeriodo(inicioISO, finISO) {
  const dias = [];
  for (let fecha = new Date(`${inicioISO}T00:00:00.000Z`); fecha <= new Date(`${finISO}T00:00:00.000Z`); fecha.setUTCDate(fecha.getUTCDate() + 1)) {
    const d = new Date(fecha);
    if (await esDiaLaborable(d)) dias.push(new Date(d));
  }
  return dias;
}

async function sembrarBitacorasDelPeriodo(solicitudId, profesorId, actividadId, inicioISO, finISO) {
  const dias = await diasHabilesDelPeriodo(inicioISO, finISO);
  let horasNuevas = 0;
  let avance = 40;

  for (const dia of dias) {
    const existente = await prisma.bitacora.findFirst({
      where: { solicitud_registro_id: solicitudId, fecha_registro: dia },
    });
    if (existente) continue;

    const horaInicio = new Date(dia);
    horaInicio.setUTCHours(15, 0, 0, 0); // 09:00 hora México
    const horaFin = new Date(horaInicio.getTime() + HORAS_POR_JORNADA * 3600 * 1000);

    const bitacora = await prisma.bitacora.create({
      data: {
        solicitud_registro_id: solicitudId,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        horas_contabilizadas: HORAS_POR_JORNADA,
        estado: 'aprobada',
        fecha_registro: dia,
        fecha_revision: new Date(horaFin.getTime() + 3600 * 1000),
        revisado_por_id: profesorId,
      },
    });
    avance = Math.min(95, avance + 1);
    await prisma.registro_bitacora_actividades.create({
      data: {
        bitacora_id: bitacora.id,
        actividad_id: actividadId,
        descripcion: 'Avance continuo de seguimiento y documentación del proyecto.',
        porcentaje_avance_registrado: avance,
        evidencia: 'https://ejemplo-interno.escom.ipn.mx/avances/seguimiento-continuo',
      },
    });
    horasNuevas += HORAS_POR_JORNADA;
  }

  if (horasNuevas > 0) {
    await prisma.cumulo_horas_y_faltas.update({
      where: { alumno_id: BOLETA_ALUMNA },
      data: { horas_acumuladas: { increment: horasNuevas } },
    });
    await prisma.actividad.update({ where: { id: actividadId }, data: { porcentaje_progreso: avance } });
  }

  console.log(`✅ periodo ${inicioISO} — ${finISO}: ${dias.length} días hábiles, ${horasNuevas}h nuevas aprobadas.`);
  return horasNuevas;
}

async function generarYAprobarReporteMensual(numero, fechaSimulada, ctx) {
  const existente = await prisma.reporte_mensual.findFirst({
    where: { solicitud_registro_id: ctx.solicitudId, num_reporte: numero },
  });
  if (existente && existente.estado_reporte === 'aprobado_coordinador') {
    console.log(`↷ reporte mensual #${numero} ya estaba aprobado_coordinador.`);
    return;
  }

  let reporteId = existente?.id;
  if (!existente) {
    const envio = await enviarReporteMensual(
      ctx.alumnoUsuarioId,
      `Resumen de actividades del periodo correspondiente al reporte #${numero}.`,
      { ahora: fechaSimulada },
    );
    reporteId = envio.reporte.id;
    console.log(`✅ reporte mensual #${numero} enviado (id ${reporteId}).`);
  }

  await aprobarComoProfesor(ctx.profesorUsuarioId, 'mensual', reporteId, { ahora: fechaSimulada });
  console.log(`✅ reporte mensual #${numero} aprobado por el profesor.`);
  await aprobarComoCoordinador(ctx.coordinadorUsuarioId, 'mensual', reporteId, { ahora: fechaSimulada });
  console.log(`✅ reporte mensual #${numero} aprobado por coordinación.`);
}

async function main() {
  const ctx = await obtenerContexto();

  await sembrarRubricaSiFalta(ctx.alumnoUsuarioId, path.join(__dirname, 'firma_alumna_prueba.png'));
  await sembrarRubricaSiFalta(ctx.profesorUsuarioId, path.join(__dirname, 'firma_profesor_prueba.png'));

  const actividadRespaldo = await obtenerOCrearActividadRespaldo(ctx.solicitudId);

  for (let numero = 2; numero <= 6; numero++) {
    const periodo = calcularPeriodoReporte({ fechaInicio: FECHA_INICIO_PERIODO, numero });
    await sembrarBitacorasDelPeriodo(ctx.solicitudId, ctx.profesorId, actividadRespaldo.id, periodo.inicio, periodo.fin);
  }

  let cumuloActual = await prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: BOLETA_ALUMNA } });
  console.log(`\nHoras netas acumuladas tras sembrar bitácoras: ${cumuloActual.horas_acumuladas - cumuloActual.horas_rechazadas}`);

  // El reporte global suma TODAS las bitácoras aprobadas directo (no por
  // periodo) — si lo de arriba no alcanzó las 480 (el periodo vacacional de
  // invierno dejó enero muy corto), se completa con más días hábiles en
  // abril 2027, que no pertenece a ningún reporte mensual ya aprobado — no
  // altera ningún snapshot ya congelado, solo suma al total vivo.
  let horasFaltantes = 480 - (cumuloActual.horas_acumuladas - cumuloActual.horas_rechazadas);
  let mesExtra = 4; // abril 2027 — numero=7 en el esquema mes_calendario (Oct=1 ... abril=7)
  while (horasFaltantes > 0) {
    const inicioExtra = `2027-${String(mesExtra).padStart(2, '0')}-01`;
    const ultimoDia = new Date(Date.UTC(2027, mesExtra, 0)).getUTCDate();
    const finExtra = `2027-${String(mesExtra).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    const hechas = await sembrarBitacorasDelPeriodo(ctx.solicitudId, ctx.profesorId, actividadRespaldo.id, inicioExtra, finExtra);
    horasFaltantes -= hechas;
    mesExtra++;
  }
  cumuloActual = await prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: BOLETA_ALUMNA } });
  console.log(`Horas netas acumuladas tras completar el mínimo de 480: ${cumuloActual.horas_acumuladas - cumuloActual.horas_rechazadas}`);

  // Determina el número de reporte real (no por conteo de este script, sino
  // con el motor oficial) de la bitácora más reciente que exista — así
  // sabemos hasta qué número hay que generar/aprobar reportes, sin importar
  // si esos datos ya existían de una corrida anterior de este mismo seed.
  const ultimaBitacora = await prisma.bitacora.findFirst({
    where: { solicitud_registro_id: ctx.solicitudId, estado: 'aprobada' },
    orderBy: { fecha_registro: 'desc' },
  });
  const ultimoNumeroConDatos = numeroPeriodoDeFecha({
    fechaInicio: FECHA_INICIO_PERIODO,
    fecha: normalizarFechaISO(ultimaBitacora.fecha_registro),
  });
  console.log(`Último numero de reporte mensual con datos: ${ultimoNumeroConDatos}`);

  // "ahora" simulado para cada reporte: el primer día hábil administrativo
  // después de que cerraría ese periodo mensual, para que el candado de
  // fecha ya esté "abierto" en ese instante simulado — sin tocar ningún
  // reloj real. Se generan TODOS los reportes hasta ultimoNumeroConDatos
  // (no solo 6): CU-REP-07 exige que el reporte mensual donde se completan
  // las 480h ya esté enviado, y si esas horas cayeron en un mes "extra"
  // (abril/mayo, por el hueco del periodo vacacional de invierno en enero),
  // ese reporte también hay que generarlo y aprobarlo.
  for (let numero = 1; numero <= ultimoNumeroConDatos; numero++) {
    const periodo = calcularPeriodoReporte({ fechaInicio: FECHA_INICIO_PERIODO, numero });
    const fechaSimulada = new Date(`${periodo.fin}T12:00:00.000Z`);
    // Margen amplio (40 días) para saltar de sobra el periodo vacacional de
    // invierno sembrado en 00-comun (21 dic 2026 — 22 ene 2027), que para
    // el reporte #3 (diciembre) empuja el "primer día hábil administrativo"
    // mucho más allá de unos pocos días.
    fechaSimulada.setUTCDate(fechaSimulada.getUTCDate() + 40);
    await generarYAprobarReporteMensual(numero, fechaSimulada, ctx);
  }

  const reportesAprobados = await prisma.reporte_mensual.count({
    where: { solicitud_registro_id: ctx.solicitudId, estado_reporte: 'aprobado_coordinador' },
  });
  console.log(`\nReportes mensuales aprobado_coordinador: ${reportesAprobados}/${ultimoNumeroConDatos} (mínimo exigido por LSS: 6)`);

  const existenteGlobal = await prisma.reporte_global.findFirst({ where: { solicitud_registro_id: ctx.solicitudId } });
  if (existenteGlobal?.estado_reporte === 'aprobado_coordinador') {
    console.log('↷ reporte global ya estaba aprobado_coordinador.');
  } else {
    const fechaSimuladaGlobal = new Date();
    fechaSimuladaGlobal.setUTCDate(fechaSimuladaGlobal.getUTCDate() + 5);
    let reporteGlobalId = existenteGlobal?.id;
    if (!existenteGlobal) {
      const envio = await enviarReporteGlobal(ctx.alumnoUsuarioId, 'Resumen global de todo el periodo de servicio social.', { ahora: fechaSimuladaGlobal });
      reporteGlobalId = envio.reporte.id;
      console.log(`✅ reporte global enviado (id ${reporteGlobalId}).`);
    }
    await aprobarComoProfesor(ctx.profesorUsuarioId, 'global', reporteGlobalId, { ahora: fechaSimuladaGlobal });
    console.log('✅ reporte global aprobado por el profesor.');
    await aprobarComoCoordinador(ctx.coordinadorUsuarioId, 'global', reporteGlobalId, { ahora: fechaSimuladaGlobal });
    console.log('✅ reporte global aprobado por coordinación.');
  }

  console.log('\n✅ Daniela debería cumplir ya los requisitos de CU-LSS-01.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en lss/00-horas-y-reportes-prueba.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main };
