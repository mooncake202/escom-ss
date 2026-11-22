// _limpieza.js — amd-pro-rep
//
// Borra SOLO carpetas HUÉRFANAS de mis usuarios en uploads/:
//   uploads/documentos/<boleta mía>/      (boleta (2018–2022)63<sufijo de _datos.js>)
//   uploads/profesores/<correo mío>/      (los 3 de _datos.js)
// "Huérfana" = su dueño NO existe en la BD (resto de una BD anterior, p. ej.
// tras `migrate reset`, que no limpia uploads/). Si el dueño existe, la
// carpeta se CONSERVA: así una segunda corrida no deja la BD apuntando a
// archivos borrados (idempotencia).
//
// Motivo: guardarRubrica abre con flag 'wx'; una rubrica.enc vieja en disco
// da 409 RUBRICA_YA_REGISTRADA con un usuario recién creado.
//
// Nunca toca uploads/coordinador/ (sello versionado en git) ni carpetas de
// Karen: solo considera nombres que _datos.js reconoce como míos.

const fs = require('fs');
const path = require('path');
const prisma = require('../../../lib/prisma');
const { RUTA_BASE_DOCUMENTOS, RUTA_BASE_PROFESORES } = require('../../../modules/reportes/reportes.shared');
const { CORREOS_PROFESORES, esBoletaMia } = require('./_datos');

function listarCarpetas(base) {
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}

/** Borra `base/nombre` solo si la ruta resuelta queda directamente dentro de `base`. */
function borrarDentroDe(base, nombre) {
  const baseResuelta = path.resolve(base);
  const objetivo = path.resolve(baseResuelta, nombre);
  if (path.dirname(objetivo) !== baseResuelta || path.basename(objetivo) !== nombre) {
    throw new Error(`Ruta fuera de ${baseResuelta}: ${objetivo}`);
  }
  if (/coordinador/i.test(objetivo.slice(baseResuelta.length))) {
    throw new Error(`Nunca se borra nada de coordinador: ${objetivo}`);
  }
  fs.rmSync(objetivo, { recursive: true, force: true });
}

async function main() {
  const borradas = [];
  const conservadas = [];

  // Documentos de mis alumnos
  for (const nombre of listarCarpetas(RUTA_BASE_DOCUMENTOS)) {
    if (!esBoletaMia(nombre)) continue;
    const alumno = await prisma.alumno.findUnique({ where: { boleta: nombre } });
    if (alumno) { conservadas.push(`documentos/${nombre}`); continue; }
    borrarDentroDe(RUTA_BASE_DOCUMENTOS, nombre);
    borradas.push(`documentos/${nombre}`);
  }

  // Carpetas de mis profesores
  const carpetasProfesores = new Set(listarCarpetas(RUTA_BASE_PROFESORES));
  for (const correo of CORREOS_PROFESORES) {
    if (!carpetasProfesores.has(correo)) continue;
    const usuario = await prisma.usuario.findUnique({ where: { correo_institucional: correo } });
    if (usuario) { conservadas.push(`profesores/${correo}`); continue; }
    borrarDentroDe(RUTA_BASE_PROFESORES, correo);
    borradas.push(`profesores/${correo}`);
  }

  borradas.forEach((c) => console.log(`  🗑  huérfana borrada: uploads/${c}`));
  conservadas.forEach((c) => console.log(`  ↷ conservada (su dueño existe): uploads/${c}`));
  if (!borradas.length && !conservadas.length) console.log('  ✅ sin carpetas mías en uploads/.');

  return { borradas, conservadas };
}

module.exports = { main };
