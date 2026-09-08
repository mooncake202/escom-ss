// Uso: node backend/src/lib/borrarUsuarioPrueba.js correo@ejemplo.com
// Borra el usuario y, por las relaciones onDelete: Cascade del schema,
// también su perfil (profesor/coordinador), tokens, logs de inicio de
// sesión y características asignadas — queda como si nunca hubiera existido.

const prisma = require('./prisma');

const correo = process.argv[2];

if (!correo) {
  console.error('Uso: node backend/src/lib/borrarUsuarioPrueba.js correo@ejemplo.com');
  process.exit(1);
}

async function main() {
  const usuario = await prisma.usuario.findUnique({ where: { correo_institucional: correo } });

  if (!usuario) {
    console.log(`No existe ningún usuario con el correo ${correo}. Nada que borrar.`);
    return;
  }

  await prisma.usuario.delete({ where: { id: usuario.id } });
  console.log(`✓ Usuario ${correo} (id ${usuario.id}) borrado junto con sus datos relacionados.`);
}

main()
  .catch((e) => {
    console.error('Error al borrar usuario:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
