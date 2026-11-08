// 00b-fases-fecha-periodo.js
//
// Cambia las fechas del periodo del video (evento_calendario/periodo_registro,
// ver 00-periodo-video.js) entre 3 "fases" para poder grabar CU-GR-01 mostrando
// que Daniela selecciona un periodo que inició el 1 de octubre de 2026, SIN
// arriesgar el auto-rechazo por vencimiento (RN-GR-04/RN-GR-63,
// gr.service.js::verificarYAplicarVencimiento) durante el resto de su registro.
//
// Uso: node 00b-fases-fecha-periodo.js fase1|fase2|fase3
//
// FASE 1 — "fechaInicio: 1 oct 2026 / fechaMaxExpediente: 21 sep 2026"
//   Para grabar EN CÁMARA el momento en que Daniela ve y selecciona este
//   periodo en /registro. Solo aparece en el listado gracias a la excepción
//   temporal en periodos.service.js (ver ese archivo, buscar
//   IDS_EXCEPCION_VIGENCIA_VIDEO). NO avances más allá de esta pantalla con
//   estas fechas puestas: en cuanto Daniela haga login, el sistema la
//   auto-rechazaría por vencimiento (fecha_max_expediente ya pasó) — pasa a
//   fase2 INMEDIATAMENTE después de capturar la selección.
//
// FASE 2 — valores seguros originales (los que ya traía el seed desde el
//   principio): para terminar de grabar el resto de GR (profesor acepta,
//   expediente, coordinador aprueba) sin ningún riesgo de vencimiento.
//
// FASE 3 — "fechaInicio: 1 oct 2026 / fechaMaxExpediente: 21 sep 2026" otra
//   vez, pero esta vez PERMANENTE: solo se aplica una vez que la solicitud
//   de Daniela ya llegó a 'alumno_asignado' (gr.service.js::ESTADOS_SIN_RELOJ
//   incluye ese estado — el chequeo de vencimiento queda desactivado para
//   ella para siempre, sin importar qué fecha tenga el periodo). A partir de
//   aquí ya es seguro correr ah/01-actividades-variadas.js.
//
// Cada fase limpia el caché de Redis de periodos vigentes (5 min de TTL en
// periodos.service.js) para que el cambio se refleje de inmediato al
// recargar /registro, sin esperar a que expire solo.

const prisma = require('../../lib/prisma');
const redis = require('../../lib/redis');
const { CACHE_KEY_PERIODOS } = require('../../modules/periodos/periodos.service');

const NOMBRE_EVENTO = 'Servicio Social — Video tutorial';

const FASES = {
  fase1: { fechaInicio: '2026-10-01', fechaMaxExpediente: '2026-09-21' },
  fase2: { fechaInicio: '2026-11-24', fechaMaxExpediente: '2026-11-09' },
  fase3: { fechaInicio: '2026-10-01', fechaMaxExpediente: '2026-09-21' },
};

async function main(nombreFase) {
  const fase = FASES[nombreFase];
  if (!fase) {
    throw new Error(`Fase desconocida: '${nombreFase}'. Usa fase1, fase2 o fase3.`);
  }

  const existente = await prisma.evento_calendario.findFirst({
    where: { nombre: NOMBRE_EVENTO, tipo: 'Periodo' },
    include: { periodo_registro: true },
  });
  if (!existente) {
    throw new Error(`No existe el periodo del video ("${NOMBRE_EVENTO}"). Corre primero 00-periodo-video.js.`);
  }

  if (nombreFase === 'fase3') {
    const solicitud = await prisma.solicitud_registro.findFirst({
      where: { periodo_registro_id: existente.periodo_registro.id },
    });
    if (!solicitud || solicitud.estado_solicitud !== 'alumno_asignado') {
      throw new Error(
        'fase3 solo es segura una vez que la solicitud de Daniela llegó a \'alumno_asignado\' ' +
        `(estado actual: ${solicitud ? solicitud.estado_solicitud : 'sin solicitud todavía'}). ` +
        'Antes de eso, fechaMaxExpediente en el pasado la auto-rechazaría en su próximo login. Termina GR en vivo primero.',
      );
    }
  }

  await prisma.evento_calendario.update({
    where: { id: existente.id },
    data: { fecha_inicio: new Date(fase.fechaInicio) },
  });
  await prisma.periodo_registro.update({
    where: { id: existente.periodo_registro.id },
    data: { fecha_max_expediente: new Date(fase.fechaMaxExpediente) },
  });

  try {
    await redis.del(CACHE_KEY_PERIODOS);
  } catch (err) {
    console.error('No se pudo limpiar el caché de periodos (no crítico, expira solo en 5 min):', err.message);
  }

  console.log(`✅ ${nombreFase} aplicada: fecha_inicio=${fase.fechaInicio}, fecha_max_expediente=${fase.fechaMaxExpediente}. Caché de periodos limpiado.`);
}

if (require.main === module) {
  const nombreFase = process.argv[2];
  main(nombreFase)
    .catch((e) => {
      console.error('❌ Error en 00b-fases-fecha-periodo.js:', e.message);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
      redis.quit().catch(() => {});
    });
}

module.exports = { main, FASES };
