// 02-coordinadores.js
//
// Los 2 coordinadores compartidos del sistema (ni los de la BD de pruebas
// vieja, ni un tercero). Cualquier módulo que necesite un coordinador_id
// (calendario, recursos, ofertas, decisiones de GR/AH/LSS/AMD) usa uno de
// estos dos — da igual cuál, porque "cualquier coordinador puede decidir
// sobre cualquier oferta/solicitud" (ver comentario en prisma/schema.prisma,
// modelo oferta_servicio).
//
// Correo: sin números ni puntos en la parte local (estilo del equipo; el
// backend solo exige @ipn.mx, ver backend/src/lib/validators.js).
// Nombre/apellidos: nombres normales generados al azar — NUNCA nombres que
// describan para qué sirve la cuenta (decisión de equipo, ver
// backend/src/seeds/README.md, sección "Nombres de usuarios").
//
// `creado_por_id`: el real CU-CRED-03 (`crearUsuario`) siempre lo fija al
// coordinador que da de alta la cuenta. Como estos 2 son los PRIMEROS
// coordinadores del seed (no hay un tercero previo que los haya creado),
// decisión de equipo: el primero queda como que se creó a sí mismo
// (autoreferencia), y el segundo queda creado por el primero. No tiene
// efecto funcional, solo evita dejar `creado_por_id` en null.
//
// `intentos_fallidos`/`cuenta_bloqueada`: el alta real los deja en null (no
// los toca) — por eso aquí también quedan en null, no en 0/false.

const bcrypt = require('bcrypt');
const prisma = require('../../../lib/prisma');

const PASSWORD_PLANO = 'JAjaja1818#'; // ver README: única contraseña para TODO el seed final

const COORDINADORES = [
  { correo_institucional: 'coordinadorherrera@ipn.mx', nombre: 'GABRIELA', apellidos: 'HERRERA SOTELO' },
  { correo_institucional: 'coordinadorvillagran@ipn.mx', nombre: 'OMAR', apellidos: 'VILLAGRAN CASTRO' },
];

async function crearCoordinador(datos, hash, ahora, creadoPorId) {
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: datos.correo_institucional } });
  if (existente) {
    const coord = await prisma.coordinador.findUnique({ where: { usuario_id: existente.id } });

    // Reconciliación: si esta cuenta ya se había creado con una corrida vieja
    // de este archivo (contraseña anterior, intentos_fallidos/cuenta_bloqueada
    // en 0/false, o sin creado_por_id), se corrige aquí en vez de dejarlo mal.
    const necesitaCorreccion = existente.intentos_fallidos !== null
      || existente.cuenta_bloqueada !== null
      || (creadoPorId !== null && existente.creado_por_id !== creadoPorId);

    if (necesitaCorreccion) {
      await prisma.usuario.update({
        where: { id: existente.id },
        data: {
          contrasena: hash,
          intentos_fallidos: null,
          cuenta_bloqueada: null,
          ...(creadoPorId !== null ? { creado_por_id: creadoPorId } : {}),
        },
      });
      console.log(`✏️  coordinador corregido: ${datos.correo_institucional} (contraseña, intentos_fallidos/cuenta_bloqueada a null${creadoPorId !== null ? ', creado_por_id' : ''})`);
    } else {
      console.log(`↷ coordinador ya existía: ${datos.correo_institucional} (coordinador.id ${coord.id})`);
    }
    return { usuarioId: existente.id, coordinadorId: coord.id };
  }

  const { usuarioId, coordinadorId } = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        correo_institucional: datos.correo_institucional,
        contrasena: hash,
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        rol: 'coordinador',
        fecha_creacion: ahora,
        creado_por_id: creadoPorId, // null solo para el primero, se autocorrige abajo
      },
    });
    const coordinador = await tx.coordinador.create({ data: { usuario_id: usuario.id } });
    return { usuarioId: usuario.id, coordinadorId: coordinador.id };
  });

  console.log(`✅ coordinador creado: ${datos.correo_institucional} (coordinador.id ${coordinadorId}) | password: ${PASSWORD_PLANO}`);
  return { usuarioId, coordinadorId };
}

async function main() {
  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  // El primero se crea con creado_por_id null (no puede autoreferenciarse antes
  // de existir) y luego se actualiza para apuntar a sí mismo.
  const primero = await crearCoordinador(COORDINADORES[0], hash, ahora, null);
  await prisma.usuario.update({ where: { id: primero.usuarioId }, data: { creado_por_id: primero.usuarioId } });

  const segundo = await crearCoordinador(COORDINADORES[1], hash, ahora, primero.usuarioId);

  return [
    { correo: COORDINADORES[0].correo_institucional, ...primero },
    { correo: COORDINADORES[1].correo_institucional, ...segundo },
  ];
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en 02-coordinadores.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, COORDINADORES, PASSWORD_PLANO };
