// 01-cred.js
//
// CU-CRED-03 — variedad de profesores para demo-final, usando la lógica
// REAL del módulo (sin inventar nada): `crearUsuario()` crea con password
// aleatoria + token de bienvenida (igual que en producción), y luego
// `restablecerContrasena()` —la MISMA función real que usa la pantalla
// `/establecer-contrasena/:token`— fija la contraseña única del seed
// (JAjaja1818#, ver backend/src/seeds/README.md). No se maneja
// bloqueo de cuenta (intentos fallidos) ni recuperación de contraseña
// aquí: decisión de equipo (2026-11-08), esos 2 casos se demuestran EN
// VIVO durante la demo, tecleando en el momento, no necesitan estado
// pre-sembrado.
//
// Un profesor "de base" (sin característica) + uno por cada una de las 6
// características reales del catálogo (`00-comun/01-catalogos.js`), para
// que la demo pueda mostrar en vivo las 7 variantes reales de cálculo de
// cupos que el sistema soporta (CUPOS_BASE + incremento_cupos de la
// característica vigente).
//
// Depende de `00-comun/` ya corrido (coordinadores + catálogo de
// características).

const prisma = require('../../../lib/prisma');
const { crearUsuario } = require('../../../modules/usuarios/usuarios.service');
const { restablecerContrasena } = require('../../../modules/password/password.service');

const PASSWORD_FINAL = 'JAjaja1818#'; // ver backend/src/seeds/README.md

const CORREO_COORDINADOR_CREADOR = 'coordinadorherrera@ipn.mx';

const PROFESORES = [
  {
    nombre: 'MARIANA', apellidos: 'CASTILLO REYES', correo: 'profesorcastillo@ipn.mx',
    departamento: 'Sistemas Computacionales', telefono: '5512345671',
    cubiculo: 'ESCOM-101', horario: 'Lunes a viernes 09:00-11:00', caracteristica: null,
  },
  {
    nombre: 'JORGE', apellidos: 'VALDEZ MONTES', correo: 'profesorvaldez@ipn.mx',
    departamento: 'Inteligencia Artificial', telefono: '5512345672',
    cubiculo: 'ESCOM-102', horario: 'Lunes a viernes 10:00-12:00', caracteristica: 'Investigador',
  },
  {
    nombre: 'PATRICIA', apellidos: 'ROMERO AGUILAR', correo: 'profesorromero@ipn.mx',
    departamento: 'Ciencias Básicas', telefono: '5512345673',
    cubiculo: 'ESCOM-103', horario: 'Lunes a viernes 11:00-13:00', caracteristica: 'Presidente_de_academia',
  },
  {
    nombre: 'FERNANDO', apellidos: 'OCHOA DELGADO', correo: 'profesorochoa@ipn.mx',
    departamento: 'Posgrado e Investigación', telefono: '5512345674',
    cubiculo: 'ESCOM-104', horario: 'Lunes a viernes 12:00-14:00', caracteristica: 'Coordinador',
  },
  {
    nombre: 'LAURA', apellidos: 'SANDOVAL PRIETO', correo: 'profesorsandoval@ipn.mx',
    departamento: 'Servicios Escolares', telefono: '5512345675',
    cubiculo: 'ESCOM-105', horario: 'Lunes a viernes 13:00-15:00', caracteristica: 'Jefe_de_departamento',
  },
  {
    nombre: 'ALEJANDRO', apellidos: 'FIGUEROA LUNA', correo: 'profesorfigueroa@ipn.mx',
    departamento: 'Sistemas Computacionales', telefono: '5512345676',
    cubiculo: 'ESCOM-106', horario: 'Lunes a viernes 14:00-16:00', caracteristica: 'Funcionario',
  },
  {
    nombre: 'CAROLINA', apellidos: 'VEGA SOLIS', correo: 'profesorvega@ipn.mx',
    departamento: 'Inteligencia Artificial', telefono: '5512345677',
    cubiculo: 'ESCOM-107', horario: 'Lunes a viernes 15:00-17:00', caracteristica: 'Profesor_coordinador_de_clubes',
  },
];

async function resolverCoordinadorCreador() {
  const coordinador = await prisma.usuario.findUnique({
    where: { correo_institucional: CORREO_COORDINADOR_CREADOR },
  });
  if (!coordinador) {
    throw new Error(`No existe ${CORREO_COORDINADOR_CREADOR} — corre primero demo-final/00-comun/.`);
  }
  return coordinador.id;
}

async function obtenerTokenVigente(usuarioId) {
  return prisma.token_contrasena.findFirst({
    where: { usuario_id: usuarioId, usado: false },
    orderBy: { id: 'desc' },
  });
}

async function sembrarProfesor(datos, creadoPorId) {
  const existente = await prisma.usuario.findUnique({ where: { correo_institucional: datos.correo } });
  if (existente) {
    console.log(`↷ profesor ya existía: ${datos.correo}`);
    return;
  }

  // CU-CRED-03 real (usuarios.service.js::crearUsuario): password aleatoria
  // + token de bienvenida, correo real (puede fallar en simulado, no importa).
  const resultado = await crearUsuario({
    nombre: datos.nombre,
    apellidos: datos.apellidos,
    correo_institucional: datos.correo,
    rol: 'profesor',
    departamento: datos.departamento,
    telefono_personal: datos.telefono,
    horario_atencion: datos.horario,
    cubiculo: datos.cubiculo,
    caracteristicas: datos.caracteristica ? [datos.caracteristica] : [],
  }, creadoPorId);

  // CU-CRED-02 real (password.service.js::restablecerContrasena) — mismo
  // camino que recorre /establecer-contrasena/:token en la UI real, para
  // dejar la contraseña fija del seed en vez de la aleatoria.
  const tokenRow = await obtenerTokenVigente(resultado.usuario.id);
  await restablecerContrasena(tokenRow.token, PASSWORD_FINAL);

  console.log(`✅ profesor creado: ${datos.correo}${datos.caracteristica ? ` (${datos.caracteristica})` : ' (base)'}`);
}

async function main() {
  const creadoPorId = await resolverCoordinadorCreador();
  for (const p of PROFESORES) {
    await sembrarProfesor(p, creadoPorId);
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error en cred-gr-ah-lss/01-cred.js:', e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { main, PROFESORES, PASSWORD_FINAL };
