// 01-actividades-variadas.js
//
// IMPORTANTE: este seed se corre DESPUÉS de que Karen termine de grabar GR en
// vivo Y después de aplicar 00b-fases-fecha-periodo.js fase3 (fecha_inicio ya
// en 1 de octubre de 2026, de forma permanente — ver ese script). No crea al
// alumno ni la solicitud: los busca. Si no los encuentra, o si la fase3 no se
// aplicó todavía, lanza error claro pidiendo terminar esos pasos primero.
//
// Fechas ANCLADAS a octubre de 2026 (no relativas a "hoy"): el periodo
// mensual #1 (CU-REP-01) necesario para que Sol pueda generar/mostrar el
// "Reporte de octubre" va de 1 al 30 de octubre — por eso el contenido real
// (bitácoras aprobadas, avances) tiene que vivir DENTRO de esa ventana, sin
// importar qué día se corra este script.
//
// Qué deja preparado (para no tener que grabar en vivo cada estado posible
// de CU-AH-02, RN-AH-08): 6 actividades —
//   1. "Sin comenzar" (referencia, se deja intacta, solo para ver).
//   2. "En progreso" (45%), con una bitácora RECHAZADA previa en octubre
//      (muestra CU-AH-04 flujo alterno sin generar falta) y una bitácora
//      APROBADA, también en octubre, que la dejó en 45%. Su fecha_limite
//      queda en noviembre (todavía no vence).
//   3. "Vencida" (fecha_limite ya pasada dentro de octubre, sin avance).
//   4. "Completada a tiempo" (100%, fecha_completada <= fecha_limite,
//      ambas en octubre).
//   5. "Completada tarde" (100%, fecha_completada > fecha_limite, dentro de
//      octubre) — el estado real en código es 'completada_tarde', NO
//      'completada_fuera_de_tiempo' como decía la ficha de CU-AH-02.
//   6. "Sin comenzar" ADICIONAL, con fecha de asignación/límite en noviembre,
//      para que Karen grabe en vivo el ciclo completo de CU-AH-03/04
//      (iniciar/finalizar jornada, reportar avance, profesor revisa).
//
// Las actividades 4 y 5 se completan el mismo día de octubre (misma
// bitácora, dos avances) — válido: el sistema permite reportar varias
// actividades en una sola jornada. Una es "a tiempo" y la otra "tarde"
// porque lo que importa es la fecha_limite de CADA UNA, no el día en que se
// completan.
//
// cumulo_horas_y_faltas se actualiza exactamente como lo haría
// confirmarBitacora/rechazarBitacora reales (horas_acumuladas incrementa al
// registrar, horas_rechazadas incrementa solo al rechazar) — ver
// backend/src/modules/ah/ah-alumno.service.js y ah-profesor.service.js. Se
// usa el mismo helper real `obtenerOCrearCumulo` (ah.shared.js) para crear
// el cúmulo si todavía no existe — en el flujo real se crea perezosamente la
// primera vez que el alumno inicia una jornada, y como aquí insertamos
// bitácoras directo por seed, nadie más lo habría creado antes.
//
// `fecha_ultima_evaluacion_faltas` se deja fijada a AYER (respecto al día en
// que se corre este script) a propósito: el cron de faltas
// (ah.cron.js::contabilizarFaltasDiarias) recorre desde
// max(fecha_inicio, fecha_ultima_evaluacion_faltas + 1 día) — sin este
// ajuste, al ser fecha_inicio=1 de octubre, la primera corrida del cron
// cobraría de golpe ~25 faltas retroactivas (todos los días hábiles de
// octubre sin bitácora), arruinando el happy path. Con este campo ya en
// "ayer", el cron nunca mira hacia atrás de ese punto — empieza a contar
// faltas desde HOY en adelante, como si el alumno recién empezara.

const prisma = require('../../../lib/prisma');
const { obtenerOCrearCumulo } = require('../../../modules/ah/ah.shared');

const CORREO_PROFESOR = 'profesornavarro@ipn.mx';
const BOLETA_ALUMNA = '2021630001';

function hoyUTC() {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
}

function diasHabilesDesde(fechaBase, delta) {
  // Simplificación deliberada (igual que el resto de los seeds): solo evita
  // sábado/domingo, no festivos/inhábiles del calendario — suficiente para
  // datos de ejemplo, no para validación real de formulario.
  const fecha = new Date(fechaBase);
  const paso = delta >= 0 ? 1 : -1;
  let restantes = Math.abs(delta);
  while (restantes > 0) {
    fecha.setUTCDate(fecha.getUTCDate() + paso);
    const dow = fecha.getUTCDay();
    if (dow !== 0 && dow !== 6) restantes--;
  }
  return fecha;
}

const HOY = hoyUTC();
const AYER = new Date(HOY);
AYER.setUTCDate(AYER.getUTCDate() - 1); // calendario puro, no necesita ser día hábil

// Fechas fijas de octubre 2026 (todas días hábiles, L-V, verificadas):
const OCT_06 = new Date('2026-10-06'); // martes
const OCT_13 = new Date('2026-10-13'); // martes
const OCT_15 = new Date('2026-10-15'); // jueves
const OCT_20 = new Date('2026-10-20'); // martes
const OCT_27 = new Date('2026-10-27'); // martes
const OCT_29 = new Date('2026-10-29'); // jueves
const FECHA_INICIO_PERIODO = new Date('2026-10-01');

const ACTIVIDADES = {
  sinComenzarReferencia: {
    titulo: 'Diseñar diagrama entidad-relación del módulo de reportes',
    descripcion: 'Elaborar el diagrama E-R de las entidades necesarias para el módulo de generación de reportes mensuales, incluyendo su relación con bitácoras y actividades.',
    entregable_esperado: 'Diagrama E-R en formato editable (draw.io o similar) más export a PNG.',
    fecha_limite: diasHabilesDesde(HOY, 12),
    fecha_asignacion: new Date('2026-10-05'),
  },
  enProgreso: {
    titulo: 'Implementar formulario de captura de avances',
    descripcion: 'Desarrollar el formulario web que permite capturar el porcentaje de avance y evidencia de cada actividad dentro de la bitácora diaria.',
    entregable_esperado: 'Formulario funcional integrado al sistema, con validaciones de campos obligatorios.',
    fecha_limite: diasHabilesDesde(HOY, 8),
    fecha_asignacion: FECHA_INICIO_PERIODO,
  },
  vencida: {
    titulo: 'Documentar manual de usuario del módulo de consulta',
    descripcion: 'Redactar el manual de usuario explicando cómo consultar actividades asignadas y su historial desde el rol de alumno.',
    entregable_esperado: 'Documento PDF con capturas de pantalla y explicación paso a paso.',
    fecha_limite: OCT_20,
    fecha_asignacion: FECHA_INICIO_PERIODO,
  },
  completadaATiempo: {
    titulo: 'Configurar entorno de pruebas del sistema',
    descripcion: 'Preparar el entorno de pruebas (datos de ejemplo, usuarios de prueba) para validar el módulo de seguimiento académico antes de su liberación.',
    entregable_esperado: 'Entorno de pruebas accesible, con guía breve de cómo reiniciarlo.',
    fecha_limite: OCT_29,
    fecha_asignacion: FECHA_INICIO_PERIODO,
  },
  completadaTarde: {
    titulo: 'Elaborar reporte de pruebas funcionales',
    descripcion: 'Documentar los casos de prueba ejecutados sobre el módulo de seguimiento académico y sus resultados.',
    entregable_esperado: 'Reporte de pruebas en formato tabular (casos, resultado esperado, resultado obtenido).',
    fecha_limite: OCT_15,
    fecha_asignacion: FECHA_INICIO_PERIODO,
  },
  paraGrabarEnVivo: {
    titulo: 'Generar reportes de avance en formato PDF',
    descripcion: 'Implementar la función que exporta el resumen de avance del proyecto a un documento PDF descargable.',
    entregable_esperado: 'Función de exportación a PDF integrada, con un ejemplo de documento generado.',
    fecha_limite: diasHabilesDesde(HOY, 8),
    // fecha_asignacion la pone el controlador real al momento de asignarla EN VIVO (CU-AH-01) — no se fija aquí.
  },
};

async function obtenerContexto() {
  const profesorUsuario = await prisma.usuario.findUnique({
    where: { correo_institucional: CORREO_PROFESOR },
    include: { profesor: true },
  });
  if (!profesorUsuario || !profesorUsuario.profesor) {
    throw new Error(`No existe el profesor ${CORREO_PROFESOR}. Corre primero cred/01-profesor.js.`);
  }

  const solicitud = await prisma.solicitud_registro.findUnique({
    where: { alumno_id: BOLETA_ALUMNA },
    include: { periodo_registro: { include: { evento_calendario: true } } },
  });
  if (!solicitud) {
    throw new Error(
      `No existe solicitud_registro para la boleta ${BOLETA_ALUMNA}. Esto significa que Daniela ` +
      `todavía no se ha registrado — corre primero el GR completo EN VIVO (CU-GR-01 a CU-GR-09, ` +
      `hasta que el coordinador apruebe el expediente) y vuelve a correr este seed después.`,
    );
  }
  if (solicitud.estado_solicitud !== 'alumno_asignado') {
    throw new Error(
      `La solicitud de Daniela existe pero su estado_solicitud es '${solicitud.estado_solicitud}', ` +
      `no 'alumno_asignado'. Termina el flujo de GR en vivo hasta que el coordinador apruebe el ` +
      `expediente antes de correr este seed.`,
    );
  }

  const fechaInicioPeriodo = solicitud.periodo_registro?.evento_calendario?.fecha_inicio ?? null;
  const yaEsOctubre = fechaInicioPeriodo
    && new Date(fechaInicioPeriodo).toISOString().slice(0, 10) === '2026-10-01';
  if (!yaEsOctubre) {
    throw new Error(
      `El periodo de Daniela todavía no tiene fecha_inicio=2026-10-01 (tiene: ${fechaInicioPeriodo}). ` +
      `Corre primero 00b-fases-fecha-periodo.js fase3 antes de este seed.`,
    );
  }

  return { profesor: profesorUsuario.profesor, solicitud };
}

async function crearActividadSiNoExiste(solicitudRegistroId, datos, extra = {}) {
  const existente = await prisma.actividad.findFirst({
    where: { solicitud_registro_id: solicitudRegistroId, titulo: datos.titulo },
  });
  if (existente) {
    console.log(`↷ actividad ya existía: ${datos.titulo} (actividad.id ${existente.id}, estado ${existente.estado})`);
    return existente;
  }

  const actividad = await prisma.actividad.create({
    data: {
      solicitud_registro_id: solicitudRegistroId,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      entregable_esperado: datos.entregable_esperado,
      fecha_limite: datos.fecha_limite,
      fecha_asignacion: datos.fecha_asignacion ?? new Date(),
      estado: extra.estado ?? 'sin_comenzar',
      porcentaje_progreso: extra.porcentaje_progreso ?? 0,
      fecha_completada: extra.fecha_completada ?? null,
    },
  });
  console.log(`✅ actividad creada: ${datos.titulo} (actividad.id ${actividad.id}, estado ${actividad.estado})`);
  return actividad;
}

async function crearBitacoraConAvancesSiNoExiste(solicitudRegistroId, fechaRegistro, { horas, estado, motivoRechazo, revisadoPorId, avances }) {
  const existente = await prisma.bitacora.findFirst({
    where: { solicitud_registro_id: solicitudRegistroId, fecha_registro: fechaRegistro },
  });
  if (existente) {
    console.log(`↷ bitácora ya existía para ${fechaRegistro.toISOString().slice(0, 10)} (bitacora.id ${existente.id}, estado ${existente.estado})`);
    return { bitacora: existente, creada: false };
  }

  const horaInicio = new Date(fechaRegistro);
  horaInicio.setUTCHours(15, 0, 0, 0); // 09:00 hora México (UTC-6)
  const horaFin = new Date(horaInicio.getTime() + horas * 3600 * 1000);

  const bitacora = await prisma.bitacora.create({
    data: {
      solicitud_registro_id: solicitudRegistroId,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      horas_contabilizadas: horas,
      estado,
      fecha_registro: fechaRegistro,
      motivo_rechazo: motivoRechazo ?? null,
      fecha_revision: new Date(fechaRegistro.getTime() + 3600 * 1000),
      revisado_por_id: revisadoPorId,
    },
  });

  await prisma.registro_bitacora_actividades.createMany({
    data: avances.map((a) => ({
      bitacora_id: bitacora.id,
      actividad_id: a.actividadId,
      descripcion: a.descripcion,
      porcentaje_avance_registrado: a.porcentaje,
      evidencia: a.evidencia,
    })),
  });

  console.log(`✅ bitácora creada para ${fechaRegistro.toISOString().slice(0, 10)} (bitacora.id ${bitacora.id}, estado ${estado}, ${horas}h)`);
  return { bitacora, creada: true };
}

async function main() {
  const { profesor, solicitud } = await obtenerContexto();
  const solicitudId = solicitud.id;

  await obtenerOCrearCumulo(BOLETA_ALUMNA);

  // Deja el cúmulo "al día" a AYER para que el cron de faltas nunca mire
  // hacia atrás de ese punto (ver nota larga arriba del archivo).
  await prisma.cumulo_horas_y_faltas.update({
    where: { alumno_id: BOLETA_ALUMNA },
    data: { fecha_ultima_evaluacion_faltas: AYER },
  });

  // 1. Sin comenzar (referencia, no se toca después)
  await crearActividadSiNoExiste(solicitudId, ACTIVIDADES.sinComenzarReferencia);

  // 2. En progreso: bitácora rechazada (30%, 6 oct) + bitácora aprobada (sube a 45%, 13 oct)
  const actEnProgreso = await crearActividadSiNoExiste(solicitudId, ACTIVIDADES.enProgreso);

  const { creada: rechazoCreada } = await crearBitacoraConAvancesSiNoExiste(solicitudId, OCT_06, {
    horas: 2,
    estado: 'rechazada',
    motivoRechazo: 'Evidencia insuficiente: favor de anexar capturas del formulario ya implementado, no solo la descripción.',
    revisadoPorId: profesor.id,
    avances: [{
      actividadId: actEnProgreso.id,
      descripcion: 'Se maquetó el formulario de captura de avances con sus campos principales.',
      porcentaje: 30,
      evidencia: 'Sin URL adjunta — pendiente de corrección señalada por el profesor.',
    }],
  });
  if (rechazoCreada) {
    await prisma.cumulo_horas_y_faltas.update({
      where: { alumno_id: BOLETA_ALUMNA },
      data: { horas_acumuladas: { increment: 2 }, horas_rechazadas: { increment: 2 } },
    });
    await prisma.actividad.update({ where: { id: actEnProgreso.id }, data: { porcentaje_progreso: 30, estado: 'en_progreso' } });
  }

  const { creada: aprobadaCreada } = await crearBitacoraConAvancesSiNoExiste(solicitudId, OCT_13, {
    horas: 3,
    estado: 'aprobada',
    revisadoPorId: profesor.id,
    avances: [{
      actividadId: actEnProgreso.id,
      descripcion: 'Se agregaron las validaciones de campos obligatorios y el manejo de errores del formulario.',
      porcentaje: 45,
      evidencia: 'https://ejemplo-interno.escom.ipn.mx/avances/formulario-captura-v2',
    }],
  });
  if (aprobadaCreada) {
    await prisma.cumulo_horas_y_faltas.update({
      where: { alumno_id: BOLETA_ALUMNA },
      data: { horas_acumuladas: { increment: 3 } },
    });
    await prisma.actividad.update({ where: { id: actEnProgreso.id }, data: { porcentaje_progreso: 45, estado: 'en_progreso' } });
  }

  // 3. Vencida (sin avance, fecha_limite 20 de octubre ya pasada)
  await crearActividadSiNoExiste(solicitudId, ACTIVIDADES.vencida, { estado: 'vencida' });

  // 4 y 5: completadas el mismo día de octubre (27 oct, misma bitácora), una a tiempo y otra tarde
  const actATiempo = await crearActividadSiNoExiste(solicitudId, ACTIVIDADES.completadaATiempo);
  const actTarde = await crearActividadSiNoExiste(solicitudId, ACTIVIDADES.completadaTarde, { estado: 'vencida' });

  const { creada: cierreCreado } = await crearBitacoraConAvancesSiNoExiste(solicitudId, OCT_27, {
    horas: 4,
    estado: 'aprobada',
    revisadoPorId: profesor.id,
    avances: [
      {
        actividadId: actATiempo.id,
        descripcion: 'Se finalizó la configuración del entorno de pruebas, incluyendo datos de ejemplo y guía de reinicio.',
        porcentaje: 100,
        evidencia: 'https://ejemplo-interno.escom.ipn.mx/avances/entorno-pruebas-final',
      },
      {
        actividadId: actTarde.id,
        descripcion: 'Se concluyó el reporte de pruebas funcionales con todos los casos documentados.',
        porcentaje: 100,
        evidencia: 'https://ejemplo-interno.escom.ipn.mx/avances/reporte-pruebas-final',
      },
    ],
  });
  if (cierreCreado) {
    await prisma.cumulo_horas_y_faltas.update({
      where: { alumno_id: BOLETA_ALUMNA },
      data: { horas_acumuladas: { increment: 4 } },
    });
    await prisma.actividad.update({
      where: { id: actATiempo.id },
      data: { porcentaje_progreso: 100, estado: 'completada_a_tiempo', fecha_completada: OCT_27 },
    });
    await prisma.actividad.update({
      where: { id: actTarde.id },
      data: { porcentaje_progreso: 100, estado: 'completada_tarde', fecha_completada: OCT_27 },
    });
  }

  // 6. Sin comenzar — para que Karen la use EN VIVO (AH-03/04 completo)
  await crearActividadSiNoExiste(solicitudId, ACTIVIDADES.paraGrabarEnVivo);

  const cumuloFinal = await prisma.cumulo_horas_y_faltas.findUnique({ where: { alumno_id: BOLETA_ALUMNA } });
  console.log(`\nResumen cúmulo de Daniela: horas_acumuladas=${cumuloFinal.horas_acumuladas}, horas_rechazadas=${cumuloFinal.horas_rechazadas} (netas=${cumuloFinal.horas_acumuladas - cumuloFinal.horas_rechazadas}), fecha_ultima_evaluacion_faltas=${cumuloFinal.fecha_ultima_evaluacion_faltas.toISOString().slice(0, 10)}.`);

  return { solicitudId };
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en ah/01-actividades-variadas.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, ACTIVIDADES, BOLETA_ALUMNA, CORREO_PROFESOR };
