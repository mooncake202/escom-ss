// Borra TODO lo que creó preparar-datos.js para el lote K6_PREFIJO (y nada más):
//   - usuarios del lote, encontrados por PATRÓN de correo (alumnos, profesores base, profesores adicionales y coordinadores,
//     también los de una versión anterior del lote con otras cantidades). Cascada: alumno, solicitudes, bitácoras, cúmulo,
//     reportes, revisiones, documentos, notificaciones, inicios de sesión, profesor, coordinador;
//   - ofertas y el evento/periodo del lote por su marca ([K6-<PREFIJO>]);
//   - archivos: uploads/documentos/<boleta>/ (PDF cifrados y rúbricas) y uploads/profesores/<correo>/ (rúbricas).
// Ejecutar dentro del contenedor, como `node`:
//   docker exec -u node -w /app/backend escom_backend node /app/pruebas/k6/datos/limpiar-datos.js
// preparar-datos.js reutiliza limpiarLote() cuando encuentra un lote con otra forma.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as conf from '../lib/config.js';

const require = createRequire(import.meta.url);
const RUTA_DOCUMENTOS = path.join(conf.BACKEND_DIR, 'uploads/documentos');
const RUTA_PROFESORES = path.join(conf.BACKEND_DIR, 'uploads/profesores');
const log = (m) => console.log(`[k6-limpiar ${conf.PREFIJO}] ${m}`);

/** Usuarios del lote (cualquier versión) con su boleta si son alumnos. */
export async function usuariosDelLote(prisma) {
  const candidatos = await prisma.usuario.findMany({
    where: { correo_institucional: { startsWith: conf.PREFIJO } },
    select: { id: true, correo_institucional: true, alumno: { select: { boleta: true } } },
  });
  return candidatos.filter((u) => conf.PATRON_CORREO_LOTE.test(u.correo_institucional));
}

export async function limpiarLote(prisma) {
  const usuarios = await usuariosDelLote(prisma);
  const ids = usuarios.map((u) => u.id);
  const boletas = usuarios.map((u) => u.alumno?.boleta).filter(Boolean);
  const correos = usuarios.map((u) => u.correo_institucional);

  const n = {};
  n.solicitudes = (await prisma.solicitud_registro.deleteMany({ where: { alumno_id: { in: boletas } } })).count;
  n.alumnos = (await prisma.alumno.deleteMany({ where: { boleta: { in: boletas } } })).count;
  n.ofertas = (await prisma.oferta_servicio.deleteMany({ where: { nombre_proyecto: { startsWith: conf.MARCA } } })).count;
  const eventos = await prisma.evento_calendario.findMany({ where: { nombre: { startsWith: conf.MARCA } }, select: { id: true } });
  n.periodos = (await prisma.periodo_registro.deleteMany({ where: { evento_calendario_id: { in: eventos.map((e) => e.id) } } })).count;
  n.eventos = (await prisma.evento_calendario.deleteMany({ where: { id: { in: eventos.map((e) => e.id) } } })).count;
  n.usuarios = (await prisma.usuario.deleteMany({ where: { id: { in: ids } } })).count;

  let carpetas = 0;
  for (const b of boletas) { const d = path.join(RUTA_DOCUMENTOS, b); if (fs.existsSync(d)) { fs.rmSync(d, { recursive: true, force: true }); carpetas += 1; } }
  for (const c of correos) { const d = path.join(RUTA_PROFESORES, c); if (fs.existsSync(d)) { fs.rmSync(d, { recursive: true, force: true }); carpetas += 1; } }
  n.carpetas = carpetas;

  const restos = {
    usuarios: (await usuariosDelLote(prisma)).length,
    alumnos: await prisma.alumno.count({ where: { boleta: { in: boletas } } }),
    ofertas: await prisma.oferta_servicio.count({ where: { nombre_proyecto: { startsWith: conf.MARCA } } }),
    eventos: await prisma.evento_calendario.count({ where: { nombre: { startsWith: conf.MARCA } } }),
    carpetas: boletas.filter((b) => fs.existsSync(path.join(RUTA_DOCUMENTOS, b))).length
      + correos.filter((c) => fs.existsSync(path.join(RUTA_PROFESORES, c))).length,
  };
  return { borrado: n, restos };
}

async function main() {
  const prisma = require(path.join(conf.BACKEND_DIR, 'src/lib/prisma'));
  try {
    const { borrado, restos } = await limpiarLote(prisma);
    log(`borrado: ${JSON.stringify(borrado)}`);
    log(`restos: ${JSON.stringify(restos)}`);
    if (Object.values(restos).some((x) => x > 0)) process.exitCode = 1;
  } catch (e) {
    console.error(`\n${e.message}\n`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    try { require(path.join(conf.BACKEND_DIR, 'src/lib/redis')).disconnect(); } catch {}
  }
}

// Solo se ejecuta como script; importado (desde preparar-datos.js) solo expone las funciones.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
