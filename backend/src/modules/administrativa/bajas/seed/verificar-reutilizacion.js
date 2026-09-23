// SEGUNDA ETAPA — NO EJECUTAR TODAVÍA.
//
// Comprueba que, después de una baja APROBADA de verdad (con COMMIT), la misma boleta y el mismo
// correo del alumno E2E vuelven a estar libres y pueden registrarse desde cero.
//
// Es la prueba de que el borrado liberó los TRES índices únicos que bloquean el regreso:
//   solicitud_registro.alumno_id (UNIQUE) · alumno.boleta (PK) · usuario.correo_institucional (UNIQUE)
// y de que solo borrando `usuario` caen los tres.
//
// Cómo verifica: crea de nuevo usuario + alumno + solicitud_registro con los MISMOS identificadores
// dentro de una transacción y hace ROLLBACK. Si los índices siguieran ocupados, MariaDB lanzaría
// ER_DUP_ENTRY y se reportaría exactamente cuál. No deja nada escrito.
//
// Uso (solo tras la aprobación real): node backend/.../seed/verificar-reutilizacion.js

require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../../../../lib/prisma');
const { BOLETA, CORREO } = require('./snapshot-e2e-bajas');

const ROLLBACK_INTENCIONAL = 'ROLLBACK_INTENCIONAL_E2E';
const n = (v) => (v === null || v === undefined ? 0 : Number(v));

(async () => {
  console.log('═══ ¿La misma boleta y el mismo correo pueden volver a registrarse? ═══\n');

  const uno = async (sql, ...p) => n((await prisma.$queryRawUnsafe(sql, ...p))[0].n);

  // 1) Los tres índices deben estar libres ANTES de intentar nada.
  const ocupado = {
    correo: await uno('SELECT COUNT(*) n FROM usuario WHERE correo_institucional = ?', CORREO),
    boleta: await uno('SELECT COUNT(*) n FROM alumno WHERE boleta = ?', BOLETA),
    solicitud: await uno('SELECT COUNT(*) n FROM solicitud_registro WHERE alumno_id = ?', BOLETA),
  };

  console.log('Índices únicos que bloquean el regreso:');
  console.log(`  usuario.correo_institucional  = ${CORREO.padEnd(26)} ocupado: ${ocupado.correo}  ${ocupado.correo === 0 ? '✅ libre' : '❌ sigue ocupado'}`);
  console.log(`  alumno.boleta (PK)            = ${BOLETA.padEnd(26)} ocupado: ${ocupado.boleta}  ${ocupado.boleta === 0 ? '✅ libre' : '❌ sigue ocupado'}`);
  console.log(`  solicitud_registro.alumno_id  = ${BOLETA.padEnd(26)} ocupado: ${ocupado.solicitud}  ${ocupado.solicitud === 0 ? '✅ libre' : '❌ sigue ocupado'}`);

  if (ocupado.correo || ocupado.boleta || ocupado.solicitud) {
    console.error('\n⛔ Alguno sigue ocupado: el borrado NO liberó el regreso. No se intenta el registro.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // 2) Registro real de prueba, revertido al final.
  console.log('\nIntentando un registro nuevo con los mismos identificadores (se revierte al terminar)...');
  const hash = await bcrypt.hash('12345678', 10);
  let fallo = null;

  try {
    await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          rol: 'alumno_sin_asignar',
          correo_institucional: CORREO,
          nombre: 'E2E Baja',
          apellidos: 'Reingreso Prueba',
          contrasena: hash,
          fecha_creacion: new Date(),
          intentos_fallidos: 0,
          cuenta_bloqueada: false,
        },
      });

      const alumno = await tx.alumno.create({
        data: {
          boleta: BOLETA,
          usuario_id: usuario.id,
          celular: '5500000000',
          carrera: 'ISC',
          creditos: 80.5,
          semestre: 8,
        },
      });

      await tx.solicitud_registro.create({
        data: {
          alumno_id: alumno.boleta,
          carrera_id: 1,
          estado_solicitud: 'espera_respuesta_de_profesor',
          fecha_aplicacion: new Date(),
        },
      });

      console.log('  ✅ usuario, alumno y solicitud_registro creados de nuevo sin conflicto.');
      throw new Error(ROLLBACK_INTENCIONAL); // no dejamos rastro
    });
  } catch (err) {
    if (err.message !== ROLLBACK_INTENCIONAL) fallo = err;
  }

  if (fallo) {
    console.error('\n❌ El re-registro FALLÓ. Error exacto:');
    console.error('  ', fallo.message);
    console.error('   code:', fallo.code, '| meta:', JSON.stringify(fallo.meta ?? {}));
    await prisma.$disconnect();
    process.exit(1);
  }

  const restante = await uno('SELECT COUNT(*) n FROM usuario WHERE correo_institucional = ?', CORREO);
  console.log(`  ROLLBACK aplicado: usuarios con ese correo tras revertir = ${restante} ${restante === 0 ? '✅' : '❌'}`);
  console.log('\n✅ La misma boleta y el mismo correo pueden volver a registrarse desde cero.');

  await prisma.$disconnect();
})();
