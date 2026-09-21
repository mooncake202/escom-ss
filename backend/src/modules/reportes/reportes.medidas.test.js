const test = require('node:test');
const assert = require('node:assert/strict');

const {
  anchoTexto,
  ascender,
  envolverTexto,
  ajustarBloque,
  alturaLineaActividades,
  altoActividades,
  lineasMaximas,
  medirActividades,
} = require('./reportes.medidas');
const { ACTIVIDADES, AREA_ACTIVIDADES } = require('./reportes.plantilla');

// Texto de `n` palabras iguales (sin cortes ambiguos) para construir párrafos de longitud conocida.
const palabras = (n, palabra = 'palabra') => Array.from({ length: n }, () => palabra).join(' ');

// Párrafo que ocupa EXACTAMENTE `lineas` líneas renderizadas en el ancho del recuadro.
function parrafoDeLineas(lineas) {
  let n = 1;
  while (envolverTexto(palabras(n), { tamano: ACTIVIDADES.tamano, ancho: AREA_ACTIVIDADES.ancho }).lineas.length < lineas) n += 1;
  return palabras(n);
}

test('envolverTexto: corte voraz por espacios, sin perder palabras y sin exceder el ancho', () => {
  const texto = palabras(60, 'actividad');
  const { lineas, palabraLarga } = envolverTexto(texto, { tamano: 10, ancho: 200 });
  assert.equal(palabraLarga, null);
  assert.equal(lineas.join(' '), texto);
  for (const linea of lineas) assert.ok(anchoTexto(linea, 'regular', 10) <= 200 + 1e-6, linea);
  assert.ok(lineas.length > 1);
});

test('envolverTexto: cada línea es la más larga posible (una palabra más ya no cabría)', () => {
  const { lineas } = envolverTexto(palabras(40, 'palabra'), { tamano: 10, ancho: 200 });
  for (let i = 0; i < lineas.length - 1; i += 1) {
    const primera = lineas[i + 1].split(' ')[0];
    assert.ok(anchoTexto(`${lineas[i]} ${primera}`, 'regular', 10) > 200, `línea ${i}`);
  }
});

test('envolverTexto: una palabra más ancha que la línea se reporta como palabraLarga', () => {
  const larga = 'x'.repeat(200);
  const r = envolverTexto(`hola ${larga} adiós`, { tamano: 10, ancho: 300 });
  assert.equal(r.palabraLarga, larga);
  assert.deepEqual(envolverTexto('sin problemas aquí', { tamano: 10, ancho: 300 }).palabraLarga, null);
  // Un URL o correo típico tampoco se puede partir.
  assert.equal(envolverTexto('https://ejemplo.com/ruta/muy/larga/de/un/repositorio/con/documentos/finales/reporte-final-2025.pdf?token=abc123', { tamano: 10, ancho: 300 }).palabraLarga !== null, true);
});

test('envolverTexto: texto vacío → una línea vacía; espacios extra no crean palabras', () => {
  assert.deepEqual(envolverTexto('', { tamano: 10, ancho: 100 }).lineas, ['']);
  assert.deepEqual(envolverTexto('a   b', { tamano: 10, ancho: 100 }).lineas, ['a b']);
});

test('ajustarBloque: usa el tamaño máximo cuando cabe y reduce hasta el mínimo solo si hace falta', () => {
  const opciones = { ancho: 200, alto: 11.6, tamanoMax: 10, tamanoMin: 8, paso: 0.5, interlineado: 1.15 };
  assert.equal(ajustarBloque('Ana García', opciones).tamano, 10);

  // Un texto que a 10 pt no cabe en una línea pero a menor tamaño sí.
  let texto = 'Nombre '; while (anchoTexto(texto, 'regular', 10) < 205) texto += 'largo ';
  texto = texto.trim();
  const ajuste = ajustarBloque(texto, opciones);
  assert.ok(ajuste.tamano < 10 && ajuste.tamano >= 8);
  assert.equal(ajuste.lineas.length, 1);
  assert.ok(anchoTexto(ajuste.lineas[0], 'regular', ajuste.tamano) <= 200);
});

test('ajustarBloque: dos líneas solo caben si el alto lo permite (fuente mínima); si no, devuelve null', () => {
  const texto = palabras(30, 'programa');
  const conDosLineas = ajustarBloque(texto, { ancho: 300, alto: 19, tamanoMax: 10, tamanoMin: 8, paso: 0.5, interlineado: 1.15 });
  if (conDosLineas) {
    assert.ok(conDosLineas.lineas.length <= 2 && conDosLineas.alto <= 19 + 1e-6);
    assert.ok(conDosLineas.tamano <= 8 + 1e-9, 'dos líneas solo a la fuente mínima');
  }
  assert.equal(ajustarBloque(palabras(200, 'programa'), { ancho: 300, alto: 19, tamanoMax: 10, tamanoMin: 8, paso: 0.5, interlineado: 1.15 }), null);
  assert.equal(ajustarBloque('x'.repeat(300), { ancho: 100, alto: 50, tamanoMax: 10, tamanoMin: 8, paso: 0.5, interlineado: 1.15 }), null);
});

test('ascender: fracción del tamaño de Liberation Sans (~0.905)', () => {
  assert.ok(Math.abs(ascender() - 0.905) < 0.01);
});

// ── Actividades ──────────────────────────────────────────────

test('actividades: geometría derivada de la plantilla (10 pt fijo, interlineado 1.3)', () => {
  assert.equal(ACTIVIDADES.tamano, 10);
  assert.ok(Math.abs(alturaLineaActividades() - 13) < 1e-9);
  assert.ok(Math.abs(AREA_ACTIVIDADES.ancho - 478.6) < 1e-6); // 502.6 - 2 × 12 pt de margen lateral
  assert.ok(Math.abs(AREA_ACTIVIDADES.alto - 298.21) < 1e-6);
});

test('actividades: líneas máximas según el número de párrafos (cada párrafo suma su separación)', () => {
  assert.equal(lineasMaximas(1), 22);   // 22×13 = 286 ≤ 298.21; 23×13 = 299 no cabe
  assert.equal(lineasMaximas(2), 22);   // 22×13 + 5 = 291
  assert.equal(lineasMaximas(3), 22);   // 22×13 + 10 = 296
  assert.equal(lineasMaximas(4), 21);   // 22×13 + 15 = 301 excede; 21×13 + 15 = 288
  assert.ok(lineasMaximas(10) < lineasMaximas(1));
  assert.ok(lineasMaximas(100) >= 0);
});

test('actividades: el límite es exactamente el que marca el alto disponible (frontera)', () => {
  for (const parrafos of [1, 2, 5, 10, 15]) {
    const max = lineasMaximas(parrafos);
    assert.ok(altoActividades(max, parrafos) <= AREA_ACTIVIDADES.alto + 1e-6, `${parrafos} párrafos, ${max} líneas caben`);
    assert.ok(altoActividades(max + 1, parrafos) > AREA_ACTIVIDADES.alto, `${parrafos} párrafos, ${max + 1} líneas no caben`);
  }
});

test('medirActividades: un párrafo que ocupa exactamente el máximo de líneas cabe; una línea más no', () => {
  const max = lineasMaximas(1);
  const justo = medirActividades([parrafoDeLineas(max)]);
  assert.equal(justo.lineasRenderizadas, max);
  assert.equal(justo.cabe, true);
  const excede = medirActividades([parrafoDeLineas(max + 1)]);
  assert.equal(excede.lineasRenderizadas, max + 1);
  assert.equal(excede.cabe, false);
  assert.equal(excede.lineasMaximas, max);
});

test('medirActividades: muchos párrafos cortos se limitan por su separación, no solo por líneas', () => {
  const cortos = Array.from({ length: 22 }, (_, i) => `Actividad ${i + 1}`);
  const m = medirActividades(cortos);
  assert.equal(m.lineasRenderizadas, 22);
  assert.equal(m.cabe, false, '22 párrafos: 22×13 + 21×5 excede el recuadro');
  const cabenCortos = medirActividades(cortos.slice(0, 16));
  assert.equal(cabenCortos.cabe, true);
  assert.equal(altoActividades(16, 16), 16 * 13 + 15 * 5);
});

test('medirActividades: una palabra demasiado ancha impide que quepa aunque haya pocas líneas', () => {
  const m = medirActividades(['Revisión del documento', `Ver ${'a'.repeat(150)} aquí`]);
  assert.equal(m.palabraLarga, 'a'.repeat(150));
  assert.equal(m.cabe, false);
});

test('medirActividades: lo que cabe y lo que no coincide con el texto medido, sin límite por caracteres', () => {
  // Muchos caracteres en pocas líneas anchas de MAYÚSCULAS no cabe; el mismo número en minúsculas sí: manda el ancho real.
  const base = 'La actividad consistió en revisar y documentar los requerimientos del módulo de reportes con el responsable directo. ';
  const minusculas = base.repeat(14).trim();
  const mayusculas = minusculas.toUpperCase();
  assert.equal(minusculas.length, mayusculas.length);
  assert.ok(medirActividades([mayusculas]).lineasRenderizadas > medirActividades([minusculas]).lineasRenderizadas);
});
