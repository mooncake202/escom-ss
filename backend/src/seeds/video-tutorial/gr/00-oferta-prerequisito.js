// 00-oferta-prerequisito.js
//
// La oferta a la que Daniela se va a registrar en GR. CU-GR-01 exige elegir
// una oferta YA APROBADA en su paso 3 — sin esto, el registro en vivo no puede
// completarse. Igual que 02-ofertas-minimas.js en demo-final: esto NO es el
// módulo PRO real (eso lo construye Sol), es solo el prerequisito mínimo que
// GR necesita que ya exista.
//
// Se inserta directo por Prisma, pero con la forma EXACTA que deja el flujo
// real de aprobación (CU-PRO-01 + CU-PRO-02, ver backend/src/modules/ofertas/
// ofertas.controller.js y ofertas.service.js::decidirOferta) — nada inventado:
//   - estado_oferta: 'aprobada' (string real, en minúsculas — confirmado en
//     ofertas.service.js, no 'Aprobada' como algún seed viejo del proyecto).
//   - programa_SISS / nombre_SISS: solo se llenan al aprobar, nunca al crear
//     la solicitud — aquí ya aprobada, así que ambos van llenos con valores
//     reales del catálogo fijo que usa CU-PRO-02 (DecisionPanel.jsx), los
//     mismos que se usaron en la prueba en vivo del 2026-11-08.
//   - cupos_ofertados: null / cupos_disponibles: 1 — así es una oferta
//     individual (no es "proyecto", que sí usa cupos_ofertados).
//   - coordinador_id: el coordinador que la aprobó (no null, porque ya está
//     decidida).
//   - deseo_de_carrera: ISC (la carrera de Daniela).

const prisma = require('../../../lib/prisma');
const coordinadoresSeed = require('../../demo-final/00-comun/02-coordinadores');
const profesorSeed = require('../cred/01-profesor');

const OFERTA = {
  nombre_proyecto: 'Desarrollo de sistema de seguimiento academico',
  descripcion_actividades:
    'El alumno apoyara en el desarrollo y mantenimiento de un sistema interno de seguimiento academico, incluyendo captura de datos, generacion de reportes y pruebas funcionales.',
  tipo_oferta: 'individual',
  // Catálogo fijo real de CU-PRO-02 (DecisionPanel.jsx) — valores literales, no inventados.
  programa_SISS: 'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL',
  nombre_SISS: 'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES',
  carreraDeseada: 'ISC',
};

async function main() {
  const profesor = await profesorSeed.main();
  const coordinadores = await coordinadoresSeed.main();
  const coordinadorId = coordinadores[0].coordinadorId;

  const existente = await prisma.oferta_servicio.findFirst({
    where: { nombre_proyecto: OFERTA.nombre_proyecto, profesor_id: profesor.profesorId },
  });
  if (existente) {
    console.log(`↷ oferta ya existía: ${OFERTA.nombre_proyecto} (oferta_servicio.id ${existente.id}, estado ${existente.estado_oferta})`);
    return { ofertaId: existente.id };
  }

  const carrera = await prisma.carrera.findFirst({ where: { nombre: OFERTA.carreraDeseada } });
  if (!carrera) {
    throw new Error(`No existe la carrera ${OFERTA.carreraDeseada}. Corre primero demo-final/00-comun/index.js.`);
  }

  const oferta = await prisma.oferta_servicio.create({
    data: {
      profesor_id: profesor.profesorId,
      coordinador_id: coordinadorId,
      nombre_proyecto: OFERTA.nombre_proyecto,
      descripcion_actividades: OFERTA.descripcion_actividades,
      tipo_oferta: OFERTA.tipo_oferta,
      programa_SISS: OFERTA.programa_SISS,
      nombre_SISS: OFERTA.nombre_SISS,
      cupos_ofertados: null,
      cupos_disponibles: 1,
      estado_oferta: 'aprobada',
      fecha_registro: new Date(),
      motivo_rechazo: null,
      deseo_de_carrera: {
        create: [{ carrera: { connect: { id: carrera.id } } }],
      },
    },
  });

  console.log(`✅ oferta creada y aprobada: ${OFERTA.nombre_proyecto} (oferta_servicio.id ${oferta.id})`);
  return { ofertaId: oferta.id };
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en gr/00-oferta-prerequisito.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, OFERTA };
