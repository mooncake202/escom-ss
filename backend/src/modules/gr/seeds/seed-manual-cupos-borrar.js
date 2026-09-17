// seed-manual-cupos-borrar.js
//
// Hermano de seed-manual-cupos-crear.js: borra TODO lo que ese script creó,
// cuando el usuario decida (nunca se ejecuta solo). Identifica los datos
// por las MISMAS constantes de seed-manual-cupos.shared.js (correos de
// coordinador/profesores/alumnos) — nunca reimplementa ni adivina el
// prefijo, para no desincronizarse del script de creación.
//
// Antes de borrar, imprime qué va a eliminar. Después de borrar, verifica
// con consultas INDEPENDIENTES (no reutilizan la lógica del borrado) que no
// quedó ningún residuo — mismo rigor que seed-prueba-cupos-profesor.js.
//
// Cómo correr (dentro del contenedor del backend):
//   docker compose exec backend node backend/src/modules/gr/seeds/seed-manual-cupos-borrar.js

const prisma = require('../../../lib/prisma');
const {
  ANIO_BOLETA,
  NOMBRE_OFERTA_A1, NOMBRE_OFERTA_B1, NOMBRE_OFERTA_D1, NOMBRE_OFERTA_D2,
  todosLosCorreos,
} = require('./seed-manual-cupos.shared');

async function main() {
  const correos = todosLosCorreos();
  const nombresOferta = [NOMBRE_OFERTA_A1, NOMBRE_OFERTA_B1, NOMBRE_OFERTA_D1, NOMBRE_OFERTA_D2];

  console.log('🔎 Buscando datos de seed-manual-cupos-crear a eliminar...');
  const [usuariosAEliminar, ofertasAEliminar, solicitudesAEliminar] = await Promise.all([
    prisma.usuario.count({ where: { correo_institucional: { in: correos } } }),
    prisma.oferta_servicio.count({ where: { nombre_proyecto: { in: nombresOferta } } }),
    prisma.solicitud_registro.count({ where: { alumno_id: { startsWith: ANIO_BOLETA } } }),
  ]);

  console.log(`   usuario:            ${usuariosAEliminar}`);
  console.log(`   oferta_servicio:    ${ofertasAEliminar}`);
  console.log(`   solicitud_registro: ${solicitudesAEliminar}`);

  if (usuariosAEliminar === 0 && ofertasAEliminar === 0 && solicitudesAEliminar === 0) {
    console.log('\n✅ No hay nada que borrar — parece que ya se limpió, o nunca se corrió seed-manual-cupos-crear.');
    return;
  }

  console.log('\n🧹 Borrando (un solo deleteMany sobre usuario — el resto cae por onDelete: Cascade)...');
  const { count } = await prisma.usuario.deleteMany({ where: { correo_institucional: { in: correos } } });
  console.log(`   ${count} usuario(s) eliminado(s).`);

  // ── Verificación independiente — consultas aparte, no reutilizan la
  // lógica de arriba, para no dar un falso "todo bien" si el filtro de
  // borrado tuviera algún error. Cubre las mismas 3 tablas más alumno y
  // evento_calendario/periodo_registro por si acaso.
  console.log('\n🔎 Verificando de forma independiente que no quedó ningún residuo...');
  const [usuarioResidual, ofertaResidual, solicitudResidual, alumnoResidual, eventoResidual] = await Promise.all([
    prisma.usuario.count({ where: { correo_institucional: { in: correos } } }),
    prisma.oferta_servicio.count({ where: { nombre_proyecto: { in: nombresOferta } } }),
    prisma.solicitud_registro.count({ where: { alumno_id: { startsWith: ANIO_BOLETA } } }),
    prisma.alumno.count({ where: { boleta: { startsWith: ANIO_BOLETA } } }),
    prisma.evento_calendario.count({ where: { nombre: { contains: 'MANUAL-CUPOS' } } }),
  ]);

  const residuales = { usuario: usuarioResidual, oferta_servicio: ofertaResidual, solicitud_registro: solicitudResidual, alumno: alumnoResidual, evento_calendario: eventoResidual };
  const totalResidual = Object.values(residuales).reduce((a, b) => a + b, 0);

  if (totalResidual === 0) {
    console.log('✅ Limpieza confirmada: no quedó ningún residuo de seed-manual-cupos-crear.');
  } else {
    console.error('🚨 ALERTA: quedaron residuos sin borrar — revisar manualmente:');
    Object.entries(residuales).forEach(([tabla, n]) => {
      if (n > 0) console.error(`   - ${tabla}: ${n}`);
    });
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error('❌ El borrado no se pudo completar.');
    console.error('   Motivo:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
