// seed-ofertas-completo.js
//
// Seed para probar el módulo de Gestión de Ofertas (CU-PRO). Crea desde cero
// usuarios, carreras y ofertas; no depende de seed-test-users.js ni de
// seed-profesores-test.js.
//
// ÚNICO requisito previo: el catálogo de características, que ya no se define
// aquí sino en backend/src/lib/seedCaracteristicas.js (fuente única de verdad):
//   node backend/src/lib/seedCaracteristicas.js
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

// Capacidad base de todo profesor; su total es CUPOS_BASE + incremento de su característica vigente.
const CUPOS_BASE = 3;

const CARRERAS = ['ISC', 'LCD', 'IIA'];

// El catálogo de características NO se define aquí: su única fuente de verdad es
// backend/src/lib/seedCaracteristicas.js. Este seed solo lee las que necesita.
const CARACTERISTICAS_REQUERIDAS = ['Investigador'];

async function crearCarreras() {
  for (const nombre of CARRERAS) {
    const existe = await prisma.carrera.findFirst({ where: { nombre } });
    if (!existe) await prisma.carrera.create({ data: { nombre } });
  }
}

async function leerCaracteristicas() {
  const leidas = {};
  for (const nombre of CARACTERISTICAS_REQUERIDAS) {
    const caracteristica = await prisma.caracteristica.findUnique({ where: { nombre } });
    if (!caracteristica) {
      throw new Error(
        `No existe la característica '${nombre}' en el catálogo. `
        + 'Corre primero: node backend/src/lib/seedCaracteristicas.js',
      );
    }
    leidas[nombre] = caracteristica;
  }
  return leidas;
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

async function main() {
  console.log('Sembrando datos de prueba para Gestión de Ofertas (CU-PRO)...');

  const hash = await bcrypt.hash(PASSWORD_PLANO, 10);

  await crearCarreras();
  const caracteristicas = await leerCaracteristicas();

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
  // Característica INICIAL vigente, asignada directamente igual que en un alta de CRED:
  // no simula una solicitud de CU-ADM-15/16, así que no se escribe solicitud_caracteristica.
  // Idempotente: el valor no depende del estado previo del profesor.
  const investigador = caracteristicas['Investigador'];
  await prisma.profesor.update({
    where: { id: profesorInvestigador.id },
    data: {
      caracteristica_id: investigador.id,
      cupos_totales: CUPOS_BASE + investigador.incremento_cupos,
    },
  });

  await crearProfesor({
    correo: 'profesor.volumen@ipn.mx', nombre: 'Profesor', apellidos: 'Volumen',
    cupos_totales: CUPOS_BASE, hash,
  });

  console.log('Seed completado. Usuarios de prueba (password: 12345678):');
  console.log('  coordinador.test@ipn.mx');
  console.log('  profesor.normal@ipn.mx           (3 cupos, sin características)');
  console.log('  profesor.sininvestigador@ipn.mx  (3 cupos, sin características)');
  console.log('  profesor.investigador@ipn.mx     (3 base + 1 Investigador = 4 cupos)');
  console.log('  profesor.volumen@ipn.mx          (3 cupos, sin características)');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
