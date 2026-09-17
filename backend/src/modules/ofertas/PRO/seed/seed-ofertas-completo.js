// seed-ofertas-completo.js
//
// Seed AUTOCONTENIDO para probar el módulo de Gestión de Ofertas (CU-PRO).
// No depende de ningún otro seed (seedCaracteristicas.js, seed-test-users.js,
// seed-profesores-test.js, etc.) — crea desde cero todo lo que necesita.
//
// Idempotente: usa findFirst/findUnique/upsert antes de crear, se puede
// correr varias veces sin duplicar nada.
//
// Requiere DATABASE_URL en el entorno del proceso (igual que el resto de
// seeds de backend/src, ninguno carga dotenv):
//   node backend/src/modules/ofertas/PRO/seed/seed-ofertas-completo.js

const bcrypt = require('bcrypt');
const prisma = require('../../../../lib/prisma');

const PASSWORD_PLANO = '12345678';

const CARRERAS = ['ISC', 'LCD', 'IIA'];

const CARACTERISTICAS = [
  { nombre: 'Investigador', incremento_cupos: 0 },
  { nombre: 'Coordinador', incremento_cupos: 2 },
];

async function crearCarreras() {
  for (const nombre of CARRERAS) {
    const existe = await prisma.carrera.findFirst({ where: { nombre } });
    if (!existe) await prisma.carrera.create({ data: { nombre } });
  }
}

async function crearCaracteristicas() {
  const creadas = {};
  for (const c of CARACTERISTICAS) {
    creadas[c.nombre] = await prisma.caracteristica.upsert({
      where: { nombre: c.nombre },
      update: {},
      create: { nombre: c.nombre, incremento_cupos: c.incremento_cupos },
    });
  }
  return creadas;
}

async function crearUsuarioBase({ correo_institucional, nombre, apellidos, rol, hash }) {
  let usuario = await prisma.usuario.findUnique({ where: { correo_institucional } });
  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: {
        correo_institucional,
        contrasena: hash,
        nombre,
        apellidos,
        rol,
        fecha_creacion: new Date(),
        intentos_fallidos: 0,
        cuenta_bloqueada: false,
      },
    });
  }
  return usuario;
}

async function crearCoordinador(hash) {
  const usuario = await crearUsuarioBase({
    correo_institucional: 'coordinador.test@ipn.mx',
    nombre: 'Coordinador',
    apellidos: 'De Prueba',
    rol: 'coordinador',
    hash,
  });
  let coordinador = await prisma.coordinador.findUnique({ where: { usuario_id: usuario.id } });
  if (!coordinador) {
    coordinador = await prisma.coordinador.create({ data: { usuario_id: usuario.id } });
  }
  return coordinador;
}

async function crearProfesor({ correo, nombre, apellidos, cupos_totales, hash }) {
  const usuario = await crearUsuarioBase({
    correo_institucional: correo,
    nombre,
    apellidos,
    rol: 'profesor',
    hash,
  });
  let profesor = await prisma.profesor.findUnique({ where: { usuario_id: usuario.id } });
  if (!profesor) {
    profesor = await prisma.profesor.create({
      data: {
        usuario_id: usuario.id,
        departamento: 'Ingeniería en Sistemas Computacionales',
        telefono_personal: '5511112222',
        horario_atencion: 'Lunes a viernes 10:00-12:00',
        cubiculo: 'ESCOM-Prueba',
        cupos_totales,
      },
    });
  }
  return profesor;
}

// Devuelve si la solicitud_caracteristica fue creada AHORA (para que el
// caller solo recalcule cupos_totales la primera vez, y el seed sea
// idempotente incluso si en el futuro incremento_cupos > 0).
async function asignarCaracteristicaAprobada(profesorId, caracteristica) {
  const existente = await prisma.solicitud_caracteristica.findFirst({
    where: { profesor_id: profesorId, caracteristica_id: caracteristica.id },
  });
  if (existente) return { solicitud: existente, creada: false };

  const solicitud = await prisma.solicitud_caracteristica.create({
    data: {
      profesor_id: profesorId,
      caracteristica_id: caracteristica.id,
      justificacion: 'Proyecto de investigación registrado ante SIP (dato de prueba).',
      estado: 'aprobada',
      fecha: new Date(),
      fecha_respuesta: new Date(),
    },
  });
  return { solicitud, creada: true };
}

async function main() {
  console.log('Sembrando datos de prueba para Gestión de Ofertas (CU-PRO)...');

  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);

  await crearCarreras();
  const caracteristicas = await crearCaracteristicas();

  await crearCoordinador(hash);

  await crearProfesor({
    correo: 'profesor.normal@ipn.mx', nombre: 'Profesor', apellidos: 'Normal',
    cupos_totales: 3, hash,
  });

  await crearProfesor({
    correo: 'profesor.sininvestigador@ipn.mx', nombre: 'Profesor', apellidos: 'Sin Investigador',
    cupos_totales: 3, hash,
  });

  const profesorInvestigador = await crearProfesor({
    correo: 'profesor.investigador@ipn.mx', nombre: 'Profesor', apellidos: 'Investigador',
    cupos_totales: 3, hash,
  });
  const { creada } = await asignarCaracteristicaAprobada(profesorInvestigador.id, caracteristicas['Investigador']);
  if (creada) {
    const nuevoTotal = profesorInvestigador.cupos_totales + caracteristicas['Investigador'].incremento_cupos;
    await prisma.profesor.update({
      where: { id: profesorInvestigador.id },
      data: { cupos_totales: nuevoTotal },
    });
  }

  await crearProfesor({
    correo: 'profesor.volumen@ipn.mx', nombre: 'Profesor', apellidos: 'Volumen',
    cupos_totales: 20, hash,
  });

  console.log('Seed completado. Usuarios de prueba (password: 12345678):');
  console.log('  coordinador.test@ipn.mx');
  console.log('  profesor.normal@ipn.mx           (3 cupos, sin características)');
  console.log('  profesor.sininvestigador@ipn.mx  (3 cupos, sin características)');
  console.log('  profesor.investigador@ipn.mx     (3 cupos + Investigador aprobada)');
  console.log('  profesor.volumen@ipn.mx          (20 cupos, para pruebas de volumen)');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
