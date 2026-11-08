// 00-periodo-video.js
//
// El ÚNICO periodo de registro dedicado al video — separado de los 38 del demo
// a propósito, porque este sí se va a editar varias veces durante la grabación
// (técnica del "salto en el tiempo", ver backend/src/seeds/video-tutorial/README.md).
//
// Vive en la raíz de video-tutorial/, no dentro de cred/, porque crear un periodo
// es CU-ADM-08 (calendario), no un CU de CRED.

const prisma = require('../../lib/prisma');

const COORDINADOR_CORREO = 'coordinadorherrera@ipn.mx';

const PERIODO = {
  anio: '2027',
  semestre: 's01',
  fechaMaxExpediente: '2026-11-09',
  fechaInicio: '2026-11-24',
  fechaFin: '2027-06-24',
};

const NOMBRE_EVENTO = 'Servicio Social — Video tutorial';

async function main() {
  const coordinadorUsuario = await prisma.usuario.findUnique({
    where: { correo_institucional: COORDINADOR_CORREO },
    include: { coordinador: true },
  });
  if (!coordinadorUsuario || !coordinadorUsuario.coordinador) {
    throw new Error(`No existe el coordinador ${COORDINADOR_CORREO}. Corre primero 00-comun/index.js.`);
  }
  const coordinadorId = coordinadorUsuario.coordinador.id;

  const existente = await prisma.evento_calendario.findFirst({
    where: { nombre: NOMBRE_EVENTO, tipo: 'Periodo' },
    include: { periodo_registro: true },
  });

  if (existente) {
    console.log(`↷ periodo de video ya existía: ${NOMBRE_EVENTO} (evento_calendario.id ${existente.id}, periodo_registro.id ${existente.periodo_registro.id})`);
    return { eventoId: existente.id, periodoRegistroId: existente.periodo_registro.id };
  }

  const evento = await prisma.evento_calendario.create({
    data: {
      coordinador_id: coordinadorId,
      nombre: NOMBRE_EVENTO,
      tipo: 'Periodo',
      fecha_inicio: new Date(PERIODO.fechaInicio),
      fecha_fin: new Date(PERIODO.fechaFin),
    },
  });
  const periodoRegistro = await prisma.periodo_registro.create({
    data: {
      evento_calendario_id: evento.id,
      anio: PERIODO.anio,
      semestre: PERIODO.semestre,
      fecha_max_expediente: new Date(PERIODO.fechaMaxExpediente),
    },
  });

  console.log(`✅ periodo de video creado: ${NOMBRE_EVENTO} (evento_calendario.id ${evento.id}, periodo_registro.id ${periodoRegistro.id})`);
  return { eventoId: evento.id, periodoRegistroId: periodoRegistro.id };
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en 00-periodo-video.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, PERIODO };
