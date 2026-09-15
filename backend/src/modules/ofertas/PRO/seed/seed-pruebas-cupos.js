
// Crea 2 profesores adicionales para probar los límites de cupos de
// CU-PRO-01, complementando a los que ya crea seed-profesores-test.js:
//
//   - Prueba De Validaciones: 10 cupos, sin ofertas — para probar
//     validaciones que NO dependen de cupos (carrera inválida, etc.)
//     sin que se consuman por accidente al usarlo en otras pruebas.
//   - Prueba Investigador: 0 cupos normales, característica Investigador
//     aprobada — para probar la excepción RN-PRO-06.
//
// REQUIERE haber corrido antes: backend/src/lib/seedCaracteristicas.js
//
const prisma = require('../../../lib/prisma');

async function crearProfesor(correo, nombre, apellidos, cupos_totales) {
  let u = await prisma.usuario.findUnique({ where: { correo_institucional: correo } });
  if (!u) {
    u = await prisma.usuario.create({
      data: {
        rol: 'profesor',
        correo_institucional: correo,
        nombre,
        apellidos,
        contrasena: 'temporal',
        fecha_creacion: new Date(),
        rubrica_fecha_registro: new Date(),
      },
    });
  }
  let p = await prisma.profesor.findUnique({ where: { usuario_id: u.id } });
  if (!p) {
    p = await prisma.profesor.create({
      data: {
        usuario_id: u.id,
        departamento: 'Prueba',
        telefono_personal: '5511112222',
        horario_atencion: 'N/A',
        cubiculo: 'N/A',
        cupos_totales,
      },
    });
  }
  return p;
}

async function main() {
  const validaciones = await crearProfesor('prueba.validaciones@ipn.mx', 'Prueba', 'De Validaciones', 10);
  console.log('Profesor de validaciones -> id:', validaciones.id);

  const investigador = await crearProfesor('prueba.investigador@ipn.mx', 'Prueba', 'Investigador', 0);
  const caracteristica = await prisma.caracteristica.findFirst({ where: { nombre: 'Investigador' } });
  if (!caracteristica) {
    throw new Error('No existe la característica Investigador. Corre primero seedCaracteristicas.js.');
  }
  const yaTiene = await prisma.solicitud_caracteristica.findFirst({
    where: { profesor_id: investigador.id, caracteristica_id: caracteristica.id },
  });
  if (!yaTiene) {
    await prisma.solicitud_caracteristica.create({
      data: {
        profesor_id: investigador.id,
        caracteristica_id: caracteristica.id,
        justificacion: 'Proyecto de investigación de prueba.',
        estado: 'aprobada',
        fecha: new Date(),
        fecha_respuesta: new Date(),
      },
    });
  }
  console.log('Profesor investigador -> id:', investigador.id);
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
