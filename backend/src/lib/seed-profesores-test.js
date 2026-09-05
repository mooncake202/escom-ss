// seed-profesores-test.js
//
// Crea 3 usuarios PROFESOR de prueba adicionales (además de profesor.test@ipn.mx
// que ya tienes de seed-test-users.js), cada uno con su perfil de profesor.
// Es ATÓMICO: corre dentro de una transacción de Prisma.
//
// Si cualquiera de los 3 correos ya existe, el script se detiene y te dice
// cuál, sin tocar nada.
//
// Colócalo en la raíz de tu proyecto backend (junto a package.json) y AJUSTA
// el require de abajo para que apunte a tu prisma.js real.

const bcrypt = require('bcrypt');
const prisma = require('./prisma'); // <-- ajusta este path

const PASSWORD_PLANO = '12345678';

const DATOS_PROFESORES = [
  {
    correo_institucional: 'jramirez@ipn.mx',
    nombre: 'Jorge',
    apellidos: 'Ramírez Castillo',
    departamento: 'Sistemas Computacionales',
    telefono_personal: '5523456789',
    horario_atencion: 'Lunes y miércoles 12:00-14:00',
    cubiculo: 'ESCOM-204',
    cupos_totales: 4,
  },
  {
    correo_institucional: 'lgomez@ipn.mx',
    nombre: 'Laura',
    apellidos: 'Gómez Villanueva',
    departamento: 'Inteligencia Artificial',
    telefono_personal: '5534567890',
    horario_atencion: 'Martes y jueves 10:00-12:00',
    cubiculo: 'ESCOM-118',
    cupos_totales: 3,
  },
  {
    correo_institucional: 'rhernandez@ipn.mx',
    nombre: 'Roberto',
    apellidos: 'Hernández Luna',
    departamento: 'Ciencias Básicas',
    telefono_personal: '5545678901',
    horario_atencion: 'Viernes 09:00-13:00',
    cubiculo: 'ESCOM-305',
    cupos_totales: 5,
  },
];

async function main() {
  // 1. Validación previa: si cualquiera de los correos ya existe, abortamos
  //    ANTES de abrir la transacción.
  const existentes = await prisma.usuario.findMany({
    where: { correo_institucional: { in: DATOS_PROFESORES.map((p) => p.correo_institucional) } },
    select: { correo_institucional: true },
  });

  if (existentes.length > 0) {
    const correos = existentes.map((u) => u.correo_institucional).join(', ');
    throw new Error(
      `Ya existe(n) usuario(s) con el/los correo(s): ${correos}. ` +
      `No se insertó nada. Bórralos primero o cambia el correo en este script.`
    );
  }

  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  // 2. Inserción atómica: todo dentro de una sola transacción.
  const resultado = await prisma.$transaction(async (tx) => {
    const creados = [];

    for (const p of DATOS_PROFESORES) {
      const usuarioCreado = await tx.usuario.create({
        data: {
          correo_institucional: p.correo_institucional,
          contrasena: hash,
          nombre: p.nombre,
          apellidos: p.apellidos,
          rol: 'profesor',
          fecha_creacion: ahora,
          
          intentos_fallidos: 0,
          cuenta_bloqueada: false,
        },
      });

      const profesorCreado = await tx.profesor.create({
        data: {
          usuario_id: usuarioCreado.id,
          departamento: p.departamento,
          telefono_personal: p.telefono_personal,
          horario_atencion: p.horario_atencion,
          cubiculo: p.cubiculo,
          cupos_totales: p.cupos_totales,
        },
      });

      creados.push({ usuarioId: usuarioCreado.id, profesorId: profesorCreado.id, correo: p.correo_institucional, nombre: `${p.nombre} ${p.apellidos}` });
    }

    return creados;
  });

  console.log('✅ Transacción completada. Profesores de prueba creados:');
  resultado.forEach((r) => {
    console.log(`  ${r.nombre} -> usuario_id: ${r.usuarioId} | profesor_id: ${r.profesorId} | correo: ${r.correo} | password: ${PASSWORD_PLANO}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ No se insertó nada (rollback automático si ya estaba en transacción).');
    console.error('   Motivo:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
