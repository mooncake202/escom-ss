// _permisos.js — amd-pro-rep
//
// El backend corre como el usuario `node` (el contenedor arranca con
// `runuser -u node -- npx nodemon server.js`), pero este seed corre como root
// (`docker compose exec`). Los servicios de REP crean carpetas 700 y archivos
// 600 (reportes-envio.service.js:83-85, reportes.rubricas.js:121-123), así que
// todo lo que sembramos quedaba root:root e inaccesible para el servidor:
// historial de reportes → 500 EACCES, ADM-13 → 404, y fallaban en vivo la
// generación, firma y validación de reportes y la subida de la carta firmada.
//
// Aquí se cambia el dueño a node:node, de forma recursiva, SOLO en mis carpetas:
//   uploads/documentos/<mis boletas>/   y   uploads/profesores/<mis correos>/
// Nunca las carpetas base, ni coordinador/, ni carpetas de Karen. Los permisos
// (700/600) no se tocan: con el dueño correcto el servidor ya puede leer y escribir.
//
// El uid/gid de `node` se lee de /etc/passwd del contenedor (no se fija a ciegas).
// Idempotente: solo cuenta lo que realmente cambió.

const fs = require('fs');
const path = require('path');
const { RUTA_BASE_DOCUMENTOS, RUTA_BASE_PROFESORES } = require('../../../modules/reportes/reportes.shared');
const { CORREOS_PROFESORES, esBoletaMia } = require('./_datos');

const USUARIO_SERVIDOR = 'node';

/** uid/gid del usuario con el que corre el servidor, leído de /etc/passwd. */
function idsUsuarioServidor() {
  const linea = fs.readFileSync('/etc/passwd', 'utf8').split('\n').find((l) => l.startsWith(`${USUARIO_SERVIDOR}:`));
  if (!linea) throw new Error(`No existe el usuario "${USUARIO_SERVIDOR}" en /etc/passwd del contenedor.`);
  const [, , uid, gid] = linea.split(':');
  return { uid: Number(uid), gid: Number(gid) };
}

/** Rutas de mis carpetas que existen en disco (nunca las bases ni nada ajeno). */
function misCarpetas() {
  const carpetas = [];
  if (fs.existsSync(RUTA_BASE_DOCUMENTOS)) {
    for (const nombre of fs.readdirSync(RUTA_BASE_DOCUMENTOS)) {
      if (esBoletaMia(nombre)) carpetas.push(path.join(RUTA_BASE_DOCUMENTOS, nombre));
    }
  }
  for (const correo of CORREOS_PROFESORES) {
    const ruta = path.join(RUTA_BASE_PROFESORES, correo);
    if (fs.existsSync(ruta)) carpetas.push(ruta);
  }
  // Defensa: cada carpeta debe ser hija DIRECTA de una de las dos bases.
  for (const c of carpetas) {
    const padre = path.dirname(path.resolve(c));
    if (padre !== path.resolve(RUTA_BASE_DOCUMENTOS) && padre !== path.resolve(RUTA_BASE_PROFESORES)) {
      throw new Error(`Carpeta fuera de las bases permitidas: ${c}`);
    }
  }
  return carpetas;
}

/** chown recursivo (sin seguir enlaces). Devuelve cuántas entradas cambió. */
function chownRecursivo(ruta, uid, gid) {
  let cambiadas = 0;
  const st = fs.lstatSync(ruta);
  if (st.uid !== uid || st.gid !== gid) {
    fs.lchownSync(ruta, uid, gid);
    cambiadas += 1;
  }
  if (st.isDirectory()) {
    for (const hijo of fs.readdirSync(ruta)) cambiadas += chownRecursivo(path.join(ruta, hijo), uid, gid);
  }
  return cambiadas;
}

function main() {
  const { uid, gid } = idsUsuarioServidor();
  const carpetas = misCarpetas();

  if (typeof process.getuid === 'function' && process.getuid() !== 0) {
    // Corriendo como `node`: lo que este proceso creó ya es de node; no hay nada que cambiar.
    if (process.getuid() !== uid) throw new Error(`El seed corre como uid ${process.getuid()}: no puede cambiar el dueño a ${USUARIO_SERVIDOR}.`);
    console.log(`  ↷ el seed ya corre como ${USUARIO_SERVIDOR} (uid ${uid}); sin cambios.`);
    return { carpetas: carpetas.length, ajustadas: 0, entradas: 0, uid, gid };
  }

  let ajustadas = 0;
  let entradas = 0;
  for (const c of carpetas) {
    const n = chownRecursivo(c, uid, gid);
    if (n) { ajustadas += 1; entradas += n; }
  }
  console.log(`  ${ajustadas ? '✅' : '↷'} ${ajustadas} de ${carpetas.length} carpeta(s) mía(s) ajustadas a ${USUARIO_SERVIDOR}:${USUARIO_SERVIDOR} (uid ${uid}) · ${entradas} entrada(s) cambiadas`);
  return { carpetas: carpetas.length, ajustadas, entradas, uid, gid };
}

module.exports = { main, idsUsuarioServidor, misCarpetas, USUARIO_SERVIDOR };
