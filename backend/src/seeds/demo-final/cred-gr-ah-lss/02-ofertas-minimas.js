// 02-ofertas-minimas.js
//
// Placeholder mínimo de PRO (lo construye Sol a fondo después): aquí solo
// se insertan ofertas YA APROBADAS, con la forma EXACTA que deja el flujo
// real de aprobación (ver video-tutorial/gr/00-oferta-prerequisito.js,
// mismo patrón) — nada inventado en los campos. GR necesita que estas
// ofertas ya existan para poder sembrar sus propios escenarios en 03-gr.js.
//
// Una oferta "individual" por escenario (cupos_disponibles tope 1, como
// cualquier oferta individual real) — algunos profesores tienen más de una
// oferta porque varios escenarios de GR necesitan profesores/alumnos
// distintos para no interferir entre sí. Ver demo-final/CUENTAS.md para el
// mapeo completo caso -> correo.

const prisma = require('../../../lib/prisma');

const CORREO_COORDINADOR_APRUEBA = 'coordinadorherrera@ipn.mx';

// profesor_correo -> [ofertas de ese profesor]
const OFERTAS_POR_PROFESOR = {
  'profesorcastillo@ipn.mx': [
    { clave: 'A1', nombre_proyecto: 'Desarrollo de portal de trámites escolares', carreraDeseada: 'ISC' },
    { clave: 'H1', nombre_proyecto: 'Automatización de reportes de biblioteca', carreraDeseada: 'ISC' },
    { clave: 'O1', nombre_proyecto: 'Digitalización del archivo histórico escolar', carreraDeseada: 'ISC' },
  ],
  'profesorvaldez@ipn.mx': [
    { clave: 'B1', nombre_proyecto: 'Sistema de recomendación para tutorías académicas', carreraDeseada: 'IA' },
    { clave: 'N1', nombre_proyecto: 'Monitoreo de laboratorios de cómputo', carreraDeseada: 'IA' },
  ],
  'profesorromero@ipn.mx': [
    { clave: 'C1', nombre_proyecto: 'Plataforma de seguimiento de prácticas profesionales', carreraDeseada: 'ISC' },
    { clave: 'I1', nombre_proyecto: 'Rediseño del catálogo de servicios estudiantiles', carreraDeseada: 'ISC' },
    { clave: 'P1', nombre_proyecto: 'Rediseño de la plataforma de becas (liberación)', carreraDeseada: 'ISC' },
  ],
  'profesorochoa@ipn.mx': [
    { clave: 'D1', nombre_proyecto: 'Análisis de datos de deserción escolar', carreraDeseada: 'LCD' },
    { clave: 'J1', nombre_proyecto: 'Visualización de indicadores institucionales', carreraDeseada: 'LCD' },
    { clave: 'Q1', nombre_proyecto: 'Visualización de indicadores institucionales (liberación)', carreraDeseada: 'LCD' },
  ],
  'profesorsandoval@ipn.mx': [
    { clave: 'E1', nombre_proyecto: 'Modernización del sistema de control escolar', carreraDeseada: 'ISC' },
    { clave: 'K1', nombre_proyecto: 'Integración de firma electrónica en trámites internos', carreraDeseada: 'ISC' },
    { clave: 'R1', nombre_proyecto: 'Monitoreo de laboratorios de cómputo (liberación)', carreraDeseada: 'ISC' },
  ],
  'profesorfigueroa@ipn.mx': [
    { clave: 'F1', nombre_proyecto: 'Sistema de seguimiento académico', carreraDeseada: 'ISC' },
    { clave: 'L1', nombre_proyecto: 'Rediseño de la plataforma de becas', carreraDeseada: 'ISC' },
  ],
  'profesorvega@ipn.mx': [
    { clave: 'G1', nombre_proyecto: 'Club de robótica — apoyo en talleres', carreraDeseada: 'ISC' },
    { clave: 'M1', nombre_proyecto: 'Difusión de actividades deportivas y culturales', carreraDeseada: 'ISC' },
  ],
};

async function sembrarOferta(profesorUsuarioId, profesorId, coordinadorId, datos) {
  const existente = await prisma.oferta_servicio.findFirst({
    where: { nombre_proyecto: datos.nombre_proyecto, profesor_id: profesorId },
  });
  if (existente) {
    console.log(`↷ oferta ${datos.clave} ya existía: ${datos.nombre_proyecto} (id ${existente.id})`);
    return existente.id;
  }

  const carrera = await prisma.carrera.findFirst({ where: { nombre: datos.carreraDeseada } });
  if (!carrera) throw new Error(`No existe la carrera ${datos.carreraDeseada}. Corre primero demo-final/00-comun/.`);

  const oferta = await prisma.oferta_servicio.create({
    data: {
      profesor_id: profesorId,
      coordinador_id: coordinadorId,
      nombre_proyecto: datos.nombre_proyecto,
      descripcion_actividades: `El alumno apoyará en el desarrollo y seguimiento de "${datos.nombre_proyecto}", incluyendo captura de datos, pruebas funcionales y documentación.`,
      tipo_oferta: 'individual',
      programa_SISS: 'ESCOM - APLICACIONES DE LA ING. EN SISTEMAS COMPUTACIONALES PARA EL SERVICIO SOCIAL',
      nombre_SISS: 'APLICACIÓN, DISEÑO, PRODUCCIÓN Y DIFUSIÓN DE LA ING, EN SISTEMAS COMPUTACIONALES',
      cupos_ofertados: null,
      cupos_disponibles: 1,
      estado_oferta: 'aprobada',
      fecha_registro: new Date(),
      motivo_rechazo: null,
      deseo_de_carrera: { create: [{ carrera: { connect: { id: carrera.id } } }] },
    },
  });

  console.log(`✅ oferta ${datos.clave} creada y aprobada: ${datos.nombre_proyecto} (id ${oferta.id}, profesor ${profesorUsuarioId})`);
  return oferta.id;
}

async function main() {
  const coordinador = await prisma.usuario.findUnique({ where: { correo_institucional: CORREO_COORDINADOR_APRUEBA } });
  if (!coordinador) throw new Error(`No existe ${CORREO_COORDINADOR_APRUEBA} — corre primero demo-final/00-comun/.`);
  const coordinadorRow = await prisma.coordinador.findUnique({ where: { usuario_id: coordinador.id } });

  const idsPorClave = {};

  for (const [correoProfesor, ofertas] of Object.entries(OFERTAS_POR_PROFESOR)) {
    const usuarioProfesor = await prisma.usuario.findUnique({ where: { correo_institucional: correoProfesor } });
    if (!usuarioProfesor) throw new Error(`No existe ${correoProfesor} — corre primero cred-gr-ah-lss/01-cred.js.`);
    const profesorRow = await prisma.profesor.findUnique({ where: { usuario_id: usuarioProfesor.id } });

    for (const datos of ofertas) {
      const ofertaId = await sembrarOferta(usuarioProfesor.id, profesorRow.id, coordinadorRow.id, datos);
      idsPorClave[datos.clave] = { ofertaId, profesorUsuarioId: usuarioProfesor.id, profesorId: profesorRow.id };
    }
  }

  return idsPorClave;
}

if (require.main === module) {
  main()
    .then((ids) => console.log('Mapa de ofertas:', ids))
    .catch((e) => {
      console.error('❌ Error en cred-gr-ah-lss/02-ofertas-minimas.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, OFERTAS_POR_PROFESOR };
