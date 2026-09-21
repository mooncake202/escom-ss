const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CODIGOS_ERROR,
  normalizarTexto,
  encontrarCaracteresNoSoportados,
  validarTextoLinea,
  validarActividades,
} = require('./reportes.texto');

const lanzaCon = (fn, code) => assert.throws(fn, (err) => {
  assert.equal(err.code, code, err.message);
  assert.equal(err.status, 400);
  return true;
});

// ── normalizarTexto ──────────────────────────────────────────

test('normalizarTexto: NFC compone letra + acento combinado (teclados/pegados en forma decompuesta)', () => {
  const decompuesto = 'n\u0303a\u0301e\u0301u\u0308 N\u0303A\u0301'; // ñáéü ÑÁ
  assert.equal(normalizarTexto(decompuesto), 'ñáéü ÑÁ');
  assert.equal(normalizarTexto(decompuesto), 'ñáéü ÑÁ'.normalize('NFC'));
});

test('normalizarTexto: saltos de línea unificados a \\n y conservados', () => {
  assert.equal(normalizarTexto('uno\r\ndos\rtres\u2028cuatro\u2029cinco\u0085seis\nsiete'), 'uno\ndos\ntres\ncuatro\ncinco\nseis\nsiete');
});

test('normalizarTexto: tabuladores y espacios Unicode pasan a espacio; se recortan y se colapsan', () => {
  assert.equal(normalizarTexto('  a\tb\u00a0\u00a0c\u2003d\u3000e  '), 'a b c d e');
  assert.equal(normalizarTexto('  Actividad   uno  \n\t Actividad\u00a0dos '), 'Actividad uno\nActividad dos');
});

test('normalizarTexto: se ELIMINAN controles y caracteres de formato invisibles', () => {
  const sucio = 'A\u0000B\u0007C\u001bD\u007fE\u009fF' + '\u200bG\u200cH\u200dI\u2060J\ufeffK\u00adL\u200eM\u202eN\u2066O';
  assert.equal(normalizarTexto(sucio), 'ABCDEFGHIJKLMNO');
  assert.equal(normalizarTexto('línea\u000buno\u000cdos'), 'líneaunodos');
});

test('normalizarTexto: conserva acentos, ñ, diéresis, ¿¡ y puntuación habitual tal cual', () => {
  const texto = '¿Qué hizo Ñandú, el pingüino? ¡Trabajó “mucho” — ¡bien! (100 %) «ok» …';
  assert.equal(normalizarTexto(texto), texto);
});

test('normalizarTexto: conserva líneas en blanco intermedias pero no las de los extremos', () => {
  assert.equal(normalizarTexto('\n\nuno\n\ndos\n\n'), 'uno\n\ndos');
  assert.equal(normalizarTexto(''), '');
  assert.equal(normalizarTexto(' \u200b \t '), '');
});

test('normalizarTexto: no es texto → TEXTO_INVALIDO', () => {
  for (const malo of [null, undefined, 42, {}, [], true]) lanzaCon(() => normalizarTexto(malo), CODIGOS_ERROR.TEXTO_INVALIDO);
});

// ── encontrarCaracteresNoSoportados ──────────────────────────

test('caracteres sin glifo: únicos, en orden de aparición y con su punto de código', () => {
  const encontrados = encontrarCaracteresNoSoportados('a😀b✓c😀d日');
  assert.deepEqual(encontrados, [
    { caracter: '😀', codigo: 'U+1F600' },
    { caracter: '✓', codigo: 'U+2713' },
    { caracter: '日', codigo: 'U+65E5' },
  ]);
});

test('caracteres sin glifo: privados, sin asignar y sustitutos sueltos no se muestran, solo su código', () => {
  const encontrados = encontrarCaracteresNoSoportados('a\ue000b\u0378c\ud800d');
  assert.deepEqual(encontrados, [
    { caracter: null, codigo: 'U+E000' },
    { caracter: null, codigo: 'U+0378' },
    { caracter: null, codigo: 'U+D800' },
  ]);
});

test('caracteres sin glifo: texto en español y Unicode habitual → ninguno; el salto de línea no cuenta', () => {
  const texto = 'Áé íóú ÜüÑñ ¿¡ «» “” ‘’ — – … • № ≥ ≤ € ° ª º % @ Łukasz Šimek Škoda Ω Д\nsegunda línea';
  assert.deepEqual(encontrarCaracteresNoSoportados(texto), []);
});

// ── validarTextoLinea (nombres, programa, correo…) ───────────

test('validarTextoLinea: nombres con acentos, ñ y caracteres latinos extendidos se aceptan', () => {
  for (const nombre of ['JOSÉ ÁNGEL PEÑA MUÑOZ', 'María Fernanda Ñandú', 'ŁUKASZ ŠIMEK', 'Zoë Nürnberg-Straße', "O'Connor  D’Angelo"]) {
    assert.equal(validarTextoLinea(nombre, 'El nombre'), nombre.replace(/ {2,}/g, ' '));
  }
});

test('validarTextoLinea: los saltos de línea se vuelven espacios', () => {
  assert.equal(validarTextoLinea('Ana\nMaría\r\nGarcía', 'El nombre'), 'Ana María García');
});

test('validarTextoLinea: vacío o solo invisibles → TEXTO_VACIO con la etiqueta en el mensaje', () => {
  for (const vacio of ['', '   ', '\u200b\ufeff', '\t\n']) {
    assert.throws(() => validarTextoLinea(vacio, 'El programa'), (err) => {
      assert.equal(err.code, CODIGOS_ERROR.TEXTO_VACIO);
      assert.match(err.message, /^El programa no puede estar vacío/);
      return true;
    });
  }
});

test('validarTextoLinea: un carácter sin glifo produce un error claro y no se "arregla" en silencio', () => {
  assert.throws(() => validarTextoLinea('Ana 😀 García', 'El nombre'), (err) => {
    assert.equal(err.code, CODIGOS_ERROR.CARACTERES_NO_SOPORTADOS);
    assert.equal(err.status, 400);
    assert.match(err.message, /^El nombre contiene caracteres que no se pueden imprimir en el reporte: "😀" \(U\+1F600\)/);
    assert.deepEqual(err.caracteres, [{ caracter: '😀', codigo: 'U+1F600' }]);
    return true;
  });
});

// ── validarActividades ───────────────────────────────────────

test('actividades: una por línea; se conservan los saltos y no se pide numeración', () => {
  const r = validarActividades('Revisé el diseño de la base de datos\nImplementé el módulo de reportes\nDocumenté la API');
  assert.deepEqual(r.lineas, ['Revisé el diseño de la base de datos', 'Implementé el módulo de reportes', 'Documenté la API']);
  assert.equal(r.texto, r.lineas.join('\n'));
});

test('actividades: se normalizan (CRLF, espacios, líneas en blanco descartadas) sin perder acentos ni ñ', () => {
  const r = validarActividades('  1. Diseño  del módulo \r\n\r\n\t2. ¿Qué pasó? ¡Todo bien!\r\n   \r\nAñadí pruebas del pingüino  ');
  assert.deepEqual(r.lineas, ['1. Diseño del módulo', '2. ¿Qué pasó? ¡Todo bien!', 'Añadí pruebas del pingüino']);
});

test('actividades: forma decompuesta y caracteres invisibles se corrigen', () => {
  const r = validarActividades('An\u0303adi\u0301 pruebas\u200b\nRevisio\u0301n\u0000 final');
  assert.deepEqual(r.lineas, ['Añadí pruebas', 'Revisión final']);
});

test('actividades: vacías, nulas o solo espacios/invisibles → ACTIVIDADES_VACIAS', () => {
  for (const vacio of [null, undefined, '', '   ', '\n\n', '\t \u200b\r\n']) {
    lanzaCon(() => validarActividades(vacio), CODIGOS_ERROR.ACTIVIDADES_VACIAS);
  }
});

test('actividades: algo que no es texto → TEXTO_INVALIDO', () => {
  for (const malo of [42, {}, ['a'], true]) lanzaCon(() => validarActividades(malo), CODIGOS_ERROR.TEXTO_INVALIDO);
});

test('actividades: caracteres sin glifo → error que los lista (máximo 10) y conserva el detalle completo', () => {
  assert.throws(() => validarActividades('Terminé ✓ la tarea 🎉 y salí 👍'), (err) => {
    assert.equal(err.code, CODIGOS_ERROR.CARACTERES_NO_SOPORTADOS);
    assert.match(err.message, /^Las actividades contiene caracteres que no se pueden imprimir en el reporte: "✓" \(U\+2713\), "🎉" \(U\+1F389\), "👍" \(U\+1F44D\)\. Quítalos o reemplázalos\.$/);
    assert.equal(err.caracteres.length, 3);
    return true;
  });

  const muchos = Array.from({ length: 14 }, (_, i) => String.fromCodePoint(0x1f600 + i)).join('');
  assert.throws(() => validarActividades(`hola ${muchos}`), (err) => {
    assert.equal(err.caracteres.length, 14);
    assert.match(err.message, / y 4 más\./);
    return true;
  });
});

test('actividades: emoji con selector de variación o unidos con ZWJ también se rechazan por su carácter base', () => {
  assert.throws(() => validarActividades('Familia 👨\u200d👩\u200d👧'), (err) => err.code === CODIGOS_ERROR.CARACTERES_NO_SOPORTADOS);
  assert.throws(() => validarActividades('Corazón ❤\ufe0f'), (err) => err.code === CODIGOS_ERROR.CARACTERES_NO_SOPORTADOS);
});

test('actividades: los caracteres de control eliminados no cuentan como error', () => {
  const r = validarActividades('Trabajo\u0000 normal\u0007\u200b');
  assert.deepEqual(r.lineas, ['Trabajo normal']);
});

test('actividades: SIN límite artificial de longitud', () => {
  const linea = 'Actividad realizada con acentos áéíóú y ñ. ';
  const muchasLineas = Array.from({ length: 2000 }, (_, i) => `${linea}${i}`).join('\n');
  const r = validarActividades(muchasLineas);
  assert.equal(r.lineas.length, 2000);
  assert.equal(r.texto.length > 80000, true);

  const unaLineaEnorme = 'x'.repeat(200000);
  assert.equal(validarActividades(unaLineaEnorme).texto.length, 200000);
});

test('actividades: ASCII y Latin-1 imprimible completos se aceptan; solo el guion blando (invisible) se elimina', () => {
  let ascii = '';
  for (let punto = 0x21; punto <= 0x7e; punto += 1) ascii += String.fromCharCode(punto);
  let latin1 = '';
  for (let punto = 0xa1; punto <= 0xff; punto += 1) latin1 += String.fromCharCode(punto);

  const r = validarActividades(`${ascii}\n${latin1}`);
  assert.equal(r.lineas.length, 2);
  assert.equal(r.lineas[0], ascii);
  assert.equal(r.lineas[1], latin1.replace('\u00ad', ''));
  assert.equal(r.lineas[1].length, 94);
});
