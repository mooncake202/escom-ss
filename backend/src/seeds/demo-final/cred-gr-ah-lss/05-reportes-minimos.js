// 05-reportes-minimos.js
//
// Placeholder mínimo de REP (lo construye Sol a fondo en amd-pro-rep/):
// solo lo que LSS necesita que ya exista — RN-LSS-02 exige, para poder
// iniciar la liberación, al menos 6 reportes mensuales aprobados por
// coordinación + el reporte global aprobado (además de las 480h netas,
// que Itzel ya tiene por 04-ah.js).
//
// Recorre la cadena REAL de REP (enviarReporteMensual/enviarReporteGlobal +
// aprobarReporte de profesor y de coordinación — 2 funciones DISTINTAS con
// el mismo nombre, una por archivo) con `deps.ahora` simulado, mismo
// patrón ya probado en video-tutorial/lss/00-horas-y-reportes-prueba.js —
// incluyendo el mismo caso límite: Itzel completó sus 480h el 10 de
// diciembre (dentro de un periodo #7 parcial), así que el reporte global
// exige que ESE reporte específico ya esté enviado, no basta con 6.
//
// Firmas: en vez de dibujarlas en un canvas en vivo (como en el video),
// aquí se usan los PNG ya commiteados en firmas-referencia/ — el profesor y
// la alumna quedan con su rúbrica real guardada (guardarRubrica real,
// misma validación de imagen) sin ninguna acción manual.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');

const { guardarRubrica } = require('../../../modules/reportes/reportes.rubricas');
const { enviarReporteMensual } = require('../../../modules/reportes/reportes-envio.service');
const { enviarReporteGlobal } = require('../../../modules/reportes/reportes-global.service');
const { aprobarReporte: aprobarComoProfesor } = require('../../../modules/reportes/reportes-revision.service');
const { aprobarReporte: aprobarComoCoordinador } = require('../../../modules/reportes/reportes-validacion.service');
const { calcularPeriodoReporte, numeroPeriodoDeFecha, normalizarFechaISO } = require('../../../modules/reportes/reportes.periodos');

const CORREO_ALUMNA = 'fuentes1501@alumno.ipn.mx';
const BOLETA_ALUMNA = '2019631501';
const CORREO_PROFESOR = 'profesorcastillo@ipn.mx';
const CORREO_COORDINADOR = 'coordinadorherrera@ipn.mx';

const RUTA_FIRMA_PROFESOR = path.join(__dirname, '../firmas-referencia/firma_profesor.png');
const RUTA_FIRMA_ALUMNO = path.join(__dirname, '../firmas-referencia/firma_alumno.png');

const TEXTO_ACTIVIDADES = 'Digitalización, catalogación y respaldo de expedientes históricos del archivo escolar, conforme al avance registrado en bitácora.';

async function obtenerContexto() {
  const profesorUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_PROFESOR } });
  const coordinadorUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR } });
  const alumnoUsuario = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_ALUMNA } });
  const solicitud = await prisma.solicitud_registro.findFirst({
    where: { alumno_id: BOLETA_ALUMNA },
    include: { periodo_registro: { include: { evento_calendario: true } } },
  });

  if (!profesorUsuario || !coordinadorUsuario || !alumnoUsuario || !solicitud) {
    throw new Error('Faltan prerrequisitos — corre primero 01-cred.js, 02-ofertas-minimas.js, 03-gr.js y 04-ah.js.');
  }
  if (solicitud.estado_solicitud !== 'alumno_asignado') {
    throw new Error(`La solicitud de Itzel no está en alumno_asignado (estado actual: ${solicitud.estado_solicitud}).`);
  }

  return {
    profesorUsuarioId: profesorUsuario.id,
    coordinadorUsuarioId: coordinadorUsuario.id,
    alumnoUsuarioId: alumnoUsuario.id,
    solicitudId: solicitud.id,
    fechaInicioPeriodo: normalizarFechaISO(solicitud.periodo_registro.evento_calendario.fecha_inicio),
  };
}

async function sembrarRubricaSiFalta(usuarioId, rutaImagen) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (usuario.rubrica_imagen) {
    console.log(`↷ usuario ${usuarioId} ya tenía rúbrica guardada.`);
    return;
  }
  try {
    const buffer = fs.readFileSync(rutaImagen);
    await guardarRubrica(usuarioId, { buffer }, { prisma, ip: '127.0.0.1', ahora: new Date() });
    console.log(`✅ rúbrica guardada para usuario ${usuarioId} (${path.basename(rutaImagen)}).`);
  } catch (err) {
    // Puede pasar en una BD recién vaciada pero reusada sobre el mismo
    // volumen de uploads/: el archivo físico de una corrida anterior (mismo
    // correo_institucional → misma ruta) sigue en disco aunque la fila de
    // usuario sea nueva. guardarRubrica ya lo detecta (EEXIST en el archivo,
    // 'wx') y lo reporta como "ya registrada" — aquí simplemente se trata
    // como éxito (idempotente), nunca se sobreescribe nada a la fuerza.
    if (err.code === 'RUBRICA_YA_REGISTRADA') {
      // El archivo físico ya existe (de una corrida anterior sobre el mismo
      // volumen de uploads/, mismo correo/boleta), pero como guardarRubrica
      // abortó ANTES de actualizar la fila, usuario.rubrica_imagen se había
      // quedado en null — se sincroniza aquí mismo con la ruta real
      // (idéntica a la que guardarRubrica habría escrito), para que
      // tieneRubrica/requiereSubirRubrica (que sí leen la BD, no el disco)
      // no bloqueen el envío de reportes más adelante.
      const esProfesor = usuario.rol === 'profesor';
      const clave = esProfesor ? usuario.correo_institucional : (await prisma.alumno.findUnique({ where: { usuario_id: usuarioId } })).boleta;
      const rutaRelativa = path.posix.join(clave, 'Rubrica', 'rubrica.enc');
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { rubrica_imagen: rutaRelativa, rubrica_ip: '127.0.0.1', rubrica_fecha_registro: new Date() },
      });
      console.log(`↷ usuario ${usuarioId} ya tenía un archivo de rúbrica físico de una corrida anterior — BD sincronizada con esa ruta.`);
      return;
    }
    throw err;
  }
}

async function generarYAprobarReporteMensual(numero, fechaSimulada, ctx) {
  const yaExiste = await prisma.reporte_mensual.findFirst({
    where: { solicitud_registro_id: ctx.solicitudId, num_reporte: numero },
  });

  let reporteId;
  if (yaExiste) {
    reporteId = yaExiste.id;
    console.log(`↷ reporte mensual #${numero} ya existía (id ${reporteId}, estado ${yaExiste.estado_reporte}).`);
  } else {
    const resultado = await enviarReporteMensual(ctx.alumnoUsuarioId, TEXTO_ACTIVIDADES, { ahora: fechaSimulada });
    reporteId = resultado.reporte.id;
    console.log(`✅ reporte mensual #${numero} enviado (id ${reporteId}).`);
  }

  const actual = await prisma.reporte_mensual.findUnique({ where: { id: reporteId } });
  if (actual.estado_reporte === 'pendiente_revision_profesor') {
    await aprobarComoProfesor(ctx.profesorUsuarioId, 'mensual', reporteId, { ahora: fechaSimulada });
    console.log(`  -> aprobado por profesor.`);
  }
  const trasProfesor = await prisma.reporte_mensual.findUnique({ where: { id: reporteId } });
  if (trasProfesor.estado_reporte === 'pendiente_revision_coordinador') {
    await aprobarComoCoordinador(ctx.coordinadorUsuarioId, 'mensual', reporteId, { ahora: fechaSimulada });
    console.log(`  -> aprobado por coordinación.`);
  }
}

async function generarYAprobarReporteGlobal(fechaSimulada, ctx) {
  const yaExiste = await prisma.reporte_global.findFirst({ where: { solicitud_registro_id: ctx.solicitudId } });

  let reporteId;
  if (yaExiste) {
    reporteId = yaExiste.id;
    console.log(`↷ reporte global ya existía (id ${reporteId}, estado ${yaExiste.estado_reporte}).`);
  } else {
    const resultado = await enviarReporteGlobal(ctx.alumnoUsuarioId, TEXTO_ACTIVIDADES, { ahora: fechaSimulada });
    reporteId = resultado.reporte.id;
    console.log(`✅ reporte global enviado (id ${reporteId}).`);
  }

  const actual = await prisma.reporte_global.findUnique({ where: { id: reporteId } });
  if (actual.estado_reporte === 'pendiente_revision_profesor') {
    await aprobarComoProfesor(ctx.profesorUsuarioId, 'global', reporteId, { ahora: fechaSimulada });
    console.log(`  -> global aprobado por profesor.`);
  }
  const trasProfesor = await prisma.reporte_global.findUnique({ where: { id: reporteId } });
  if (trasProfesor.estado_reporte === 'pendiente_revision_coordinador') {
    await aprobarComoCoordinador(ctx.coordinadorUsuarioId, 'global', reporteId, { ahora: fechaSimulada });
    console.log(`  -> global aprobado por coordinación.`);
  }
}

async function main() {
  const ctx = await obtenerContexto();

  await sembrarRubricaSiFalta(ctx.profesorUsuarioId, RUTA_FIRMA_PROFESOR);
  await sembrarRubricaSiFalta(ctx.alumnoUsuarioId, RUTA_FIRMA_ALUMNO);

  // Última bitácora real de Itzel determina hasta qué número de reporte hay
  // datos — no se asume "6 meses" a ciegas (mismo criterio que el video:
  // ella completó sus 480h el 10 de diciembre, dentro de un periodo #7
  // parcial, así que el global va a exigir que ESE reporte específico ya
  // esté enviado).
  const ultimaBitacora = await prisma.bitacora.findFirst({
    where: { solicitud_registro_id: ctx.solicitudId },
    orderBy: { fecha_registro: 'desc' },
  });
  const ultimoNumeroConDatos = numeroPeriodoDeFecha({
    fechaInicio: ctx.fechaInicioPeriodo,
    fecha: normalizarFechaISO(ultimaBitacora.fecha_registro),
  });
  console.log(`Último periodo con bitácoras reales: #${ultimoNumeroConDatos}.`);

  for (let numero = 1; numero <= ultimoNumeroConDatos; numero++) {
    const periodo = calcularPeriodoReporte({ fechaInicio: ctx.fechaInicioPeriodo, numero });
    // +40 días de margen sobre el fin del periodo mensual — mismo valor ya
    // probado en el video, de sobra incluso sin cruce con vacaciones de
    // invierno (Itzel termina el 10 dic, antes del 21 dic).
    const fechaSimulada = new Date(new Date(periodo.fin).getTime() + 40 * 86400000);
    await generarYAprobarReporteMensual(numero, fechaSimulada, ctx);
  }

  const fechaSimuladaGlobal = new Date(Date.now());
  await generarYAprobarReporteGlobal(fechaSimuladaGlobal, ctx);

  console.log('✅ 05-reportes-minimos.js terminado.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en cred-gr-ah-lss/05-reportes-minimos.js:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, CORREO_ALUMNA, BOLETA_ALUMNA, CORREO_PROFESOR };
