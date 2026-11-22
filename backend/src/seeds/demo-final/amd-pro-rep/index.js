// index.js — amd-pro-rep (Sol: PRO, REP, ADM)
//
// Orden obligatorio (amd-pro-rep/PENDIENTE.md), siempre sobre BD recién vaciada:
//   docker compose exec -T backend npx prisma migrate reset --force
//   docker compose exec -T backend node backend/src/seeds/demo-final/00-comun/index.js
//   docker compose exec -T backend node backend/src/seeds/demo-final/cred-gr-ah-lss/index.js
//   docker compose exec -T backend node backend/src/seeds/demo-final/amd-pro-rep/index.js
// Verificación (solo lectura):
//   docker compose exec -T backend node backend/src/seeds/demo-final/amd-pro-rep/verificar.js
//
// Idempotente: correrlo dos veces no duplica nada (todo se busca por correo,
// boleta o nombre antes de crearse).
//
// Correos: lib/mailer.js lee SMTP_HOST al cargarse. Este seed lo vacía SOLO
// en su propio proceso para que crearUsuario/GR usen el modo "correo
// simulado" (imprime en consola) y no manden correos reales a cuentas
// @ipn.mx que podrían existir. No modifica el mailer ni el backend en marcha.
process.env.SMTP_HOST = '';

const prisma = require('../../../lib/prisma');
const { REF } = require('./_helpers');
const { tomarHuella, compararHuellas, totalFilas } = require('./_huella');
const { CORREOS_COORDINADORES, PROFESORES } = require('./_datos');
const limpieza = require('./_limpieza');
const profesores = require('./01-profesores');
const ofertas = require('./02-ofertas');
const rep = require('./03-reportes');
const adm = require('./04-administrativo');
const permisos = require('./_permisos');

async function verificarPrerrequisitos() {
  for (const correo of CORREOS_COORDINADORES) {
    const u = await prisma.usuario.findUnique({ where: { correo_institucional: correo } });
    if (!u || u.rol !== 'coordinador') throw new Error(`Falta el coordinador ${correo}: corre primero 00-comun.`);
  }
  const nombres = [...new Set(Object.values(PROFESORES).map((p) => p.caracteristica).filter(Boolean))];
  for (const nombre of nombres) {
    const c = await prisma.caracteristica.findFirst({ where: { nombre } });
    if (!c) throw new Error(`Falta la característica ${nombre}: corre primero 00-comun.`);
  }
  const solicitudesKaren = await prisma.solicitud_registro.count();
  if (solicitudesKaren === 0) {
    throw new Error('No hay solicitudes de registro: corre primero cred-gr-ah-lss.');
  }
}

let pasoActual = 'inicio';

async function paso(nombre, fn) {
  pasoActual = nombre;
  console.log(`\n── ${nombre} ──`);
  return fn();
}

async function main() {
  const t0 = Date.now();
  console.log(`amd-pro-rep · REF = ${REF.toISOString()} (México: ${REF.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })})`);

  await paso('0. Prerrequisitos', verificarPrerrequisitos);
  const huellaAntes = await tomarHuella();

  const resLimpieza = await paso('1. Limpieza de carpetas huérfanas', () => limpieza.main());
  const resProfesores = await paso('2. Profesores (P1, P2, P3)', () => profesores.main());
  const resOfertas = await paso('3. PRO — ofertas (S1–S6, L1–L4, A1)', () => ofertas.main());
  // Antes de asignarle alumnos a P1: su solicitud de característica (cabe con 0 alumnos).
  await paso('4. ADM — solicitud de característica de P1 (antes de REP)', () => rep.crearSolicitudCaracteristicaP1());
  const resRep = await paso('5. REP — 6 alumnos de P1 (GR, AH, reportes con TSA)', () => rep.main());
  const resAdm = await paso('6. ADM — característica de P2, bajas, anuncios y cartas firmadas', () => adm.main());
  // El servidor corre como `node`; este seed como root. Sin esto, mis archivos quedan root:root 700/600.
  const resPermisos = await paso('7. Permisos de mis carpetas en uploads/ (dueño node)', () => permisos.main());

  pasoActual = 'huella de Karen';
  const { errores, info } = compararHuellas(huellaAntes, await tomarHuella());
  info.forEach((m) => console.log(`  ℹ️  ${m}`));
  if (errores.length) {
    throw new Error(`Mi seed cambió datos que no son míos:\n   ${errores.join('\n   ')}`);
  }

  const creados = Object.entries(resProfesores).filter(([, r]) => r.creado).map(([k]) => k);
  const existian = Object.entries(resProfesores).filter(([, r]) => !r.creado).map(([k]) => k);
  console.log('\n── Resumen ──');
  console.log(`  Carpetas huérfanas borradas: ${resLimpieza.borradas.length} · conservadas: ${resLimpieza.conservadas.length}`);
  console.log(`  Permisos: ${resPermisos.ajustadas} de ${resPermisos.carpetas} carpeta(s) mía(s) ajustadas a node (${resPermisos.entradas} entradas)`);
  console.log(`  Profesores creados: ${creados.join(', ') || 'ninguno'} · ya existían: ${existian.join(', ') || 'ninguno'}`);
  const ofCreadas = Object.entries(resOfertas).filter(([, r]) => r.creada).map(([k]) => k);
  const ofExistian = Object.entries(resOfertas).filter(([, r]) => !r.creada).map(([k]) => k);
  console.log(`  Ofertas creadas: ${ofCreadas.join(', ') || 'ninguna'} · ya existían: ${ofExistian.join(', ') || 'ninguna'}`);
  const alCreados = Object.entries(resRep).filter(([, r]) => r.creado).map(([k]) => k);
  const alExistian = Object.entries(resRep).filter(([, r]) => !r.creado).map(([k]) => k);
  console.log(`  Alumnos REP creados: ${alCreados.join(', ') || 'ninguno'} · ya existían: ${alExistian.join(', ') || 'ninguno'}`);
  const bCreados = Object.entries(resAdm).filter(([, r]) => r.creado).map(([k]) => k);
  const bExistian = Object.entries(resAdm).filter(([, r]) => !r.creado).map(([k]) => k);
  console.log(`  Alumnos de bajas creados: ${bCreados.join(', ') || 'ninguno'} · ya existían: ${bExistian.join(', ') || 'ninguno'}`);
  console.log(`  Datos de Karen / 00-comun: ${totalFilas(huellaAntes)} filas ajenas medidas, ninguna modificada ni borrada.`);
  console.log(`  Duración: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  console.log('✅ amd-pro-rep completo.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(`\n❌ amd-pro-rep falló en "${pasoActual}": ${e.message}`);
    if (process.env.DEBUG_SEED) console.error(e);
    try { await prisma.$disconnect(); } catch {}
    process.exit(1);
  });
