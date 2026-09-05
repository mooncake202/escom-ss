// seed-ofertas-servicio.js
//
// Crea 8 ofertas de servicio social (2 por cada uno de los 4 profesores:
// profesor.test@ipn.mx + los 3 creados por seed-profesores-test.js), cada
// una con su relación deseo_de_carrera cuando aplica.
//
// REQUIERE haber corrido antes:
//   1. seed-test-users.js       (crea coordinador.test@ipn.mx y profesor.test@ipn.mx)
//   2. seed-profesores-test.js  (crea los 3 profesores adicionales)
//
// Es ATÓMICO (transacción de Prisma) y seguro de re-correr: si una oferta ya
// existe (comparando por nombre_proyecto), se omite en vez de duplicarla.
//
const prisma = require('./prisma'); // <-- ajusta este path

const ESTADO_OFERTA_ACTIVA = 'Aprobada';

const CORREO_COORDINADOR = 'coordinador.test@ipn.mx';

// Carreras del catálogo (mismos códigos que CARRERAS en el frontend).
// Si la tabla `carrera` todavía no tiene estos 3 registros, este script los
// crea (findFirst-or-create), para no depender de que exista un seed previo.
const CARRERAS_CATALOGO = ['ISC', 'IA', 'LCD'];

// Cada oferta se liga a un profesor por su correo (más legible que por id).
const DATOS_OFERTAS = [
  {
    profesorCorreo: 'profesor.test@ipn.mx',
    nombre_SISS: 'Sistema de gestión de bibliotecas escolares',
    nombre_proyecto: 'Sistema de gestión de bibliotecas escolares',
    tipo_oferta: 'proyecto',
    descripcion_actividades: 'Desarrollo de un sistema web para el control de préstamos, devoluciones e inventario de la biblioteca escolar, incluyendo panel administrativo y reportes de uso.',
    cupos_ofertados: 4,
    carrerasDeseadas: ['ISC', 'IA'],
  },
  {
    profesorCorreo: 'profesor.test@ipn.mx',
    nombre_SISS: 'Soporte técnico y mantenimiento de laboratorios',
    nombre_proyecto: 'Soporte técnico y mantenimiento de laboratorios de cómputo',
    tipo_oferta: 'individual',
    descripcion_actividades: 'Apoyo en mantenimiento preventivo y correctivo de equipo de cómputo, configuración de software académico y soporte a usuarios en los laboratorios del departamento.',
    cupos_ofertados: 2,
    carrerasDeseadas: [], // abierta a cualquier carrera
  },
  {
    profesorCorreo: 'jramirez@ipn.mx',
    nombre_SISS: 'App móvil para trámites escolares',
    nombre_proyecto: 'Desarrollo de aplicación móvil para trámites escolares',
    tipo_oferta: 'proyecto',
    descripcion_actividades: 'Diseño y desarrollo de una app móvil (Android/iOS) para que los alumnos realicen trámites administrativos comunes desde su teléfono, con backend propio y notificaciones push.',
    cupos_ofertados: 3,
    carrerasDeseadas: ['ISC'],
  },
  {
    profesorCorreo: 'jramirez@ipn.mx',
    nombre_SISS: 'Análisis de datos académicos con ML',
    nombre_proyecto: 'Análisis de datos académicos con Machine Learning',
    tipo_oferta: 'proyecto',
    descripcion_actividades: 'Construcción de modelos predictivos sobre datos históricos de desempeño académico para identificar factores de riesgo de deserción escolar.',
    cupos_ofertados: 3,
    carrerasDeseadas: ['IA', 'LCD'],
  },
  {
    profesorCorreo: 'lgomez@ipn.mx',
    nombre_SISS: 'Automatización de procesos administrativos',
    nombre_proyecto: 'Automatización de procesos administrativos internos',
    tipo_oferta: 'individual',
    descripcion_actividades: 'Automatización de tareas repetitivas de captura y validación de información administrativa mediante scripts y macros, reduciendo tiempo de procesamiento manual.',
    cupos_ofertados: 2,
    carrerasDeseadas: [],
  },
  {
    profesorCorreo: 'lgomez@ipn.mx',
    nombre_SISS: 'Plataforma de visualización de datos institucionales',
    nombre_proyecto: 'Plataforma de visualización de datos institucionales',
    tipo_oferta: 'proyecto',
    descripcion_actividades: 'Desarrollo de dashboards interactivos para visualizar indicadores institucionales (matrícula, egreso, servicio social) a partir de fuentes de datos existentes.',
    cupos_ofertados: 4,
    carrerasDeseadas: ['LCD'],
  },
  {
    profesorCorreo: 'rhernandez@ipn.mx',
    nombre_SISS: 'Ciberseguridad en redes del plantel',
    nombre_proyecto: 'Auditoría y ciberseguridad en redes del plantel',
    tipo_oferta: 'proyecto',
    descripcion_actividades: 'Apoyo en auditorías de seguridad de la red institucional, detección de vulnerabilidades y elaboración de recomendaciones de hardening.',
    cupos_ofertados: 3,
    carrerasDeseadas: ['ISC'],
  },
  {
    profesorCorreo: 'rhernandez@ipn.mx',
    nombre_SISS: 'Investigación aplicada en inteligencia artificial',
    nombre_proyecto: 'Investigación aplicada en inteligencia artificial',
    tipo_oferta: 'individual',
    descripcion_actividades: 'Apoyo en revisión bibliográfica, experimentación y documentación de resultados para un proyecto de investigación en curso sobre visión por computadora.',
    cupos_ofertados: 2,
    carrerasDeseadas: ['IA'],
  },
];

async function main() {
  // 1. Coordinador (todas las ofertas necesitan coordinador_id).
  const usuarioCoordinador = await prisma.usuario.findUnique({
    where: { correo_institucional: CORREO_COORDINADOR },
    include: { coordinador: true },
  });
  if (!usuarioCoordinador || !usuarioCoordinador.coordinador) {
    throw new Error(`No se encontró un coordinador con correo ${CORREO_COORDINADOR}. Corre primero seed-test-users.js.`);
  }
  const coordinadorId = usuarioCoordinador.coordinador.id;

  // 2. Resolver profesor_id de cada correo usado en DATOS_OFERTAS.
  const correosProfesores = [...new Set(DATOS_OFERTAS.map((o) => o.profesorCorreo))];
  const usuariosProfesores = await prisma.usuario.findMany({
    where: { correo_institucional: { in: correosProfesores } },
    include: { profesor: true },
  });

  const profesorIdPorCorreo = {};
  for (const u of usuariosProfesores) {
    if (!u.profesor) continue;
    profesorIdPorCorreo[u.correo_institucional] = u.profesor.id;
  }
  const faltantes = correosProfesores.filter((c) => !profesorIdPorCorreo[c]);
  if (faltantes.length > 0) {
    throw new Error(
      `No se encontró perfil de profesor para: ${faltantes.join(', ')}. ` +
      `Corre primero seed-test-users.js y seed-profesores-test.js.`
    );
  }

  // 3. Catálogo de carreras: buscar o crear (para no depender de un seed previo).
  const carreraIdPorNombre = {};
  for (const nombre of CARRERAS_CATALOGO) {
    let carrera = await prisma.carrera.findFirst({ where: { nombre } });
    if (!carrera) {
      carrera = await prisma.carrera.create({ data: { nombre } });
      console.log(`ℹ️  Carrera "${nombre}" no existía, se creó (id: ${carrera.id}).`);
    }
    carreraIdPorNombre[nombre] = carrera.id;
  }

  // 4. Pre-chequeo de duplicados por nombre_proyecto.
  const existentes = await prisma.oferta_servicio.findMany({
    where: { nombre_proyecto: { in: DATOS_OFERTAS.map((o) => o.nombre_proyecto) } },
    select: { nombre_proyecto: true },
  });
  const existentesSet = new Set(existentes.map((o) => o.nombre_proyecto));
  const nuevas = DATOS_OFERTAS.filter((o) => !existentesSet.has(o.nombre_proyecto));
  const omitidas = DATOS_OFERTAS.length - nuevas.length;

  if (nuevas.length === 0) {
    console.log('✅ Las 8 ofertas ya existían, no se insertó nada nuevo.');
    return;
  }

  const ahora = new Date();

  // 5. Inserción atómica.
  const creadas = await prisma.$transaction(async (tx) => {
    const nombres = [];

    for (const o of nuevas) {
      const ofertaCreada = await tx.oferta_servicio.create({
        data: {
          profesor_id: profesorIdPorCorreo[o.profesorCorreo],
          coordinador_id: coordinadorId,
          nombre_SISS: o.nombre_SISS,
          nombre_proyecto: o.nombre_proyecto,
          tipo_oferta: o.tipo_oferta,
          descripcion_actividades: o.descripcion_actividades,
          cupos_ofertados: o.cupos_ofertados,
          cupos_disponibles: o.cupos_ofertados, // nadie aceptado todavía
          estado_oferta: ESTADO_OFERTA_ACTIVA,
          fecha_registro: ahora,
        },
      });

      if (o.carrerasDeseadas.length > 0) {
        await tx.deseo_de_carrera.createMany({
          data: o.carrerasDeseadas.map((c) => ({
            oferta_id: ofertaCreada.id,
            carrera_id: carreraIdPorNombre[c],
          })),
        });
      }

      nombres.push(`${o.nombre_proyecto} (${o.profesorCorreo}, ${o.cupos_ofertados} cupos)`);
    }

    return nombres;
  });

  console.log(`✅ Transacción completada. ${creadas.length} ofertas creadas (${omitidas} ya existían y se omitieron):`);
  creadas.forEach((n) => console.log(`  - ${n}`));
}

main()
  .catch((e) => {
    console.error('❌ No se insertó nada (rollback automático).');
    console.error('   Motivo:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
