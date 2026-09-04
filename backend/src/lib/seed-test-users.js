// seed-test-users.js
//
// Crea un usuario COORDINADOR y un usuario PROFESOR de prueba, cada uno con
// su perfil relacionado. Es ATÓMICO: corre dentro de una transacción de
// Prisma, así que si algo falla a mitad de camino, NO queda nada a medias
// insertado — se revierte todo.
//
// Si el correo ya existe, el script se detiene y te dice cuál, sin tocar
// nada (para que decidas si lo borras a mano o cambias el correo aquí).
//
// Colócalo en la raíz de tu proyecto backend (junto a package.json) y AJUSTA
// el require de abajo para que apunte a tu prisma.js real.

const bcrypt = require('bcrypt');
const prisma = require('./prisma'); // <-- ajusta este path

const PASSWORD_PLANO = '12345678';

const DATOS_COORDINADOR = {
  correo_institucional: 'coordinador.test@ipn.mx',
  nombre: 'Coordinador',
  apellidos: 'De Prueba',
};

const DATOS_PROFESOR = {
  correo_institucional: 'profesor.test@ipn.mx',
  nombre: 'Profesor',
  apellidos: 'De Prueba',
  departamento: 'Computación',
  telefono_personal: '5512345678',
  horario_atencion: 'Lunes a viernes 10:00-12:00',
  cubiculo: 'ESCOM-101',
  cupos_totales: 5,
};

async function main() {
  // 1. Validación previa: si cualquiera de los dos correos ya existe, abortamos
  //    ANTES de abrir la transacción, para dar un mensaje claro de inmediato.
  const existentes = await prisma.usuario.findMany({
    where: {
      correo_institucional: {
        in: [DATOS_COORDINADOR.correo_institucional, DATOS_PROFESOR.correo_institucional],
      },
    },
    select: { correo_institucional: true },
  });

  if (existentes.length > 0) {
    const correos = existentes.map((u) => u.correo_institucional).join(', ');
    throw new Error(
      `Ya existe(n) usuario(s) con el/los correo(s): ${correos}. ` +
      `No se insertó nada. Si quieres recrearlos, bórralos primero de la BD ` +
      `(tabla usuario, y su perfil en coordinador/profesor) o cambia el correo en este script.`
    );
  }

  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  // 2. Inserción atómica: todo dentro de una sola transacción.
  const resultado = await prisma.$transaction(async (tx) => {
    const coordinadorUsuario = await tx.usuario.create({
      data: {
        correo_institucional: DATOS_COORDINADOR.correo_institucional,
        contrasena: hash,
        nombre: DATOS_COORDINADOR.nombre,
        apellidos: DATOS_COORDINADOR.apellidos,
        rol: 'coordinador',
        fecha_creacion: ahora,
        rubrica_fecha_registro: ahora, // requerido por el schema; valor dummy
        intentos_fallidos: 0,
        cuenta_bloqueada: false,
      },
    });

    await tx.coordinador.create({ data: { usuario_id: coordinadorUsuario.id } });

    const profesorUsuario = await tx.usuario.create({
      data: {
        correo_institucional: DATOS_PROFESOR.correo_institucional,
        contrasena: hash,
        nombre: DATOS_PROFESOR.nombre,
        apellidos: DATOS_PROFESOR.apellidos,
        rol: 'profesor',
        fecha_creacion: ahora,
        rubrica_fecha_registro: ahora,
        intentos_fallidos: 0,
        cuenta_bloqueada: false,
      },
    });

    await tx.profesor.create({
      data: {
        usuario_id: profesorUsuario.id,
        departamento: DATOS_PROFESOR.departamento,
        telefono_personal: DATOS_PROFESOR.telefono_personal,
        horario_atencion: DATOS_PROFESOR.horario_atencion,
        cubiculo: DATOS_PROFESOR.cubiculo,
        cupos_totales: DATOS_PROFESOR.cupos_totales,
      },
    });

    return { coordinadorUsuario, profesorUsuario };
  });

  console.log('✅ Transacción completada. Usuarios de prueba creados:');
  console.log(`  Coordinador -> id: ${resultado.coordinadorUsuario.id} | correo: ${DATOS_COORDINADOR.correo_institucional} | password: ${PASSWORD_PLANO}`);
  console.log(`  Profesor    -> id: ${resultado.profesorUsuario.id} | correo: ${DATOS_PROFESOR.correo_institucional} | password: ${PASSWORD_PLANO}`);
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
