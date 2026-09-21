const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PAGINA, COLORES, ENCABEZADO, TITULO, PERIODO, DATOS, ACTIVIDADES, AREA_ACTIVIDADES, FIRMAS, SELLO, PIE,
} = require('./reportes.plantilla');
const { anchoTexto, ascender } = require('./reportes.medidas');
const { construirDatosPdf, planificarPagina } = require('./reportes.pdf');
const { crearPng, resultadoEjemplo, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const ancho = (texto, estilo, tamano) => anchoTexto(texto, estilo, tamano);

const imagen = (w, h) => ({ data: crearPng(w, h), format: 'png', ancho: w, alto: h });
const datos = (cambios) => construirDatosPdf(resultadoEjemplo(cambios), ACTIVIDADES_EJEMPLO);
const CON_FIRMAS = { alumno: imagen(500, 180), profesor: imagen(500, 180), sello: imagen(300, 300) };

// Caja aproximada de un elemento (texto: alto de línea ≈ 1.2 × tamaño).
function caja(el) {
  if (el.tipo === 'texto') return { x0: el.left, y0: el.top, x1: el.left + (el.ancho ?? el.anchoMedido), y1: el.top + el.tamano * 1.2 };
  if (el.tipo === 'linea') return { x0: el.x, y0: el.y, x1: el.x + el.ancho, y1: el.y + el.alto };
  if (el.tipo === 'actividades') return { x0: el.x, y0: el.y, x1: el.x + el.ancho, y1: el.y + el.alto };
  return { x0: el.left, y0: el.top, x1: el.left + el.ancho, y1: el.top + el.alto };
}

test('hoja: Carta vertical (612 x 792 pt)', () => {
  assert.deepEqual([PAGINA.ancho, PAGINA.alto], [612, 792]);
});

test('actividades: 10 pt fijos; leyenda en negritas cursivas y dentro del ancho del recuadro', () => {
  assert.equal(ACTIVIDADES.tamano, 10);
  assert.equal(ACTIVIDADES.leyenda.estilo, 'boldItalic');
  const derecha = ACTIVIDADES.leyenda.x + ancho(ACTIVIDADES.leyenda.texto, 'boldItalic', ACTIVIDADES.leyenda.tamano);
  assert.ok(derecha <= ACTIVIDADES.caja.x + ACTIVIDADES.caja.ancho - 4, `la leyenda termina en ${derecha.toFixed(1)} pt`);
});

test('encabezado: cada línea cabe entre los logos, centrada', () => {
  for (const linea of ENCABEZADO.lineas) {
    const w = ancho(linea.texto, linea.estilo, linea.tamano);
    assert.ok(w <= ENCABEZADO.xMaxTexto - ENCABEZADO.xMinTexto, `${linea.texto} (${w.toFixed(0)} pt)`);
    assert.ok(ENCABEZADO.centroX - w / 2 >= ENCABEZADO.logoIpn.x + ENCABEZADO.logoIpn.ancho + 2);
    assert.ok(ENCABEZADO.centroX + w / 2 <= ENCABEZADO.logoEscom.x - 2);
  }
});

test('título: cabe con el número de reporte más ancho posible (255)', () => {
  const w = ancho(`${TITULO.prefijo} 255`, TITULO.estilo, TITULO.tamano);
  assert.ok(w <= TITULO.xMax - TITULO.xMin, `${w.toFixed(0)} pt`);
});

test('periodo: cualquier par de fechas cabe en una línea (12 pt; se reduce hasta el mínimo solo en el peor caso)', () => {
  const disponible = PERIODO.xMax - PERIODO.x;
  let peor = 0;
  for (const mes of MESES) for (const dia of [1, 30, 31, 28]) {
    const fecha = `${dia} de ${mes} de 2025`;
    for (const otra of [`31 de ${mes} de 2025`, '30 de septiembre de 2025']) {
      const w = ancho(`${PERIODO.etiqueta} ${fecha} ${PERIODO.conector} ${otra}`, PERIODO.estilo, PERIODO.tamano);
      if (w > peor) peor = w;
    }
  }
  // Con el tamaño mínimo el peor caso teórico (dos fechas idénticas y las más largas) sigue cabiendo.
  const peorTeorico = ancho(`${PERIODO.etiqueta} 30 de septiembre de 2025 ${PERIODO.conector} 30 de septiembre de 2025`, PERIODO.estilo, PERIODO.tamanoMin);
  assert.ok(peorTeorico <= disponible, `${peorTeorico.toFixed(1)} pt de ${disponible.toFixed(1)}`);
  assert.ok(peor > 0);
  // Un periodo mensual típico se imprime a 12 pt.
  const tipico = planificarPagina(datos(), {}).find((e) => /^Correspondiente/.test(e.texto));
  assert.equal(tipico.tamano, PERIODO.tamano);
  // El peor caso real se reduce pero no se rechaza ni desborda.
  const extremo = planificarPagina(datos({ reporte: { periodo: { inicioTexto: '30 de septiembre de 2025', finTexto: '30 de septiembre de 2025' } } }), {})
    .find((e) => /^Correspondiente/.test(e.texto));
  assert.ok(extremo.tamano < PERIODO.tamano && extremo.tamano >= PERIODO.tamanoMin);
  assert.ok(ancho(extremo.texto, 'regular', extremo.tamano) <= disponible);
});

test('datos: las etiquetas caben antes de su valor y las columnas no se pisan', () => {
  for (const [nombre, fila] of Object.entries(DATOS.filas)) {
    const finEtiqueta = fila.x + ancho(fila.etiqueta, 'regular', DATOS.tamano);
    assert.ok(finEtiqueta <= fila.valorX - 2, `${nombre}: la etiqueta termina en ${finEtiqueta.toFixed(1)} y el valor empieza en ${fila.valorX}`);
  }
  const izquierda = DATOS.filas.boleta;
  assert.ok(DATOS.columna2 - DATOS.separacion > izquierda.valorX + ancho('2022630001', 'regular', DATOS.tamano));
  assert.ok(DATOS.columna2 - DATOS.separacion > DATOS.filas.telefono.valorX + ancho('5512345678', 'regular', DATOS.tamano));
  // Boleta | Porcentaje de Créditos comparten fila; el porcentaje queda en la columna de "Correo electrónico".
  assert.equal(DATOS.filas.boleta.baseline, DATOS.filas.creditos.baseline);
  assert.equal(DATOS.filas.creditos.x, DATOS.filas.correo.x);
});

test('datos: sin "No. de Registro" en ninguna parte del layout', () => {
  const elementos = planificarPagina(datos(), CON_FIRMAS);
  const textos = elementos.filter((e) => e.tipo === 'texto').map((e) => e.texto).join('\n');
  assert.equal(/registro/i.test(textos), false);
  assert.equal(/Ciudad de M[eé]xico/i.test(textos), false);
  assert.equal(/asistencia/i.test(textos), false);
});

test('líneas base: cada texto fijo queda en la línea base medida en la plantilla', () => {
  const elementos = planificarPagina(datos(), CON_FIRMAS);
  const baselinesDe = (predicado) => elementos.filter((e) => e.tipo === 'texto' && predicado(e.texto)).map((e) => e.baseline);
  const esperado = [
    [/^Instituto/, 32], [/^ESCUELA/, 49], [/^SUBDIRECCI/, 66], [/^Departamento/, 81], [/^REPORTE MENSUAL/, 101],
    [/^Correspondiente/, 128], [/^Datos del/, 159], [/^Nombre:/, 174], [/^Carrera:/, 193], [/^Boleta:/, 212],
    [/^Porcentaje/, 212], [/^Tel/, 231], [/^Correo/, 231], [/^Prestatario:/, 249], [/^Programa:/, 268],
    [/^Redacci/, 304], [/^Elabor/, 701], [/^Autoriz/, 701], [/^Sello del/, 755], [/^Responsable/, 766], [/^Página/, 786],
  ];
  for (const [patron, baseline] of esperado) {
    assert.deepEqual(baselinesDe((t) => patron.test(t)), [baseline], String(patron));
  }
});

test('posición vertical: el borde superior del texto es la línea base menos el ascender', () => {
  const elementos = planificarPagina(datos(), CON_FIRMAS);
  const titulo = elementos.find((e) => e.tipo === 'texto' && /^REPORTE/.test(e.texto));
  assert.ok(Math.abs(titulo.top - (TITULO.baseline - ascender() * TITULO.tamano)) < 1e-9);
});

test('todos los elementos quedan dentro de la hoja y ningún fondo gris se dibuja', () => {
  for (const elementos of [planificarPagina(datos(), {}), planificarPagina(datos(), CON_FIRMAS)]) {
    for (const el of elementos) {
      const c = caja(el);
      assert.ok(c.x0 >= 0 && c.y0 >= 0 && c.x1 <= PAGINA.ancho + 1e-6 && c.y1 <= PAGINA.alto + 1e-6, `${el.tipo} ${el.texto ?? ''} fuera de la hoja`);
    }
    // Solo hay bordes (rect con grosor) y líneas negras: los marcadores grises de la plantilla no se dibujan.
    for (const el of elementos.filter((e) => e.tipo === 'rect')) assert.ok(el.grosor > 0 && el.relleno === undefined && el.fondo === undefined);
    for (const el of elementos.filter((e) => e.tipo === 'linea')) assert.equal(el.color, COLORES.borde);
    const grises = elementos.filter((e) => e.color === '#F4F4F4' || e.color === '#F5F5F5');
    assert.equal(grises.length, 0);
  }
});

test('recuadros: solo los de datos y actividades; sin marco ESCOM ni rectángulo del sello', () => {
  for (const elementos of [planificarPagina(datos(), {}), planificarPagina(datos(), CON_FIRMAS)]) {
    const cajas = elementos.filter((e) => e.tipo === 'rect');
    assert.equal(cajas.length, 2);
    const buscar = (color, grosor) => cajas.find((c) => c.color === color && c.grosor === grosor);
    const actividades = buscar(COLORES.bordeActividades, 1);
    assert.deepEqual([actividades.left, actividades.top, actividades.ancho, actividades.alto], [55.1, 311.39, 502.6, 314.21]);
    const datosCaja = buscar(COLORES.borde, 0.75);
    assert.deepEqual([datosCaja.left, datosCaja.top], [56.68, 144.95]);
  }
});

test('sello: sin rectángulo, pero se conservan la leyenda, su posición y toda la zona reservada', () => {
  const leyenda = planificarPagina(datos(), {}).find((e) => e.texto === 'Sello del Prestatario');
  assert.equal(leyenda.baseline, 755);
  assert.equal(leyenda.color, COLORES.etiquetaSello);
  assert.ok(Math.abs(leyenda.left + leyenda.ancho / 2 - 485.7) < 1e-9);
  assert.deepEqual({ ...SELLO.zona }, { x: 413.75, y: 630, ancho: 143.9, alto: 112 });
  assert.deepEqual({ ...SELLO.area }, { x: 407.75, y: 621.1, ancho: 155.9, alto: 136.85 });
  // La zona reservada queda bajo el recuadro de actividades y dentro del área del sello.
  assert.ok(SELLO.zona.y > ACTIVIDADES.caja.y + ACTIVIDADES.caja.alto);
  assert.ok(SELLO.zona.x >= SELLO.area.x && SELLO.zona.x + SELLO.zona.ancho <= SELLO.area.x + SELLO.area.ancho);
  assert.ok(SELLO.zona.y + SELLO.zona.alto <= SELLO.etiqueta.baseline - ascender() * SELLO.etiqueta.tamano);
});

test('carrera: el valor empieza en la misma x que Nombre y Boleta', () => {
  assert.equal(DATOS.filas.carrera.valorX, 114.4);
  assert.equal(DATOS.filas.carrera.valorX, DATOS.filas.nombre.valorX);
  assert.equal(DATOS.filas.carrera.valorX, DATOS.filas.boleta.valorX);
  const valor = planificarPagina(datos(), {}).find((e) => e.texto === 'Ingeniería en Inteligencia Artificial');
  assert.equal(valor.left, 114.4);
  assert.equal(valor.baseline, 193);
});

test('firmas: la línea, la etiqueta, el nombre y el fin del campo bajaron 8 pt en conjunto; Responsable Directo no se movió', () => {
  assert.equal(FIRMAS.yLinea, 681.5 + 8);
  assert.equal(FIRMAS.etiquetaBaseline, 693 + 8);
  assert.equal(FIRMAS.nombreTop, 697.5 + 8);
  assert.equal(FIRMAS.elaboro.campo.yFin, 725.5 + 8);
  assert.equal(FIRMAS.autorizo.campo.yFin, 756.5, 'el tope de Autorizó es "Responsable Directo", que no se movió');
  assert.equal(FIRMAS.responsable.baseline, 766);
  // El alto disponible para el nombre bajo Elaboró es el mismo que antes (28 pt).
  assert.ok(Math.abs(FIRMAS.elaboro.campo.yFin - FIRMAS.nombreTop - 28) < 1e-9);
});

test('firmas: ni el nombre más largo aceptado bajo Autorizó llega a "Responsable Directo"', () => {
  const topResponsable = FIRMAS.responsable.baseline - 0.729 * FIRMAS.responsable.tamano;
  let aceptado = 0;
  for (let n = 1; n < 60; n += 1) {
    const nombre = Array.from({ length: n }, () => 'PROFESOR').join(' ');
    let elementos;
    try {
      elementos = planificarPagina(datos({ profesor: { nombreCompleto: nombre } }), {});
    } catch (err) {
      assert.equal(err.code, 'DATO_EXCEDE_ANCHO');
      break;
    }
    const lineas = elementos.filter((e) => e.tipo === 'texto' && e.texto.startsWith('PROFESOR') && e.baseline > FIRMAS.nombreTop && e.left > 231 && e.left < 395);
    const fondo = Math.max(...lineas.map((l) => l.baseline + 0.212 * l.tamano));
    assert.ok(fondo < topResponsable, `${n} palabras: el nombre termina en ${fondo.toFixed(1)} y "Responsable Directo" empieza en ${topResponsable.toFixed(1)}`);
    aceptado = n;
  }
  assert.ok(aceptado >= 10, 'un nombre largo sí se acepta');
});

test('rúbricas: zona de ~160 x 50 pt sobre la línea de firma, sin tocar el recuadro de actividades ni la etiqueta', () => {
  const finActividades = ACTIVIDADES.caja.y + ACTIVIDADES.caja.alto;
  assert.deepEqual([FIRMAS.rubrica.ancho, FIRMAS.rubrica.alto], [160, 50]);
  const arriba = FIRMAS.yLinea - FIRMAS.rubrica.separacionLinea - FIRMAS.rubrica.alto;
  assert.ok(arriba > finActividades, `la zona empieza en ${arriba}, el recuadro termina en ${finActividades}`);
  for (const bloque of [FIRMAS.elaboro, FIRMAS.autorizo]) {
    assert.ok(bloque.xDer - bloque.xIzq >= FIRMAS.rubrica.ancho, 'la línea es más larga que la zona de la rúbrica');
  }
  assert.ok(FIRMAS.autorizo.xDer < SELLO.area.x, 'la zona de Autorizó no invade el sello');
});

test('firmas: imágenes con proporción conservada y dentro de su zona (todas las proporciones)', () => {
  const casos = [[500, 180], [180, 500], [300, 300], [1000, 100], [40, 16]];
  for (const [w, h] of casos) {
    const elementos = planificarPagina(datos(), { alumno: imagen(w, h), profesor: imagen(w, h), sello: imagen(w, h) });
    const imagenes = elementos.filter((e) => e.tipo === 'imagen').slice(2); // tras los dos logos
    assert.equal(imagenes.length, 3);
    for (const im of imagenes) {
      assert.ok(Math.abs(im.ancho / im.alto - w / h) < 1e-9, `proporción ${w}x${h}`);
    }
    const [alumno, profesor, sello] = imagenes;
    for (const rubrica of [alumno, profesor]) {
      assert.ok(rubrica.ancho <= 160 + 1e-9 && rubrica.alto <= 50 + 1e-9);
      assert.ok(rubrica.top + rubrica.alto <= FIRMAS.yLinea - FIRMAS.rubrica.separacionLinea + 1e-9, 'sobre la línea');
    }
    assert.ok(sello.ancho <= SELLO.zona.ancho + 1e-9 && sello.alto <= SELLO.zona.alto + 1e-9);
    assert.ok(sello.left >= SELLO.area.x && sello.left + sello.ancho <= SELLO.area.x + SELLO.area.ancho);
    assert.ok(sello.top + sello.alto <= SELLO.etiqueta.baseline - ascender() * SELLO.etiqueta.tamano, 'el sello no tapa la etiqueta');
  }
});

test('logos: IPN y ESCOM conservan su proporción; ESCOM ocupa todo el ancho de su zona, sin marco', () => {
  const [ipn, escom] = planificarPagina(datos(), {}).filter((e) => e.tipo === 'imagen');
  assert.ok(Math.abs(ipn.ancho / ipn.alto - 212 / 340) < 1e-9);
  assert.ok(Math.abs(escom.ancho / escom.alto - 360 / 252) < 1e-9);
  const zona = ENCABEZADO.logoEscom;
  assert.ok(Math.abs(escom.ancho - zona.ancho) < 1e-9 && Math.abs(escom.left - zona.x) < 1e-9);
  assert.ok(escom.top >= zona.y - 1e-9 && escom.top + escom.alto <= zona.y + zona.alto + 1e-9);
  assert.ok(Math.abs(escom.top + escom.alto / 2 - (zona.y + zona.alto / 2)) < 1e-9, 'centrado en vertical');
  assert.ok(escom.left + escom.ancho <= PAGINA.ancho - 30, 'margen derecho de la hoja');
  assert.ok(ipn.left >= ENCABEZADO.logoIpn.x - 1e-9 && ipn.top >= ENCABEZADO.logoIpn.y - 1e-9);
});

test('actividades: 12 pt de margen lateral y 8 pt vertical entre el recuadro y el texto', () => {
  const c = ACTIVIDADES.caja;
  assert.deepEqual([c.rellenoX, c.rellenoY], [12, 8]);
  assert.ok(Math.abs(AREA_ACTIVIDADES.x - (c.x + 12)) < 1e-9 && Math.abs(AREA_ACTIVIDADES.y - (c.y + 8)) < 1e-9);
  assert.ok(Math.abs(AREA_ACTIVIDADES.ancho - (c.ancho - 24)) < 1e-9 && Math.abs(AREA_ACTIVIDADES.alto - (c.alto - 16)) < 1e-9);
  assert.ok(AREA_ACTIVIDADES.y + AREA_ACTIVIDADES.alto < c.y + c.alto);
  // El elemento que se dibuja usa exactamente esa área.
  const bloque = planificarPagina(datos(), {}).find((e) => e.tipo === 'actividades');
  assert.deepEqual([bloque.x, bloque.y, bloque.ancho, bloque.alto], [AREA_ACTIVIDADES.x, AREA_ACTIVIDADES.y, AREA_ACTIVIDADES.ancho, AREA_ACTIVIDADES.alto]);
});

test('pie: "Página 1 de 1" alineado a la derecha, dentro de la hoja', () => {
  const pie = planificarPagina(datos(), {}).find((e) => e.texto === PIE.texto);
  assert.ok(Math.abs(pie.left + pie.ancho - (PIE.derecha)) < 1e-6);
  assert.ok(pie.left + pie.ancho <= PAGINA.ancho);
});
