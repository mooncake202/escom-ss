process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { DIRECTORIO_LOGOS, RUTA_SELLO, LOGOS, dimensionesPng, leerLogo, leerSello } = require('./reportes.assets');
const { cifrarBuffer } = require('../../lib/fileEncryption');

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

// ── Sello institucional (cifrado, no versionado con el código) ──────────

// PNG mínimo válido (cabecera IHDR real) para probar el sello sin depender de un archivo real en disco.
function pngDePrueba() {
  const { crearPng } = require('./reportes.pdf.fixtures');
  return crearPng(20, 12);
}

function carpetaTemporal(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sello-test-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  return base;
}

// Ruta a un .enc temporal con `bytes` cifrados con el mismo mecanismo real (AES-256-GCM, fileEncryption.js).
function selloCifradoEn(t, bytes = pngDePrueba()) {
  const ruta = path.join(carpetaTemporal(t), 'sello-escom.enc');
  fs.writeFileSync(ruta, cifrarBuffer(bytes));
  return ruta;
}

test('sello: RUTA_SELLO apunta a uploads/coordinador/Sellos/sello-escom.enc (no a assets/)', () => {
  assert.match(RUTA_SELLO.split(path.sep).slice(-4).join('/'), /^uploads\/coordinador\/Sellos\/sello-escom\.enc$/);
});

test('sello: ya no se lee en claro desde assets/sellos ni depende de un SHA-256 fijo', () => {
  const fuente = fs.readFileSync(path.join(__dirname, 'reportes.assets.js'), 'utf8').replace(/\/\/.*$/gm, '');
  assert.equal(/assets.*sellos|DIRECTORIO_SELLOS/i.test(fuente), false);
  assert.equal(/descifrarBuffer/.test(fuente), true, 'se descifra con el mecanismo real de fileEncryption.js');
});

test('sello: leerSello descifra el archivo cifrado (AES-256-GCM) y devuelve el PNG con sus dimensiones; se reutiliza la lectura (caché)', (t) => {
  const bytes = pngDePrueba();
  const rutaSello = selloCifradoEn(t, bytes);

  const sello = leerSello({ rutaSello });
  assert.equal(sello.format, 'png');
  assert.deepEqual([sello.ancho, sello.alto], [20, 12]);
  assert.ok(sello.data.equals(bytes));
  assert.equal(leerSello({ rutaSello }), sello, 'se reutiliza la lectura (caché)');
  assert.notEqual(leerLogo('ipn'), sello, 'el caché de logos y el del sello no se mezclan');
});

test('sello: un archivo cifrado alterado → SELLO_ALTERADO (lo detecta la autenticación de AES-GCM, no un hash fijo)', (t) => {
  const rutaSello = selloCifradoEn(t);
  const alterado = (ruta) => { const b = Buffer.from(fs.readFileSync(ruta)); b[b.length - 1] ^= 0x01; return b; };
  assert.throws(() => leerSello({ rutaSello, leer: alterado }), (err) => err.code === 'SELLO_ALTERADO');
});

test('sello: archivo ausente → SELLO_NO_ENCONTRADO', () => {
  const ausente = () => { throw Object.assign(new Error('no existe'), { code: 'ENOENT' }); };
  assert.throws(() => leerSello({ leer: ausente }), (err) => err.code === 'SELLO_NO_ENCONTRADO' && /ENOENT/.test(err.message));
});

test('sello: descifra bien pero el contenido no es un PNG válido → SELLO_ALTERADO', (t) => {
  const rutaSello = selloCifradoEn(t, Buffer.from('no soy un PNG, solo texto de relleno largo'));
  assert.throws(() => leerSello({ rutaSello }), (err) => err.code === 'SELLO_ALTERADO');
});

test('sello: la llave de cifrado incorrecta también se rechaza como SELLO_ALTERADO (nunca datos corruptos en silencio)', (t) => {
  const rutaSello = path.join(carpetaTemporal(t), 'sello-escom.enc');
  const llaveOriginal = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = 'b'.repeat(64);
  fs.writeFileSync(rutaSello, cifrarBuffer(pngDePrueba()));
  process.env.ENCRYPTION_KEY = llaveOriginal;
  assert.throws(() => leerSello({ rutaSello }), (err) => err.code === 'SELLO_ALTERADO');
});
