const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  DIRECTORIO_FUENTES,
  FAMILIA_FUENTE,
  FUENTES,
  rutaFuente,
  leerFuentesVerificadas,
  leerCodigosSoportados,
  leerMetricas,
  obtenerMedidor,
  obtenerCobertura,
  tieneGlifo,
} = require('./reportes.fuentes');

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const cp = (texto) => [...texto].map((c) => c.codePointAt(0));

test('assets: solo Liberation Sans Regular, Bold y Bold Italic con su LICENSE y AUTHORS, dentro del módulo', () => {
  assert.equal(DIRECTORIO_FUENTES.startsWith(__dirname), true);
  assert.deepEqual(fs.readdirSync(DIRECTORIO_FUENTES).sort(), [
    'AUTHORS', 'LICENSE', 'LiberationSans-Bold.ttf', 'LiberationSans-BoldItalic.ttf', 'LiberationSans-Regular.ttf',
  ]);
  assert.equal(FAMILIA_FUENTE, 'Liberation Sans');
});

test('licencia: SIL Open Font License 1.1 y autores incluidos junto a las fuentes', () => {
  const licencia = fs.readFileSync(path.join(DIRECTORIO_FUENTES, 'LICENSE'), 'utf8');
  assert.match(licencia, /SIL Open Font License,\s+Version 1\.1/);
  assert.match(licencia, /SIL OPEN FONT LICENSE Version 1\.1 - 26 February 2007/);
  assert.match(licencia, /Red Hat/);
  const autores = fs.readFileSync(path.join(DIRECTORIO_FUENTES, 'AUTHORS'), 'utf8');
  assert.match(autores, /Steve Matteson/);
});

test('integridad: los TTF incorporados coinciden con el SHA-256 aprobado (cálculo independiente)', () => {
  const esperados = {
    'LiberationSans-Regular.ttf': '76d04c18ea243f426b7de1f3ad208e927008f961dc5945e5aad352d0dfde8ee8',
    'LiberationSans-Bold.ttf': '788abee4c806d660e8aee46689dd8540cd4bb98da03dcc9d171ce3efd99a9173',
    'LiberationSans-BoldItalic.ttf': '698da70fc191cc5f33ad4d6d3fe830fe4624b898ea2e3169955928b7c491f1ee',
  };
  for (const [archivo, hash] of Object.entries(esperados)) {
    assert.equal(sha256(fs.readFileSync(path.join(DIRECTORIO_FUENTES, archivo))), hash, archivo);
  }
  assert.equal(FUENTES.regular.sha256, esperados['LiberationSans-Regular.ttf']);
  assert.equal(FUENTES.bold.sha256, esperados['LiberationSans-Bold.ttf']);
  assert.equal(FUENTES.boldItalic.sha256, esperados['LiberationSans-BoldItalic.ttf']);
});

test('leerFuentesVerificadas: devuelve los tres estilos cuando los hashes coinciden', () => {
  const { regular, bold, boldItalic } = leerFuentesVerificadas();
  assert.equal(sha256(regular), FUENTES.regular.sha256);
  assert.equal(sha256(bold), FUENTES.bold.sha256);
  assert.equal(sha256(boldItalic), FUENTES.boldItalic.sha256);
});

test('leerFuentesVerificadas: Bold Italic alterada se rechaza con FUENTE_ALTERADA', () => {
  const leer = (ruta) => {
    const contenido = Buffer.from(fs.readFileSync(ruta));
    if (ruta.endsWith('LiberationSans-BoldItalic.ttf')) contenido[2000] ^= 0x01;
    return contenido;
  };
  assert.throws(() => leerFuentesVerificadas({ leer }), (err) => err.code === 'FUENTE_ALTERADA' && /BoldItalic/.test(err.message));
});

test('leerFuentesVerificadas: una fuente alterada (un byte) se rechaza con FUENTE_ALTERADA y nombra el archivo', () => {
  const leer = (ruta) => {
    const contenido = Buffer.from(fs.readFileSync(ruta));
    if (ruta.endsWith('LiberationSans-Bold.ttf')) contenido[1000] ^= 0x01;
    return contenido;
  };
  assert.throws(
    () => leerFuentesVerificadas({ leer }),
    (err) => err.code === 'FUENTE_ALTERADA' && /LiberationSans-Bold\.ttf/.test(err.message) && !/Regular/.test(err.message),
  );
});

test('leerFuentesVerificadas: una fuente ausente se informa con FUENTE_NO_ENCONTRADA', () => {
  const leer = () => { throw Object.assign(new Error('no existe'), { code: 'ENOENT' }); };
  assert.throws(
    () => leerFuentesVerificadas({ leer }),
    (err) => err.code === 'FUENTE_NO_ENCONTRADA' && /ENOENT/.test(err.message),
  );
});

test('rutaFuente: apunta a los archivos del módulo; un estilo desconocido es TypeError', () => {
  assert.equal(rutaFuente('regular'), path.join(DIRECTORIO_FUENTES, 'LiberationSans-Regular.ttf'));
  assert.equal(rutaFuente('bold'), path.join(DIRECTORIO_FUENTES, 'LiberationSans-Bold.ttf'));
  assert.equal(fs.existsSync(rutaFuente('regular')) && fs.existsSync(rutaFuente('bold')), true);
  assert.equal(rutaFuente('boldItalic'), path.join(DIRECTORIO_FUENTES, 'LiberationSans-BoldItalic.ttf'));
  for (const malo of ['italic', 'Regular', '', undefined]) assert.throws(() => rutaFuente(malo), TypeError);
});

test('Bold Italic cubre todo el texto fijo de la leyenda de actividades', () => {
  const { boldItalic } = leerFuentesVerificadas();
  const soportados = leerCodigosSoportados(boldItalic);
  const leyenda = 'Redacción en párrafos describiendo las actividades realizadas durante el periodo mensual.';
  for (const punto of cp(leyenda)) assert.equal(soportados.has(punto), true, String.fromCodePoint(punto));
});

test('cobertura: español completo (acentos, ñ/Ñ, diéresis, ¿¡) y puntuación habitual', () => {
  const grupos = [
    'áéíóúÁÉÍÓÚüÜñÑ¿¡',
    'ªº°',
    '«»“”‘’‚„–—…•·',
    '.,;:!?()[]{}/\\|@#$%&*+-=<>_~^`\'"',
    '0123456789',
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ' ',
  ];
  for (const texto of grupos) for (const punto of cp(texto)) assert.equal(tieneGlifo(punto), true, String.fromCodePoint(punto));
});

test('cobertura: Latin-1 imprimible completo y símbolos habituales', () => {
  for (let punto = 0x20; punto <= 0x7e; punto += 1) assert.equal(tieneGlifo(punto), true, `U+${punto.toString(16)}`);
  for (let punto = 0xa1; punto <= 0xff; punto += 1) assert.equal(tieneGlifo(punto), true, `U+${punto.toString(16)}`);
  for (const punto of cp('€№™≥≤≠±×÷→←°µ§¶')) assert.equal(tieneGlifo(punto), true, String.fromCodePoint(punto));
});

test('cobertura: latín extendido de nombres extranjeros, griego y cirílico', () => {
  for (const punto of cp('łŁćĆšŠžŽőŐűŰřŘěĚçÇãõâêôàèìòùïëäößđğışșț')) {
    assert.equal(tieneGlifo(punto), true, String.fromCodePoint(punto));
  }
  for (const punto of cp('αβγΩΔДЖЯ')) assert.equal(tieneGlifo(punto), true, String.fromCodePoint(punto));
});

test('cobertura: lo que no tiene glifo se detecta (emoji, ✓, CJK, privados, sustitutos, controles)', () => {
  const sinGlifo = [
    ...cp('😀🎉👍✓✔❤日本語한'),
    0xe000,   // uso privado
    0xd800,   // sustituto suelto
    0x0378,   // sin asignar
    0x0000, 0x0009, 0x0007, 0x2060, 0xfeff, 0xfe0f, // controles y formato sin glifo
  ];
  for (const punto of sinGlifo) assert.equal(tieneGlifo(punto), false, `U+${punto.toString(16)}`);
});

test('cobertura: algunos caracteres invisibles SÍ tienen glifo en la fuente (por eso la normalización no depende de ella)', () => {
  // Ancho cero, marcas bidi y guion blando existen en el cmap: sin normalizar se imprimirían como huecos o alterarían el orden.
  for (const punto of [0x200b, 0x200c, 0x200d, 0x200e, 0x202e, 0x00ad]) assert.equal(tieneGlifo(punto), true, `U+${punto.toString(16)}`);
});

test('cobertura: es la intersección de Regular y Bold y tiene el tamaño esperado de Liberation Sans', () => {
  const { regular, bold } = leerFuentesVerificadas();
  const enRegular = leerCodigosSoportados(regular);
  const enBold = leerCodigosSoportados(bold);
  const cobertura = obtenerCobertura();
  assert.equal(cobertura.size >= 2000, true);
  for (const punto of cobertura) assert.equal(enRegular.has(punto) && enBold.has(punto), true);
  assert.equal(cobertura.size, [...enRegular].filter((c) => enBold.has(c)).length);
});

test('leerCodigosSoportados: archivos que no son fuentes válidas fallan con FUENTE_INVALIDA', () => {
  assert.throws(() => leerCodigosSoportados(Buffer.alloc(4)), (err) => err.code === 'FUENTE_INVALIDA');
  assert.throws(() => leerCodigosSoportados(Buffer.alloc(200)), (err) => err.code === 'FUENTE_INVALIDA'); // sin cmap
  assert.throws(() => leerCodigosSoportados(Buffer.from('esto no es un TTF, solo texto de relleno '.repeat(6))), (err) => err.code === 'FUENTE_INVALIDA');
});

// ── Métricas ─────────────────────────────────────────────────

test('métricas: Liberation Sans Regular tiene las mismas medidas que Arial (2048 unidades por em)', () => {
  const medidor = obtenerMedidor('regular');
  const unidades = 2048;
  // H=1479, e=1139, l=455, o=1139 (anchos de Arial): "Hello" = 4667 unidades.
  assert.ok(Math.abs(medidor.ancho('Hello', 10) - (4667 * 10) / unidades) < 1e-9);
  assert.ok(Math.abs(medidor.ancho(' ', 10) - (569 * 10) / unidades) < 1e-9);
  assert.ok(Math.abs(medidor.ancho('W', 12) - (1933 * 12) / unidades) < 1e-9);
});

test('métricas: el ancho es proporcional al tamaño, aditivo y cero para el texto vacío', () => {
  const medidor = obtenerMedidor('regular');
  assert.equal(medidor.ancho('', 10), 0);
  assert.ok(Math.abs(medidor.ancho('Reporte', 20) - 2 * medidor.ancho('Reporte', 10)) < 1e-9);
  assert.ok(Math.abs(medidor.ancho('ab', 10) - (medidor.ancho('a', 10) + medidor.ancho('b', 10))) < 1e-9);
});

test('métricas: Bold es más ancha que Regular para el mismo texto; ascender y descender son razonables', () => {
  const regular = obtenerMedidor('regular');
  const bold = obtenerMedidor('bold');
  assert.ok(bold.ancho('REPORTE MENSUAL DE ACTIVIDADES', 10) > regular.ancho('REPORTE MENSUAL DE ACTIVIDADES', 10));
  assert.ok(regular.ascender > 0.85 && regular.ascender < 0.95);
  assert.ok(regular.descender > 0.15 && regular.descender < 0.3);
});

test('métricas: acentos y ñ se miden (no caen al glifo por defecto) y el medidor se reutiliza', () => {
  const medidor = obtenerMedidor('regular');
  assert.ok(Math.abs(medidor.ancho('ñ', 10) - medidor.ancho('n', 10)) < 1e-9);
  assert.ok(Math.abs(medidor.ancho('á', 10) - medidor.ancho('a', 10)) < 1e-9);
  assert.equal(medidor.ancho('ñ', 10), obtenerMedidor('regular').ancho('ñ', 10));
});

test('métricas: estilo desconocido → TypeError; TTF inválido → FUENTE_INVALIDA', () => {
  assert.throws(() => obtenerMedidor('italic'), TypeError);
  assert.throws(() => leerMetricas(Buffer.alloc(200)), (err) => err.code === 'FUENTE_INVALIDA');
});
