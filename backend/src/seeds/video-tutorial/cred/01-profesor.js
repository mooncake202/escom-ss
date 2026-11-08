// 01-profesor.js
//
// El profesor al que Daniela (la alumna que Karen registra en vivo) se va a
// asignar en GR. A diferencia de cuando grabamos CRED-03 en vivo en el
// navegador (ver README, "Estado actual" — ese profesor y el de prueba ya se
// borraron al limpiar la BD), aquí se crea DIRECTO por Prisma, con el mismo
// patrón de 00-comun/02-coordinadores.js: sin pasar por crearUsuario() real,
// porque ese servicio deja una contraseña aleatoria + token de correo que no
// tiene sentido manejar desde un seed (eso es justo lo que CRED demuestra en
// vivo, no algo que este script deba repetir).
//
// Mismos datos que ya se documentaron y probaron en vivo el 2026-11-08.

const bcrypt = require('bcrypt');
const prisma = require('../../../lib/prisma');
const coordinadoresSeed = require('../../demo-final/00-comun/02-coordinadores');

const PASSWORD_PLANO = 'JAjaja1818#';

const PROFESOR = {
  correo_institucional: 'profesornavarro@ipn.mx',
  nombre: 'RICARDO',
  apellidos: 'NAVARRO OLVERA',
  departamento: 'Sistemas Computacionales',
  telefono_personal: '5587451236',
  cubiculo: 'ESCOM-204',
  horario_atencion: 'Lunes a viernes 10:00-12:00',
  cupos_totales: 3, // profesor de base, sin característica
};

async function main() {
  const coordinadores = await coordinadoresSeed.main();
  const creadoPorId = coordinadores[0].usuarioId; // mismo criterio que 02-coordinadores: uno de los 2 de 00-comun

  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: PROFESOR.correo_institucional } });
  if (existente) {
    const profesor = await prisma.profesor.findUnique({ where: { usuario_id: existente.id } });
    console.log(`↷ profesor ya existía: ${PROFESOR.correo_institucional} (profesor.id ${profesor.id})`);
    return { usuarioId: existente.id, profesorId: profesor.id };
  }

  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);
  const ahora = new Date();

  const { usuarioId, profesorId } = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        correo_institucional: PROFESOR.correo_institucional,
        contrasena: hash,
        nombre: PROFESOR.nombre,
        apellidos: PROFESOR.apellidos,
        rol: 'profesor',
        fecha_creacion: ahora,
        creado_por_id: creadoPorId,
      },
    });
    const profesor = await tx.profesor.create({
      data: {
        usuario_id: usuario.id,
        departamento: PROFESOR.departamento,
        telefono_personal: PROFESOR.telefono_personal,
        cubiculo: PROFESOR.cubiculo,
        horario_atencion: PROFESOR.horario_atencion,
        cupos_totales: PROFESOR.cupos_totales,
        caracteristica_id: null,
      },
    });
    return { usuarioId: usuario.id, profesorId: profesor.id };
  });

  console.log(`✅ profesor creado: ${PROFESOR.correo_institucional} (profesor.id ${profesorId}) | password: ${PASSWORD_PLANO}`);
  return { usuarioId, profesorId };
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en cred/01-profesor.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, PROFESOR, PASSWORD_PLANO };
