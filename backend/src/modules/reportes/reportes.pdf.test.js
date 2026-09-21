const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');

const {
  CODIGOS_ERROR,
  construirDatosPdf,
  prepararImagen,
  planificarPagina,
  verificarActividades,
  generarPdfReporteMensual,
  agregarRubricaProfesor,
  agregarSelloValidacion,
} = require('./reportes.pdf');
const { lineasMaximas, envolverTexto, medirActividades } = require('./reportes.medidas');
const { AREA_ACTIVIDADES, ACTIVIDADES, SELLO } = require('./reportes.plantilla');
const { leerSello } = require('./reportes.assets');
const { crearPng, JPEG_PEQUENO, resultadoEjemplo, ACTIVIDADES_EJEMPLO } = require('./reportes.pdf.fixtures');

const datos = (cambios, actividades = ACTIVIDADES_EJEMPLO) => construirDatosPdf(resultadoEjemplo(cambios), actividades);
const rechaza = (fn, code) => assert.rejects(async () => fn(), (err) => err.code === code && err.status >= 400, code);
const lanza = (fn, code) => assert.throws(fn, (err) => err.code === code, code);

async function paginasYImagenes(buffer) {
  const pdf = await PDFDocument.load(buffer);
  let imagenes = 0;
  for (const [, objeto] of pdf.context.enumerateIndirectObjects()) {
    if (objeto instanceof PDFRawStream && objeto.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')
      && !objeto.dict.has(PDFName.of('SMaskInData')) && objeto.dict.get(PDFName.of('ColorSpace')) !== PDFName.of('DeviceGray')) imagenes += 1;
  }
  return { paginas: pdf.getPageCount(), imagenes, pdf };
}

const palabras = (n, palabra = 'palabra') => Array.from({ length: n }, () => palabra).join(' ');
function parrafoDeLineas(lineas) {
  let n = 1;
  while (envolverTexto(palabras(n), { tamano: ACTIVIDADES.tamano, ancho: AREA_ACTIVIDADES.ancho }).lineas.length < lineas) n += 1;
  return palabras(n);
}

// ── construirDatosPdf ────────────────────────────────────────

test('construirDatosPdf: datos completos con la forma esperada y actividades normalizadas', () => {
  const d = datos({}, '  Primera actividad  \r\n\r\n\tSegunda   actividad\n');
  assert.equal(d.numeroReporte, 3);
  assert.deepEqual(d.periodo, { inicioTexto: '16 de septiembre de 2025', finTexto: '15 de octubre de 2025' });
  assert.equal(d.alumno.nombreCompleto, 'ANA MARÍA GARCÍA LÓPEZ');
  assert.equal(d.alumno.creditosTexto, '85.5 %');
  assert.equal(d.prestatario, 'Escuela Superior de Cómputo');
  assert.equal(d.profesor.nombreCompleto, 'LUIS ENRIQUE TORRES VEGA');
  assert.deepEqual(d.actividades.lineas, ['Primera actividad', 'Segunda actividad']);
  assert.equal(d.actividades.texto, 'Primera actividad\nSegunda actividad');
});

test('construirDatosPdf: las actividades no se numeran ni se les añade nada', () => {
  const d = datos({}, 'Uno\nDos\nTres');
  assert.deepEqual(d.actividades.lineas, ['Uno', 'Dos', 'Tres']);
  const textos = planificarPagina(d, {}).find((e) => e.tipo === 'actividades').parrafos;
  assert.deepEqual(textos, ['Uno', 'Dos', 'Tres']);
});

test('construirDatosPdf: un reporte no generable no produce datos (REPORTE_NO_GENERABLE, 409)', () => {
  const bloqueado = { ...resultadoEjemplo(), puedeGenerar: false, motivosBloqueo: [{ codigo: 'BITACORAS_PENDIENTES' }] };
  assert.throws(() => construirDatosPdf(bloqueado, 'x'), (err) => err.code === 'REPORTE_NO_GENERABLE' && err.status === 409 && err.motivos[0] === 'BITACORAS_PENDIENTES');
  lanza(() => construirDatosPdf(null, 'x'), 'REPORTE_NO_GENERABLE');
  lanza(() => construirDatosPdf({ puedeGenerar: true }, 'x'), 'REPORTE_NO_GENERABLE');
});

test('construirDatosPdf: cada dato obligatorio ausente o vacío → DATO_REQUERIDO con su campo', () => {
  const casos = [
    [{ alumno: { nombreCompleto: '' } }, 'alumno.nombreCompleto'],
    [{ alumno: { carreraNombre: null } }, 'alumno.carreraNombre'],
    [{ alumno: { boleta: '   ' } }, 'alumno.boleta'],
    [{ alumno: { creditosTexto: undefined } }, 'alumno.creditosTexto'],
    [{ alumno: { telefono: '' } }, 'alumno.telefono'],
    [{ alumno: { correoPersonal: null } }, 'alumno.correoPersonal'],
    [{ profesor: { nombreCompleto: '' } }, 'profesor.nombreCompleto'],
    [{ servicio: { programa: '' } }, 'servicio.programa'],
    [{ reporte: { periodo: { inicioTexto: '', finTexto: 'x' } } }, 'periodo.inicio'],
    [{ reporte: { periodo: { inicioTexto: 'x', finTexto: null } } }, 'periodo.fin'],
    [{ reporte: { numero: 0 } }, 'numeroReporte'],
    [{ reporte: { numero: 1.5 } }, 'numeroReporte'],
    [{ reporte: { numero: '3' } }, 'numeroReporte'],
  ];
  for (const [cambios, campo] of casos) {
    assert.throws(() => datos(cambios), (err) => err.code === 'DATO_REQUERIDO' && err.status === 422 && err.campo === campo, campo);
  }
});

test('construirDatosPdf: un carácter sin glifo → DATOS_NO_IMPRIMIBLES con campo y caracteres, sin modificar el dato', () => {
  assert.throws(
    () => datos({ alumno: { nombreCompleto: 'ANA 😀 LÓPEZ' } }),
    (err) => err.code === 'DATOS_NO_IMPRIMIBLES' && err.status === 422 && err.campo === 'alumno.nombreCompleto'
      && err.caracteres.some((c) => c.codigo === 0x1f600 || c.caracter === '😀'),
  );
  assert.throws(() => datos({ servicio: { programa: 'Programa 漢字' } }), (err) => err.code === 'DATOS_NO_IMPRIMIBLES' && err.campo === 'servicio.programa');
  assert.throws(() => datos({}, 'Actividad con 😀 emoji'), (err) => err.code === 'CARACTERES_NO_SOPORTADOS');
});

test('construirDatosPdf: nombres con caracteres europeos que sí tienen glifo se aceptan', () => {
  const d = datos({ alumno: { nombreCompleto: 'ŁUKASZ ÖZGÜR ÅNGSTRÖM ŠIMEK' } });
  assert.equal(d.alumno.nombreCompleto, 'ŁUKASZ ÖZGÜR ÅNGSTRÖM ŠIMEK');
});

test('construirDatosPdf: actividades vacías o solo espacios → ACTIVIDADES_VACIAS', () => {
  const construir = (actividades) => construirDatosPdf(resultadoEjemplo(), actividades);
  for (const vacio of [undefined, null, '', ' \n \t\n']) lanza(() => construir(vacio), 'ACTIVIDADES_VACIAS');
  lanza(() => construir(42), 'TEXTO_INVALIDO');
});

test('construirDatosPdf: los códigos de error de Fase 3 están definidos', () => {
  for (const codigo of ['REPORTE_NO_GENERABLE', 'DATO_REQUERIDO', 'DATOS_NO_IMPRIMIBLES', 'DATO_EXCEDE_ANCHO', 'ACTIVIDADES_EXCEDEN_ESPACIO',
    'ACTIVIDADES_PALABRA_DEMASIADO_LARGA', 'IMAGEN_INVALIDA', 'PDF_PAGINAS_INVALIDAS']) {
    assert.equal(CODIGOS_ERROR[codigo], codigo);
  }
  assert.ok(Object.isFrozen(CODIGOS_ERROR));
});

// ── prepararImagen ───────────────────────────────────────────

test('prepararImagen: PNG y JPEG válidos → datos con dimensiones reales; nada → null', async () => {
  const png = await prepararImagen(crearPng(300, 100), 'La rúbrica');
  assert.deepEqual([png.format, png.ancho, png.alto], ['png', 300, 100]);
  const jpg = await prepararImagen(JPEG_PEQUENO, 'La rúbrica');
  assert.deepEqual([jpg.format, jpg.ancho, jpg.alto], ['jpg', 40, 16]);
  assert.equal(await prepararImagen(null, 'x'), null);
  assert.equal(await prepararImagen(undefined, 'x'), null);
});

test('prepararImagen: bytes que no son imagen, PNG/JPEG corruptos o tipos incorrectos → IMAGEN_INVALIDA', async () => {
  const png = crearPng(120, 60);
  const corrupto = Buffer.from(png);
  corrupto.fill(0x00, 40, corrupto.length - 20);
  const malos = [
    Buffer.from('%PDF-1.7 no soy imagen'),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    Buffer.alloc(4),
    png.subarray(0, 60),
    corrupto,
    JPEG_PEQUENO.subarray(0, 100),
    JPEG_PEQUENO.subarray(0, JPEG_PEQUENO.length - 40),
    png.subarray(0, png.length - 12),
    crearPng(8100, 2),
    'data:image/png;base64,AAAA',
    { data: png },
    12345,
  ];
  for (const malo of malos) await rechaza(() => prepararImagen(malo, 'La rúbrica'), 'IMAGEN_INVALIDA');
});

test('prepararImagen: acepta límites de dimensiones más estrictos, revisados antes de decodificar', async () => {
  const png = crearPng(1200, 300);
  assert.equal((await prepararImagen(png, 'La rúbrica', { maxLado: 1200, maxPixeles: 400_000 })).ancho, 1200);
  await rechaza(() => prepararImagen(png, 'La rúbrica', { maxLado: 1000 }), 'IMAGEN_INVALIDA');
  await rechaza(() => prepararImagen(png, 'La rúbrica', { maxPixeles: 100_000 }), 'IMAGEN_INVALIDA');
  // Sin opciones se conservan los topes de siempre (8000 px por lado).
  assert.equal((await prepararImagen(png, 'La rúbrica')).alto, 300);
});

// ── planificarPagina ─────────────────────────────────────────

test('planificarPagina: es pura y determinista (mismo resultado, sin modificar los datos)', () => {
  const d = datos();
  const copia = JSON.stringify(d);
  const a = planificarPagina(d, {});
  const b = planificarPagina(d, {});
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(d), copia);
});

test('planificarPagina: un programa largo se imprime en dos líneas a 8 pt como máximo; los cortos a 10 pt', () => {
  const enPrograma = (elementos) => elementos.filter((e) => e.tipo === 'texto' && e.left === 126.46);
  const programaLargo = `${'Programa de Desarrollo de Sistemas de Información para Apoyo a la Gestión Académica '.repeat(2)}y Administrativa`;
  const largo = enPrograma(planificarPagina(datos({ servicio: { programa: programaLargo } }), {}));
  assert.equal(largo.length, 2);
  assert.ok(largo.every((l) => l.tamano === 8));
  assert.equal(largo.map((l) => l.texto).join(' '), programaLargo.replace(/ +/g, ' '));
  for (const l of largo) assert.ok(l.left + l.anchoMedido <= 553 + 1e-6);

  const corto = enPrograma(planificarPagina(datos({ servicio: { programa: 'Programa corto' } }), {}));
  assert.equal(corto.length, 1);
  assert.equal(corto[0].tamano, 10);
  assert.equal(corto[0].baseline, 268);

  // El programa de ejemplo cabe en una línea a 10 pt.
  const ejemplo = enPrograma(planificarPagina(datos(), {}));
  assert.equal(ejemplo.length, 1);
  assert.equal(ejemplo[0].tamano, 10);
});

test('planificarPagina: un nombre largo reduce su fuente (10 → 8 pt) y nunca cruza el borde derecho de la caja', () => {
  const nombre = 'MARÍA GUADALUPE FERNANDA DE LOS ÁNGELES RODRÍGUEZ HERNÁNDEZ DE LA CRUZ Y MONTES DE OCA VILLA';
  const partes = planificarPagina(datos({ alumno: { nombreCompleto: nombre } }), {})
    .filter((e) => e.tipo === 'texto' && e.left === 114.4 && e.baseline > 160 && e.baseline < 185);
  assert.equal(partes.length, 2, 'a 8 pt se parte en dos líneas');
  assert.ok(partes.every((p) => p.tamano === 8));
  const medio = planificarPagina(datos({ alumno: { nombreCompleto: nombre.replace(' DE OCA VILLA', '') } }), {})
    .filter((e) => e.tipo === 'texto' && e.left === 114.4 && e.baseline > 160 && e.baseline < 185);
  assert.equal(medio.length, 1);
  assert.ok(medio[0].tamano > 8 && medio[0].tamano < 10, 'primero se reduce la letra, en una sola línea');
  assert.equal(partes.map((p) => p.texto).join(' '), nombre);
  for (const p of partes) assert.ok(p.left + p.anchoMedido <= 553 + 1e-6, `${p.texto} termina en ${p.left + p.anchoMedido}`);
});

test('planificarPagina: valores absurdamente largos → DATO_EXCEDE_ANCHO con su campo (no se recortan)', () => {
  const casos = [
    [{ alumno: { nombreCompleto: 'A'.repeat(200) } }, 'alumno.nombreCompleto'],
    [{ alumno: { carreraNombre: 'Ingeniería '.repeat(30) } }, 'alumno.carreraNombre'],
    [{ alumno: { correoPersonal: 'x'.repeat(120) + '@example.com' } }, 'alumno.correoPersonal'],
    [{ alumno: { telefono: '5'.repeat(60) } }, 'alumno.telefono'],
    [{ servicio: { programa: 'Programa de gestión '.repeat(40) } }, 'servicio.programa'],
    [{ profesor: { nombreCompleto: 'PROFESOR '.repeat(40) } }, 'profesor.nombreCompleto'],
  ];
  for (const [cambios, campo] of casos) {
    assert.throws(() => planificarPagina(datos(cambios), {}), (err) => err.code === 'DATO_EXCEDE_ANCHO' && err.status === 422 && err.campo === campo, campo);
  }
});

test('planificarPagina: el número de imágenes depende de la etapa (logos + rúbricas + sello)', () => {
  const img = (w, h) => ({ data: crearPng(w, h), format: 'png', ancho: w, alto: h });
  const contar = (imagenes) => planificarPagina(datos(), imagenes).filter((e) => e.tipo === 'imagen').length;
  assert.equal(contar({}), 2);
  assert.equal(contar({ alumno: img(400, 120) }), 3);
  assert.equal(contar({ alumno: img(400, 120), profesor: img(400, 120) }), 4);
  assert.equal(contar({ alumno: img(400, 120), profesor: img(400, 120), sello: img(200, 200) }), 5);
});

test('planificarPagina: el nombre del profesor se imprime bajo "Autorizó" y el del alumno bajo "Elaboró"', () => {
  const elementos = planificarPagina(datos(), {});
  const alumno = elementos.find((e) => e.texto === 'ANA MARÍA GARCÍA LÓPEZ' && e.baseline > 690);
  const profesor = elementos.find((e) => e.texto === 'LUIS ENRIQUE TORRES VEGA');
  assert.ok(alumno && profesor);
  assert.ok(alumno.left + alumno.ancho / 2 > 55 && alumno.left + alumno.ancho / 2 < 217);
  assert.ok(profesor.left + profesor.ancho / 2 > 231 && profesor.left + profesor.ancho / 2 < 395);
});

// ── Actividades: límite de espacio ───────────────────────────

test('verificarActividades: el texto de ejemplo cabe', async () => {
  const m = await verificarActividades(ACTIVIDADES_EJEMPLO.split('\n'));
  assert.equal(m.cabe, true);
  assert.ok(m.lineasRenderizadas <= m.lineasMaximas);
});

test('verificarActividades: exactamente el máximo de líneas cabe (medición y motor coinciden); una más no', async () => {
  const max = lineasMaximas(1);
  const cabe = await verificarActividades([parrafoDeLineas(max)]);
  assert.equal(cabe.lineasRenderizadas, max);
  await assert.rejects(
    () => verificarActividades([parrafoDeLineas(max + 1)]),
    (err) => err.code === 'ACTIVIDADES_EXCEDEN_ESPACIO' && err.status === 422 && err.lineasMaximas === max && err.lineasRenderizadas === max + 1 && /Resume/.test(err.message),
  );
});

test('verificarActividades: el límite depende de los párrafos (cada uno suma su separación)', async () => {
  const cortos = (n) => Array.from({ length: n }, (_, i) => `Actividad número ${i + 1} del periodo`);
  await verificarActividades(cortos(16));
  await rechaza(() => verificarActividades(cortos(22)), 'ACTIVIDADES_EXCEDEN_ESPACIO');
  // 4 párrafos: 22 líneas ya no caben, 21 sí.
  const cuatro = (lineas) => {
    const base = Math.floor(lineas / 4);
    const resto = lineas - base * 4;
    return Array.from({ length: 4 }, (_, i) => parrafoDeLineas(base + (i < resto ? 1 : 0)));
  };
  await verificarActividades(cuatro(21));
  await rechaza(() => verificarActividades(cuatro(22)), 'ACTIVIDADES_EXCEDEN_ESPACIO');
});

test('verificarActividades: el criterio es el ancho real en el recuadro, no el número de caracteres', async () => {
  const base = 'La actividad consistió en revisar y documentar los requerimientos del módulo con el responsable directo. ';
  const cabe = (texto) => verificarActividades([texto]).then(() => true, (err) => (err.code === 'ACTIVIDADES_EXCEDEN_ESPACIO' ? false : Promise.reject(err)));
  let n = 1;
  while (await cabe(base.repeat(n).trim().toUpperCase())) n += 1;
  const mayusculas = base.repeat(n).trim().toUpperCase();
  const minusculas = mayusculas.toLowerCase();
  assert.equal(mayusculas.length, minusculas.length);
  assert.equal(await cabe(mayusculas), false);
  assert.equal(await cabe(minusculas), true);
});

test('verificarActividades: una palabra más ancha que el recuadro → ACTIVIDADES_PALABRA_DEMASIADO_LARGA', async () => {
  const url = `https://ejemplo.mx/${'documentos-del-proyecto/'.repeat(12)}reporte.pdf`;
  await assert.rejects(
    () => verificarActividades(['Consulté el repositorio', url]),
    (err) => err.code === 'ACTIVIDADES_PALABRA_DEMASIADO_LARGA' && err.status === 422 && err.palabra.length <= 31,
  );
});

test('verificarActividades: un texto enorme se rechaza sin generar una segunda página', async () => {
  await rechaza(() => verificarActividades(Array.from({ length: 300 }, () => palabras(40))), 'ACTIVIDADES_EXCEDEN_ESPACIO');
});

// ── generarPdfReporteMensual ─────────────────────────────────

const rubricaAlumno = crearPng(500, 180, [20, 40, 140]);
const rubricaProfesor = crearPng(400, 200, [120, 20, 40]);
const sello = crearPng(300, 300, [30, 90, 30]);

function textoDelPdf(buffer) {
  const archivo = path.join(os.tmpdir(), `reporte-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`);
  fs.writeFileSync(archivo, buffer);
  try {
    const r = spawnSync('pdftotext', ['-layout', archivo, '-'], { encoding: 'utf8' });
    return r.status === 0 ? r.stdout : null;
  } catch {
    return null;
  } finally {
    fs.rmSync(archivo, { force: true });
  }
}

test('generarPdfReporteMensual: etapa 1 (alumno) → un PDF de una sola página Carta con la fuente aprobada incrustada', async () => {
  const pdf = await generarPdfReporteMensual(datos(), { rubricaAlumno });
  assert.equal(pdf.subarray(0, 5).toString('latin1'), '%PDF-');
  const { paginas, imagenes, pdf: doc } = await paginasYImagenes(pdf);
  assert.equal(paginas, 1);
  assert.equal(imagenes, 3, 'logo IPN + logo ESCOM + rúbrica del alumno');
  const { width, height } = doc.getPage(0).getSize();
  assert.deepEqual([Math.round(width), Math.round(height)], [612, 792]);
  const fuentes = pdf.toString('latin1').match(/\/FontName \/[A-Z]{6}\+[A-Za-z-]+/g) ?? [];
  assert.ok(fuentes.length >= 1 && fuentes.every((f) => /LiberationSans/.test(f)), fuentes.join(', '));
  assert.ok(pdf.length < 600 * 1024, `tamaño ${pdf.length} B`);
});

test('generarPdfReporteMensual: las tres etapas (alumno; +profesor; +sello) y sin rúbricas', async () => {
  const sinFirmas = await generarPdfReporteMensual(datos());
  const etapa2 = await generarPdfReporteMensual(datos(), { rubricaAlumno, rubricaProfesor });
  const etapa3 = await generarPdfReporteMensual(datos(), { rubricaAlumno, rubricaProfesor, selloInstitucional: sello });
  const resultados = await Promise.all([sinFirmas, etapa2, etapa3].map(paginasYImagenes));
  assert.deepEqual(resultados.map((r) => r.paginas), [1, 1, 1]);
  assert.deepEqual(resultados.map((r) => r.imagenes), [2, 4, 5]);
});

test('generarPdfReporteMensual: acepta rúbricas JPEG', async () => {
  const pdf = await generarPdfReporteMensual(datos(), { rubricaAlumno: JPEG_PEQUENO });
  assert.equal((await paginasYImagenes(pdf)).paginas, 1);
});

test('generarPdfReporteMensual: imágenes dañadas → IMAGEN_INVALIDA, sin PDF', async () => {
  await rechaza(() => generarPdfReporteMensual(datos(), { rubricaAlumno: Buffer.from('no es una imagen') }), 'IMAGEN_INVALIDA');
  await rechaza(() => generarPdfReporteMensual(datos(), { rubricaAlumno, rubricaProfesor: crearPng(50, 50).subarray(0, 40) }), 'IMAGEN_INVALIDA');
  await rechaza(() => generarPdfReporteMensual(datos(), { rubricaAlumno, selloInstitucional: 'sello' }), 'IMAGEN_INVALIDA');
});

test('generarPdfReporteMensual: actividades que no caben → error explícito, nunca una segunda página', async () => {
  const demasiadas = Array.from({ length: 60 }, (_, i) => `Actividad ${i + 1}: ${palabras(12)}`).join('\n');
  await rechaza(() => generarPdfReporteMensual(datos({}, demasiadas), { rubricaAlumno }), 'ACTIVIDADES_EXCEDEN_ESPACIO');
  const justoMas = parrafoDeLineas(lineasMaximas(1) + 1);
  await rechaza(() => generarPdfReporteMensual(datos({}, justoMas), { rubricaAlumno }), 'ACTIVIDADES_EXCEDEN_ESPACIO');
});

test('generarPdfReporteMensual: con las actividades al límite exacto sigue siendo una página y el texto queda dentro del recuadro', async () => {
  const limite = parrafoDeLineas(lineasMaximas(1));
  const pdf = await generarPdfReporteMensual(datos({}, limite), { rubricaAlumno, rubricaProfesor, selloInstitucional: sello });
  assert.equal((await paginasYImagenes(pdf)).paginas, 1);
});

test('generarPdfReporteMensual: el contenido impreso es el esperado (si hay pdftotext)', async (t) => {
  const pdf = await generarPdfReporteMensual(datos(), { rubricaAlumno });
  const texto = textoDelPdf(pdf);
  if (texto === null) return t.skip('pdftotext no disponible');
  const plano = texto.replace(/\s+/g, ' ');
  for (const esperado of [
    'Instituto Politécnico Nacional', 'ESCUELA SUPERIOR DE CÓMPUTO', 'REPORTE MENSUAL DE ACTIVIDADES NÚMERO: 3',
    'Correspondiente al periodo mensual del: 16 de septiembre de 2025 al 15 de octubre de 2025',
    'Datos del Prestador o Prestadora', 'ANA MARÍA GARCÍA LÓPEZ', 'Ingeniería en Inteligencia Artificial', '2022630001', '85.5 %',
    '5512345678', 'ana.garcia.lopez@example.com', 'Prestatario: Escuela Superior de Cómputo',
    'Redacción en párrafos describiendo las actividades realizadas durante el periodo mensual.',
    'ñandú', 'LUIS ENRIQUE TORRES VEGA', 'Elaboró', 'Autorizó', 'Responsable Directo', 'Sello del Prestatario', 'Página 1 de 1',
  ]) {
    assert.ok(plano.includes(esperado), `falta: ${esperado}`);
  }
  for (const ausente of ['No. de Registro', 'Registro', 'Ciudad de México', 'Control de Asistencia']) {
    assert.equal(plano.includes(ausente), false, `sobra: ${ausente}`);
  }
  assert.equal(/^\s*\d+[.)]\s/m.test(texto.split('Redacción en párrafos')[1].split('Elaboró')[0]), false, 'las actividades no se numeran');
});

test('generarPdfReporteMensual: el generador no necesita el PDF de referencia ni los logos originales', () => {
  const fuente = fs.readFileSync(path.join(__dirname, 'reportes.pdf.js'), 'utf8').replace(/\/\/.*$/gm, '');
  assert.equal(/referencia|Formato Reporte|IPN-Logo|logoescom/.test(fuente), false);
});

// ── Rúbrica del profesor sobre el PDF ya firmado por el alumno (CU-REP-05) ──

const hayPdftoppm = spawnSync('pdftoppm', ['-v']).error === undefined;

// Raster de la página (PPM) para comparar el resultado píxel a píxel.
function rasterizar(pdf) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-'));
  try {
    fs.writeFileSync(path.join(dir, 'a.pdf'), pdf);
    const r = spawnSync('pdftoppm', ['-r', '100', '-singlefile', path.join(dir, 'a.pdf'), path.join(dir, 'a')]);
    assert.equal(r.status, 0, String(r.stderr));
    return fs.readFileSync(path.join(dir, 'a.ppm'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('agregarRubricaProfesor: queda EXACTAMENTE donde el generador pone la rúbrica de "Autorizó" (mismo raster que alumno + profesor)', { skip: !hayPdftoppm && 'pdftoppm no está instalado' }, async () => {
  const alumno = crearPng(400, 140, [20, 40, 140]);
  const profesor = crearPng(300, 100, [200, 20, 20]);
  const soloAlumno = await generarPdfReporteMensual(datos(), { rubricaAlumno: alumno });
  const referencia = await generarPdfReporteMensual(datos(), { rubricaAlumno: alumno, rubricaProfesor: profesor });

  const sellado = await agregarRubricaProfesor(soloAlumno, profesor);

  assert.equal(Buffer.compare(rasterizar(sellado), rasterizar(referencia)), 0, 'coordenadas y tamaño idénticos a los del generador');
  assert.notEqual(Buffer.compare(rasterizar(sellado), rasterizar(soloAlumno)), 0, 'y sí cambia respecto al PDF solo del alumno');
});

test('agregarRubricaProfesor: devuelve un Buffer nuevo de una página Carta, no toca el original y conserva sus metadatos', async () => {
  const soloAlumno = await generarPdfReporteMensual(datos(), { rubricaAlumno: crearPng(400, 140) });
  const copia = Buffer.from(soloAlumno);

  const sellado = await agregarRubricaProfesor(soloAlumno, crearPng(300, 100));

  assert.ok(Buffer.isBuffer(sellado));
  assert.notEqual(Buffer.compare(sellado, soloAlumno), 0);
  assert.equal(Buffer.compare(soloAlumno, copia), 0, 'el PDF original no se modifica');
  const original = await PDFDocument.load(soloAlumno);
  const final = await PDFDocument.load(sellado);
  assert.equal(final.getPageCount(), 1);
  assert.deepEqual([final.getPage(0).getWidth(), final.getPage(0).getHeight()], [612, 792]);
  assert.equal(final.getTitle(), original.getTitle());
  assert.equal(final.getAuthor(), original.getAuthor());
  assert.equal(final.getProducer(), original.getProducer());
  assert.equal(final.getModificationDate()?.getTime(), original.getModificationDate()?.getTime());
  // Las mismas imágenes del original (logos y rúbrica del alumno) más una: la del profesor.
  assert.equal((await paginasYImagenes(sellado)).imagenes, (await paginasYImagenes(soloAlumno)).imagenes + 1);
});

test('agregarRubricaProfesor: acepta una rúbrica JPG y la proporción se conserva (una rúbrica muy ancha no se deforma)', async () => {
  const soloAlumno = await generarPdfReporteMensual(datos(), { rubricaAlumno: crearPng(400, 140) });
  assert.equal((await PDFDocument.load(await agregarRubricaProfesor(soloAlumno, JPEG_PEQUENO))).getPageCount(), 1);
  assert.equal((await PDFDocument.load(await agregarRubricaProfesor(soloAlumno, crearPng(3000, 100)))).getPageCount(), 1);
});

test('agregarRubricaProfesor: rúbrica ausente, no imagen, dañada o truncada → IMAGEN_INVALIDA (nunca se cuelga ni se guarda algo a medias)', async () => {
  const soloAlumno = await generarPdfReporteMensual(datos(), { rubricaAlumno: crearPng(400, 140) });
  const png = crearPng(300, 100);
  for (const mala of [null, undefined, Buffer.from('no soy una imagen'), png.subarray(0, 60), JPEG_PEQUENO.subarray(0, 100), 'texto', 42]) {
    await rechaza(() => agregarRubricaProfesor(soloAlumno, mala), CODIGOS_ERROR.IMAGEN_INVALIDA);
  }
});

test('agregarRubricaProfesor: solo acepta el PDF del reporte (una página Carta); otra cosa → PDF_ALMACENADO_INVALIDO', async () => {
  const png = crearPng(300, 100);
  const dos = await PDFDocument.create();
  dos.addPage([612, 792]); dos.addPage([612, 792]);
  const a4 = await PDFDocument.create();
  a4.addPage([595, 842]);

  for (const malo of [Buffer.from('%PDF-1.7 roto'), Buffer.from('no es un pdf'), Buffer.alloc(0), null, 'texto', Buffer.from(await dos.save()), Buffer.from(await a4.save())]) {
    await rechaza(() => agregarRubricaProfesor(malo, png), CODIGOS_ERROR.PDF_ALMACENADO_INVALIDO);
  }
});

// ── Sello de validación del prototipo sobre el PDF ya firmado (CU-REP-06) ──

// Raster PPM (P6) → { ancho, alto, datos } para comparar píxeles.
function leerPpm(ppm) {
  const cabecera = /^P6\s+(\d+)\s+(\d+)\s+255\s/.exec(ppm.subarray(0, 40).toString('latin1'));
  return { ancho: Number(cabecera[1]), alto: Number(cabecera[2]), datos: ppm.subarray(cabecera[0].length) };
}

// Píxeles que difieren entre dos rasters (con tolerancia) y el rectángulo que los contiene, en puntos del PDF.
function diferencias(pdfA, pdfB) {
  const a = leerPpm(rasterizar(pdfA));
  const b = leerPpm(rasterizar(pdfB));
  assert.deepEqual([a.ancho, a.alto], [b.ancho, b.alto]);
  const aPt = 72 / 100;
  let n = 0;
  const caja = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (let y = 0; y < a.alto; y += 1) {
    for (let x = 0; x < a.ancho; x += 1) {
      const i = (y * a.ancho + x) * 3;
      if (Math.max(Math.abs(a.datos[i] - b.datos[i]), Math.abs(a.datos[i + 1] - b.datos[i + 1]), Math.abs(a.datos[i + 2] - b.datos[i + 2])) > 40) {
        n += 1;
        caja.x0 = Math.min(caja.x0, x * aPt); caja.y0 = Math.min(caja.y0, y * aPt);
        caja.x1 = Math.max(caja.x1, (x + 1) * aPt); caja.y1 = Math.max(caja.y1, (y + 1) * aPt);
      }
    }
  }
  return { n, caja };
}

const dentroDeZonaSello = (caja) => caja.x0 >= SELLO.zona.x - 1 && caja.y0 >= SELLO.zona.y - 1
  && caja.x1 <= SELLO.zona.x + SELLO.zona.ancho + 1 && caja.y1 <= SELLO.zona.y + SELLO.zona.alto + 1;

test('agregarSelloValidacion: el sello va SOLO en SELLO.zona y nada más del PDF cambia (mismas firmas, mismo texto)', { skip: !hayPdftoppm && 'pdftoppm no está instalado' }, async () => {
  const alumno = crearPng(400, 140, [20, 40, 140]);
  const profesor = crearPng(300, 100, [200, 20, 20]);
  const sello = crearPng(300, 200, [10, 120, 30]);
  const firmado = await agregarRubricaProfesor(await generarPdfReporteMensual(datos(), { rubricaAlumno: alumno }), profesor);

  const conSello = await agregarSelloValidacion(firmado, sello);

  const cambio = diferencias(firmado, conSello);
  assert.ok(cambio.n > 0, 'el sello se ve');
  assert.ok(dentroDeZonaSello(cambio.caja), `los cambios quedan dentro de SELLO.zona: ${JSON.stringify(cambio.caja)}`);
  // Y donde el generador pone alumno + profesor + sello, el resultado es el mismo (fuera del remuestreo dentro de la zona).
  const referencia = await generarPdfReporteMensual(datos(), { rubricaAlumno: alumno, rubricaProfesor: profesor, selloInstitucional: sello });
  const contraGenerador = diferencias(conSello, referencia);
  assert.ok(contraGenerador.n === 0 || dentroDeZonaSello(contraGenerador.caja), 'mismas coordenadas y escala que el generador');
});

test('agregarSelloValidacion: con el sello real del prototipo, mantiene una página Carta y las firmas previas; el original no se toca', async () => {
  const firmado = await agregarRubricaProfesor(await generarPdfReporteMensual(datos(), { rubricaAlumno: crearPng(400, 140) }), crearPng(300, 100));
  const copia = Buffer.from(firmado);

  const final = await agregarSelloValidacion(firmado, leerSello().data);

  assert.ok(Buffer.isBuffer(final));
  assert.equal(Buffer.compare(firmado, copia), 0, 'el PDF de entrada no se modifica');
  assert.notEqual(Buffer.compare(final, firmado), 0);
  const documento = await PDFDocument.load(final);
  assert.equal(documento.getPageCount(), 1);
  assert.deepEqual([Math.round(documento.getPage(0).getWidth()), Math.round(documento.getPage(0).getHeight())], [612, 792]);
  assert.equal(documento.getTitle(), (await PDFDocument.load(firmado)).getTitle());
  assert.equal((await paginasYImagenes(final)).imagenes, (await paginasYImagenes(firmado)).imagenes + 1);
});

test('agregarSelloValidacion: sello ausente o inservible → IMAGEN_INVALIDA; PDF que no es el del reporte → PDF_ALMACENADO_INVALIDO', async () => {
  const firmado = await agregarRubricaProfesor(await generarPdfReporteMensual(datos(), { rubricaAlumno: crearPng(400, 140) }), crearPng(300, 100));
  for (const malo of [null, undefined, Buffer.from('no soy una imagen'), crearPng(300, 100).subarray(0, 60), 'texto']) {
    await assert.rejects(() => agregarSelloValidacion(firmado, malo), (err) => err.code === CODIGOS_ERROR.IMAGEN_INVALIDA && /sello de validación del prototipo/.test(err.message));
  }
  const dos = await PDFDocument.create();
  dos.addPage([612, 792]); dos.addPage([612, 792]);
  for (const malo of [Buffer.from('%PDF-1.7 roto'), Buffer.alloc(0), null, Buffer.from(await dos.save())]) {
    await rechaza(() => agregarSelloValidacion(malo, crearPng(300, 100)), CODIGOS_ERROR.PDF_ALMACENADO_INVALIDO);
  }
});
