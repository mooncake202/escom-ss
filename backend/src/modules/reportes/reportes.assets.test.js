const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { DIRECTORIO_LOGOS, DIRECTORIO_SELLOS, LOGOS, SELLOS, dimensionesPng, leerLogo, leerSello } = require('./reportes.assets');

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

test('logos: los PNG optimizados coinciden con el SHA-256 aprobado (cálculo independiente)', () => {
  const esperados = {
    'ipn.png': 'c47c1ef18b35810d7f4b2cd4f8fb73bae1c1344fd7476c7153b80f09bb267d0d',
    'escom.png': 'b8962cb65dc77725d9c63511522034bb6a56bd7a675fb53e9b62fdaa140bbe49',
  };
  for (const [archivo, hash] of Object.entries(esperados)) {
    assert.equal(sha256(fs.readFileSync(path.join(DIRECTORIO_LOGOS, archivo))), hash, archivo);
  }
  assert.equal(LOGOS.ipn.sha256, esperados['ipn.png']);
  assert.equal(LOGOS.escom.sha256, esperados['escom.png']);
});

test('logos: leerLogo devuelve el PNG verificado con sus dimensiones y proporción original', () => {
  const ipn = leerLogo('ipn');
  const escom = leerLogo('escom');
  assert.equal(ipn.format, 'png');
  assert.deepEqual([ipn.ancho, ipn.alto], [212, 340]);
  assert.deepEqual([escom.ancho, escom.alto], [360, 252]);
  // Proporción del logo original recortado: IPN 1312x2106, ESCOM 1224x857.
  assert.ok(Math.abs(ipn.ancho / ipn.alto - 1312 / 2106) < 0.003);
  assert.ok(Math.abs(escom.ancho / escom.alto - 1224 / 857) < 0.003);
  assert.equal(leerLogo('ipn'), ipn, 'se reutiliza la lectura verificada');
});

test('logos: se conserva el color institucional (guinda del IPN) y la transparencia', () => {
  // El PNG optimizado es RGBA (color tipo 6) sin cuantizar.
  for (const nombre of ['ipn', 'escom']) {
    const { data } = leerLogo(nombre);
    assert.equal(data[25], 6, `${nombre}: RGBA`);
    assert.equal(data[24], 8, `${nombre}: 8 bits por canal`);
  }
});

test('logos: un archivo alterado se rechaza con LOGO_ALTERADO y nombra el archivo', () => {
  const leer = (ruta) => {
    const contenido = Buffer.from(fs.readFileSync(ruta));
    contenido[100] ^= 0x01;
    return contenido;
  };
  assert.throws(() => leerLogo('ipn', { leer }), (err) => err.code === 'LOGO_ALTERADO' && /ipn\.png/.test(err.message));
});

test('logos: un archivo ausente se informa con LOGO_NO_ENCONTRADO', () => {
  const leer = () => { throw Object.assign(new Error('no existe'), { code: 'ENOENT' }); };
  assert.throws(() => leerLogo('escom', { leer }), (err) => err.code === 'LOGO_NO_ENCONTRADO' && /ENOENT/.test(err.message));
});

test('logos: nombre desconocido → TypeError; bytes que no son PNG → LOGO_INVALIDO', () => {
  for (const malo of ['otro', '', undefined]) assert.throws(() => leerLogo(malo), TypeError);
  assert.throws(() => dimensionesPng(Buffer.from('no soy un png, solo texto de relleno largo')), (err) => err.code === 'LOGO_INVALIDO');
  assert.throws(() => dimensionesPng(Buffer.alloc(10)), (err) => err.code === 'LOGO_INVALIDO');
});

test('logos: los originales y el PDF de referencia NO son necesarios en ejecución', () => {
  // El módulo solo lee los archivos optimizados listados en LOGOS.
  const usados = Object.values(LOGOS).map((l) => l.archivo).sort();
  assert.deepEqual(usados, ['escom.png', 'ipn.png']);
  const fuente = fs.readFileSync(path.join(__dirname, 'reportes.assets.js'), 'utf8');
  assert.equal(/referencia|IPN-Logo|logoescom/.test(fuente.replace(/\/\/.*$/gm, '')), false);
});

// ── Sello de validación del prototipo ────────────────────────

const SHA_SELLO = 'bc6a4d2d36c20be63ebabd46ccb8876d00de18ae02aeaa3b737becf8f1567694';

test('sello: el PNG del prototipo coincide con el SHA-256 aprobado (cálculo independiente)', () => {
  assert.equal(sha256(fs.readFileSync(path.join(DIRECTORIO_SELLOS, 'sello-prototipo.png'))), SHA_SELLO);
  assert.equal(SELLOS.prototipo.sha256, SHA_SELLO);
  assert.equal(SELLOS.prototipo.archivo, 'sello-prototipo.png');
  assert.match(DIRECTORIO_SELLOS.split(path.sep).slice(-4).join('/'), /^modules\/reportes\/assets\/sellos$/);
});

test('sello: leerSello devuelve el PNG verificado con sus dimensiones; "prototipo" es el valor por omisión y se reutiliza la lectura', () => {
  const sello = leerSello();
  assert.equal(sello.format, 'png');
  assert.deepEqual([sello.ancho, sello.alto], [1254, 1254]);
  assert.equal(sha256(sello.data), SHA_SELLO);
  assert.equal(leerSello('prototipo'), sello);
  assert.notEqual(leerLogo('ipn'), sello, 'el caché de sellos y el de logos no se mezclan');
});

test('sello: un archivo alterado → SELLO_ALTERADO; ausente → SELLO_NO_ENCONTRADO; nombre desconocido → TypeError', () => {
  const alterado = (ruta) => { const b = Buffer.from(fs.readFileSync(ruta)); b[100] ^= 0x01; return b; };
  assert.throws(() => leerSello('prototipo', { leer: alterado }), (err) => err.code === 'SELLO_ALTERADO' && /sello-prototipo\.png/.test(err.message));
  const ausente = () => { throw Object.assign(new Error('no existe'), { code: 'ENOENT' }); };
  assert.throws(() => leerSello('prototipo', { leer: ausente }), (err) => err.code === 'SELLO_NO_ENCONTRADO' && /ENOENT/.test(err.message));
  for (const malo of ['institucional', '', 'ipn']) assert.throws(() => leerSello(malo), TypeError);
  assert.throws(() => leerSello('prototipo', { leer: () => Buffer.from('no soy un png, solo texto de relleno largo') }), (err) => err.code === 'SELLO_ALTERADO', 'el hash se revisa antes de interpretar el archivo');
});
